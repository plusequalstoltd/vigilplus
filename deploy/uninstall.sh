#!/bin/bash

set -e

echo "🗑️  VigilPlus Uninstaller"
echo "========================"

# Check if running as root or user
if [[ $EUID -eq 0 ]]; then
   echo "🔍 Running as root - will remove system-wide installation"
   INSTALL_GLOBAL=true
   INSTALL_DIR="/opt/vigilplus"
   BIN_DIR="/usr/local/bin"
   SERVICE_FILE="/etc/systemd/system/vigilplus.service"
   CONFIG_DIR="/etc/vigilplus"
   LOG_DIR="/var/log/vigilplus"
else
   echo "🔍 Running as user - will remove user installation"
   INSTALL_GLOBAL=false
   INSTALL_DIR="$HOME/.local/vigilplus"
   BIN_DIR="$HOME/.local/bin"
   SERVICE_FILE="$HOME/.config/systemd/user/vigilplus.service"
   CONFIG_DIR="$HOME/.config/vigilplus"
   LOG_DIR="$HOME/.local/log/vigilplus"
fi

echo ""
echo "⚠️  This will remove:"
echo "   📁 Installation: $INSTALL_DIR"
echo "   🔗 Command: $BIN_DIR/vigilplus"
if [ "$INSTALL_GLOBAL" = true ]; then
   echo "   ⚙️  Service: $SERVICE_FILE"
   echo "   📝 Config: $CONFIG_DIR"
   echo "   📊 Logs: $LOG_DIR"
fi
echo ""

# Confirm removal
read -p "❓ Are you sure you want to uninstall VigilPlus? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Uninstall cancelled"
    exit 1
fi

echo "🛑 Starting uninstall process..."

# Stop and disable service if it exists
if [ -f "$SERVICE_FILE" ]; then
    echo "🔄 Stopping VigilPlus service..."
    if [ "$INSTALL_GLOBAL" = true ]; then
        systemctl stop vigilplus.service 2>/dev/null || true
        systemctl disable vigilplus.service 2>/dev/null || true
        systemctl daemon-reload
    else
        systemctl --user stop vigilplus.service 2>/dev/null || true
        systemctl --user disable vigilplus.service 2>/dev/null || true
        systemctl --user daemon-reload
    fi
    
    echo "🗑️  Removing service file..."
    rm -f "$SERVICE_FILE"
fi

# Remove symlink
if [ -L "$BIN_DIR/vigilplus" ]; then
    echo "🔗 Removing command symlink..."
    rm -f "$BIN_DIR/vigilplus"
fi

# Remove installation directory
if [ -d "$INSTALL_DIR" ]; then
    echo "📁 Removing installation directory..."
    rm -rf "$INSTALL_DIR"
fi

# Remove configuration (ask first)
if [ -d "$CONFIG_DIR" ]; then
    read -p "🗑️  Remove configuration files? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$CONFIG_DIR"
        echo "✅ Configuration removed"
    else
        echo "⏭️  Configuration preserved at $CONFIG_DIR"
    fi
fi

# Remove logs (ask first)
if [ -d "$LOG_DIR" ]; then
    read -p "🗑️  Remove log files? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$LOG_DIR"
        echo "✅ Logs removed"
    else
        echo "⏭️  Logs preserved at $LOG_DIR"
    fi
fi

# Clean up temp files
echo "🧹 Cleaning up temporary files..."
rm -rf /tmp/vigilplus* 2>/dev/null || true

echo ""
echo "✅ VigilPlus has been uninstalled successfully!"
echo ""

# Check for leftover processes
PROCESSES=$(pgrep -f "vigilplus\|vigil.*plus" 2>/dev/null || true)
if [ ! -z "$PROCESSES" ]; then
    echo "⚠️  Warning: Found running VigilPlus processes:"
    ps -p $PROCESSES -o pid,cmd 2>/dev/null || true
    echo "💡 You may want to kill them manually: sudo kill $PROCESSES"
fi

echo "🎯 Uninstall complete!"
echo ""
echo "💡 If you want to reinstall later:"
echo "   - Re-run the install.sh script"
echo "   - Your previous config/logs are preserved (if you chose to keep them)" 