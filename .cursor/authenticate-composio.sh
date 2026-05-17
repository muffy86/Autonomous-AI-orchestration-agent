#!/bin/bash

# Composio Auto-Authentication Script
# This script automatically authenticates the Composio CLI if COMPOSIO_API_KEY is available

set -e

echo "🔐 Composio Authentication Helper"
echo "=================================="
echo ""

# Check if Composio CLI is installed
if [ ! -f "$HOME/.composio/composio" ]; then
    echo "❌ Composio CLI not found. Installing..."
    curl -fsSL https://composio.dev/install | bash
    echo "✅ Composio CLI installed"
    echo ""
fi

# Check if already authenticated
if $HOME/.composio/composio whoami &> /dev/null; then
    CURRENT_AUTH=$($HOME/.composio/composio whoami 2>/dev/null || echo "")
    if [ -n "$CURRENT_AUTH" ]; then
        echo "✅ Already authenticated:"
        echo "$CURRENT_AUTH"
        exit 0
    fi
fi

# Check for API key in environment
if [ -n "$COMPOSIO_API_KEY" ]; then
    echo "🔑 Found COMPOSIO_API_KEY in environment"
    echo "   Authenticating..."
    
    # Get organization ID if provided
    ORG_FLAG=""
    if [ -n "$COMPOSIO_ORG" ]; then
        ORG_FLAG="--org $COMPOSIO_ORG"
    fi
    
    # Authenticate
    if $HOME/.composio/composio login --user-api-key "$COMPOSIO_API_KEY" $ORG_FLAG --no-skill-install --yes 2>&1; then
        echo ""
        echo "✅ Authentication successful!"
        echo ""
        
        # Show authentication info
        echo "📋 Account Information:"
        $HOME/.composio/composio whoami
        
        echo ""
        echo "🎉 Composio CLI is ready to use!"
        echo ""
        echo "Try these commands:"
        echo "  ~/.composio/composio search \"github\""
        echo "  ~/.composio/composio tools list github"
        
        exit 0
    else
        echo ""
        echo "❌ Authentication failed. Please check your API key."
        exit 1
    fi
else
    echo "⚠️  No COMPOSIO_API_KEY found in environment"
    echo ""
    echo "To authenticate, do one of the following:"
    echo ""
    echo "1. Add as environment variable:"
    echo "   export COMPOSIO_API_KEY='your-api-key'"
    echo "   $0"
    echo ""
    echo "2. Add as Cursor Cloud Agent secret:"
    echo "   • Go to Cursor Dashboard → Cloud Agents → Secrets"
    echo "   • Add COMPOSIO_API_KEY with your key"
    echo "   • Re-run the Cloud Agent"
    echo ""
    echo "3. Authenticate manually:"
    echo "   ~/.composio/composio login"
    echo ""
    echo "Get your API key at: https://composio.dev/ → Settings → API Keys"
    echo ""
    exit 1
fi
