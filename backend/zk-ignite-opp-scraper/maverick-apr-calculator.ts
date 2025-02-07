import axios from "axios";

interface PoolData {
  ticker_id: string;
  base_currency: string;
  target_currency: string;
  last_price: number;
  base_volume: number;
  target_volume: number;
  pool_id: string;
  liquidity_in_usd: number;
}

interface PoolAPRResult {
  pool_id: string;
  ticker_id: string;
  apr: number;
}

const calculatePoolAPR = (poolData: PoolData, feeTier: number): number => {
  const DAYS_IN_YEAR = 365;

  // Calculate daily volume in USD
  const dailyVolumeUSD = poolData.target_volume * poolData.last_price;

  // Calculate daily fees
  const dailyFees = dailyVolumeUSD * (feeTier / 100);

  // Annualize the fees
  const annualizedFees = dailyFees * DAYS_IN_YEAR;

  // Calculate APR
  const apr = (annualizedFees / poolData.liquidity_in_usd) * 100;

  // Round to 2 decimal places
  return Math.round(apr * 100) / 100;
};

const fetchPoolsAndCalculateAPRs = async (
  chainId: number,
  feeTier: number,
  apiBaseUrl: string = "https://app.mav.xyz"
): Promise<PoolAPRResult[]> => {
  try {
    // Fetch pool data from API
    const response = await axios.get(`${apiBaseUrl}/api/latest/tickers`, {
      params: {
        chainId: chainId,
      },
    });

    // Validate API response
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid API response format");
    }

    // Calculate APR for each pool
    const poolAPRs: PoolAPRResult[] = response.data
      .filter((poolData: PoolData) => {
        // Filter out invalid pool data
        return (
          poolData.liquidity_in_usd > 0 &&
          poolData.last_price > 0 &&
          poolData.target_volume >= 0
        );
      })
      .map((poolData: PoolData) => {
        const apr = calculatePoolAPR(poolData, feeTier);
        return {
          pool_id: poolData.pool_id,
          ticker_id: poolData.ticker_id,
          apr: apr,
        };
      });

    return poolAPRs;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to fetch and calculate APRs: ${error.message}`);
    }
    throw error;
  }
};

export { fetchPoolsAndCalculateAPRs, calculatePoolAPR };
