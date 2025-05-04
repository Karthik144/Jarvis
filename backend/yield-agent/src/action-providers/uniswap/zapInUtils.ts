import {
  ZapInParams,
  ZapInRouteResponse,
  BuildZapInRouteParams,
  ZapInBuildResponse,
} from "./types";

/**
 * Gets the best zap-in route from the KyberSwap API
 */
export async function getZapInRoute(
  params: ZapInParams
): Promise<ZapInRouteResponse> {
  const baseUrl = "https://zap-api.kyberswap.com/base";
  const endpoint = "/api/v1/in/route";

  // Build query parameters
  const queryParams = new URLSearchParams({
    dex: "DEX_UNISWAPV3",
    "pool.id": params.poolId,
    "position.tickLower": params.tickLower.toString(),
    "position.tickUpper": params.tickUpper.toString(),
    tokensIn: params.tokenIn,
    amountsIn: params.amountIn,
    slippage: (params.slippage || 100).toString(), // Default to 1% slippage (100 basis points)
  });

  // Make the API request
  const response = await fetch(
    `${baseUrl}${endpoint}?${queryParams.toString()}`,
    {
      method: "GET",
      headers: {
        "X-Client-Id": "jarvis4", // Your client ID
      },
    }
  );

  if (!response.ok) {
    console.log("INSIDE RESPONSE NOT OK");
    const errorData = await response.json();
    throw new Error(
      `Failed to get zap route: ${errorData.message || response.statusText}`
    );
  }

  const data = await response.json();

  console.log("DATA", data);
  // Check if the API returned an error
  if (data.message !== "OK") {
    throw new Error(`API error: ${data.message}`);
  }

  return {
    route: data.data.route,
    routerAddress:
      data.data.routerAddress || "0x0e97C887b61cCd952a53578B04763E7134429e05", // Use the provided router address
    gas: data.data.gas || "3000000", // Default gas estimate if not provided
  };
}

/**
 * Builds the zap-in transaction data
 */
export async function buildZapInRoute(
  params: BuildZapInRouteParams
): Promise<ZapInBuildResponse> {
  const baseUrl = "https://zap-api.kyberswap.com/base";
  const endpoint = "/api/v1/in/route/build";

  // Default deadline to 20 minutes from now
  const deadline = params.deadline || Math.floor(Date.now() / 1000) + 20 * 60;

  const requestBody = {
    sender: params.sender,
    recipient: params.recipient,
    route: params.route,
    deadline: deadline,
    source: "jarvis4-integration",
  };

  // Make the API request
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": "jarvis4",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to build zap route: ${errorData.message || response.statusText}`
    );
  }

  const data = await response.json();

  // Check if the API returned an error
  if (data.message !== "OK") {
    throw new Error(`API error: ${data.message}`);
  }

  return {
    routerAddress:
      data.data.routerAddress || "0x0e97C887b61cCd952a53578B04763E7134429e05",
    callData: data.data.callData,
    value: data.data.value || "0",
  };
}
