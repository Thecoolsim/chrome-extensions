#!/bin/bash

# CSS Scanner Pro - Version Switcher
# Makes it easy to switch between production and diagnostic versions

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "╔════════════════════════════════════════╗"
echo "║   CSS Scanner Pro - Version Switcher   ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check what's currently active
if [ -f "manifest.json" ]; then
  CURRENT=$(grep -o '"CSS Scanner Pro[^"]*"' manifest.json | head -1)
  echo "Current version: $CURRENT"
  echo ""
fi

echo "Choose version:"
echo "  1) Production (full-featured)"
echo "  2) Diagnostic (with console logging)"
echo "  3) Show current files"
echo "  q) Quit"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo ""
    echo "Switching to PRODUCTION version..."

    # Backup current if exists
    if [ -f "manifest.json" ]; then
      mv manifest.json manifest.backup.json
    fi

    # Create production manifest if it doesn't exist
    if [ ! -f "manifest-production.json" ]; then
      cp manifest.backup.json manifest-production.json 2>/dev/null || {
        echo "Error: manifest-production.json not found"
        mv manifest.backup.json manifest.json 2>/dev/null
        exit 1
      }
    fi

    cp manifest-production.json manifest.json

    echo "✅ Switched to production version"
    echo ""
    echo "Uses: js/background.js + js/scanner-full.js"
    echo ""
    echo "Next steps:"
    echo "1. Go to chrome://extensions/"
    echo "2. Click refresh icon on CSS Scanner Pro"
    echo "3. Test the extension"
    ;;

  2)
    echo ""
    echo "Switching to DIAGNOSTIC version..."

    # Backup current if exists
    if [ -f "manifest.json" ]; then
      mv manifest.json manifest.backup.json
    fi

    # Create diagnostic manifest if it doesn't exist
    if [ ! -f "manifest-diagnostic.json" ]; then
      echo "Error: manifest-diagnostic.json not found"
      mv manifest.backup.json manifest.json 2>/dev/null
      exit 1
    fi

    cp manifest-diagnostic.json manifest.json

    echo "✅ Switched to diagnostic version"
    echo ""
    echo "Uses: js/background-diagnostic.js + js/scanner-diagnostic.js"
    echo ""
    echo "This version has extensive console logging!"
    echo ""
    echo "Next steps:"
    echo "1. Go to chrome://extensions/"
    echo "2. Click refresh icon on CSS Scanner Pro"
    echo "3. Open test.html in Chrome"
    echo "4. Open DevTools (F12) → Console"
    echo "5. Click extension icon"
    echo "6. Watch the console for detailed logs"
    ;;

  3)
    echo ""
    echo "Current files in directory:"
    echo ""
    ls -lh manifest*.json 2>/dev/null
    echo ""
    ls -lh js/background*.js 2>/dev/null
    echo ""
    ls -lh js/scanner*.js 2>/dev/null
    ;;

  q|Q)
    echo "Exiting..."
    exit 0
    ;;

  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "════════════════════════════════════════"
echo "Done!"
