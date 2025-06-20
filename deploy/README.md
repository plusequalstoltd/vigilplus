# MonitorPlus Linux Server Deployment Guide

This guide will help you deploy MonitorPlus to your Linux server for production monitoring.

## 🎯 What You'll Get on Linux

- ✅ **Full temperature monitoring** (CPU, disk, chipset temperatures)
- ✅ **Better performance metrics** (more detailed CPU/memory info)
- ✅ **System service integration** (runs automatically on boot)
- ✅ **Persistent logging** to `/var/log/monitorplus/`
- ✅ **Automatic restarts** if the service crashes

## 📋 Prerequisites

- Linux server (Ubuntu 18+, CentOS 7+, RHEL 8+, or similar)
- Node.js 22+ (will be installed if needed)
- sudo/root access for system-wide installation

## 🚀 Quick Deployment

### Step 1: Transfer Files to Server

```bash
# Copy the package to your server
scp monitorplus-1.0.0.tgz user@your-server:/tmp/
scp deploy/* user@your-server:/tmp/
```

### Step 2: Install on Server

```bash
# SSH to your server
ssh user@your-server

# Navigate to temp directory
cd /tmp

# Make scripts executable
chmod +x install.sh setup-service.sh

# Install MonitorPlus
sudo bash install.sh

# Set up as system service (optional but recommended)
sudo bash setup-service.sh
```

### Step 3: Start Monitoring

```bash
# Start the service
sudo systemctl start monitorplus

# Check status
sudo systemctl status monitorplus

# View live logs
sudo tail -f /var/log/monitorplus/monitor.log
```

## 📊 Manual Usage (Alternative)

If you prefer not to run as a service:

```bash
# Real-time monitoring
monitorplus monitor

# Quick status check
monitorplus status

# System information
monitorplus info

# Custom settings
monitorplus monitor --interval 1000 --cpu-alert 70 --memory-alert 80
```

## 🔧 Configuration

Service configuration is stored at `/etc/monitorplus/config.json`:

```json
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
# Service control
sudo systemctl start monitorplus      # Start
sudo systemctl stop monitorplus       # Stop  
sudo systemctl restart monitorplus    # Restart
sudo systemctl status monitorplus     # Status

# Enable/disable auto-start
sudo systemctl enable monitorplus     # Auto-start on boot
sudo systemctl disable monitorplus    # Disable auto-start

# View logs
sudo journalctl -u monitorplus -f     # Service logs
sudo tail -f /var/log/monitorplus/monitor.log  # Monitoring data
```

## 🔍 Troubleshooting

### Permission Issues
```bash
# If you get permission errors
sudo chown -R root:root /opt/monitorplus
sudo chmod +x /opt/monitorplus/dist/cli.js
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

### Check Service Status
```bash
# Detailed status
sudo systemctl status monitorplus -l

# Recent logs
sudo journalctl -u monitorplus --since "1 hour ago"
```

## 🌐 Remote Monitoring

To access monitoring data remotely, you can:

1. **SSH + tail logs**:
   ```bash
   ssh user@server 'sudo tail -f /var/log/monitorplus/monitor.log'
   ```

2. **Create API endpoint** (future enhancement):
   ```bash
   # Add HTTP server to expose metrics as JSON API
   curl http://your-server:3000/metrics
   ```

3. **Forward to monitoring systems**:
   - Send alerts to Slack/Discord
   - Forward to Prometheus/Grafana
   - Integrate with existing monitoring stack

## 🎯 Production Tips

1. **Log Rotation**: Set up logrotate for `/var/log/monitorplus/`
2. **Monitoring the Monitor**: Use systemd notifications for service health
3. **Resource Usage**: MonitorPlus itself uses minimal resources (~10MB RAM)
4. **Security**: Runs with minimal privileges and protected directories

---

Your MonitorPlus will provide much richer data on Linux servers compared to macOS! 🚀 