#!/bin/bash

set -e

echo "🚀 VigilPlus Linux Server Installation"
echo "======================================"

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
    INSTALL_DIR="/opt/vigilplus"
    BIN_DIR="/usr/local/bin"
    SERVICE_DIR="/etc/systemd/system"
else
    INSTALL_DIR="$HOME/.local/vigilplus"
    BIN_DIR="$HOME/.local/bin"
    SERVICE_DIR="$HOME/.config/systemd/user"
    mkdir -p "$BIN_DIR"
    mkdir -p "$SERVICE_DIR"
fi

echo "📁 Installing to: $INSTALL_DIR"

# Extract and install
echo "📦 Extracting VigilPlus..."
mkdir -p "$INSTALL_DIR"

# Find the package file
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
PACKAGE_FILE="$SCRIPT_DIR/vigilplus-1.0.0.tgz"

if [ ! -f "$PACKAGE_FILE" ]; then
    echo "❌ Package file not found at: $PACKAGE_FILE"
    echo "💡 Please ensure vigilplus-1.0.0.tgz is in the same directory as install.sh"
    exit 1
fi

tar -xzf "$PACKAGE_FILE" -C "$INSTALL_DIR" --strip-components=1

cd "$INSTALL_DIR"

# Install dependencies (production only)
echo "📥 Installing dependencies..."
npm install --omit=dev

# Create symlink for global access
echo "🔗 Creating command symlink..."
if [ "$INSTALL_GLOBAL" = true ]; then
    ln -sf "$INSTALL_DIR/dist/cli.js" "$BIN_DIR/vigilplus"
    chmod +x "$INSTALL_DIR/dist/cli.js"
else
    ln -sf "$INSTALL_DIR/dist/cli.js" "$BIN_DIR/vigilplus"
    chmod +x "$INSTALL_DIR/dist/cli.js"
    
    # Add to PATH if not already there
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> ~/.bashrc
        echo "💡 Added ~/.local/bin to PATH. Run 'source ~/.bashrc' or restart terminal."
    fi
fi

echo "✅ VigilPlus installed successfully!"
echo ""
echo "🔧 Usage:"
echo "   vigilplus monitor          # Start real-time monitoring"
echo "   vigilplus status           # Quick system check"
echo "   vigilplus info             # System information"
echo ""
echo "⚙️  To set up as a system service, run:"
echo "   sudo bash setup-service.sh" 