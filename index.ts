import { createMoonwellClient } from "@moonwell-fi/moonwell-sdk";
import { Market, MarketSnapshot } from "./types";

const moonwellClient = createMoonwellClient({
  networks: {
    base: {
      rpcUrls: ["https://base.llamarpc.com"],
    },
  },
});

const markets = await moonwellClient.getMarkets({ chainId: 8453 });

// Step 1: Get top three markets by totalSupplyApr
// Step 2: Get historical snapshots for the top three markets and find the avg baseSupplyApy
// Step 3: Find the market with the highest avg baseSupplyApy AND the highest totalSupplyApr
// Step 4: Get underlyingToken address (underlyingToken.address) for the market returned from step 3, and swap USDC for the underlyingToken
// Step 4: Lend USDC into the market returned from step 3
// Step 5: Create function to redeem token from the market lended on in step 4

// Step 1: Get top three markets by totalSupplyApr
function getTopThreeMarketsBySupplyApr(markets: Market[]) {
  return markets
    .sort((a, b) => b.totalSupplyApr - a.totalSupplyApr)
    .slice(0, 3);
}

// Step 2: Get historical snapshots for the top three markets and find the avg baseSupplyApy
function getAvgBaseSupplyApy(snapshots: MarketSnapshot[]) {
  const totalSupplyApy = snapshots.reduce(
    (acc, snapshot) => acc + snapshot.baseSupplyApy,
    0
  );
  return totalSupplyApy / snapshots.length;
}

// Step 3: Find the market with the highest avg baseSupplyApy AND the highest totalSupplyApr
async function getTopMarketByAvgBaseSupplyApy(
  markets: Market[]
): Promise<Market | null> {
  if (markets.length === 0) return null;

  const THRESHOLD_PERCENTAGE = 0.02;

  // Process first market separately to get initial values
  const firstMarket = markets[0];
  const firstSnapshots = await moonwellClient.getMarketSnapshots({
    type: "core",
    marketId: firstMarket.marketToken.address,
    chainId: 8453,
  });

  let topMarket = {
    market: firstMarket,
    totalSupplyApr: firstMarket.totalSupplyApr,
    avgBaseSupplyApy: getAvgBaseSupplyApy(firstSnapshots),
  };

  // Compare remaining markets
  for (let i = 1; i < markets.length; i++) {
    const market = markets[i];
    const snapshots = await moonwellClient.getMarketSnapshots({
      type: "core",
      marketId: market.marketToken.address,
      chainId: 8453,
    });

    const avgBaseSupplyApy = getAvgBaseSupplyApy(snapshots);
    const apyDifference =
      Math.abs(avgBaseSupplyApy - topMarket.avgBaseSupplyApy) /
      topMarket.avgBaseSupplyApy;

    if (
      apyDifference <= THRESHOLD_PERCENTAGE &&
      market.totalSupplyApr > topMarket.totalSupplyApr
    ) {
      topMarket = {
        market,
        totalSupplyApr: market.totalSupplyApr,
        avgBaseSupplyApy,
      };
    }
  }

  console.log("FINAL RESULTS:", topMarket);
  return topMarket.market;
}

const topThreeMarketsBySupplyApr = getTopThreeMarketsBySupplyApr(markets);
const topMarket = await getTopMarketByAvgBaseSupplyApy(
  topThreeMarketsBySupplyApr
);
