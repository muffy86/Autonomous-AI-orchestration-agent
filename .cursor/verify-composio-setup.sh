#!/bin/bash

# Composio MCP Setup Verification Script
# This script verifies that the Composio MCP server is properly configured

set -e

echo "🔍 Composio MCP Setup Verification"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ALL_CHECKS_PASSED=true

# Function to print success
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
print_error() {
    echo -e "${RED}✗${NC} $1"
    ALL_CHECKS_PASSED=false
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check 1: MCP Configuration File
echo "1. Checking MCP configuration file..."
if [ -f ".cursor/mcp.json" ]; then
    print_success "MCP configuration file exists"
    
    # Validate JSON
    if command -v jq &> /dev/null; then
        if jq empty .cursor/mcp.json 2>/dev/null; then
            print_success "MCP configuration is valid JSON"
            
            # Check for composio server
            if jq -e '.mcpServers.composio' .cursor/mcp.json &> /dev/null; then
                print_success "Composio server is configured"
                
                # Check URL
                URL=$(jq -r '.mcpServers.composio.url' .cursor/mcp.json)
                if [ "$URL" = "https://connect.composio.dev/mcp" ]; then
                    print_success "Composio URL is correct: $URL"
                else
                    print_error "Composio URL is incorrect: $URL"
                fi
            else
                print_error "Composio server not found in configuration"
            fi
        else
            print_error "MCP configuration contains invalid JSON"
        fi
    else
        print_warning "jq not installed, skipping JSON validation"
    fi
else
    print_error "MCP configuration file not found at .cursor/mcp.json"
fi

echo ""

# Check 2: Composio CLI Installation
echo "2. Checking Composio CLI installation..."
if [ -f "$HOME/.composio/composio" ]; then
    print_success "Composio CLI is installed"
    
    # Check version
    VERSION=$($HOME/.composio/composio --version 2>/dev/null || echo "unknown")
    print_success "Composio CLI version: $VERSION"
else
    print_error "Composio CLI not found at ~/.composio/composio"
    print_warning "Install with: curl -fsSL https://composio.dev/install | bash"
fi

echo ""

# Check 3: Composio Authentication
echo "3. Checking Composio authentication..."
if [ -f "$HOME/.composio/composio" ]; then
    if $HOME/.composio/composio whoami &> /dev/null; then
        WHOAMI=$($HOME/.composio/composio whoami 2>/dev/null)
        print_success "Composio is authenticated"
        
        # Extract email and org from JSON
        if command -v jq &> /dev/null; then
            EMAIL=$(echo "$WHOAMI" | jq -r '.email' 2>/dev/null || echo "unknown")
            ORG=$(echo "$WHOAMI" | jq -r '.default_org_name' 2>/dev/null || echo "unknown")
            echo "   Email: $EMAIL"
            echo "   Organization: $ORG"
        else
            echo "   $WHOAMI"
        fi
    else
        print_error "Composio is not authenticated"
        print_warning "Login with: ~/.composio/composio login --user-api-key <your-key> --org <your-org>"
    fi
else
    print_warning "Skipping authentication check (CLI not installed)"
fi

echo ""

# Check 4: Documentation
echo "4. Checking documentation..."
if [ -f ".cursor/COMPOSIO_MCP_SETUP.md" ]; then
    print_success "Setup documentation exists"
else
    print_error "Setup documentation not found at .cursor/COMPOSIO_MCP_SETUP.md"
fi

echo ""

# Check 5: Network connectivity to Composio
echo "5. Checking network connectivity to Composio..."
if command -v curl &> /dev/null; then
    if curl -s --head --request GET https://connect.composio.dev/mcp | grep "HTTP" > /dev/null; then
        print_success "Can reach Composio MCP endpoint"
    else
        print_error "Cannot reach Composio MCP endpoint"
        print_warning "Check your internet connection"
    fi
else
    print_warning "curl not installed, skipping network check"
fi

echo ""
echo "=================================="

# Final summary
if [ "$ALL_CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Your Composio MCP setup is complete and ready to use."
    echo ""
    echo "Next steps:"
    echo "1. Open Cursor IDE"
    echo "2. Go to Settings > Tools & MCP"
    echo "3. Verify the 'composio' server is connected"
    echo ""
    echo "For more information, see: .cursor/COMPOSIO_MCP_SETUP.md"
    exit 0
else
    echo -e "${RED}✗ Some checks failed${NC}"
    echo ""
    echo "Please review the errors above and fix any issues."
    echo "For help, see: .cursor/COMPOSIO_MCP_SETUP.md"
    exit 1
fi
