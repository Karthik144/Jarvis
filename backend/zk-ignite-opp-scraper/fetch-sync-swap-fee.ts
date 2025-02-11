import { ethers } from "ethers";

const POOL_ADDRESS = "0x01e00F0064Fa11Bb35D1251DF35376d60AF7D435"; // Target pool address

const POOL_ABI = [
  "function master() view returns (address)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function getSwapFee(address,address,address,bytes) view returns (uint24)",
  "function getProtocolFee() view returns (uint24)",
];

const provider = new ethers.JsonRpcProvider(
  "https://zksync-mainnet.g.alchemy.com/v2/oQcwBviequQgqzvgAXUShhOlCzgZKtKK"
);

const FEE_MANAGER_ABI = [
  "function poolSwapFee(address) view returns (uint24)",
  "function poolProtocolFee(address) view returns (uint24)",
];

const pool = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);

// TO-DO: Figure out why it's not accurate for pool 0x80115c708E12eDd42E504c1cD52Aea96C547c05c
export async function getPoolFees() {
  const [token0, token1] = await Promise.all([pool.token0(), pool.token1()]);

  const swapFee = await pool.getSwapFee(
    ethers.ZeroAddress,
    token0,
    token1,
    "0x"
  );

  const protocolFee = await pool.getProtocolFee();

  // Convert from 6-decimal format (100 = 0.01%, 10000 = 1%)
  const formatFee = (fee: bigint) => Number(fee) / 10000; // Convert BigInt to Number first

  return {
    swapFee: formatFee(swapFee),
    protocolFee: formatFee(protocolFee),
  };
}

// Usage
// getPoolFees().then((fees) => {
//   console.log(`Swap Fee: ${fees.swapFee}%`);
//   console.log(`Protocol Fee: ${fees.protocolFee}%`);
// });
