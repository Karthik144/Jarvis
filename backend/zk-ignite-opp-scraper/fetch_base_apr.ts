import axios from "axios";
import { PancakePoolData, KoiPoolData, APRResult } from "./types";
import { getPoolFees } from "./fetch-sync-swap-fee";

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
    const response = await axios.post(SUBGRAPH_URL, { query });

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

    for (const pool of filteredPools) {
      const weeklyFees = pool.poolDayData.reduce(
        (acc, day) => acc + parseFloat(day.feesUSD),
        0
      );

      const annualFees = weeklyFees * 52;
      const tvlUSD = parseFloat(pool.totalValueLockedUSD);

      // Set APR to 0 if TVL is 0 to avoid division by zero
      poolAPRs[pool.id] = tvlUSD === 0 ? 0 : (annualFees / tvlUSD) * 100;
    }

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
    const response = await axios.post(SUBGRAPH_URL, { query });
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

    filteredPools.forEach((pool) => {
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

export async function getSyncSwapAPR(
  poolAddresses: string[]
): Promise<APRResult> {
  console.log("GET SYNC SWAP APR FUNC CALLED");

  const api_key = "5db37e23ce820eb4087f65bc3d79438c";
  const SUBGRAPH_URL = `https://gateway.thegraph.com/api/${api_key}/subgraphs/id/5zkMe9YoZHMG8FzzKDB5n1jLfGx4JYmRozZsngRtGPdw`;

  // Convert all pool addresses to lowercase for comparison
  const lowercasedPoolAddresses = poolAddresses.map((address) =>
    address.toLowerCase()
  );

  const query = `
    {
      pairs(first: 1000, orderBy: volumeUSD, orderDirection: desc) {
        reserveUSD
        volumeUSD 
        createdAtTimestamp
        id
      }
    }
  `;

  try {
    console.log("INSIDE TRY BLOCK");
    const response = await axios.post(SUBGRAPH_URL, { query });
    const pools = response.data.data.pairs;

    console.log("POOLS:", pools.length);

    if (!pools || pools.length === 0) {
      console.error("No SyncSwap pools found");
      return {};
    }

    // Filter pools based on the provided pool addresses
    const filteredPools = pools.filter((pool) =>
      lowercasedPoolAddresses.includes(pool.id)
    );

    console.log("FILTERED POOLS:", filteredPools.length);

    // Calculate APR for each filtered pool
    const poolAPRs: APRResult = {};

    for (const pool of filteredPools) {
      console.log("POOL:", pool.id);
      const poolSwapFee = await getPoolFees(pool.id);
      console.log("POOL SWAP FEE:", poolSwapFee);

      console.log("VOLUME:", pool.volumeUSD);
      console.log("RESERVE:", pool.reserveUSD);
      console.log("POOL SWAP FEE:", poolSwapFee);

      const totalPoolVolume = pool.volumeUSD;
      const daysSincePoolCreated = daysSinceTimestamp(pool.createdAtTimestamp);

      const avgDailyVolume = totalPoolVolume / daysSincePoolCreated;
      console.log("AVG DAILY VOLUME:", avgDailyVolume);

      const annualFees = avgDailyVolume * poolSwapFee * 365;
      const tvlUSD = parseFloat(pool.reserveUSD);

      const feeAPR = tvlUSD > 0 ? (annualFees / tvlUSD) * 100 : 0;

      const originalAddress = poolAddresses.find(
        (addr) => addr.toLowerCase() === pool.id.toLowerCase()
      );
      if (originalAddress) {
        poolAPRs[originalAddress] = feeAPR;
      }
    }

    return poolAPRs;
  } catch (error) {
    console.error(
      "SyncSwap APR error:",
      error instanceof Error ? error.message : error
    );
    return {};
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

// SyncSwap Example Invocation

// const addresses = [
//   "0xbeac8553817d719c83f876681917ab2d7e5c4500",
//   "0x80115c708e12edd42e504c1cd52aea96c547c05c",
//   "0xe6ed575d9627942893f12bf9c2cc3c47cd11d002",
//   "0x01e00f0064fa11bb35d1251df35376d60af7d435",
//   "0xc9d2f9f56904dd71de34f2d696f5afc508f93ac3",
//   "0x0259d9dfb638775858b1d072222237e2ce7111c0",
//   "0xa93472c1b88243793e145b237b7172f1ee547836",
//   "0xfe1fc5128b5f5e7c0742bf4bfcbb5466fdf96e12",
//   "0x57b11c2c0cdc81517662698a48473938e81d5834",
//   "0xb249b76c7bda837b8a507a0e12caeda90d25d32f",
//   "0x45856bd6bb9f076f4c558a4d5932c6c8d832b0d0",
//   "0x12bf23c2fe929c23ab375199efad425e70c0ece1",
//   "0x80115c708e12edd42e504c1cd52aea96c547c05c",
//   "0x58ba6ddb7af82a106219dc412395ad56284bc5b3",
//   "0x12e7a9423d9128287e63017ee6d1f20e1c237f15",
// ];

// (async () => {
//   try {
//     const aprs = await getSyncSwapAPR(addresses);
//     console.log("SyncSwap APRS:", aprs);
//   } catch (error) {
//     console.error("Error getting APRs:", error);
//     process.exit(1);
//   }
// })();

function daysSinceTimestamp(timestampStr: string): number {
  // Convert string timestamp to milliseconds
  const timestampMs = parseInt(timestampStr) * 1000;
  const creationDate = new Date(timestampMs);

  // Current date (Feb 11, 2025 00:00 UTC)
  const currentDate = new Date("2025-02-11T00:00:00Z");

  // Calculate time difference in milliseconds
  const timeDiff = currentDate.getTime() - creationDate.getTime();

  // Convert milliseconds to days and floor result
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
}
