#!/bin/bash

# 🚀 PromptCraft Studio - Automated Setup Script
# For Hackathon Judges & Developers

echo "🚀 Setting up PromptCraft Studio..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ required. Current: $(node --version)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) detected${NC}"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
if npm install; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
    echo "Creating template .env.local file..."
    
    cat > .env.local << EOL
# 🔧 PromptCraft Studio Environment Configuration
# Replace these with your actual values

# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI API Keys (OPTIONAL - users can add in app)
OPENAI_API_KEY=sk-your-openai-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Production Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-for-production
EOL

    echo -e "${YELLOW}📝 Template .env.local created${NC}"
    echo -e "${RED}🚨 IMPORTANT: You must set up a database for the app to work!${NC}"
    echo -e "${BLUE}📖 Read DATABASE_SETUP.md for complete instructions${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Please choose one option:${NC}"
    echo "1. Use demo database (contact for credentials)"
    echo "2. Create your own Supabase database (recommended)"
    echo "3. Run the setup script again after updating .env.local"
    echo ""
else
    echo -e "${GREEN}✅ .env.local found${NC}"
    
    # Check if database credentials are configured
    if grep -q "your-project-id.supabase.co" .env.local 2>/dev/null; then
        echo -e "${YELLOW}⚠️  .env.local contains template values${NC}"
        echo -e "${RED}🚨 You must configure your database credentials!${NC}"
        echo -e "${BLUE}📖 See DATABASE_SETUP.md for instructions${NC}"
    else
        echo -e "${GREEN}✅ Database credentials appear to be configured${NC}"
    fi
fi

# Build the project to check for errors
echo -e "${BLUE}🔨 Building project to verify setup...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed - please check your configuration${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Update .env.local with your Supabase credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo -e "${BLUE}For detailed setup instructions, see:${NC}"
echo "- README.md"
echo "- SETUP.md"
echo ""
echo -e "${GREEN}Happy hacking! 🚀${NC}" 