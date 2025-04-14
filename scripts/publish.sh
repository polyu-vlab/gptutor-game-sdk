#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting package publishing process...${NC}"

# Check if GitHub token is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  GITHUB_TOKEN not set. Please set it first:${NC}"
    echo "export GITHUB_TOKEN=your_github_token"
    exit 1
fi

# Add GitHub token to .npmrc
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" > .npmrc
echo "@polyu-vlab:registry=https://npm.pkg.github.com" >> .npmrc

# Build the package
echo -e "${YELLOW}🏗️  Building package...${NC}"
pnpm run build

# Publish the package
echo -e "${YELLOW}📦 Publishing package...${NC}"
pnpm publish --no-git-checks

echo -e "${GREEN}✅ Package published successfully!${NC}"
echo -e "${YELLOW}📝 To use this package in another project:${NC}"
echo "1. Create a .npmrc file with:"
echo "   @polyu-vlab:registry=https://npm.pkg.github.com"
echo "2. Install the package:"
echo "   pnpm add @polyu-vlab/gptutor-game-sdk" 