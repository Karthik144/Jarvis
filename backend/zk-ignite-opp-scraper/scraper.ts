import axios from "axios";
import { Opportunity } from "./types";
import { fetchPoolsAndCalculateAPRs } from "./maverick-apr-calculator";
import { getKoiFinanceAPR, getPancakeSwapAPR } from "./fetch_base_apr";

const API_BASE_URL = "https://api.merkl.xyz/v4";

interface DexConfig {
  name: string;
  actions: string[];
}

interface EnhancedOpportunity extends Opportunity {
  baseApr: number;
  dexName: string;
}

const supportedDexes: DexConfig[] = [
  { name: "maverick", actions: ["POOL"] },
  { name: "syncswap", actions: ["POOL"] },
  { name: "koi", actions: ["POOL", "LEND"] },
  { name: "pancakeswap-v3", actions: ["POOL"] },
];

async function fetchOpportunities(
  dex: DexConfig
): Promise<EnhancedOpportunity[]> {
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
    const opportunities: Opportunity[] = response.data;

    const enhancedOpportunities: EnhancedOpportunity[] = await Promise.all(
      opportunities.map(async (opportunity) => {
        let baseApr = 0;
        if (dex.name === "pancakeswap-v3") {
          baseApr = await getPancakeSwapAPR(opportunity.identifier);
        } else if (dex.name === "koi") {
          // Only uncomment in production or for critical tests
          // baseApr = await getKoiFinanceAPR(opportunity.identifier);
        }
        return {
          ...opportunity,
          baseApr,
          dexName: dex.name,
        };
      })
    );

    return enhancedOpportunities;
  } catch (error: any) {
    console.error(
      `Error fetching ${dex.name}:`,
      error.response?.status || error.message
    );
    return [];
  }
}

async function main() {
  try {
    console.log("Fetching opportunities for all DEXes...");
    const combinedOpportunities: EnhancedOpportunity[] = [];

    for (const dex of supportedDexes) {
      const opportunities = await fetchOpportunities(dex);
      combinedOpportunities.push(...opportunities);
    }

    const sorted = combinedOpportunities.sort(
      (a, b) => b.apr + b.baseApr - (a.apr + a.baseApr)
    );

    console.log("\nAll opportunities sorted by total APR:");
    console.log(`Total opportunities: ${sorted.length}`);
    sorted.forEach((opportunity, index) => {
      const combinedApr = opportunity.apr + opportunity.baseApr;
      const depositLink = opportunity.depositUrl
        ? `\u001B]8;;${opportunity.depositUrl}\u0007Deposit\u001B]8;;\u0007`
        : "No deposit link";
      console.log(
        `${index + 1}. [${opportunity.dexName.toUpperCase()}] ${
          opportunity.name
        }: ` +
          `${combinedApr.toFixed(2)}% (Base: ${opportunity.baseApr.toFixed(
            2
          )}% + Boosted: ${opportunity.apr.toFixed(2)}%) ` +
          `${depositLink} | ${opportunity.identifier}`
      );
    });
  } catch (error: any) {
    console.error("Runtime error:", error.message);
    process.exit(1);
  }
}

main();
