const rimraf = require("rimraf");
const { exec } = require("child_process");
const util = require("util");

const rimrafAsync = util.promisify(rimraf);
const execAsync = util.promisify(exec);

const paths = [
  "node_modules",
  "apps/*/node_modules",
  "libs/*/node_modules",
  "plugins/*/node_modules",
  "apps/*/package-lock.json",
  "libs/*/package-lock.json",
  "plugins/*/package-lock.json"
];

async function main() {
  try {
    console.log("Removing node_modules and package-lock.json...");

    for (const p of paths) {
      console.log(`Deleting: ${p}`);
      await rimrafAsync(p);
    }

    console.log("Clearing npm cache...");
    await execAsync("npm cache clean --force");

    console.log("Installing root dependencies...");
    await execAsync("npm install");

    console.log("Bootstrapping monorepo...");
    await execAsync("npx lerna bootstrap");

    console.log("Clean and reinstall complete!");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
