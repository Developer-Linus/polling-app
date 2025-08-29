#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script helps set up the Supabase database for the polling application.
 * It can be used for both local development and production deployment.
 * 
 * Usage:
 *   npm run db:setup          # Setup local database
 *   npm run db:setup --prod    # Setup production database
 *   npm run db:reset           # Reset local database with fresh data
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_DIR = path.join(__dirname, '..', 'supabase');
const MIGRATION_FILE = path.join(SUPABASE_DIR, 'migrations', '001_initial_schema.sql');
const SEED_FILE = path.join(SUPABASE_DIR, 'seed.sql');
const CONFIG_FILE = path.join(SUPABASE_DIR, 'config.toml');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options
    });
    return { success: true, output: result };
  } catch (err) {
    return { success: false, error: err.message, output: err.stdout };
  }
}

function checkSupabaseCLI() {
  info('Checking Supabase CLI installation...');
  const result = execCommand('supabase --version', { silent: true });
  
  if (!result.success) {
    error('Supabase CLI is not installed!');
    info('Please install it using: npm install -g supabase');
    info('Or visit: https://supabase.com/docs/guides/cli');
    process.exit(1);
  }
  
  success(`Supabase CLI is installed: ${result.output.trim()}`);
}

function checkDockerRunning() {
  info('Checking if Docker is running...');
  const result = execCommand('docker ps', { silent: true });
  
  if (!result.success) {
    error('Docker is not running!');
    info('Please start Docker Desktop and try again.');
    process.exit(1);
  }
  
  success('Docker is running');
}

function ensureSupabaseDirectory() {
  if (!fs.existsSync(SUPABASE_DIR)) {
    info('Creating supabase directory...');
    fs.mkdirSync(SUPABASE_DIR, { recursive: true });
    fs.mkdirSync(path.join(SUPABASE_DIR, 'migrations'), { recursive: true });
  }
}

function checkRequiredFiles() {
  const requiredFiles = [
    { path: MIGRATION_FILE, name: 'Migration file' },
    { path: SEED_FILE, name: 'Seed file' },
    { path: CONFIG_FILE, name: 'Config file' }
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file.path)) {
      error(`${file.name} not found: ${file.path}`);
      info('Please ensure all database files are created first.');
      process.exit(1);
    }
  }
  
  success('All required database files found');
}

function initializeSupabase() {
  info('Initializing Supabase project...');
  
  // Check if already initialized
  if (fs.existsSync(path.join(SUPABASE_DIR, 'config.toml'))) {
    warning('Supabase project already initialized');
    return;
  }
  
  const result = execCommand('supabase init');
  
  if (!result.success) {
    error('Failed to initialize Supabase project');
    process.exit(1);
  }
  
  success('Supabase project initialized');
}

function startSupabase() {
  info('Starting Supabase local development...');
  
  const result = execCommand('supabase start');
  
  if (!result.success) {
    error('Failed to start Supabase');
    info('Make sure Docker is running and try again.');
    process.exit(1);
  }
  
  success('Supabase started successfully');
}

function applyMigrations() {
  info('Applying database migrations...');
  
  const result = execCommand('supabase db reset');
  
  if (!result.success) {
    error('Failed to apply migrations');
    process.exit(1);
  }
  
  success('Database migrations applied');
}

function seedDatabase() {
  info('Seeding database with sample data...');
  
  // Read and execute seed file
  const seedSQL = fs.readFileSync(SEED_FILE, 'utf8');
  
  // Write seed SQL to a temporary file and execute it
  const tempSeedFile = path.join(SUPABASE_DIR, 'temp_seed.sql');
  fs.writeFileSync(tempSeedFile, seedSQL);
  
  const result = execCommand(`supabase db reset --with-seed`);
  
  // Clean up temp file
  if (fs.existsSync(tempSeedFile)) {
    fs.unlinkSync(tempSeedFile);
  }
  
  if (!result.success) {
    warning('Failed to seed database - continuing without sample data');
    return;
  }
  
  success('Database seeded with sample data');
}

function generateTypes() {
  info('Generating TypeScript types...');
  
  const typesDir = path.join(__dirname, '..', 'lib');
  const typesFile = path.join(typesDir, 'supabase.types.ts');
  
  const result = execCommand(`supabase gen types typescript --local > "${typesFile}"`);
  
  if (!result.success) {
    warning('Failed to generate types - you may need to do this manually');
    return;
  }
  
  success('TypeScript types generated');
}

function showConnectionInfo() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🎉 DATABASE SETUP COMPLETE!', 'green');
  log('='.repeat(60), 'cyan');
  
  log('\nLocal Supabase Services:', 'bright');
  log('📊 Studio (Database UI): http://localhost:54323', 'blue');
  log('🔌 API URL: http://localhost:54321', 'blue');
  log('📧 Inbucket (Email testing): http://localhost:54324', 'blue');
  
  log('\nNext Steps:', 'bright');
  log('1. Update your .env.local file with local credentials', 'yellow');
  log('2. Start your Next.js development server: npm run dev', 'yellow');
  log('3. Visit http://localhost:3000 to see your app', 'yellow');
  
  log('\nUseful Commands:', 'bright');
  log('• supabase status - Check service status', 'magenta');
  log('• supabase stop - Stop all services', 'magenta');
  log('• supabase db reset - Reset database with fresh data', 'magenta');
  log('• supabase logs - View service logs', 'magenta');
  
  log('\n' + '='.repeat(60), 'cyan');
}

function setupProduction() {
  info('Setting up production database...');
  
  // Check if project is linked
  const statusResult = execCommand('supabase status', { silent: true });
  
  if (statusResult.output && statusResult.output.includes('Local project not linked')) {
    error('Project is not linked to a Supabase project!');
    info('Please run: supabase link --project-ref YOUR_PROJECT_REF');
    process.exit(1);
  }
  
  // Push migrations to production
  info('Pushing migrations to production...');
  const pushResult = execCommand('supabase db push');
  
  if (!pushResult.success) {
    error('Failed to push migrations to production');
    process.exit(1);
  }
  
  success('Production database setup complete!');
  info('Remember to update your production environment variables.');
}

function main() {
  const args = process.argv.slice(2);
  const isProduction = args.includes('--prod') || args.includes('--production');
  const isReset = args.includes('--reset');
  
  log('🚀 Polling App Database Setup', 'cyan');
  log('================================\n', 'cyan');
  
  if (isProduction) {
    log('Setting up PRODUCTION database...\n', 'yellow');
    checkSupabaseCLI();
    checkRequiredFiles();
    setupProduction();
    return;
  }
  
  log('Setting up LOCAL development database...\n', 'blue');
  
  // Pre-flight checks
  checkSupabaseCLI();
  checkDockerRunning();
  ensureSupabaseDirectory();
  checkRequiredFiles();
  
  // Setup process
  if (!fs.existsSync(path.join(process.cwd(), 'supabase', 'config.toml'))) {
    initializeSupabase();
  }
  
  startSupabase();
  applyMigrations();
  
  if (!isReset) {
    seedDatabase();
  }
  
  generateTypes();
  showConnectionInfo();
}

// Handle errors gracefully
process.on('uncaughtException', (err) => {
  error(`Unexpected error: ${err.message}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  log('\n\nSetup interrupted by user', 'yellow');
  process.exit(0);
});

// Run the setup
if (require.main === module) {
  main();
}

module.exports = {
  checkSupabaseCLI,
  checkDockerRunning,
  startSupabase,
  applyMigrations,
  seedDatabase,
  generateTypes
};