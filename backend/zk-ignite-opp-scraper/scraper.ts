import puppeteer from "puppeteer";

interface OpportunityData {
  opportunityName: string;
  totalDailyRewards: string;
  baseProtocolName: string;
  aprPercentage: string;
}

async function scrapeClientRenderedSite(url: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle0" });

    // Wait for the card elements to load
    await page.waitForSelector("div.flex.border-1.border-main-0");

    const data = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll("div.flex.border-1.border-main-0")
      );

      return cards.map((card) => {
        const opportunityName =
          card.querySelector("h3.text-main-12")?.textContent?.trim() || "N/A";
        const totalDailyRewards =
          card.querySelector("h3.text-main-11")?.textContent?.trim() || "N/A";
        const baseProtocolName =
          card
            .querySelector(
              "button.flex.items-center:not(:has(span.font-normal))"
            )
            ?.textContent?.trim() || "N/A";
        const aprPercentage =
          card
            .querySelector("button.flex.items-center:has(span.font-normal)")
            ?.childNodes[0]?.textContent?.trim() || "N/A";

        return {
          opportunityName,
          totalDailyRewards,
          baseProtocolName,
          aprPercentage,
        };
      });
    });

    console.log(data);
    return data;
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await browser.close();
  }
}

// Usage
(async () => {
  const opportunities = await scrapeClientRenderedSite(
    "https://app.zksyncignite.xyz/opportunities?items=100"
  );
  console.log(`Found ${opportunities?.length || 0} opportunities`);
})();
