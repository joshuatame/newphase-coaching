import { cpSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const configuredBase = process.env.VITE_APP_BASE_PATH ?? "/clients/newphase-coaching/";
const relativeBase = configuredBase.replace(/^\/+|\/+$/g, "");

if (!relativeBase || relativeBase.includes("..")) {
  throw new Error(`Invalid VITE_APP_BASE_PATH: ${configuredBase}`);
}

const sourceDirectory = path.resolve("dist");
const hostingDirectory = path.resolve("firebase-dist");
const targetDirectory = path.join(hostingDirectory, relativeBase);

rmSync(hostingDirectory, { recursive: true, force: true });
mkdirSync(targetDirectory, { recursive: true });
cpSync(sourceDirectory, targetDirectory, { recursive: true });

console.log(`Prepared Firebase Hosting artifact at ${targetDirectory}`);
