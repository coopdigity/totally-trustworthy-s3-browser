#!/bin/bash
set -e

echo "Building Totally Trustworthy S3 Browser..."
npm run build

echo ""
echo "Build complete! Looking for AppImage..."

# Find the AppImage
APPIMAGE=$(find release -name "*.AppImage" | head -1)

if [ -z "$APPIMAGE" ]; then
    echo "Error: No AppImage found in release directory"
    exit 1
fi

echo "Found: $APPIMAGE"

# Create ~/.local/bin if it doesn't exist
mkdir -p ~/.local/bin

# Copy the AppImage
cp "$APPIMAGE" ~/.local/bin/s3browser.AppImage
chmod +x ~/.local/bin/s3browser.AppImage

# Create a wrapper script that runs with --no-sandbox
cat > ~/.local/bin/s3browser << 'EOF'
#!/bin/bash
exec "$HOME/.local/bin/s3browser.AppImage" --no-sandbox "$@"
EOF

chmod +x ~/.local/bin/s3browser

echo ""
echo "✅ Successfully installed to ~/.local/bin/s3browser"
echo ""
echo "The wrapper script will run the AppImage with --no-sandbox to avoid SUID issues."
echo ""
echo "Make sure ~/.local/bin is in your PATH, then run:"
echo "  s3browser"
