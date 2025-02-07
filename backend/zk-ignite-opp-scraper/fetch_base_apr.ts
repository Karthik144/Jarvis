import axios from "axios";

interface PoolData {
  feeTier: string;
  totalValueLockedUSD: string;
  feesUSD: string;
  poolDayData: {
    feesUSD: string;
  }[];
}

export async function getPancakeSwapAPR(poolAddress: string): Promise<number> {
  const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/45376/exchange-v3-zksync/version/latest";

  const query = `
    {
      pool(id: "${poolAddress.toLowerCase()}") {
        feeTier
        totalValueLockedUSD
        feesUSD
        poolDayData(first: 7, orderBy: date, orderDirection: desc) {
          feesUSD
        }
      }
    }
  `;

  try {
    const response = await axios.post(SUBGRAPH_URL, { query });
    const poolData: PoolData = response.data.data.pool;

    if (!poolData) {
      console.error("Pool not found in subgraph");
      return 0;
    }

    const weeklyFees = poolData.poolDayData.reduce(
      (acc, day) => acc + parseFloat(day.feesUSD),
      0
    );

    const annualFees = weeklyFees * 52;
    const tvlUSD = parseFloat(poolData.totalValueLockedUSD);

    if (tvlUSD === 0) return 0;

    const apr = (annualFees / tvlUSD) * 100;
    return apr;

  } catch (error) {
    console.error("Error fetching APR:", error instanceof Error ? error.message : error);
    return 0;
  }
}
//INVOCATION
//P.s. the subgraph rate limit is heinous ~1 per 2secs 
getPancakeSwapAPR("0x5631fE6d29E3CB717517DA05A9970e499DEF5e31").then(apr => console.log("APR:", apr));
