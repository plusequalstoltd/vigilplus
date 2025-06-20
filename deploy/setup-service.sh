#!/bin/bash

set -e

echo "⚙️  MonitorPlus Service Setup"
echo "============================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)"
   exit 1
fi

INSTALL_DIR="/opt/monitorplus"
SERVICE_FILE="/etc/systemd/system/monitorplus.service"
CONFIG_DIR="/etc/monitorplus"
LOG_DIR="/var/log/monitorplus"

# Check if MonitorPlus is installed
if [ ! -f "$INSTALL_DIR/dist/cli.js" ]; then
    echo "❌ MonitorPlus not found at $INSTALL_DIR"
    echo "💡 Please run install.sh first"
    exit 1
fi

# Create directories
echo "📁 Creating directories..."
mkdir -p "$CONFIG_DIR"
mkdir -p "$LOG_DIR"

# Create configuration file
echo "📝 Creating configuration..."
cat > "$CONFIG_DIR/config.json" << EOF
{
  "interval": 5000,
  "logToFile": true,
  "logPath": "/var/log/monitorplus/monitor.log",
  "alerts": [
    {
      "metric": "cpu",
      "threshold": 80,
      "operator": ">",
      "enabled": true
    },
    {
      "metric": "memory",
      "threshold": 85,
      "operator": ">",
      "enabled": true
    },
    {
      "metric": "disk",
      "threshold": 90,
      "operator": ">",
      "enabled": true
    }
  ]
}
EOF

# Create systemd service file
echo "🔧 Creating systemd service..."
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=MonitorPlus - Advanced Server Monitoring
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/dist/cli.js monitor --interval 5000 --log --log-path /var/log/monitorplus/monitor.log
Restart=always
RestartSec=10
StandardOutput=append:/var/log/monitorplus/service.log
StandardError=append:/var/log/monitorplus/service.log

# Security settings
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/monitorplus

# Environment
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Set permissions
echo "🔐 Setting permissions..."
chown -R root:root "$INSTALL_DIR"
chmod 755 "$INSTALL_DIR/dist/cli.js"
chown -R root:root "$CONFIG_DIR"
chown -R root:root "$LOG_DIR"

# Reload systemd and enable service
echo "🔄 Enabling service..."
systemctl daemon-reload
systemctl enable monitorplus.service

echo "✅ MonitorPlus service configured successfully!"
echo ""
echo "🎮 Service Management:"
echo "   systemctl start monitorplus     # Start the service"
echo "   systemctl stop monitorplus      # Stop the service"
echo "   systemctl status monitorplus    # Check status"
echo "   systemctl restart monitorplus   # Restart the service"
echo ""
echo "📊 Monitoring:"
echo "   tail -f /var/log/monitorplus/monitor.log    # View monitoring logs"
echo "   tail -f /var/log/monitorplus/service.log    # View service logs"
echo ""
echo "⚡ To start monitoring now:"
echo "   systemctl start monitorplus" 