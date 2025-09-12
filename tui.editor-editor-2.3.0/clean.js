const { rimraf } = require("rimraf"); // note the destructuring
const { exec } = require("child_process");
const util = require("util");

const execAsync = util.promisify(exec);

const paths = [
    "node_modules",
    "apps/*/node_modules",
    "libs/*/node_modules",
    "plugins/*/node_modules"
];

async function main() {
    try {
        console.log("🧹 Removing node_modules and package-lock.json...");

        for (const p of paths) {
            console.log(`Deleting: ${p}`);
            await rimraf(p, { glob: true }); // enable glob patterns
        }

        console.log("🧹 Clearing npm cache...");
        await execAsync("npm cache clean --force");

        console.log("📦 Installing root dependencies...");
        await execAsync("npm install");

        console.log("🔗 Bootstrapping monorepo...");
        await execAsync("npx lerna bootstrap");

        console.log("✅ Clean and reinstall complete!");
    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

main();