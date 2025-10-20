#!/bin/bash

# Loominary Rebranding Script
# This script updates all references from Heirloom to Loominary across the entire platform

set -e

echo "🌟 Starting Loominary Rebranding Process"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_magic() {
    echo -e "${PURPLE}[LOOMINARY]${NC} $1"
}

# Backup function
create_backup() {
    print_status "Creating backup before rebranding..."
    cp -r . ../Heirloom-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
    print_success "Backup created (if possible)"
}

# Update file contents
update_file_contents() {
    print_status "Updating file contents..."
    
    # Find all text files and update content
    find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.svelte" -o -name "*.html" -o -name "*.json" -o -name "*.md" -o -name "*.yml" -o -name "*.yaml" -o -name "*.toml" -o -name "*.txt" \) \
        -not -path "./node_modules/*" \
        -not -path "./.git/*" \
        -not -path "./dist/*" \
        -not -path "./build/*" \
        -not -path "./.svelte-kit/*" \
        -exec sed -i 's/Heirloom/Loominary/g' {} \;
    
    # Update lowercase references
    find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.svelte" -o -name "*.html" -o -name "*.json" -o -name "*.md" -o -name "*.yml" -o -name "*.yaml" -o -name "*.toml" -o -name "*.txt" \) \
        -not -path "./node_modules/*" \
        -not -path "./.git/*" \
        -not -path "./dist/*" \
        -not -path "./build/*" \
        -not -path "./.svelte-kit/*" \
        -exec sed -i 's/heirloom/loominary/g' {} \;
    
    # Update UPPERCASE references
    find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.svelte" -o -name "*.html" -o -name "*.json" -o -name "*.md" -o -name "*.yml" -o -name "*.yaml" -o -name "*.toml" -o -name "*.txt" \) \
        -not -path "./node_modules/*" \
        -not -path "./.git/*" \
        -not -path "./dist/*" \
        -not -path "./build/*" \
        -not -path "./.svelte-kit/*" \
        -exec sed -i 's/HEIRLOOM/LOOMINARY/g' {} \;
    
    print_success "File contents updated"
}

# Update specific branding elements
update_branding_elements() {
    print_status "Updating specific branding elements..."
    
    # Update taglines and descriptions
    find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.svelte" -o -name "*.html" -o -name "*.json" -o -name "*.md" \) \
        -not -path "./node_modules/*" \
        -not -path "./.git/*" \
        -exec sed -i 's/Legacy for Future Generations/Weaving Memories Across Time/g' {} \;
    
    find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.svelte" -o -name "*.html" -o -name "*.json" -o -name "*.md" \) \
        -not -path "./node_modules/*" \
        -not -path "./.git/*" \
        -exec sed -i 's/The world'\''s first legacy platform/Private vaults weaving memories across time/g' {} \;
    
    find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.svelte" -o -name "*.html" -o -name "*.json" -o -name "*.md" \) \
        -not-path "./node_modules/*" \
        -not -path "./.git/*" \
        -exec sed -i 's/legacy platform/private memory vaults/g' {} \;
    
    print_success "Branding elements updated"
}

# Update package.json files
update_package_json() {
    print_status "Updating package.json files..."
    
    # Update main package.json
    if [ -f "package.json" ]; then
        sed -i 's/"name": "heirloom"/"name": "loominary"/g' package.json
        sed -i 's/"Heirloom"/"Loominary"/g' package.json
    fi
    
    # Update frontend package.json
    if [ -f "sveltekit-app/package.json" ]; then
        sed -i 's/"name": "heirloom"/"name": "loominary"/g' sveltekit-app/package.json
        sed -i 's/"Heirloom"/"Loominary"/g' sveltekit-app/package.json
    fi
    
    # Update backend package.json
    if [ -f "backend/package.json" ]; then
        sed -i 's/"name": "heirloom"/"name": "loominary"/g' backend/package.json
        sed -i 's/"Heirloom"/"Loominary"/g' backend/package.json
    fi
    
    # Update mobile app package.json
    if [ -f "mobile-app/package.json" ]; then
        sed -i 's/"name": "heirloom"/"name": "loominary"/g' mobile-app/package.json
        sed -i 's/"Heirloom"/"Loominary"/g' mobile-app/package.json
    fi
    
    # Update tests package.json
    if [ -f "tests/package.json" ]; then
        sed -i 's/"name": "heirloom"/"name": "loominary"/g' tests/package.json
        sed -i 's/"Heirloom"/"Loominary"/g' tests/package.json
    fi
    
    print_success "Package.json files updated"
}

# Update Docker files
update_docker_files() {
    print_status "Updating Docker files..."
    
    find . -name "Dockerfile" -o -name "docker-compose*.yml" | while read file; do
        sed -i 's/heirloom/loominary/g' "$file"
        sed -i 's/Heirloom/Loominary/g' "$file"
        sed -i 's/HEIRLOOM/LOOMINARY/g' "$file"
    done
    
    print_success "Docker files updated"
}

# Update environment files
update_env_files() {
    print_status "Updating environment files..."
    
    find . -name ".env*" -o -name "*.env" | while read file; do
        sed -i 's/HEIRLOOM/LOOMINARY/g' "$file"
        sed -i 's/heirloom/loominary/g' "$file"
    done
    
    print_success "Environment files updated"
}

# Update README and documentation
update_documentation() {
    print_status "Updating documentation..."
    
    # Update main README
    if [ -f "README.md" ]; then
        # Update title
        sed -i '1s/.*/# 🌟 Loominary - Private Memory Vaults/' README.md
        
        # Update description
        sed -i 's/revolutionary legacy platform/revolutionary private vault platform/g' README.md
        sed -i 's/preserve family memories/preserve private family memories in secure vaults/g' README.md
        
        # Add vault-specific features
        sed -i '/## Features/a\
- 🔐 **Private Vault System** - Secure token-based access to memory vaults\
- 🔍 **Sentiment Search** - "Tell me when my mom was happy in her 30s"\
- 🎭 **Emotional Intelligence** - AI-powered emotion and age context analysis\
- 🔑 **Token Inheritance** - Vault access through secure tokens (typically upon death)\
- 👨‍👩‍👧‍👦 **Family Linking** - Connect family members after vault unlock' README.md
    fi
    
    # Update other documentation files
    find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" | while read file; do
        sed -i 's/# Heirloom/# Loominary/g' "$file"
        sed -i 's/## Heirloom/## Loominary/g' "$file"
        sed -i 's/### Heirloom/### Loominary/g' "$file"
    done
    
    print_success "Documentation updated"
}

