import axios from "axios";
import { Opportunity } from "./types";

const API_BASE_URL = "https://api.merkl.xyz/v4";

async function main() {
  try {
    console.log("Fetching Merkl opportunities...");
    const response = await axios.get<Opportunity[]>(
      `${API_BASE_URL}/opportunities?chain=324&action=POOL,LEND&status=LIVE&items=100`
    );

    const data = response.data;
    console.log("Raw DATA:", data);
    console.log(`Total opportunities before filtering: ${data.length}\n`);

    // Filter opportunities to only include chainId 324
    const filteredOpportunities = data.filter(
      (opportunity) => opportunity.chainId === 324
    );

    console.log(
      `Total opportunities after filtering: ${filteredOpportunities.length}\n`
    );

    console.log("Filtered Opportunities:", filteredOpportunities);

    return filteredOpportunities;
  } catch (error: any) {
    if (error?.response) {
      console.error(
        `API Error: ${error.response.status} - ${error.response.statusText}`
      );
    } else if (error?.request) {
      console.error("No response received from the server");
    } else {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

main();
