#!/usr/bin/env node

const postgres = require('postgres');
const { createClient } = require('redis');
const { config } = require('dotenv');

config({ path: '.env.local' });

async function verifyConnections() {
  console.log('🔍 Verifying system connections...\n');
  
  let allPassed = true;

  // Test PostgreSQL
  console.log('📊 Testing PostgreSQL connection...');
  try {
    const sql = postgres(process.env.POSTGRES_URL);
    const result = await sql`SELECT version()`;
    console.log('✅ PostgreSQL: Connected successfully');
    console.log(`   Version: ${result[0].version.split('\n')[0]}`);
    await sql.end();
  } catch (error) {
    console.error('❌ PostgreSQL: Connection failed');
    console.error(`   Error: ${error.message}`);
    allPassed = false;
  }

  // Test Redis
  console.log('\n🔴 Testing Redis connection...');
  try {
    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
    const pong = await redis.ping();
    console.log('✅ Redis: Connected successfully');
    console.log(`   Response: ${pong}`);
    await redis.disconnect();
  } catch (error) {
    console.error('❌ Redis: Connection failed');
    console.error(`   Error: ${error.message}`);
    allPassed = false;
  }

  // Check environment variables
  console.log('\n🔑 Checking environment variables...');
  const requiredVars = ['AUTH_SECRET', 'POSTGRES_URL', 'REDIS_URL'];
  const optionalVars = ['XAI_API_KEY', 'OPENAI_API_KEY', 'BLOB_READ_WRITE_TOKEN'];

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allPassed = false;
    }
  }

  console.log('\n📝 Optional variables:');
  for (const varName of optionalVars) {
    if (process.env[varName] && !process.env[varName].includes('your_')) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`⚠️  ${varName}: Not set (optional)`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All required connections verified successfully!');
    console.log('🚀 You can now run: pnpm dev');
    process.exit(0);
  } else {
    console.log('❌ Some connections failed. Please check the errors above.');
    process.exit(1);
  }
}

verifyConnections();
