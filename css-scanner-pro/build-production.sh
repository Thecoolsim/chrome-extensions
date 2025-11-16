#!/bin/bash

###############################################################################
# CSS Scanner Pro - Production Build Script
# Author: Simon Adjatan (https://adjatan.org/)
#
# This script creates a clean production build of the extension
# Usage: ./build-production.sh [version]
# Example: ./build-production.sh 1.0.1
###############################################################################

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BUILD_DIR="${SCRIPT_DIR}/../css-scanner-pro-production"
VERSION=${1:-"1.0.0"}  # Use provided version or default to 1.0.0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CSS Scanner Pro - Production Build${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Clean previous build
echo -e "${YELLOW}→ Cleaning previous build...${NC}"
if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
fi
mkdir -p "$BUILD_DIR"

# Create production structure
echo -e "${YELLOW}→ Creating production structure...${NC}"
mkdir -p "$BUILD_DIR/js"
mkdir -p "$BUILD_DIR/img"
mkdir -p "$BUILD_DIR/_locales"

# Copy essential files
echo -e "${YELLOW}→ Copying essential files...${NC}"

# Copy manifest
cp "${SCRIPT_DIR}/manifest.json" "$BUILD_DIR/"
echo "  ✓ manifest.json"

# Copy LICENSE
cp "${SCRIPT_DIR}/LICENSE" "$BUILD_DIR/"
echo "  ✓ LICENSE"

# Copy production JavaScript files only
cp "${SCRIPT_DIR}/js/background.js" "$BUILD_DIR/js/"
cp "${SCRIPT_DIR}/js/scanner-full.js" "$BUILD_DIR/js/"
echo "  ✓ JavaScript files (background.js, scanner-full.js)"

# Copy all image files
cp -r "${SCRIPT_DIR}/img/"*.png "$BUILD_DIR/img/" 2>/dev/null || true
cp -r "${SCRIPT_DIR}/img/"*.svg "$BUILD_DIR/img/" 2>/dev/null || true
echo "  ✓ Image files"

# Copy all locale files
cp -r "${SCRIPT_DIR}/_locales/"* "$BUILD_DIR/_locales/"
echo "  ✓ Locale files (en, fr, es, de)"

# Create production README
echo -e "${YELLOW}→ Creating production README...${NC}"
cat > "$BUILD_DIR/README.md" << 'EOF'
# CSS Scanner Pro - Production Build

Version: VERSION_PLACEHOLDER

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select this folder

## What's Included

- `manifest.json` - Extension configuration
- `js/background.js` - Service worker
- `js/scanner-full.js` - Main scanner functionality (~78KB)
- `img/` - Extension icons (16px, 48px, 128px)
- `_locales/` - Multi-language support (English, French, Spanish, German)
- `LICENSE` - MIT License

## Features

✨ **Instant CSS inspection** on hover
📋 **Multi-tab interface** (CSS, HTML, Source, Editor)
✏️ **Live CSS editor** with real-time preview
🖼️ **CodePen export** for quick sharing
🎨 **Syntax highlighting** for easy reading
🌍 **Multi-language support** (auto-detects browser language)
⌨️ **Keyboard shortcuts** for fast workflow

## Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Activate Scanner | Ctrl+Shift+S | Cmd+Shift+S |
| Toggle Grid | Ctrl+Shift+G | Cmd+Shift+G |
| Scan Parent | Ctrl+Shift+E | Cmd+Shift+E |

## Support

- 🌐 Website: https://adjatan.org/
- 💻 GitHub: https://github.com/Thecoolsim
- 🐛 Issues: https://github.com/Thecoolsim/chrome-extensions/issues

## Author

**Simon Adjatan**
- Website: https://adjatan.org/
- GitHub: https://github.com/Thecoolsim
- Twitter: https://x.com/adjatan
- Facebook: https://www.facebook.com/adjatan

## License

MIT License - see LICENSE file for details
EOF

# Replace version placeholder
sed -i '' "s/VERSION_PLACEHOLDER/${VERSION}/g" "$BUILD_DIR/README.md"
echo "  ✓ README.md"

# Get build size
BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)

# Create zip file
echo -e "${YELLOW}→ Creating production ZIP...${NC}"
cd "$(dirname "$BUILD_DIR")"
ZIP_NAME="css-scanner-pro-v${VERSION}-production.zip"
zip -r "$ZIP_NAME" "$(basename "$BUILD_DIR")" -q
ZIP_PATH="$(dirname "$BUILD_DIR")/$ZIP_NAME"
ZIP_SIZE=$(du -h "$ZIP_PATH" | cut -f1)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Production build completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Version:${NC} ${VERSION}"
echo -e "${BLUE}Build folder:${NC} $BUILD_DIR"
echo -e "${BLUE}Build size:${NC} $BUILD_SIZE"
echo -e "${BLUE}ZIP file:${NC} $ZIP_PATH"
echo -e "${BLUE}ZIP size:${NC} $ZIP_SIZE"
echo ""
echo -e "${GREEN}Files included:${NC}"
echo "  • manifest.json"
echo "  • LICENSE"
echo "  • README.md"
echo "  • js/background.js"
echo "  • js/scanner-full.js"
echo "  • img/ (icons)"
echo "  • _locales/ (4 languages)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Test the build: Load '$BUILD_DIR' as unpacked extension"
echo "  2. Upload to Chrome Web Store: Use '$ZIP_NAME'"
echo "  3. GitHub release: Attach '$ZIP_NAME' to release v${VERSION}"
echo ""
