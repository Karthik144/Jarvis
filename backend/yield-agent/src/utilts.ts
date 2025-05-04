import { supabase } from "./supabaseClient";

export async function getWalletIdsForUsers(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, privy_server_wallet");

    if (error) throw error;

    if (!data) return {};

    // Map where key is user.id (uuid) and value is privy_server_wallet.id
    const walletIdMap: Record<string, string> = {};

    data.forEach((user) => {
      if (user.privy_server_wallet && user.privy_server_wallet.id) {
        walletIdMap[user.id] = user.privy_server_wallet.id;
      }
    });

    return walletIdMap;
  } catch (error) {
    console.error("Error fetching wallet IDs:", error);
    throw error;
  }
}
