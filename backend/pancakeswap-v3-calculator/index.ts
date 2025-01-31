import { ethers } from 'ethers';
import { request, gql } from 'graphql-request';


const POOL_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
  'function liquidity() external view returns (uint128)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
];

const ERC20_ABI = [
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)'
];

interface PoolVolumeResponse {
  pool: {
    volumeUSD: string;
  }
}


async function getPoolAPY(poolAddress: string, lowerPrice: number, upperPrice: number): Promise<number> {
  const provider = new ethers.JsonRpcProvider('https://mainnet.era.zksync.io');
  const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);

  const [token0, token1, poolFee, liquidity, slot0] = await Promise.all([
    pool.token0(),
    pool.token1(),
    pool.fee(),
    pool.liquidity(),
    pool.slot0()
  ]);

  const lowerTick = Math.floor(Math.log(lowerPrice) / Math.log(1.0001));
  const upperTick = Math.floor(Math.log(upperPrice) / Math.log(1.0001));

  // Updated GraphQL endpoint
  const subgraphUrl = 'https://api.studio.thegraph.com/query/45376/exchange-v3-zksync/version/latest';

  // Updated query to match the new schema
  const query = gql`
    query get24HourVolume($poolAddress: ID!) {
      pool(id: $poolAddress) {
        volumeUSD
      }
    }
  `;

  const variables = { poolAddress: poolAddress.toLowerCase() };
  const data = await request<PoolVolumeResponse>(subgraphUrl, query, variables);

  const volume24h = parseFloat(data.pool.volumeUSD);

  // Rest of the function remains the same
  const feeTier = Number(poolFee) / 10000;
  const dailyFees = (volume24h * feeTier) / 100;
  const annualFees = dailyFees * 365;
  console.log(annualFees)

  const liquidityInRange = Number(liquidity) * (upperTick - lowerTick) / (Number(slot0.tick) - lowerTick);
  console.log(liquidityInRange)
  const apy = (annualFees / liquidityInRange) * 100;

  return apy;
}



// Example usage
async function main() {
  const poolAddress = '0x3AEf05a8E7D7A83f5527edeD214e0b24A87d0991'; // Replace with actual Pool Address
  const lowerPrice = 0.8; // Lower price bound
  const upperPrice = 1.2; // Upper price bound
  
  try {
    const apy = await getPoolAPY(poolAddress, lowerPrice, upperPrice);
    console.log(`Estimated APY: ${apy.toFixed(2)}%`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('An unknown error occurred');
    }
  }
}

main();