# Update CSS themes
update_css_themes() {
    print_status "Updating CSS themes..."
    
    # Update Tailwind config
    if [ -f "sveltekit-app/tailwind.config.js" ]; then
        sed -i 's/heirloom/loominary/g' sveltekit-app/tailwind.config.js
        sed -i 's/"heirloom"/"loominary"/g' sveltekit-app/tailwind.config.js
    fi
    
    # Update any CSS files
    find . -name "*.css" -not -path "./node_modules/*" | while read file; do
        sed -i 's/heirloom/loominary/g' "$file"
        sed -i 's/Heirloom/Loominary/g' "$file"
    done
    
    print_success "CSS themes updated"
}

# Update database schemas and models
update_database_schemas() {
    print_status "Updating database schemas..."
    
    # Update Prisma schema
    if [ -f "backend/prisma/schema.prisma" ]; then
        sed -i 's/heirloom/loominary/g' backend/prisma/schema.prisma
        sed -i 's/Heirloom/Loominary/g' backend/prisma/schema.prisma
    fi
    
    print_success "Database schemas updated"
}

# Update GitHub workflows
update_github_workflows() {
    print_status "Updating GitHub workflows..."
    
    find .github -name "*.yml" -o -name "*.yaml" 2>/dev/null | while read file; do
        sed -i 's/heirloom/loominary/g' "$file"
        sed -i 's/Heirloom/Loominary/g' "$file"
        sed -i 's/HEIRLOOM/LOOMINARY/g' "$file"
    done
    
    print_success "GitHub workflows updated"
}

