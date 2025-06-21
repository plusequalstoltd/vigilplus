# VigilPlus 🛡️

**Advanced server monitoring tool with real-time metrics, alerts, and web API integration**

A lightweight, powerful monitoring solution that keeps your servers vigilant. Track CPU, memory, disk usage, and system health with both beautiful terminal displays and RESTful APIs for web/mobile integration.

## ✨ Features

- **Real-time Monitoring**: Live system metrics with configurable intervals
- **Multiple Interfaces**: Terminal display, web API, or both simultaneously  
- **Smart Alerts**: Configurable thresholds with visual and audio notifications
- **Historical Data**: Track performance trends over time
- **Cross-Platform**: Works on Linux, macOS, and Windows
- **Lightweight**: Minimal resource footprint (~10MB RAM)
- **Easy Integration**: RESTful API for web and mobile applications

## 🚀 Quick Start

### Installation

```bash
# Global installation (recommended)
npm install -g vigilplus

# The installer will guide you through setup options
```

### Initial Setup (Crucial)

**Important**: After installation, run the setup command to configure your server settings:

```bash
vigilplus setup
```

This interactive setup will ask you to configure:
- **Server port** - Choose your desired port (e.g., 5357, 3000, 8080)
- **Host binding** - Usually `0.0.0.0` for remote access
- **Monitoring interval** - How often to collect metrics
- **Alert thresholds** - CPU, memory, and disk usage limits

**The setup is crucial** - it saves your configuration so the server starts with the correct port and settings. Without proper setup, you may encounter connection issues when trying to connect from remote clients or mobile apps.

### Firewall Configuration

**Important**: If you're running VigilPlus server mode on a remote server, you need to allow the port through your firewall.

#### For UFW (Ubuntu/Debian):
```bash
# Allow your chosen port
sudo ufw allow [PORT]

# Check firewall status
sudo ufw status

# If you need to remove a port later
sudo ufw delete allow [PORT]
```

#### For firewalld (CentOS/RHEL/Fedora):
```bash
# Allow your chosen port
sudo firewall-cmd --permanent --add-port=[PORT]/tcp
sudo firewall-cmd --reload

# Check open ports
sudo firewall-cmd --list-ports
```

#### For iptables:
```bash
# Allow your chosen port
sudo iptables -A INPUT -p tcp --dport [PORT] -j ACCEPT
sudo iptables-save
```

**Note**: Always ensure you configure the firewall before starting the VigilPlus server, especially when connecting from remote clients or mobile apps.

## 📊 Usage

### Monitor in Terminal
Perfect for direct server monitoring and SSH sessions.
```bash
vigilplus monitor
```

### Start API Server  
Ideal for web dashboards and mobile app integration.
```bash
vigilplus server --port [PORT]
```

### Both Together
Complete monitoring solution with API + terminal display.
```bash
vigilplus server --port [PORT] --with-monitor
```

### Quick Status Check
Get instant system snapshot.
```bash
vigilplus status
```

## 🌐 API Endpoints

When running in server mode, VigilPlus provides a comprehensive REST API:

- `GET /health` - Server health check
- `GET /api/metrics` - Current system metrics  
- `GET /api/stream` - Real-time data stream (SSE)
- `GET /api/history` - Historical performance data

## ⚙️ Configuration Options

### Recommended: Use Interactive Setup
```bash
vigilplus setup    # Configure all settings interactively (recommended)
```

### Command Line Options (Override Setup)
```bash
--port [PORT]      # Server port (uses setup default if not specified)
--host [HOST]      # Bind address (default: 0.0.0.0)
--interval [SEC]   # Update interval in seconds (uses setup default)
--cpu [PERCENT]    # CPU alert threshold % (uses setup default)
--memory [PERCENT] # Memory alert threshold % (uses setup default)
--disk [PERCENT]   # Disk alert threshold % (uses setup default)
--log              # Enable file logging
--with-monitor     # Enable terminal display with API server
--help             # Show all available options
```

**Note**: Command line options override your saved setup configuration. Run `vigilplus setup` first to set your preferred defaults.

## 📋 Example API Response

```json
{
  "success": true,
  "timestamp": "2025-01-09T10:30:00.000Z",
  "data": {
    "cpu": { "usage": 45.2, "cores": 4, "temperature": 65 },
    "memory": { "usage": 68.1, "total": 16384, "used": 11157 },
    "disk": [{ "usage": 72.3, "total": 500, "used": 361 }],
    "load": { "1min": 1.2, "5min": 1.0, "15min": 0.8 }
  }
}
```

## 🎯 Perfect For

- **System Administrators**: Monitor servers directly via terminal
- **Web Developers**: Integrate real-time metrics into dashboards  
- **Mobile App Developers**: Build monitoring apps with REST API
- **DevOps Teams**: Track server performance and set up alerts
- **Small Businesses**: Simple, effective server monitoring solution

## 🔧 Troubleshooting

### Connection Timeouts
If you're getting connection timeouts when trying to connect to the VigilPlus server:

1. **Check if the server is running:**
   ```bash
   # On the server machine
   ps aux | grep vigilplus
   ```

2. **Verify the port is open:**
   ```bash
   # Test from another machine
   telnet [SERVER_IP] [PORT]
   # or
   curl http://[SERVER_IP]:[PORT]/health
   ```

3. **Check firewall settings:**
   ```bash
   # For UFW
   sudo ufw status
   
   # For firewalld  
   sudo firewall-cmd --list-ports
   ```

4. **Common solutions:**
   - Ensure firewall allows the port (see Firewall Configuration section)
   - Verify server is binding to `0.0.0.0` not `127.0.0.1`
   - Check if another service is using the same port

### Server Won't Start
- **Port already in use**: Try a different port or stop the conflicting service
- **Permission denied**: Some ports (< 1024) require root privileges
- **Invalid configuration**: Check your command line arguments

## 📄 License

MIT - Build amazing monitoring solutions with VigilPlus! 