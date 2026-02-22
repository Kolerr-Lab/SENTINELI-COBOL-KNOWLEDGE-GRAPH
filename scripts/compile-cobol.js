/**
 * COBOL Compilation Script
 * Compiles all COBOL source files to executables
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src/cobol');
const BIN_DIR = path.join(__dirname, '../bin');
const COBOL_COMPILER = 'cobc';

// Ensure bin directory exists
if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
    console.log(`✓ Created ${BIN_DIR}`);
}

// Find all .cob files
const cobolFiles = fs.readdirSync(SRC_DIR)
    .filter(file => file.endsWith('.cob'));

if (cobolFiles.length === 0) {
    console.log('No COBOL files found to compile');
    process.exit(0);
}

console.log(`Found ${cobolFiles.length} COBOL file(s) to compile\n`);

let successCount = 0;
let errorCount = 0;

// Compile each file
cobolFiles.forEach(file => {
    const srcPath = path.join(SRC_DIR, file);
    const programName = path.basename(file, '.cob');
    const binPath = path.join(BIN_DIR, programName);

    try {
        console.log(`Compiling ${file}...`);
        
        const command = `${COBOL_COMPILER} -x -free -o "${binPath}" "${srcPath}"`;
        execSync(command, { stdio: 'inherit' });
        
        console.log(`✓ ${file} → ${programName}\n`);
        successCount++;
    } catch (error) {
        console.error(`✗ Failed to compile ${file}`);
        console.error(error.message);
        console.log('');
        errorCount++;
    }
});

console.log('='.repeat(50));
console.log(`Compilation complete:`);
console.log(`  Success: ${successCount}`);
console.log(`  Failed: ${errorCount}`);
console.log('='.repeat(50));

if (errorCount > 0) {
    process.exit(1);
}
