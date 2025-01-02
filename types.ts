type Amount = {
  value: number;
  exponential: number;
  base: number;
};

type TokenConfig = {
  address: string;
  decimals: number;
  name: string;
  symbol: string;
};

export type Market = {
  marketKey: string;
  chainId: number;
  deprecated: boolean;
  mintPaused: boolean;
  borrowPaused: boolean;
  seizePaused: boolean;
  transferPaused: boolean;
  marketToken: TokenConfig;
  underlyingToken: TokenConfig;
  collateralFactor: number;
  underlyingPrice: number;
  supplyCaps: Amount;
  supplyCapsUsd: number;
  borrowCaps: Amount;
  borrowCapsUsd: number;
  badDebt: Amount;
  badDebtUsd: number;
  totalSupply: Amount;
  totalSupplyUsd: number;
  totalBorrows: Amount;
  totalBorrowsUsd: number;
  totalReserves: Amount;
  totalReservesUsd: number;
  cash: Amount;
  exchangeRate: number;
  reserveFactor: number;
  baseSupplyApy: number;
  baseBorrowApy: number;
  totalSupplyApr: number;
  totalBorrowApr: number;
  rewards: MarketReward[];
};

type MarketReward = {
  token: TokenConfig;
  supplyApr: number;
  borrowApr: number;
  liquidStakingApr: number;
};

export type MarketSnapshot = {
  chainId: number;
  marketId: string;
  totalSupply: number;
  totalSupplyUsd: number;
  totalBorrows: number;
  totalBorrowsUsd: number;
  totalLiquidity: number;
  totalLiquidityUsd: number;
  baseSupplyApy: number;
  baseBorrowApy: number;
  timestamp: number;
};
