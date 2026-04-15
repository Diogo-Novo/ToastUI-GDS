const { execSync } = require('child_process');
const path = require('path');
const isWin = process.platform === 'win32';
const outFile = '../build/squire-raw.js';
const sources = [
    'intro.js',
    'Constants.js',
    'TreeWalker.js',
    'Node.js',
    'Range.js',
    'KeyHandlers.js',
    'Clean.js',
    'Clipboard.js',
    'Editor.js',
    'exports.js',
    'outro.js'
].map((f) => path.resolve(__dirname, '../source', f));


if (isWin) {
    const fileString = sources.join(', ');
    execSync(
        `powershell -NoProfile -Command "Get-Content ${fileString} | Select-String -NotMatch 'jshint' | Set-Content ${outFile}"`
    );
} else {
    const fileString = sources.join(' ');
    execSync(`cat ${fileString} | grep -v 'jshint' > ${outFile}`);
}

console.log('raw JS built');
