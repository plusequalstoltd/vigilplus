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

## 📊 Usage

### Monitor in Terminal
Perfect for direct server monitoring and SSH sessions.
```bash
vigilplus monitor
```

### Start API Server  
Ideal for web dashboards and mobile app integration.
```bash
vigilplus server --port 8080
```

### Both Together
Complete monitoring solution with API + terminal display.
```bash
vigilplus server --port 8080 --with-monitor
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

```bash
--port 8080        # Server port (default: 3000)
--host 0.0.0.0     # Bind address (default: all interfaces)
--interval 5       # Update interval in seconds (default: 2)
--cpu 75           # CPU alert threshold % (default: 80)
--memory 80        # Memory alert threshold % (default: 85)
--disk 90          # Disk alert threshold % (default: 90)
--log              # Enable file logging
--with-monitor     # Enable terminal display with API server
--help             # Show all available options
```

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

## 📄 License

MIT - Build amazing monitoring solutions with VigilPlus! 