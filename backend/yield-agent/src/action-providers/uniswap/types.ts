export interface ZapInParams {
  poolId: string;
  tokenIn: string;
  amountIn: string;
  tickLower: number;
  tickUpper: number;
  slippage?: number; // Optional slippage in basis points (0.01%)
  senderAddress: string;
  recipientAddress?: string; // Optional, defaults to sender
}

export interface ZapInRouteResponse {
  route: string;
  routerAddress: string;
  gas: string;
}

export interface BuildZapInRouteParams {
  route: string;
  sender: string;
  recipient: string;
  deadline?: number; // Optional deadline timestamp
}

export interface ZapInBuildResponse {
  routerAddress: string;
  callData: string;
  value: string;
}
