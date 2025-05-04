export type TokenPricesResponse = Record<string, string>;

export interface Position {
  userId: string;
  poolAddress: string;
  token0Address: string;
  token1Address: string;
  token0LiquidityAmount: number;
  token1LiquidityAmount: number;
  tokenId: string;
  token0InitialPrice: number;
  token1InitialPrice: number;
}

export interface SupabasePosition {
  token_id: string;
  pool_address: string;
}
