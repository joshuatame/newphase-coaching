import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME ||
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--disable-web-security", "--use-gl=angle"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const logs = [];
page.on("console", (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => logs.push(`[pageerror] ${err.message}`));
page.on("requestfailed", (req) =>
  logs.push(`[reqfail] ${req.url()} :: ${req.failure()?.errorText}`),
);

await page.goto("https://app.tame-dynamics.com/clients/newphase-coaching/", {
  waitUntil: "networkidle0",
  timeout: 90000,
});
await new Promise((r) => setTimeout(r, 10000));

const info = await page.evaluate(() => {
  const canvas = document.querySelector("canvas");
  const imgs = [...document.querySelectorAll('img[src*="newphase-mark"]')].map(
    (i) => ({
      src: i.getAttribute("src"),
      w: i.naturalWidth,
      h: i.naturalHeight,
      complete: i.complete,
    }),
  );
  return {
    canvas: canvas
      ? {
          w: canvas.width,
          h: canvas.height,
          cw: canvas.clientWidth,
          ch: canvas.clientHeight,
          opacity: getComputedStyle(canvas.parentElement || canvas).opacity,
        }
      : null,
    canvasCount: document.querySelectorAll("canvas").length,
    imgs,
  };
});

console.log(JSON.stringify({ info, logs }, null, 2));
await page.screenshot({ path: "debug-dumbbell.png", fullPage: false });
await browser.close();
