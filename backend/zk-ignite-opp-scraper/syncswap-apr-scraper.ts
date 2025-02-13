import puppeteer from "puppeteer";
import { APRResult } from "./types";

async function scrapeAPR(addresses: string[]): Promise<APRResult> {
  c
  onst browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const results: APRResult = {};
  let page;

  try {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    for (const address of addresses) {
      try {
        // Navigate to the page with current address
        await page.goto(`https://syncswap.xyz/pool/${address}`, {
          waitUntil: "networkidle0",
          timeout: 60000,
        });

        // Wait for the dynamic content to load
        await page.waitForSelector(".MuiTypography-root", { timeout: 30000 });

        // Add a small delay to ensure React has finished rendering
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const aprValue = await page.evaluate(() => {
          return new Promise((resolve, reject) => {
            // Add a small delay inside evaluate to ensure React rendering is complete
            setTimeout(() => {
              try {
                // Find elements with MuiTypography-root class
                const elements = document.querySelectorAll(
                  ".MuiTypography-root"
                );

                // Find the Fee APR label
                let feeAprElement: Element | null = null;
                elements.forEach((el) => {
                  if (el.textContent?.trim() === "Fee APR (24h)") {
                    feeAprElement = el;
                  }
                });

                if (!feeAprElement) {
                  reject(new Error("Fee APR label not found"));
                  return;
                }

                // Navigate up to the container and find the value
                const container = feeAprElement.closest(".col");
                if (!container) {
                  reject(new Error("Container not found"));
                  return;
                }

                const valueElement = container.querySelector(".fade-text");
                if (!valueElement) {
                  reject(new Error("Value element not found"));
                  return;
                }

                const text = valueElement.textContent;

                if (!text) {
                  reject(new Error("No text content found"));
                  return;
                }

                const value = parseFloat(text.replace("%", ""));

                if (isNaN(value)) {
                  reject(new Error("Failed to parse value"));
                  return;
                }

                resolve(value);
              } catch (error) {
                reject(error);
              }
            }, 1000); // 1 second delay
          });
        });

        results[address] = aprValue;
        console.log(
          `Successfully scraped Fee APR for ${address}: ${aprValue}%`
        );
      } catch (error) {
        console.error(`Error scraping APR for address ${address}:`, error);
        results[address] = -1; // Note: -1 Indicates Error
      }
    }

    return results;
  } catch (error) {
    console.error("Error during scraping:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Example Invocation
// async function main() {
//   const addresses = [
//     "0xbeac8553817d719c83f876681917ab2d7e5c4500",
//     "0x80115c708e12edd42e504c1cd52aea96c547c05c",
//     "0xe6ed575d9627942893f12bf9c2cc3c47cd11d002",
//     "0x01e00f0064fa11bb35d1251df35376d60af7d435",
//     "0xc9d2f9f56904dd71de34f2d696f5afc508f93ac3",
//     "0x0259d9dfb638775858b1d072222237e2ce7111c0",
//     "0xa93472c1b88243793e145b237b7172f1ee547836",
//     "0xfe1fc5128b5f5e7c0742bf4bfcbb5466fdf96e12",
//     "0x57b11c2c0cdc81517662698a48473938e81d5834",
//     "0xb249b76c7bda837b8a507a0e12caeda90d25d32f",
//     "0x45856bd6bb9f076f4c558a4d5932c6c8d832b0d0",
//     "0x12bf23c2fe929c23ab375199efad425e70c0ece1",
//     "0x80115c708e12edd42e504c1cd52aea96c547c05c",
//     "0x58ba6ddb7af82a106219dc412395ad56284bc5b3",
//     "0x12e7a9423d9128287e63017ee6d1f20e1c237f15",
//   ];

//   try {
//     const results = await scrapeAPR(addresses);
//     console.log("Final results:", results);
//   } catch (error) {
//     console.error("Error occurred:", error);
//   }
// }

// main();
