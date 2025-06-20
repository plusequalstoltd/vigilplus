#!/bin/bash

set -e

echo "🚀 MonitorPlus Linux Server Installation (Location Independent)"
echo "============================================================="

# Find the monitorplus package
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
PACKAGE_FILE=""

# Look for package in same directory as script
if [ -f "$SCRIPT_DIR/monitorplus-1.0.0.tgz" ]; then
    PACKAGE_FILE="$SCRIPT_DIR/monitorplus-1.0.0.tgz"
# Look in /tmp/monitorplus
elif [ -f "/tmp/monitorplus/monitorplus-1.0.0.tgz" ]; then
    PACKAGE_FILE="/tmp/monitorplus/monitorplus-1.0.0.tgz"
# Look in current directory
elif [ -f "./monitorplus-1.0.0.tgz" ]; then
    PACKAGE_FILE="./monitorplus-1.0.0.tgz"
# Search common locations
else
    PACKAGE_FILE=$(find /tmp /home/$USER -name "monitorplus-1.0.0.tgz" 2>/dev/null | head -1)
fi

if [ -z "$PACKAGE_FILE" ]; then
    echo "❌ Could not find monitorplus-1.0.0.tgz package!"
    echo "💡 Please ensure the package is in:"
    echo "   - Same directory as this script"
    echo "   - /tmp/monitorplus/"
    echo "   - Current directory"
    exit 1
fi

echo "📦 Found package: $PACKAGE_FILE"

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   echo "⚠️  Running as root. This is OK for system-wide installation."
   INSTALL_GLOBAL=true
else
   echo "📝 Running as user. Will install for current user only."
   INSTALL_GLOBAL=false
fi

# Check Node.js version
echo "🔍 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "💡 Please install Node.js 22+ first:"
    echo "   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
    echo "   sudo apt-get install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Need 22+"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Create installation directory
if [ "$INSTALL_GLOBAL" = true ]; then
    INSTALL_DIR="/opt/monitorplus"
    BIN_DIR="/usr/local/bin"
    SERVICE_DIR="/etc/systemd/system"
else
    INSTALL_DIR="$HOME/.local/monitorplus"
    BIN_DIR="$HOME/.local/bin"
    SERVICE_DIR="$HOME/.config/systemd/user"
    mkdir -p "$BIN_DIR"
    mkdir -p "$SERVICE_DIR"
fi

echo "📁 Installing to: $INSTALL_DIR"

# Extract and install
echo "📦 Extracting MonitorPlus..."
mkdir -p "$INSTALL_DIR"
tar -xzf "$PACKAGE_FILE" -C "$INSTALL_DIR" --strip-components=1

cd "$INSTALL_DIR"

# Install dependencies (production only)
echo "📥 Installing dependencies..."
npm install --omit=dev

# Create symlink for global access
echo "🔗 Creating command symlink..."
if [ "$INSTALL_GLOBAL" = true ]; then
    ln -sf "$INSTALL_DIR/dist/cli.js" "$BIN_DIR/monitorplus"
    chmod +x "$INSTALL_DIR/dist/cli.js"
else
    ln -sf "$INSTALL_DIR/dist/cli.js" "$BIN_DIR/monitorplus"
    chmod +x "$INSTALL_DIR/dist/cli.js"
    
    # Add to PATH if not already there
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> ~/.bashrc
        echo "💡 Added ~/.local/bin to PATH. Run 'source ~/.bashrc' or restart terminal."
    fi
fi

echo "✅ MonitorPlus installed successfully!"
echo ""
echo "🔧 Usage:"
echo "   monitorplus monitor          # Start real-time monitoring"
echo "   monitorplus status           # Quick system check"
echo "   monitorplus info             # System information"
echo ""
echo "⚙️  To set up as a system service, run:"
echo "   sudo bash setup-service.sh"
echo ""
echo "🗑️  To uninstall later, run:"
echo "   sudo bash uninstall.sh" 