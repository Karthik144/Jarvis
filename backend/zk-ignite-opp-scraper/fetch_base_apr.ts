import axios from "axios";
import {
  PancakePoolData,
  PancakeSubgraphResponse,
  KoiPoolData,
  KoiSubgraphResponse,
  APRResult,
} from "./types";

export async function getPancakeSwapAPR(
  poolAddresses: string[]
): Promise<APRResult> {
  // Convert all pool addresses to lowercase for comparison
  const lowercasedPoolAddresses = poolAddresses.map((address) =>
    address.toLowerCase()
  );

  const SUBGRAPH_URL =
    "https://api.studio.thegraph.com/query/45376/exchange-v3-zksync/version/latest";

  const query = `
    {
      pools(first:1000) {
        feeTier
        totalValueLockedUSD
        feesUSD
        poolDayData(first: 7, orderBy: date, orderDirection: desc) {
          feesUSD
        }
        id
      }
    }
  `;

  try {
    const response = await axios.post<PancakeSubgraphResponse>(SUBGRAPH_URL, {
      query,
    });

    const pools = response.data.data.pools;

    if (!pools || pools.length === 0) {
      console.error("No Pancake Swap pools found");
      return {};
    }

    // Filter pools based on the provided pool addresses
    const filteredPools = pools.filter((pool) =>
      lowercasedPoolAddresses.includes(pool.id)
    );

    // Calculate APR for each filtered pool
    const poolAPRs: APRResult = {};

    filteredPools.forEach((pool: PancakePoolData) => {
      const weeklyFees = pool.poolDayData.reduce(
        (acc, day) => acc + parseFloat(day.feesUSD),
        0
      );

      const annualFees = weeklyFees * 52;
      const tvlUSD = parseFloat(pool.totalValueLockedUSD);

      // Calculate APR and handle division by zero
      const feeAPR = tvlUSD > 0 ? (annualFees / tvlUSD) * 100 : 0;

      // Store the result using the original pool address as key
      const originalAddress = poolAddresses.find(
        (addr) => addr.toLowerCase() === pool.id.toLowerCase()
      );
      if (originalAddress) {
        poolAPRs[originalAddress] = feeAPR;
      }
    });

    return poolAPRs;
  } catch (error) {
    console.error(
      "Error fetching APR:",
      error instanceof Error ? error.message : error
    );
    return {};
  }
}

export async function getKoiFinanceAPR(
  poolAddresses: string[]
): Promise<APRResult> {
  const api_key = "5db37e23ce820eb4087f65bc3d79438c";
  const SUBGRAPH_URL = `https://gateway.thegraph.com/api/${api_key}/subgraphs/id/3gLgwpvmNybVfKeVLKcFLnpLvbtiwTQ4rLceVP7gWcjT`;

  // Convert all pool addresses to lowercase for comparison
  const lowercasedPoolAddresses = poolAddresses.map((address) =>
    address.toLowerCase()
  );

  const query = `
    {
      pools(first: 1000) {
        totalValueLockedUSD
        poolHourData(
          first: 168
          orderBy: periodStartUnix
          orderDirection: desc
        ) {
          feesUSD
        }
        id
      }
    }
  `;

  try {
    const response = await axios.post<KoiSubgraphResponse>(SUBGRAPH_URL, {
      query,
    });
    const pools = response.data.data.pools;

    if (!pools || pools.length === 0) {
      console.error("No Koi pools found");
      return {};
    }

    // Filter pools based on the provided pool addresses
    const filteredPools = pools.filter((pool) =>
      lowercasedPoolAddresses.includes(pool.id)
    );

    // Calculate APR for each filtered pool
    const poolAPRs: APRResult = {};

    filteredPools.forEach((pool: KoiPoolData) => {
      // Calculate weekly fees from 168 hours (7 days)
      const weeklyFees = pool.poolHourData.reduce(
        (acc, hour) => acc + parseFloat(hour.feesUSD),
        0
      );

      const annualFees = weeklyFees * 52;
      const tvlUSD = parseFloat(pool.totalValueLockedUSD);

      // Calculate APR and handle division by zero
      const feeAPR = tvlUSD > 0 ? (annualFees / tvlUSD) * 100 : 0;

      // Store the result using the original pool address as key
      const originalAddress = poolAddresses.find(
        (addr) => addr.toLowerCase() === pool.id.toLowerCase()
      );
      if (originalAddress) {
        poolAPRs[originalAddress] = feeAPR;
      }
    });

    return poolAPRs;
  } catch (error) {
    console.error(
      "Koi APR error:",
      error instanceof Error ? error.message : error
    );
    return 0;
  }
}

// INVOCATION EXAMPLES

// P.S. Subgraph Rate Limit: ~1 per 2secs

// const addresses = [
//   "0x3bF35ac7BF2E4aaF98e007c9C3e0d214562A3DBB",
//   "0xC081eACC77c75CE1f39a43c04b53D90ADaD35fFd",
//   "0x291d9F9764c72C9BA6fF47b451a9f7885Ebf9977",
//   "0xD05eEf3792276E92bB051029DaDFc2Bf81121692",
//   "0x3AEf05a8E7D7A83f5527edeD214e0b24A87d0991",
//   "0x5631fE6d29E3CB717517DA05A9970e499DEF5e31",
// ];

// (async () => {
//   try {
//     const aprs = await getPancakeSwapAPR(addresses);
//     console.log("PANCAKE SWAP APRS:", aprs);
//   } catch (error) {
//     console.error("Error getting APRs:", error);
//     process.exit(1);
//   }
// })();

// P.S. Only test this one in production, using a non-public graph so have 100,000 query limit
// Note: Returned APR is base + boosted from ZK
// const addresses = [
//   "0x9C40DE601340650baC1813f925f7Cff9178c4C2C",
//   "0x58FB07E1Fd51edd7bBa91f870ff751e67e33Cec5",
//   "0x95138f634Fa2309EdE488Fe382AD3a9e5D8Aa131",
//   "0x64972FDDf1DDDA49c6d5979dCD43CEc19f47ddf6",
//   "0x57cC53DeF9F5Ca7EF4DA51082Dd874867e56Ba14",
//   "0x66E050B921ba87259bB6627ACEDd2d1FaEf85CF5",
//   "0xc0f4a1e34Ec35B225939Bc75336FDB787e432e3b",
//   "0xDFAaB828f5F515E104BaaBa4d8D554DA9096f0e4",
// ];

// (async () => {
//   try {
//     const aprs = await getKoiFinanceAPR(addresses);
//     console.log("KOI FINANCE APRS:", aprs);
//   } catch (error) {
//     console.error("Error getting APRs:", error);
//     process.exit(1);
//   }
// })();
