# VigilPlus Linux Server Deployment Guide

This guide will help you deploy VigilPlus to your Linux server for production monitoring.

## 🎯 Two Ways to Use VigilPlus

### 📱 **API Server Mode** (Recommended)
- **For Flutter App**: Provides HTTP API endpoints for your mobile app
- **Remote Access**: Monitor your server from anywhere via the mobile app
- **Real-time Data**: Live metrics, alerts, and system information
- **Port**: Runs on port 8080 by default

### 💻 **Terminal Monitor Mode** 
- **For Console Use**: Direct terminal output and logging
- **Local Monitoring**: Perfect for SSH sessions and server admins
- **Background Process**: Runs quietly and logs to files
- **Logs**: Saves to `/var/log/vigilplus/monitor.log`

### 🚀 **Both Modes** (Best of Both Worlds)
- **API Server + Monitor**: Run both simultaneously
- **Complete Coverage**: Flutter app access + terminal logging
- **Production Ready**: Perfect for comprehensive monitoring
- **Dual Output**: HTTP API endpoints + log files

## 📋 Prerequisites

- Linux server (Ubuntu 18+, CentOS 7+, RHEL 8+, or similar)
- Node.js 22+ (will be installed if needed)
- sudo/root access for system-wide installation

## 🚀 Quick Deployment

### Step 1: Install VigilPlus

```bash
# Install globally via npm
sudo npm install -g vigilplus

# The post-install script will guide you through setup
```

**During installation, you'll be asked:**
1. **Service vs Background**: Set up as system service (auto-start) or simple background process
2. **Mode Selection**: Choose API Server, Terminal Monitor, or Both modes simultaneously
3. **Auto-start**: Whether to start immediately after installation

### Step 2: Choose Your Mode

#### 📱 API Server Mode (Flutter App)
```bash
# Manual start
vigilplus server --port 8080 --host 0.0.0.0

# Your Flutter app can now connect to:
# http://your-server-ip:8080
```

#### 💻 Terminal Monitor Mode
```bash
# Manual start  
vigilplus monitor --interval 5

# Background with logging
vigilplus monitor --interval 5 --log --log-path /var/log/vigilplus/monitor.log
```

#### 🚀 Both Modes (Complete Setup)
```bash
# Run API server with built-in monitoring
vigilplus server --port 8080 --host 0.0.0.0 --with-monitor

# Or run them separately (two terminals)
vigilplus server --port 8080 --host 0.0.0.0 &
vigilplus monitor --interval 5 --log &
```

## 📊 API Endpoints (Server Mode)

When running in API server mode, these endpoints are available:

```bash
# Health check
curl http://your-server:8080/health

# Current system metrics
curl http://your-server:8080/api/metrics

# System information
curl http://your-server:8080/api/info

# Historical data (if logging enabled)
curl http://your-server:8080/api/history
```

## 🔧 Configuration

Service configuration is stored at `/etc/vigilplus/config.json`:

```json
{
  "mode": "server",           // "server" or "monitor"
  "port": 8080,              // API server port
  "host": "0.0.0.0",         // Listen on all interfaces
  "interval": 5000,          // Monitoring interval (ms)
  "logToFile": true,
  "logPath": "/var/log/vigilplus/monitor.log",
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
```

## 📈 Linux-Specific Benefits

### Temperature Monitoring
On Linux, you'll see actual CPU temperatures:
```
🔧 CPU Information
Usage:      45.2% ██████████████░░░░░░░░░░░░░░░░
Cores:      4
Speed:      2.4 GHz
Temp:       65°C    # 🎉 This will work on Linux!
```

### Better Performance Data
- More detailed CPU load averages
- SMART disk health information
- Network interface statistics
- Process-level monitoring capabilities

## 🎮 Service Management

```bash
# Service control (if installed as systemd service)
sudo systemctl start vigilplus      # Start
sudo systemctl stop vigilplus       # Stop  
sudo systemctl restart vigilplus    # Restart
sudo systemctl status vigilplus     # Status

# Enable/disable auto-start
sudo systemctl enable vigilplus     # Auto-start on boot
sudo systemctl disable vigilplus    # Disable auto-start

# View logs
sudo journalctl -u vigilplus -f     # Service logs
sudo tail -f /var/log/vigilplus/monitor.log  # Monitoring data
```

## 🔍 Troubleshooting

### Check What's Running
```bash
# Check if vigilplus is running
ps aux | grep vigilplus

# Check which ports are in use
sudo netstat -tlnp | grep vigilplus

# Check service status (if using systemd)
sudo systemctl status vigilplus -l
```

### Permission Issues
```bash
# If you get permission errors
sudo chown -R root:root /opt/vigilplus
sudo chmod +x /opt/vigilplus/dist/cli.js
```

### Missing Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install nodejs npm
```

## 🌐 Remote Access Setup

### For Flutter App (API Server Mode)
1. **Start API server**: `vigilplus server --port 8080 --host 0.0.0.0`
2. **Open firewall**: `sudo ufw allow 8080` (Ubuntu) or configure iptables
3. **Configure Flutter app**: Enter your server IP and port 8080
4. **Test connection**: Visit `http://your-server-ip:8080/health`

### For Terminal Access (Monitor Mode)
```bash
# SSH + monitor
ssh user@server 'vigilplus monitor --interval 5'

# SSH + view logs
ssh user@server 'sudo tail -f /var/log/vigilplus/monitor.log'
```

## 🎯 Production Tips

1. **Use Both Modes**: Run API server for Flutter app + separate monitor for logging
2. **Log Rotation**: Set up logrotate for `/var/log/vigilplus/`
3. **Monitoring the Monitor**: Use systemd notifications for service health
4. **Resource Usage**: VigilPlus itself uses minimal resources (~10MB RAM)
5. **Security**: Consider using reverse proxy (nginx) for HTTPS in production

## 🚀 Quick Start Examples

```bash
# Flutter app backend (most common)
sudo npm install -g vigilplus
vigilplus server --port 8080 --host 0.0.0.0

# Terminal monitoring with logging
vigilplus monitor --interval 5 --log

# Both modes - single command (recommended)
vigilplus server --port 8080 --host 0.0.0.0 --with-monitor

# Both modes - separate processes
vigilplus server --port 8080 --host 0.0.0.0 &
vigilplus monitor --interval 10 --log --log-path /var/log/vigilplus/monitor.log &
``` 