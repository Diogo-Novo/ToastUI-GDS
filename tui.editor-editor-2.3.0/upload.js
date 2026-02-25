const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const glob = require('glob');

// ============= CONFIGURATION =============
const CONFIG = {
  apiUrl: 'https://jsfilehost.toolsharp-vps1.pricesharp.co.uk/api/file/upload-multiple',
  //apiUrl: 'http://localhost:5094/api/file/upload-multiple',
  apiKey: 'test',
  sourceDir: './apps/editor/dist/cdn',
  // Files to upload (supports glob patterns)
  filesToUpload: [
    '**/*.js',
    '**/*.css',
    '**/*.map' // Include source maps if needed
  ],
  // Files to exclude
  excludePatterns: ['**/node_modules/**', '**/*.test.js']
};
// =========================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function findFiles() {
  log('\n📂 Finding files to upload...', colors.cyan);

  const allFiles = [];

  CONFIG.filesToUpload.forEach((pattern) => {
    const files = glob.sync(path.join(CONFIG.sourceDir, pattern), {
      ignore: CONFIG.excludePatterns,
      nodir: true
    });
    allFiles.push(...files);
  });

  // Remove duplicates
  const uniqueFiles = [...new Set(allFiles)];

  log(`   Found ${uniqueFiles.length} file(s)`, colors.blue);
  uniqueFiles.forEach((file) => {
    const relativePath = path.relative(CONFIG.sourceDir, file);
    log(`   - ${relativePath}`, colors.reset);
  });

  return uniqueFiles;
}

async function uploadFiles(files) {
  if (files.length === 0) {
    log('\n⚠️  No files to upload!', colors.yellow);
    return;
  }

  log(`\n🚀 Uploading ${files.length} file(s) to container...`, colors.cyan);

  const form = new FormData();

  files.forEach((filePath) => {
    const fileName = path.basename(filePath);
    form.append('files', fs.createReadStream(filePath), fileName);
  });

  try {
    const response = await axios.post(`${CONFIG.apiUrl}?apiKey=${CONFIG.apiKey}`, form, {
      headers: {
        ...form.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    log('\n✅ Upload successful!', colors.green);

    if (response.data.results) {
      response.data.results.forEach((result) => {
        if (result.success) {
          log(`   ✓ ${result.fileName} (${formatBytes(result.size)})`, colors.green);
        } else {
          log(`   ✗ ${result.fileName} - ${result.error}`, colors.red);
        }
      });
    }

    log(`\n🎉 Deployment complete!`, colors.bright + colors.green);
    log(
      `   Your files are now available at: ${CONFIG.apiUrl.replace('/api/file/upload-multiple', '')}`,
      colors.cyan
    );
  } catch (error) {
    log('\n❌ Upload failed!', colors.red);

    if (error.response) {
      log(`   Status: ${error.response.status}`, colors.red);
      log(`   Message: ${JSON.stringify(error.response.data)}`, colors.red);
    } else if (error.request) {
      log('   No response received from server', colors.red);
      log('   Check if your API is running and accessible', colors.yellow);
    } else {
      log(`   Error: ${error.message}`, colors.red);
    }

    process.exit(1);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Main execution
async function main() {
  log('╔════════════════════════════════════════╗', colors.bright);
  log('║   Toast UI Editor - Deploy to Container   ║', colors.bright);
  log('╚════════════════════════════════════════╝', colors.bright);

  try {
    const files = findFiles();
    await uploadFiles(files);
  } catch (error) {
    log(`\n💥 Unexpected error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();
