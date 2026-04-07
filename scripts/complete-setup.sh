#!/bin/bash

###############################################################################
# Telegram Bot Complete Setup Script
# 
# This script will guide you through the complete setup process and
# automatically configure everything once you provide the required information.
###############################################################################

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 Telegram Bot Complete Setup Wizard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "✓ Found existing .env file"
    echo ""
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Using existing .env file..."
    else
        cp .env .env.backup.$(date +%s)
        echo "Backed up existing .env"
    fi
else
    echo "Creating new .env file from template..."
    cp .env.example .env
    echo "✓ Created .env file"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step 1: Database Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "You need a PostgreSQL database URL."
echo ""
echo "Options:"
echo "  1. Vercel Postgres (recommended for production)"
echo "  2. Neon (free tier available)"
echo "  3. Local PostgreSQL"
echo "  4. Skip (already configured in environment)"
echo ""
read -p "Enter your choice (1-4): " db_choice

if [ "$db_choice" != "4" ]; then
    echo ""
    read -p "Enter your POSTGRES_URL: " postgres_url
    
    if [ ! -z "$postgres_url" ]; then
        # Update .env file
        if grep -q "^POSTGRES_URL=" .env; then
            sed -i.bak "s|^POSTGRES_URL=.*|POSTGRES_URL=$postgres_url|" .env
        else
            echo "POSTGRES_URL=$postgres_url" >> .env
        fi
        echo "✓ Database URL configured"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 Step 2: Telegram Bot Tokens"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "How to get your tokens:"
echo "  1. Open Telegram and message @BotFather"
echo "  2. Send /mybots"
echo "  3. Select each bot and click 'API Token'"
echo ""
echo "Enter your bot tokens (comma-separated, no spaces):"
echo "Example: 123456789:ABC...,987654321:XYZ..."
echo ""
read -p "TELEGRAM_BOT_TOKENS: " bot_tokens

if [ ! -z "$bot_tokens" ]; then
    if grep -q "^TELEGRAM_BOT_TOKENS=" .env; then
        sed -i.bak "s|^TELEGRAM_BOT_TOKENS=.*|TELEGRAM_BOT_TOKENS=$bot_tokens|" .env
    else
        echo "TELEGRAM_BOT_TOKENS=$bot_tokens" >> .env
    fi
    echo "✓ Bot tokens configured"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧠 Step 3: AI API Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Choose your AI provider:"
echo "  1. xAI (Grok) - Default"
echo "  2. OpenAI"
echo "  3. Skip (already configured)"
echo ""
read -p "Enter your choice (1-3): " ai_choice

if [ "$ai_choice" == "1" ]; then
    echo ""
    echo "Get your xAI API key from: https://console.x.ai/"
    read -p "XAI_API_KEY: " xai_key
    if [ ! -z "$xai_key" ]; then
        if grep -q "^XAI_API_KEY=" .env; then
            sed -i.bak "s|^XAI_API_KEY=.*|XAI_API_KEY=$xai_key|" .env
        else
            echo "XAI_API_KEY=$xai_key" >> .env
        fi
        echo "✓ xAI API key configured"
    fi
elif [ "$ai_choice" == "2" ]; then
    echo ""
    echo "Get your OpenAI API key from: https://platform.openai.com/api-keys"
    read -p "OPENAI_API_KEY: " openai_key
    if [ ! -z "$openai_key" ]; then
        if grep -q "^OPENAI_API_KEY=" .env; then
            sed -i.bak "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$openai_key|" .env
        else
            echo "OPENAI_API_KEY=$openai_key" >> .env
        fi
        echo "✓ OpenAI API key configured"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Step 4: Authentication Secret"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ! grep -q "^AUTH_SECRET=" .env || grep -q "^AUTH_SECRET=\*\*\*\*" .env; then
    echo "Generating random AUTH_SECRET..."
    auth_secret=$(openssl rand -base64 32)
    if grep -q "^AUTH_SECRET=" .env; then
        sed -i.bak "s|^AUTH_SECRET=.*|AUTH_SECRET=$auth_secret|" .env
    else
        echo "AUTH_SECRET=$auth_secret" >> .env
    fi
    echo "✓ AUTH_SECRET generated"
else
    echo "✓ AUTH_SECRET already configured"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️ Step 5: Running Database Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Load .env
set -a
source .env
set +a

if [ -z "$POSTGRES_URL" ]; then
    echo "⚠️  POSTGRES_URL not set. Skipping migration."
    echo "   Please configure database and run: pnpm db:migrate"
else
    echo "Running database migration..."
    if pnpm db:migrate; then
        echo "✓ Database migration completed"
    else
        echo "❌ Migration failed. Please check your database connection."
        exit 1
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Step 6: Webhook Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -z "$TELEGRAM_BOT_TOKENS" ]; then
    echo "⚠️  TELEGRAM_BOT_TOKENS not set. Skipping webhook setup."
    echo "   Configure tokens and run: node scripts/setup-telegram-webhooks.js <domain>"
else
    echo "To set up webhooks, you need your application's public URL."
    echo ""
    echo "Options:"
    echo "  1. Production URL (e.g., https://my-chatbot.vercel.app)"
    echo "  2. Local with ngrok (for testing)"
    echo "  3. Skip (set up later)"
    echo ""
    read -p "Enter your choice (1-3): " webhook_choice
    
    if [ "$webhook_choice" == "1" ]; then
        read -p "Enter your production URL: " prod_url
        if [ ! -z "$prod_url" ]; then
            echo ""
            echo "Setting up webhooks..."
            node scripts/setup-telegram-webhooks.js "$prod_url"
        fi
    elif [ "$webhook_choice" == "2" ]; then
        echo ""
        echo "For local testing:"
        echo "  1. Install ngrok: https://ngrok.com/"
        echo "  2. Run: ngrok http 3000"
        echo "  3. Copy the https URL"
        echo "  4. Run: node scripts/setup-telegram-webhooks.js <ngrok-url>"
        echo ""
        read -p "Press Enter to continue..."
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo ""
echo "  1. Start the development server:"
echo "     pnpm dev"
echo ""
echo "  2. Test your bots by sending messages on Telegram"
echo ""
echo "  3. Check application logs for any errors"
echo ""
echo "  4. For production deployment:"
echo "     - Push to GitHub: git push"
echo "     - Deploy to Vercel"
echo "     - Set environment variables in Vercel dashboard"
echo "     - Run webhook setup with production URL"
echo ""
echo "Configuration saved to: .env"
echo ""
echo "For help, see:"
echo "  - TELEGRAM_QUICKSTART.md"
echo "  - TELEGRAM_BOT_SETUP.md"
echo "  - SETUP_REQUIRED.md"
echo ""
