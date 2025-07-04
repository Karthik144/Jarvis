import { z } from "zod";

/**
 * Input schema for Uniswap create LP position action.
 */
export const CreatePositionSchema = z
  .object({
    poolAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
      .describe("The address of the Syncswap LP pool to create a position in"),
    tokenIn: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
      .describe(
        "The address of the base token that will be used to create a LP position"
      ),
    amountDesired: z
      .string()
      .regex(/^\d+\.?\d*$|^\.\d+$/, "Must be valid decimal format")
      .describe("The total amount to be added to the LP pool, in whole units"),
    userId: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        "Invalid user id format"
      )
      .describe("The user's id in the supabase and dynamo db tables"),
  })
  .describe("Input schema for Syncswap create LP position action");

/**
 * Input schema for retrieving Token IDs for Syncswap LP positions action.
 */
export const GetTokenIdsSchema = z
  .object({
    userAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
      .describe("The address that owns the LP positions in the Syncswap pool"),
  })
  .describe(
    "Input schema for retrieving Token IDs for Syncswap LP positions action"
  );

/**
 * Input schema for removing liquidity for a specific Syncswap LP position action.
 */
export const RemoveLiquiditySchema = z
  .object({
    tokenId: z
      .string()
      .regex(
        /^[0-9]+$/,
        "Token ID must be numeric characters only (e.g. '340250')"
      )
      .describe(
        "The NFT token ID representing the Syncswap liquidity position to remove"
      ),
    userId: z
      .string()
      .regex(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        "Invalid user id format"
      )
      .describe("The user's id in the supabase and dynamo db tables"),
  })
  .describe("Input schema for removing liquidity from a Syncswap LP position");
