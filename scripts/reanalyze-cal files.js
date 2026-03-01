const fs = require('fs');
const http = require('http');
const path = require('path');

const files = [
  'src/cobol/bank/transaction_processor.cob',
  'src/cobol/loan_approval.cob',
  'src/cobol/bank/fraud_detection.cob'
];

async function analyzeFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  const code = fs.readFileSync(fullPath, 'utf8');
  const program = path.basename(filePath, '.cob').toUpperCase().replace(/_/g, '-');
  
  const payload = JSON.stringify({
    program,
    code,
    fileType: 'cobol'
  });

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8766,
      path: '/api/analyze',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 120000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const calledPrograms = result.analysis?.dependencies?.called_programs || [];
          console.log(`✓ ${filePath}`);
          console.log(`  Called programs: ${JSON.stringify(calledPrograms)}`);
          resolve(result);
        } catch (e) {
          console.error(`Parse error for ${filePath}: ${e.message}`);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.write(payload);
    req.end();
  });
}

(async () => {
  console.log('Re-analyzing files with CALL statements...\n');
  for (const file of files) {
    console.log(`Analyzing ${file}...`);
    try {
      await analyzeFile(file);
      console.log('');
      await new Promise(r => setTimeout(r, 3000)); // Wait between requests
    } catch (e) {
      console.error(`Error analyzing ${file}: ${e.message}\n`);
    }
  }
  console.log('Done!');
})();
