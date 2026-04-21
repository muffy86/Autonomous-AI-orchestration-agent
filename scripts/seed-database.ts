/**
 * Database Seeding Script
 * Automatically populates the database with initial data for testing/development
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hash } from 'bcrypt-ts';
import { user, chat, message } from '../lib/db/schema';

config({ path: '.env.local' });

const seedDatabase = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  console.log('🌱 Starting database seeding...\n');

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  try {
    // Create demo user
    console.log('👤 Creating demo user...');
    const hashedPassword = await hash('Demo123!@#', 10);
    
    const [demoUser] = await db.insert(user).values({
      email: 'demo@example.com',
      password: hashedPassword,
    }).returning().catch(() => {
      console.log('   Demo user already exists, skipping...');
      return [];
    });

    if (demoUser) {
      console.log('   ✅ Demo user created: demo@example.com');
      console.log('   🔑 Password: Demo123!@#\n');

      // Create demo chat
      console.log('💬 Creating demo chat...');
      const [demoChat] = await db.insert(chat).values({
        title: 'Welcome to AI Chatbot!',
        userId: demoUser.id,
        createdAt: new Date(),
        visibility: 'private',
      }).returning();

      console.log('   ✅ Demo chat created\n');

      // Create welcome messages
      console.log('📝 Creating welcome messages...');
      await db.insert(message).values([
        {
          chatId: demoChat.id,
          role: 'assistant',
          parts: [{
            type: 'text',
            text: 'Hello! Welcome to your AI Chatbot. I\'m here to help you with anything you need. How can I assist you today?'
          }],
          attachments: [],
          createdAt: new Date(),
        },
      ]);

      console.log('   ✅ Welcome messages created\n');
    }

    // Create test user (for automated testing)
    console.log('🧪 Creating test user...');
    const testPassword = await hash('Test123!@#', 10);
    
    await db.insert(user).values({
      email: 'test@example.com',
      password: testPassword,
    }).returning().catch(() => {
      console.log('   Test user already exists, skipping...');
      return [];
    });

    console.log('   ✅ Test user created: test@example.com');
    console.log('   🔑 Password: Test123!@#\n');

    console.log('═══════════════════════════════════════════════');
    console.log('✅ Database seeding completed successfully!');
    console.log('═══════════════════════════════════════════════');
    console.log('\n📊 Seeded data:');
    console.log('   • Demo user: demo@example.com (Demo123!@#)');
    console.log('   • Test user: test@example.com (Test123!@#)');
    console.log('   • 1 demo chat with welcome message\n');

  } catch (error) {
    console.error('❌ Seeding failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await connection.end();
    process.exit(0);
  }
};

seedDatabase();
