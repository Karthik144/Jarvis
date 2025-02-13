import axios from "axios";
import {
  Opportunity,
  EnhancedOpportunity,
  ProtocolOpportunities,
  APRResult,
} from "./types";
import { getKoiFinanceAPR, getPancakeSwapAPR } from "./fetch_base_apr";

const API_BASE_URL = "https://api.merkl.xyz/v4";
const PROTOCOL_MAP: Record<string, string> = {
  maverick: "maverick",
  syncswap: "syncswap",
  koi: "koi",
  "pancakeswap-v3": "pancakeswap",
};

async function fetchOpportunities(): Promise<
  ProtocolOpportunities | undefined
> {
  try {
    const { data } = await axios.get<Opportunity[]>(
      `${API_BASE_URL}/opportunities`,
      {
        params: {
          chainId: 324,
          action: "POOL",
          status: "LIVE",
          items: 100,
        },
      }
    );

    return data.reduce((acc, opportunity) => {
      const protocolKey = PROTOCOL_MAP[opportunity.protocol.id];

      // Take existing array for this protocol (or empty array if none exists)
      // Spread existing elements into new array
      // Append new opportunity at the end
      if (protocolKey) {
        acc[protocolKey] = [...(acc[protocolKey] || []), opportunity];
      }
      return acc;
    }, {} as ProtocolOpportunities);
  } catch (error) {
    console.error(`Error fetching opportunities: ${error.message}`);
    return undefined;
  }
}

async function enhanceOpportunities(
  opportunities: Opportunity[],
  aprFetcher: (identifiers: string[]) => Promise<APRResult>
): Promise<EnhancedOpportunity[]> {
  if (!opportunities?.length) return [];

  const identifiers = opportunities.map((o) => o.identifier);
  const aprs = await aprFetcher(identifiers);

  return opportunities.map((opportunity) => ({
    ...opportunity,
    baseApr: aprs[opportunity.identifier] ?? 0,
  }));
}

function formatOpportunityOutput(opportunities: EnhancedOpportunity[]): void {
  const sorted = [...opportunities].sort(
    (a, b) => b.apr + b.baseApr - (a.apr + a.baseApr)
  );

  console.log(`\nFound ${sorted.length} opportunities sorted by total APR:`);

  sorted.forEach((opportunity, index) => {
    const totalApr = opportunity.apr + opportunity.baseApr;
    const depositLink = opportunity.depositUrl
      ? `\u001B]8;;${opportunity.depositUrl}\u0007Deposit\u001B]8;;\u0007`
      : "No deposit link";

    console.log(
      `${index + 1}. ${opportunity.pool} | ${totalApr.toFixed(2)}% ` +
        `(Base: ${opportunity.baseApr.toFixed(
          2
        )}% + Boost: ${opportunity.apr.toFixed(2)}%) | ` +
        `${depositLink}`
    );
  });
}

async function main() {
  try {
    const opportunities = await fetchOpportunities();
    if (!opportunities) return;

    // To-Do: Add logic for SyncSwap and Maverick Protocol
    const [koiEnhanced, pancakeswapEnhanced] = await Promise.all([
      enhanceOpportunities(opportunities.koi, getKoiFinanceAPR),
      enhanceOpportunities(opportunities.pancakeswap, getPancakeSwapAPR),
    ]);

    formatOpportunityOutput([...koiEnhanced, ...pancakeswapEnhanced]);
  } catch (error) {
    console.error(`Runtime error: ${error.message}`);
    process.exit(1);
  }
}

main();
