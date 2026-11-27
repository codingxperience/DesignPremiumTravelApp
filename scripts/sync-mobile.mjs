import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
const require = createRequire(import.meta.url);
const platforms = process.argv.slice(2);
if (platforms.length > 1 || platforms.some((name) => !["android", "ios"].includes(name)))
  throw new Error("Choose android, ios, or omit the platform to sync both.");
if (!process.env.VITE_TRAVEL_ORIGIN)
  throw new Error(
    "Set VITE_TRAVEL_ORIGIN to the HTTPS agency server before syncing a device build.",
  );
const vite = resolve(dirname(require.resolve("vite/package.json")), "bin/vite.js");
const cap = resolve(dirname(require.resolve("@capacitor/cli/package.json")), "bin/capacitor");
execFileSync(process.execPath, [vite, "build", "--config", "vite.mobile.config.ts"], {
  stdio: "inherit",
});
execFileSync(process.execPath, [cap, "sync", ...platforms], { stdio: "inherit" });
