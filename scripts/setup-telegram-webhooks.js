#!/usr/bin/env node

/**
 * Telegram Bot Webhook Setup Script
 * 
 * This script helps you set up webhooks for your Telegram bots.
 * It will register the webhook URL with Telegram's API for each bot token.
 * 
 * Usage:
 *   node scripts/setup-telegram-webhooks.js <YOUR_DOMAIN>
 * 
 * Example:
 *   node scripts/setup-telegram-webhooks.js https://my-chatbot.vercel.app
 */

const https = require('https');

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: data ? 'POST' : 'GET',
      headers: data ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      } : {}
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

async function setWebhook(botToken, webhookUrl) {
  const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
  const data = JSON.stringify({
    url: webhookUrl,
    allowed_updates: ['message']
  });

  try {
    const response = await makeRequest(url, data);
    return response;
  } catch (error) {
    throw new Error(`Failed to set webhook: ${error.message}`);
  }
}

async function getWebhookInfo(botToken) {
  const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
  
  try {
    const response = await makeRequest(url);
    return response;
  } catch (error) {
    throw new Error(`Failed to get webhook info: ${error.message}`);
  }
}

async function getBotInfo(botToken) {
  const url = `https://api.telegram.org/bot${botToken}/getMe`;
  
  try {
    const response = await makeRequest(url);
    return response;
  } catch (error) {
    throw new Error(`Failed to get bot info: ${error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Error: Missing domain argument');
    console.error('');
    console.error('Usage:');
    console.error('  node scripts/setup-telegram-webhooks.js <YOUR_DOMAIN>');
    console.error('');
    console.error('Example:');
    console.error('  node scripts/setup-telegram-webhooks.js https://my-chatbot.vercel.app');
    process.exit(1);
  }

  let domain = args[0];
  
  // Ensure domain starts with https://
  if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
    domain = 'https://' + domain;
  }

  // Remove trailing slash
  domain = domain.replace(/\/$/, '');

  console.log('🤖 Telegram Bot Webhook Setup');
  console.log('━'.repeat(60));
  console.log('');

  // Get bot tokens from environment variable
  const tokens = process.env.TELEGRAM_BOT_TOKENS;
  
  if (!tokens) {
    console.error('❌ Error: TELEGRAM_BOT_TOKENS environment variable not set');
    console.error('');
    console.error('Please set the TELEGRAM_BOT_TOKENS environment variable:');
    console.error('  export TELEGRAM_BOT_TOKENS="token1,token2,token3"');
    console.error('');
    console.error('Or create a .env file with:');
    console.error('  TELEGRAM_BOT_TOKENS=token1,token2,token3');
    process.exit(1);
  }

  const botTokens = tokens.split(',').map(t => t.trim()).filter(t => t);

  if (botTokens.length === 0) {
    console.error('❌ Error: No bot tokens found in TELEGRAM_BOT_TOKENS');
    process.exit(1);
  }

  console.log(`Found ${botTokens.length} bot token(s)`);
  console.log('');

  for (let i = 0; i < botTokens.length; i++) {
    const token = botTokens[i];
    const tokenPreview = token.substring(0, 15) + '...';
    
    console.log(`📱 Bot ${i + 1}/${botTokens.length} (${tokenPreview})`);
    console.log('─'.repeat(60));

    try {
      // Get bot info
      console.log('  ℹ️  Getting bot info...');
      const botInfo = await getBotInfo(token);
      
      if (botInfo.ok) {
        console.log(`  ✓ Bot name: @${botInfo.result.username}`);
        console.log(`  ✓ Full name: ${botInfo.result.first_name}`);
      }

      // Set webhook
      const webhookUrl = `${domain}/api/telegram-webhook?token=${token}`;
      console.log(`  🔗 Setting webhook: ${domain}/api/telegram-webhook?token=***`);
      
      const setWebhookResponse = await setWebhook(token, webhookUrl);
      
      if (setWebhookResponse.ok) {
        console.log('  ✓ Webhook set successfully');
      } else {
        console.error(`  ❌ Failed to set webhook: ${setWebhookResponse.description}`);
        continue;
      }

      // Verify webhook
      console.log('  🔍 Verifying webhook...');
      const webhookInfo = await getWebhookInfo(token);
      
      if (webhookInfo.ok) {
        if (webhookInfo.result.url === webhookUrl) {
          console.log('  ✓ Webhook verified successfully');
          console.log(`  ✓ Pending updates: ${webhookInfo.result.pending_update_count || 0}`);
          
          if (webhookInfo.result.last_error_date) {
            console.log(`  ⚠️  Last error: ${webhookInfo.result.last_error_message}`);
          }
        } else {
          console.error('  ❌ Webhook URL mismatch');
          console.error(`     Expected: ${webhookUrl}`);
          console.error(`     Got: ${webhookInfo.result.url}`);
        }
      }

      console.log('');
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      console.log('');
    }
  }

  console.log('━'.repeat(60));
  console.log('✅ Setup complete!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Test your bot by sending a message on Telegram');
  console.log('  2. Check your application logs for any errors');
  console.log('  3. Visit the webhook endpoint to verify it\'s working:');
  console.log(`     ${domain}/api/telegram-webhook`);
  console.log('');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
