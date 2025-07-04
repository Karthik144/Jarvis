import {
  AgentKit,
  walletActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  erc20ActionProvider,
  wethActionProvider,
  PrivyWalletProvider,
  PrivyWalletConfig,
  ViemWalletProvider,
} from "@coinbase/agentkit";

import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { http } from "viem";
import { createWalletClient } from "viem";

import { opportunityFetcherActionProvider } from "./action-providers/opportunityDatabase/opportunityDatabaseActionProvider";
import { weiToEthConverterActionProvider } from "./action-providers/weiToEthConverter/weiToEthConverterActionProvider";
import { uniswapActionProvider } from "./action-providers/uniswap/uniswapActionProvider";
import { userPositionsActionProvider } from "./action-providers/userPositions/userPositionsActionProvider";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { getWalletIdsForUsers } from "./utils";
import * as dotenv from "dotenv";

dotenv.config();

function validateEnvironment(): void {
  const missingVars: string[] = [];

  const requiredVars = [
    "OPENAI_API_KEY",
    "CDP_API_KEY_NAME",
    "CDP_API_KEY_PRIVATE_KEY",
  ];
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach((varName) => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }
}

async function initializeAgent(userId: string, walletId: string) {
  try {
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
    });

    // OLD WALLET METHOD: UNCOMMENTED FOR TESTING UNTIL PRIVY WALLET IS FIXED

    const account = privateKeyToAccount(
      (process.env.PRIVATE_KEY || "0x1234") as `0x${string}`
    );

    const client = createWalletClient({
      account,
      chain: base,
      transport: http(),
    });

    const walletProvider = new ViemWalletProvider(client);

    // NEW METHOD: COMMENTED BC OF BUG
    // const config: PrivyWalletConfig = {
    //   appId: process.env.PRIVY_APP_ID ?? "",
    //   appSecret: process.env.PRIVY_APP_SECRET ?? "",
    //   chainId: "8453",
    //   walletId: walletId,
    // };

    // const walletProvider = await PrivyWalletProvider.configureWithWallet(config);

    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        erc20ActionProvider(),
        opportunityFetcherActionProvider(),
        wethActionProvider(),
        walletActionProvider(),
        weiToEthConverterActionProvider(),
        uniswapActionProvider(),
        userPositionsActionProvider(),
        cdpApiActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n"
          ),
        }),
        cdpWalletActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n"
          ),
        }),
      ],
    });

    const tools = await getLangChainTools(agentkit);

    const memory = new MemorySaver();
    const agentConfig = {
      configurable: {
        thread_id: `Autonomous Yield Farming Agent For User ${userId}`,
      },
    };

    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier:
        "You are a helpful autonomous agent that can interact onchain using the Coinbase Developer Platform AgentKit. " +
        "You are empowered to interact onchain using your tools. Your wallet is on Base Mainnet" +
        "and you will have some initial wallet balance. " +
        `1. Check if the user has any active positions using the userPositionsActionProvider. The userId ${userId} should be passed as a parameter.\n` +
        "2. If the user does not have any active positions, proceed with the steps to create a new position:\n" +
        "   - Request to view LP position opportunities for UniswapV3 Pools\n" +
        "   - Find the LP pool with the highest APR across all available pools\n" +
        "   - Check your balance of 0x4200000000000000000000000000000000000006 (Wrapped Ethereum)\n" +
        "   - Convert balance from wei to ETH units using the weiToEthConverter tool\n" +
        "   - Execute LP position creation using 90% of the balance of 0x4200000000000000000000000000000000000006 (Wrapped Ethereum) in ETH units\n" +
        "       - Specify tokenIn as 0x4200000000000000000000000000000000000006 (Wrapped Ethereum)\n" +
        "3. If the user does have an active position, check if the poolAddress of that position matches the pool with the highest APR:\n" +
        "   - If it matches, do nothing.\n" +
        "   - If it does not match, call the Uniswap tool to invoke the removeLiquidity function.\n" +
        "   - Then follow all steps from part two to create a new position for the pool with the highest APR.\n" +
        `Whenever you need to call a function that requires a userId to read or write to or from the database, use the userId variable, which is ${userId}.\n` +
        "After creating an LP position, remain idle unless a new LP opportunity arises with a higher APR than your current pool.",
    });

    return { agent, config: agentConfig };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
    throw error;
  }
}

async function runAutonomousMode(
  agent: any,
  config: any,
  userId: string,
  maxRuntime = 120
) {
  console.log("Starting autonomous mode...");
  const startTime = Date.now();

  while (Date.now() - startTime < maxRuntime * 1000) {
    try {
      const thought =
        "You are a helpful autonomous agent that can interact onchain using the Coinbase Developer Platform AgentKit. " +
        "You are empowered to interact onchain using your tools. Your wallet is on Base Mainnet" +
        "and you will have some initial wallet balance. " +
        `1. Check if the user has any active positions using the userPositionsActionProvider. The userId ${userId} should be passed as a parameter.\n` +
        "2. If the user does not have any active positions, proceed with the steps to create a new position:\n" +
        "   - Request to view LP position opportunities for UniswapV3 Pools\n" +
        "   - Find the LP pool with the highest APR across all available pools\n" +
        "   - Check your balance of 0x4200000000000000000000000000000000000006 (Wrapped Ethereum)\n" +
        "   - Convert balance from wei to ETH units using the weiToEthConverter tool\n" +
        "   - Execute LP position creation using 90% of the balance of 0x4200000000000000000000000000000000000006 (Wrapped Ethereum) in ETH units\n" +
        "       - Specify tokenIn as 0x4200000000000000000000000000000000000006 (Wrapped Ethereum)\n" +
        "3. If the user does have an active position, check if the poolAddress of that position matches the pool with the highest APR:\n" +
        "   - If it matches, do nothing.\n" +
        "   - If it does not match, call the Uniswap tool to invoke the removeLiquidity function.\n" +
        "   - Then follow all steps from part two to create a new position for the pool with the highest APR.\n" +
        `Whenever you need to call a function that requires a userId to read or write to or from the database, use the userId variable, which is ${userId}.\n` +
        "After creating an LP position, remain idle unless a new LP opportunity arises with a higher APR than your current pool.";

      const stream = await agent.stream(
        { messages: [new HumanMessage(thought)] },
        config
      );

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }

      console.log(`Autonomous mode completed for user ID ${userId}.`);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      } else {
        console.error("Unknown error:", error);
      }
      process.exit(1);
    }
  }
}

async function main() {
  try {
    validateEnvironment();

    const walletIdMap = await getWalletIdsForUsers();

    console.log("WALLET ID MAP:", walletIdMap);

    const userIds = Object.keys(walletIdMap);

    for (const userId of userIds) {
      const walletId = walletIdMap[userId];

      console.log(`User ID: ${userId}, Wallet ID: ${walletId}`);
      const { agent, config } = await initializeAgent(userId, walletId);

      console.log(`Running agent for user ID ${userId}`);

      await runAutonomousMode(agent, config, userId);
    }

    console.log("Execution completed successfully.");
  } catch (error) {
    console.error("Error:", (error as Error).message);
  }
}

main();