# Create new branding assets
create_branding_assets() {
    print_status "Creating additional branding assets..."
    
    # Create a brand colors file
    cat > sveltekit-app/src/lib/brand.ts << 'EOF'
// Loominary Brand Colors and Theme
export const loominaryColors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  mystical: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  constellation: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  }
};

export const loominaryTheme = {
  name: 'Loominary',
  tagline: 'Weaving Memories Across Time',
  description: 'Private vaults that preserve your family\'s memories, accessible only through secure tokens',
  features: [
    'Private Vault System',
    'Token-Based Access',
    'Sentiment Search',
    'Emotional Intelligence',
    'Family Inheritance',
    '3D Constellation UI'
  ]
};
EOF
    
    print_success "Branding assets created"
}

# Update mobile app configuration
update_mobile_config() {
    print_status "Updating mobile app configuration..."
    
    # Update React Native app.json
    if [ -f "mobile-app/app.json" ]; then
        sed -i 's/"name": "Heirloom"/"name": "Loominary"/g' mobile-app/app.json
        sed -i 's/"displayName": "Heirloom"/"displayName": "Loominary"/g' mobile-app/app.json
        sed -i 's/"slug": "heirloom"/"slug": "loominary"/g' mobile-app/app.json
    fi
    
    # Update iOS Info.plist if exists
    if [ -f "mobile-app/ios/Heirloom/Info.plist" ]; then
        sed -i 's/Heirloom/Loominary/g' mobile-app/ios/Heirloom/Info.plist
    fi
    
    # Update Android strings.xml if exists
    if [ -f "mobile-app/android/app/src/main/res/values/strings.xml" ]; then
        sed -i 's/Heirloom/Loominary/g' mobile-app/android/app/src/main/res/values/strings.xml
    fi
    
    print_success "Mobile app configuration updated"
}

# Update test files
update_test_files() {
    print_status "Updating test files..."
    
    find tests -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null | while read file; do
        sed -i 's/Heirloom/Loominary/g' "$file"
        sed -i 's/heirloom/loominary/g' "$file"
        
        # Update test descriptions to reflect vault functionality
        sed -i 's/legacy platform/private vault platform/g' "$file"
        sed -i 's/family memories/private vault memories/g' "$file"
    done
    
    print_success "Test files updated"
}

# Main execution
main() {
    print_magic "🌟 Welcome to the Loominary Transformation! 🌟"
    echo ""
    print_magic "Transforming Heirloom into Loominary - Private Memory Vaults"
    print_magic "Where memories are woven across time, accessible through sacred tokens"
    echo ""
    
    # Create backup
    create_backup
    
    # Update all components
    update_file_contents
    update_branding_elements
    update_package_json
    update_docker_files
    update_env_files
    update_documentation
    update_css_themes
    update_database_schemas
    update_github_workflows
    create_branding_assets
    update_mobile_config
    update_test_files
    
    echo ""
    print_magic "✨ LOOMINARY TRANSFORMATION COMPLETE! ✨"
    echo ""
    print_success "🌟 Brand Identity: Loominary - Weaving Memories Across Time"
    print_success "🔐 Core Concept: Private vaults accessible only through tokens"
    print_success "🔍 Key Feature: Sentiment search - 'Tell me when my mom was happy in her 30s'"
    print_success "🎭 AI Power: Emotional intelligence and age context analysis"
    print_success "👨‍👩‍👧‍👦 Family Focus: Token inheritance and family linking after vault unlock"
    print_success "🌌 UI Preserved: Beautiful constellation interface maintained"
    echo ""
    print_magic "The platform has been successfully rebranded to Loominary!"
    print_magic "Ready to weave memories across time for future generations! 🌟"
    echo ""
    
    # Next steps
    echo "📋 NEXT STEPS:"
    echo "1. Review and test the rebranded application"
    echo "2. Update any remaining manual references"
    echo "3. Test all functionality with new branding"
    echo "4. Update deployment configurations"
    echo "5. Launch the new Loominary platform!"
    echo ""
    
    print_success "🚀 Loominary is ready for launch!"
}

# Handle script interruption
trap 'print_error "Rebranding interrupted"; exit 1' INT TERM

# Run main function
main "$@"