/**
 * Temporary verification script (not part of the project).
 *
 * Loads the production build in headless Chromium at three viewport sizes and
 * in both interface languages, and reports overflow, missing labels and
 * console errors. Run with:
 *
 *   node scripts/verify-ui.mjs http://localhost:3161
 */
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3161";
const routes = [
  "/",
  "/news",
  "/category/ai",
  "/jobs",
  "/github",
  "/security",
  "/login",
  "/signup",
  "/forgot-password",
  "/terms",
  "/privacy",
];

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "desktop", width: 1440, height: 900 },
];

const browser = await chromium.launch();
let failures = 0;

for (const language of ["bn", "en"]) {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      locale: language === "bn" ? "bn-BD" : "en-GB",
    });
    await context.addCookies([
      {
        name: "drh_lang",
        value: language,
        url: base,
      },
    ]);

    for (const route of routes) {
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });

      await page.goto(`${base}${route}`, { waitUntil: "networkidle" });

      const report = await page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        const overflow = document.documentElement.scrollWidth - docWidth;
        const clipped = [];
        for (const element of document.querySelectorAll("main *")) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.right > docWidth + 2) {
            clipped.push(
              `${element.tagName.toLowerCase()}.${String(element.className).slice(0, 40)}`,
            );
          }
        }
        const unlabelled = [...document.querySelectorAll("button, a")].filter(
          (element) => {
            const text = (element.textContent ?? "").trim();
            const label = element.getAttribute("aria-label");
            const title = element.getAttribute("title");
            return !text && !label && !title;
          },
        ).length;
        return { overflow, clipped: clipped.slice(0, 4), unlabelled };
      });

      const problems = [];
      if (report.overflow > 2) {
        problems.push(`horizontal overflow ${report.overflow}px`);
      }
      if (report.clipped.length) {
        problems.push(`clipped: ${report.clipped.join(", ")}`);
      }
      if (report.unlabelled > 0) {
        problems.push(`${report.unlabelled} control(s) without an accessible name`);
      }
      if (consoleErrors.length) {
        problems.push(`console: ${consoleErrors[0].slice(0, 90)}`);
      }

      if (problems.length) {
        failures += 1;
        console.log(
          `✖ ${language}/${viewport.name} ${route}: ${problems.join(" | ")}`,
        );
      }
      await page.close();
    }
    await context.close();
  }
}

await browser.close();
console.log(failures === 0 ? "✔ no layout problems found" : `${failures} route check(s) reported problems`);
