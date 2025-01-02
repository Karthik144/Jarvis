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

type MorphoMarketParamsType = {
  loanToken: string;
  collateralToken: string;
  irm: string;
  lltv: bigint;
  oracle: string;
};

type MorphoVaultMarket = {
  allocation: number;
  marketId: string;
  marketCollateral: TokenConfig;
  marketApy: number;
  marketLiquidity: Amount;
  marketLiquidityUsd: number;
  marketLoanToValue: number;
  totalSupplied: Amount;
  totalSuppliedUsd: number;
};

type MarketReward = {
  token: TokenConfig;
  supplyApr: number;
  borrowApr: number;
  liquidStakingApr: number;
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

export type MorphoMarket = {
  chainId: number;
  marketId: string;
  marketKey: string;
  deprecated: boolean;
  loanToValue: number;
  performanceFee: number;
  loanToken: TokenConfig;
  loanTokenPrice: number;
  collateralAssets: Amount;
  collateralToken: TokenConfig;
  collateralTokenPrice: number;
  totalSupply: Amount;
  totalSupplyUsd: number;
  totalSupplyInLoanToken: Amount;
  totalBorrows: Amount;
  totalBorrowsUsd: number;
  availableLiquidity: Amount;
  availableLiquidityUsd: number;
  marketParams: MorphoMarketParamsType;
  baseSupplyApy: number;
  rewardsSupplyApy: number;
  baseBorrowApy: number;
  rewardsBorrowApy: number;
  totalSupplyApr: number;
  totalBorrowApr: number;
};

export type MorphoVault = {
  chainId: number;
  vaultKey: string;
  vaultToken: TokenConfig;
  underlyingToken: TokenConfig;
  vaultSupply: Amount;
  totalSupply: Amount;
  totalSupplyUsd: number;
  totalLiquidity: Amount;
  totalLiquidityUsd: number;
  underlyingPrice: number;
  baseApy: number;
  rewardsApy: number;
  totalApy: number;
  performanceFee: number;
  curators: string[];
  timelock: number;
  markets: MorphoVaultMarket[];
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

export type MorphoVaultSnapshot = {
  chainId: number;
  vaultAddress: string;
  totalSupply: number;
  totalSupplyUsd: number;
  totalBorrows: number;
  totalBorrowsUsd: number;
  totalLiquidity: number;
  totalLiquidityUsd: number;
  timestamp: number;
};
