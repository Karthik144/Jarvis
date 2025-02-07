import axios from "axios";
import { Opportunity } from "./types";
import { fetchPoolsAndCalculateAPRs } from "./maverick-apr-calculator";

const API_BASE_URL = "https://api.merkl.xyz/v4";

interface DexConfig {
  name: string;
  actions: string[];
}

const supportedDexes: DexConfig[] = [
  { name: "maverick", actions: ["POOL"] },
  { name: "syncswap", actions: ["POOL"] },
  { name: "koi", actions: ["POOL", "LEND"] },
  { name: "pancakeswap-v3", actions: ["POOL"] },
];

async function fetchOpportunities(dex: DexConfig): Promise<Opportunity[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/opportunities`, {
      params: {
        chainId: 324,
        action: dex.actions.join(","),
        mainProtocolId: dex.name,
        status: "LIVE",
        items: 100,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      `Error fetching ${dex.name}:`,
      error.response?.status || error.message
    );
    return [];
  }
}

function filterAndSortOpportunities(
  opportunities: Opportunity[]
): Opportunity[] {
  return opportunities
    .filter(
      (opportunity) =>
        opportunity.chainId === 324 &&
        opportunity.protocol.id === opportunity.protocol.id.toLowerCase()
    )
    .sort((a, b) => b.apr - a.apr);
}

function logOpportunities(dexName: string, opportunities: Opportunity[]): void {
  console.log(
    `\n${dexName.charAt(0).toUpperCase() + dexName.slice(1)} opportunities:`
  );
  console.log(`Total opportunities: ${opportunities.length}`);
  opportunities.forEach((opportunity, index) => {
    console.log(
      `${index + 1}. ${opportunity.name}: ${opportunity.apr.toFixed(2)}% APR ${opportunity.identifier}`
    );
  });
}

async function main() {
  try {
    console.log("Fetching opportunities for supported DEXes...");

    for (const dex of supportedDexes) {
      const opportunities = await fetchOpportunities(dex);
      const filtered = filterAndSortOpportunities(opportunities);
      logOpportunities(dex.name, filtered);
    }

    const chainId = 324; // ZKSync mainnet
    const feeTier = 0.02; // 0.02% fee tier

    const poolAPRs = await fetchPoolsAndCalculateAPRs(chainId, feeTier);

    // Log results
    // console.log("Pool APRs:");
    // poolAPRs.forEach(({ ticker_id, pool_id, apr }) => {
    //   console.log(`${ticker_id} (${pool_id}): ${apr}%`);
    // });
  } catch (error: any) {
    console.error("Runtime error:", error.message);
    process.exit(1);
  }
}

main();
