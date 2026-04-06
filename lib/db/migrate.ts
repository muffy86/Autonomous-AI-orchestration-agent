import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as fs from 'node:fs';
import * as path from 'node:path';

config({
  path: '.env.local',
});

const runMigrate = async () => {
  console.log('🔍 Checking migration prerequisites...\n');

  // Check if POSTGRES_URL is defined
  if (!process.env.POSTGRES_URL) {
    console.error('❌ Migration failed: Missing database configuration\n');
    console.error('POSTGRES_URL environment variable is not defined.');
    console.error('\n📝 To fix this issue:\n');
    console.error('1. Create a .env.local file in your project root');
    console.error('2. Add your database URL:');
    console.error('   POSTGRES_URL="postgresql://user:password@host:port/database"\n');
    console.error('3. For local development, you can use:');
    console.error('   - PostgreSQL (default port 5432)');
    console.error('   - Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres');
    console.error('   - Neon Serverless: https://neon.tech\n');
    console.error('4. For production deployment:');
    console.error('   - Set POSTGRES_URL in your deployment platform environment variables');
    console.error('   - Vercel: https://vercel.com/docs/storage/postgres');
    console.error('   - Railway: https://railway.app/');
    console.error('   - Render: https://render.com/docs/databases\n');
    throw new Error('POSTGRES_URL is not defined');
  }

  // Check if migrations folder exists
  const migrationsFolder = './lib/db/migrations';
  if (!fs.existsSync(migrationsFolder)) {
    console.error(`❌ Migration failed: Migrations folder not found\n`);
    console.error(`The migrations folder does not exist at: ${path.resolve(migrationsFolder)}\n`);
    console.error('📝 To fix this issue:\n');
    console.error('1. Run: npm run db:generate');
    console.error('   This will generate migration files from your schema\n');
    console.error('2. If you need to create the folder manually:');
    console.error(`   mkdir -p ${migrationsFolder}\n`);
    throw new Error('Migrations folder not found');
  }

  // Check if there are migration files
  const files = fs.readdirSync(migrationsFolder).filter(f => f.endsWith('.sql'));
  if (files.length === 0) {
    console.warn('⚠️  No migration files found in', migrationsFolder);
    console.warn('Run "npm run db:generate" to create migration files from your schema\n');
    console.log('✅ Migration check completed (no migrations to run)');
    process.exit(0);
    return;
  }

  console.log(`📁 Found ${files.length} migration file(s)\n`);

  let connection: postgres.Sql | null = null;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = postgres(process.env.POSTGRES_URL, { 
      max: 1,
      connect_timeout: 10,
      idle_timeout: 10,
    });
    
    // Test the connection
    await connection`SELECT 1`;
    console.log('✅ Database connection successful\n');

    const db = drizzle(connection);

    console.log('⏳ Running migrations...');
    const start = Date.now();
    
    await migrate(db, { migrationsFolder });
    
    const end = Date.now();
    const duration = end - start;

    console.log(`\n✅ Migrations completed successfully in ${duration}ms`);
    console.log(`📊 Applied ${files.length} migration(s)\n`);
    
  } catch (err) {
    console.error('\n❌ Migration failed\n');
    
    if (err instanceof Error) {
      // Connection errors
      if (err.message.includes('ECONNREFUSED')) {
        console.error('Connection refused: Unable to connect to the database server.\n');
        console.error('Possible causes:');
        console.error('- Database server is not running');
        console.error('- Incorrect host or port in POSTGRES_URL');
        console.error('- Firewall blocking the connection\n');
      } 
      // Authentication errors
      else if (err.message.includes('authentication') || err.message.includes('password')) {
        console.error('Authentication failed: Invalid database credentials.\n');
        console.error('Please check:');
        console.error('- Username and password in POSTGRES_URL');
        console.error('- Database user has proper permissions\n');
      }
      // Database not found
      else if (err.message.includes('database') && err.message.includes('does not exist')) {
        console.error('Database does not exist.\n');
        console.error('Please create the database first or check the database name in POSTGRES_URL\n');
      }
      // Permission errors
      else if (err.message.includes('permission denied')) {
        console.error('Permission denied: Database user lacks necessary privileges.\n');
        console.error('Please ensure the database user has:');
        console.error('- CREATE privileges');
        console.error('- ALTER privileges');
        console.error('- SELECT, INSERT, UPDATE, DELETE privileges\n');
      }
      // Generic error with details
      else {
        console.error('Error details:', err.message, '\n');
      }
      
      console.error('Stack trace:');
      console.error(err.stack);
    } else {
      console.error('Unknown error occurred:', err);
    }
    
    throw err;
  } finally {
    // Ensure connection is closed
    if (connection) {
      await connection.end({ timeout: 5 });
      console.log('🔌 Database connection closed');
    }
  }
};

runMigrate()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💡 For more help:');
    console.error('- Documentation: Check DEPLOYMENT.md in the project root');
    console.error('- Database setup: See README.md for local development setup');
    console.error('- Issues: https://github.com/vercel/ai-chatbot/issues\n');
    process.exit(1);
  });
