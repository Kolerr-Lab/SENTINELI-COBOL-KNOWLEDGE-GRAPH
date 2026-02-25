#!/usr/bin/env node

/**
 * Sentineli - Automated Setup Script
 * 
 * This script automates the initial setup process for Sentineli.
 * It checks prerequisites, configures environment, and starts services.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function execute(command, errorMessage) {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`✗ ${errorMessage}`, 'red');
    return false;
  }
}

function checkCommand(command, name) {
  try {
    execSync(`${command} --version`, { stdio: 'pipe' });
    log(`✓ ${name} is installed`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${name} is NOT installed`, 'red');
    return false;
  }
}

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${prompt}${colors.reset} `, resolve);
  });
}

async function main() {
  log('🛡️  Sentineli - Automated Setup', 'bright');
  log('By Ricky Anh Nguyen | OrchesityAI & Kolerr Lab\n', 'reset');

  // Step 1: Check prerequisites
  logHeader('Step 1/6: Checking Prerequisites');

  const hasNode = checkCommand('node', 'Node.js');
  const hasNpm = checkCommand('npm', 'npm');
  const hasDocker = checkCommand('docker', 'Docker');
  const hasGit = checkCommand('git', 'Git');

  if (!hasNode || !hasNpm) {
    log('\n❌ Node.js 18+ is required. Download: https://nodejs.org/', 'red');
    process.exit(1);
  }

  if (!hasDocker) {
    log('\n⚠️  Docker is recommended but optional', 'yellow');
    log('   Download: https://www.docker.com/products/docker-desktop/', 'yellow');
  }

  // Step 2: Install dependencies
  logHeader('Step 2/6: Installing Dependencies');

  log('Installing npm packages...', 'cyan');
  if (!execute('npm install', 'Failed to install dependencies')) {
    process.exit(1);
  }
  log('✓ Dependencies installed successfully', 'green');

  // Step 3: Configure environment
  logHeader('Step 3/6: Configuring Environment');

  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  if (fs.existsSync(envPath)) {
    log('⚠️  .env file already exists', 'yellow');
    const overwrite = await question('Do you want to reconfigure? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      log('✓ Keeping existing .env file', 'green');
    } else {
      await configureEnvironment(envPath, envExamplePath);
    }
  } else {
    await configureEnvironment(envPath, envExamplePath);
  }

  // Step 4: Compile COBOL (optional)
  logHeader('Step 4/6: COBOL Compiler');

  const hasCobc = checkCommand('cobc', 'GnuCOBOL');
  if (hasCobc) {
    const compile = await question('Compile COBOL programs now? (y/N): ');
    if (compile.toLowerCase() === 'y') {
      log('Compiling COBOL programs...', 'cyan');
      execute('npm run compile:cobol', 'COBOL compilation failed (non-critical)');
    }
  } else {
    log('⚠️  GnuCOBOL not installed - will use Docker for COBOL', 'yellow');
  }

  // Step 5: Choose deployment method
  logHeader('Step 5/6: Choose Deployment Method');

  log('How do you want to run Sentineli?\n', 'cyan');
  log('1. Docker Compose (Recommended for first-time users)', 'reset');
  log('2. PM2 (Recommended for production)', 'reset');
  log('3. Manual (For development)', 'reset');
  log('4. Skip (I\'ll start it manually later)\n', 'reset');

  const choice = await question('Enter your choice (1-4): ');

  let startCommand = null;
  switch (choice.trim()) {
    case '1':
      if (hasDocker) {
        startCommand = 'docker-compose up -d';
        log('\n✓ Starting services with Docker...', 'green');
      } else {
        log('\n❌ Docker is not installed. Please choose another option.', 'red');
        process.exit(1);
      }
      break;
    case '2':
      startCommand = 'npm run start:pm2';
      log('\n✓ Starting services with PM2...', 'green');
      break;
    case '3':
      log('\n✓ Manual mode selected', 'green');
      log('\nTo start manually:', 'cyan');
      log('  Terminal 1: cd src/bridge && PORT=3000 node server.js', 'reset');
      log('  Terminal 2: cd dashboard && DASHBOARD_PORT=3102 node server.js', 'reset');
      break;
    case '4':
      log('\n✓ Skipping service start', 'green');
      break;
    default:
      log('\n⚠️  Invalid choice, skipping service start', 'yellow');
  }

  if (startCommand) {
    logHeader('Step 6/6: Starting Services');
    execute(startCommand, 'Failed to start services');

    // Wait for services to start
    log('\nWaiting for services to start (30 seconds)...', 'cyan');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Verify services
    log('\nVerifying services...', 'cyan');
    try {
      const http = require('http');
      const checkService = (port, name) => {
        return new Promise((resolve) => {
          http.get(`http://localhost:${port}/health`, (res) => {
            if (res.statusCode === 200) {
              log(`✓ ${name} is running on port ${port}`, 'green');
              resolve(true);
            } else {
              log(`✗ ${name} returned status ${res.statusCode}`, 'red');
              resolve(false);
            }
          }).on('error', () => {
            log(`✗ ${name} is not responding on port ${port}`, 'red');
            resolve(false);
          });
        });
      };

      await checkService(3000, 'Bridge API');
      await checkService(3102, 'Dashboard');
    } catch (error) {
      log('⚠️  Service verification skipped', 'yellow');
    }
  } else {
    logHeader('Step 6/6: Setup Complete');
  }

  // Show success message
  console.log('\n' + '='.repeat(60));
  log('🎉  Sentineli Setup Complete!', 'green');
  console.log('='.repeat(60) + '\n');

  log('Access your Sentineli instance:', 'cyan');
  log('  Dashboard:  http://localhost:3102', 'bright');
  log('  API:        http://localhost:3000/health', 'reset');
  log('  Metrics:    http://localhost:3000/api/metrics\n', 'reset');

  log('Next Steps:', 'cyan');
  log('  1. Open the dashboard and paste COBOL code', 'reset');
  log('  2. Try the API: curl http://localhost:3000/health', 'reset');
  log('  3. Read the docs: cat QUICKSTART.md\n', 'reset');

  log('Need help?', 'yellow');
  log('  📖 Documentation: ./QUICKSTART.md', 'reset');
  log('  🐛 Issues: https://github.com/Kolerr-Lab/sentineli/issues', 'reset');
  log('  💬 Discussions: https://github.com/Kolerr-Lab/sentineli/discussions\n', 'reset');

  rl.close();
}

async function configureEnvironment(envPath, envExamplePath) {
  log('Creating .env file from template...', 'cyan');

  // Copy .env.example to .env
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    log('✓ Created .env file', 'green');
  } else {
    log('✗ .env.example not found, creating minimal .env', 'yellow');
    fs.writeFileSync(envPath, `NODE_ENV=development\nPORT=3000\nLOG_LEVEL=info\n`);
  }

  // Ask for OpenAI API key
  log('\n⚠️  OpenAI API Key Required for AI features', 'yellow');
  log('   Get your key at: https://platform.openai.com/api-keys\n', 'yellow');

  const hasKey = await question('Do you have an OpenAI API key? (y/N): ');

  if (hasKey.toLowerCase() === 'y') {
    const apiKey = await question('Enter your OpenAI API key: ');
    if (apiKey && apiKey.startsWith('sk-')) {
      // Update .env file
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(
        /OPENAI_API_KEY=.*/,
        `OPENAI_API_KEY=${apiKey.trim()}`
      );
      fs.writeFileSync(envPath, envContent);
      log('✓ OpenAI API key configured', 'green');
    } else {
      log('⚠️  Invalid API key format (should start with sk-)', 'yellow');
      log('   You can add it later by editing the .env file', 'yellow');
    }
  } else {
    log('⚠️  AI features will be disabled without an API key', 'yellow');
    log('   Add your key later by editing the .env file', 'yellow');
  }

  // Configure other important settings
  log('\nConfiguring security settings...', 'cyan');

  // Generate JWT secret
  const crypto = require('crypto');
  const jwtSecret = crypto.randomBytes(64).toString('base64');
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(/JWT_SECRET=.*/, `JWT_SECRET=${jwtSecret}`);

  // Generate API key
  const apiKey = crypto.randomBytes(32).toString('hex');
  envContent = envContent.replace(/API_KEYS=.*/, `API_KEYS=${apiKey}`);

  fs.writeFileSync(envPath, envContent);
  log('✓ Security settings configured', 'green');
  log(`   Your API key: ${apiKey}`, 'yellow');
  log('   Save this key for API authentication\n', 'yellow');
}

// Run the setup
main().catch((error) => {
  log(`\n❌ Setup failed: ${error.message}`, 'red');
  process.exit(1);
});
