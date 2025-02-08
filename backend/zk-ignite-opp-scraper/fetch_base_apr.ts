import axios from "axios";

interface PancakePoolData {
  feeTier: string;
  totalValueLockedUSD: string;
  feesUSD: string;
  poolDayData: {
    feesUSD: string;
  }[];
}

interface KoiPoolData {
    totalValueLockedUSD: string;
    poolHourData: {
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
    const PancakePoolData: PancakePoolData = response.data.data.pool;

    if (!PancakePoolData) {
      console.error("Pool not found in subgraph");
      return 0;
    }

    const weeklyFees = PancakePoolData.poolDayData.reduce(
      (acc, day) => acc + parseFloat(day.feesUSD),
      0
    );

    const annualFees = weeklyFees * 52;
    const tvlUSD = parseFloat(PancakePoolData.totalValueLockedUSD);

    if (tvlUSD === 0) return 0;

    const apr = (annualFees / tvlUSD) * 100;
    return apr;

  } catch (error) {
    console.error("Error fetching APR:", error instanceof Error ? error.message : error);
    return 0;
  }
}

export async function getKoiFinanceAPR(poolAddress: string): Promise<number> {
    const api_key = '5db37e23ce820eb4087f65bc3d79438c'
    const SUBGRAPH_URL = `https://gateway.thegraph.com/api/${api_key}/subgraphs/id/3gLgwpvmNybVfKeVLKcFLnpLvbtiwTQ4rLceVP7gWcjT`;
    
    const query = `
      {
        pool(id: "${poolAddress.toLowerCase()}") {
          totalValueLockedUSD
          poolHourData(first: 168, orderBy: periodStartUnix, orderDirection: desc) {
            feesUSD
          }
        }
      }
    `;
  
    try {      
      const response = await axios.post(SUBGRAPH_URL, { query });
      const poolData: KoiPoolData = response.data.data.pool;
  
      if (!poolData) {
        console.error("Koi pool not found", poolAddress.toLowerCase());
        return 0;
      }
  
      // Calculate weekly fees from 168 hours (7 days)
      const weeklyFees = poolData.poolHourData.reduce(
        (acc, hour) => acc + parseFloat(hour.feesUSD),
        0
      );
  
      const annualFees = weeklyFees * 52;
      const tvlUSD = parseFloat(poolData.totalValueLockedUSD);
  
  
      const feeAPR = (annualFees / tvlUSD) * 100;
      return feeAPR;
  
    } catch (error) {
      console.error("Koi APR error:", error instanceof Error ? error.message : error);
      return 0;
    }
  }
//INVOCATIONS

//P.s. the subgraph rate limit is heinous ~1 per 2secs 
//getPancakeSwapAPR("0x5631fE6d29E3CB717517DA05A9970e499DEF5e31").then(apr => console.log("APR:", apr));

//P.s. only test this one in production, using a non-public graph so have 100,000 query limit
// returned APR is base + boosted from ZK
// getKoiFinanceAPR("0x9c40de601340650bac1813f925f7cff9178c4c2c").then(apr => console.log("Koi APR:", apr));