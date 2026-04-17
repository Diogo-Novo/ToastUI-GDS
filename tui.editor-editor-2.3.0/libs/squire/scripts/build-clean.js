const { execSync } = require("child_process");
const path = require("path");

const isWin = process.platform === "win32";



const buildDir = path.resolve(__dirname, "../build");

if (isWin) {
  execSync(
    `powershell -NoProfile -Command "if (Test-Path '${buildDir}') { Remove-Item '${buildDir}' -Recurse -Force }; New-Item '${buildDir}' -ItemType Directory | Out-Null"`
  );
} else {
  execSync(`rm -rf ${buildDir} && mkdir ${buildDir}`);
}


console.log("build directory cleaned/recreated");