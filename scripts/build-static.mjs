// Static export build script for NewPhase Coaching.
// Produces an `out/` directory suitable for deployment under
// https://<host>/clients/newphase-coaching
import { spawn } from "node:child_process";

const env = {
  ...process.env,
  NP_STATIC_EXPORT: "true",
  NEXT_PUBLIC_BASE_PATH:
    process.env.NEXT_PUBLIC_BASE_PATH || "/clients/newphase-coaching",
  NEXT_PUBLIC_API_URL:
    process.env.NEXT_PUBLIC_API_URL || "https://api.tame-dynamics.com/api/v1",
};

console.log("[build-static] NewPhase Coaching static export");
console.log("[build-static] BASE_PATH :", env.NEXT_PUBLIC_BASE_PATH);
console.log("[build-static] API_URL   :", env.NEXT_PUBLIC_API_URL);

const isWin = process.platform === "win32";
const cmd = isWin ? "npx.cmd" : "npx";

const child = spawn(cmd, ["next", "build"], {
  env,
  stdio: "inherit",
  shell: isWin,
});

child.on("exit", (code) => {
  if (code === 0) {
    console.log("\n[build-static] Done. Output written to ./out");
  } else {
    console.error(`\n[build-static] Build failed with exit code ${code}`);
  }
  process.exit(code ?? 1);
});
