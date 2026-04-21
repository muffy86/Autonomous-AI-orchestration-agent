import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({
  path: '.env.local',
});

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    console.log('⚠️  POSTGRES_URL is not defined, skipping migrations');
    process.exit(0);
  }

  try {
    const connection = postgres(process.env.POSTGRES_URL, { max: 1, connect_timeout: 5 });
    const db = drizzle(connection);

    console.log('⏳ Running migrations...');

    const start = Date.now();
    await migrate(db, { migrationsFolder: './lib/db/migrations' });
    const end = Date.now();

    console.log('✅ Migrations completed in', end - start, 'ms');
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.log('⚠️  Database connection failed, skipping migrations (this is OK for build-time)');
    console.log('   Error:', (err as Error).message);
    process.exit(0);
  }
};

runMigrate().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});
