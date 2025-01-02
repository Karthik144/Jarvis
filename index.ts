import { createMoonwellClient } from "@moonwell-fi/moonwell-sdk";
import {
  Market,
  MarketSnapshot,
  MorphoMarket,
  MorphoVault,
  MorphoVaultSnapshot,
} from "./types";

const moonwellClient = createMoonwellClient({
  networks: {
    base: {
      rpcUrls: ["https://base.llamarpc.com"],
    },
  },
});

interface MarketResult {
  type: "moonwell-core" | "morpho-isolated" | "morpho-vault";
  marketId: string;
  totalApr: number;
  avgBaseSupplyApy?: number;
  underlyingToken?: {
    address: string;
    symbol: string;
  };
  data: Market | MorphoMarket | MorphoVault; // Original data object
}

async function getAvgBaseSupplyApy(
  marketId: string,
  type: "core" | "isolated",
  chainId: number
): Promise<number> {
  const snapshots = await moonwellClient.getMarketSnapshots({
    type,
    marketId,
    chainId,
  });

  if (snapshots.length === 0) return 0;

  const totalSupplyApy = snapshots.reduce(
    (acc, snapshot) => acc + snapshot.baseSupplyApy,
    0
  );
  return totalSupplyApy / snapshots.length;
}

async function getBestInvestmentOption(
  chainId: number = 8453
): Promise<MarketResult | null> {
  // Get all markets and vaults
  const [coreMarkets, morphoMarkets, morphoVaults] = await Promise.all([
    moonwellClient.getMarkets({ chainId }),
    moonwellClient.getMorphoMarkets({ chainId }),
    moonwellClient.getMorphoVaults(),
  ]);

  const results: MarketResult[] = [];

  // Process top 3 core markets
  const topCoreMarkets = coreMarkets
    .sort((a, b) => b.totalSupplyApr - a.totalSupplyApr)
    .slice(0, 3);

  for (const market of topCoreMarkets) {
    const avgApy = await getAvgBaseSupplyApy(
      market.marketToken.address,
      "core",
      chainId
    );
    results.push({
      type: "moonwell-core",
      marketId: market.marketToken.address,
      totalApr: market.totalSupplyApr,
      avgBaseSupplyApy: avgApy,
      underlyingToken: market.underlyingToken,
      data: market,
    });
  }

  // Process top 3 morpho isolated markets
  const topMorphoMarkets = morphoMarkets
    .sort((a, b) => b.totalSupplyApr - a.totalSupplyApr)
    .slice(0, 3);

  for (const market of topMorphoMarkets) {
    const avgApy = await getAvgBaseSupplyApy(
      market.marketId,
      "isolated",
      chainId
    );
    results.push({
      type: "morpho-isolated",
      marketId: market.marketId,
      totalApr: market.totalSupplyApr,
      avgBaseSupplyApy: avgApy,
      underlyingToken: market.underlyingToken,
      data: market,
    });
  }

  // Process top 3 morpho vaults
  const topVaults = morphoVaults
    .sort((a, b) => b.totalApy - a.totalApy)
    .slice(0, 3);

  for (const vault of topVaults) {
    results.push({
      type: "morpho-vault",
      marketId: vault.address,
      totalApr: vault.totalApy,
      underlyingToken: vault.underlyingToken,
      data: vault,
    });
  }

  // Find the best option based on total APR/APY and historical performance
  const THRESHOLD_PERCENTAGE = 0.02;
  let bestOption = results[0];

  for (const result of results) {
    if (!bestOption) {
      bestOption = result;
      continue;
    }

    // For options with avgBaseSupplyApy, compare both metrics
    if (result.avgBaseSupplyApy && bestOption.avgBaseSupplyApy) {
      const apyDifference =
        Math.abs(result.avgBaseSupplyApy - bestOption.avgBaseSupplyApy) /
        bestOption.avgBaseSupplyApy;

      if (
        apyDifference <= THRESHOLD_PERCENTAGE &&
        result.totalApr > bestOption.totalApr
      ) {
        bestOption = result;
      }
    } else {
      // For vaults or when historical data isn't available, compare only total APR/APY
      if (result.totalApr > bestOption.totalApr) {
        bestOption = result;
      }
    }
  }

  return bestOption;
}

const bestOption = await getBestInvestmentOption();
console.log("Best Investment Option:", bestOption);
