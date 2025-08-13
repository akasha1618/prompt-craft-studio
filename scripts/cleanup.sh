#!/bin/bash

# 🧹 PromptCraft Studio - Project Cleanup Script
# Prepare your project for hackathon submission

echo "🧹 Cleaning up PromptCraft Studio for hackathon submission..."
echo "============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if file/directory exists and remove it
safe_remove() {
    if [ -e "$1" ]; then
        rm -rf "$1"
        echo -e "${GREEN}✅ Removed: $1${NC}"
    else
        echo -e "${BLUE}ℹ️  Not found: $1${NC}"
    fi
}

# Remove sensitive environment files
echo -e "${YELLOW}🔐 Removing sensitive environment files...${NC}"
safe_remove ".env"
safe_remove ".env.local"
safe_remove ".env.development.local"
safe_remove ".env.production.local"

# Remove build artifacts
echo -e "${YELLOW}📦 Removing build artifacts...${NC}"
safe_remove ".next"
safe_remove "node_modules"
safe_remove "dist"
safe_remove "build"
safe_remove "out"
safe_remove "*.tsbuildinfo"
safe_remove "next-env.d.ts"

# Remove development files
echo -e "${YELLOW}🛠️  Removing development files...${NC}"
safe_remove ".vscode"
safe_remove ".idea"
safe_remove "*.swp"
safe_remove "*.swo"
safe_remove "*~"

# Remove log files
echo -e "${YELLOW}📊 Removing log files...${NC}"
safe_remove "logs"
safe_remove "*.log"
safe_remove "npm-debug.log*"
safe_remove "yarn-debug.log*"
safe_remove "yarn-error.log*"

# Remove personal notes
echo -e "${YELLOW}📝 Removing personal notes...${NC}"
safe_remove "NOTES.md"
safe_remove "TODO.md"
safe_remove "SCRATCH.md"
safe_remove "RANDOM_THOUGHTS.md"
safe_remove "PERSONAL_NOTES.txt"

# Remove database files
echo -e "${YELLOW}🗄️  Removing local database files...${NC}"
safe_remove "*.db"
safe_remove "*.sqlite"
safe_remove "*.sqlite3"
safe_remove "database.json"
safe_remove "local_data.sql"

# Security check - search for potential secrets
echo -e "${YELLOW}🔍 Performing security audit...${NC}"
echo "Searching for potential secrets in remaining files..."

# Check for common secret patterns
SECRET_PATTERNS=("sk-" "password" "secret" "token" "key")
FOUND_SECRETS=false

for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -r "$pattern" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="cleanup.sh" --exclude="setup.sh" -q 2>/dev/null; then
        echo -e "${RED}⚠️  Found potential secret pattern: '$pattern'${NC}"
        echo "Please review these files manually:"
        grep -r "$pattern" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="cleanup.sh" --exclude="setup.sh" -l 2>/dev/null | head -5
        FOUND_SECRETS=true
    fi
done

if [ "$FOUND_SECRETS" = false ]; then
    echo -e "${GREEN}✅ No obvious secrets found${NC}"
fi

# Verify essential files exist
echo -e "${YELLOW}📋 Verifying essential files...${NC}"
ESSENTIAL_FILES=("README.md" "package.json" ".gitignore" "app" "components" "supabase/schema.sql")
MISSING_FILES=false

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo -e "${GREEN}✅ Found: $file${NC}"
    else
        echo -e "${RED}❌ Missing: $file${NC}"
        MISSING_FILES=true
    fi
done

# Final summary
echo ""
echo "============================================================="
if [ "$FOUND_SECRETS" = true ] || [ "$MISSING_FILES" = true ]; then
    echo -e "${YELLOW}⚠️  Cleanup completed with warnings${NC}"
    if [ "$FOUND_SECRETS" = true ]; then
        echo -e "${RED}🔐 Please review and remove any secrets manually${NC}"
    fi
    if [ "$MISSING_FILES" = true ]; then
        echo -e "${RED}📋 Some essential files are missing${NC}"
    fi
else
    echo -e "${GREEN}🎉 Cleanup completed successfully!${NC}"
fi

echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo "1. Review the security audit results above"
echo "2. Test your project: npm install && npm run build"
echo "3. Update README.md with your actual repository URL"
echo "4. Create a demo deployment"
echo "5. Commit and push to GitHub"
echo ""
echo -e "${GREEN}Your project is ready for hackathon submission! 🚀${NC}" 