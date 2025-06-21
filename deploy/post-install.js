#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.blue) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function warn(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function error(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

// Check if this is a global installation
function isGlobalInstall() {
  const installPath = process.env.npm_config_prefix || process.env.PREFIX;
  return installPath && (
    installPath.includes('/usr/local') || 
    installPath.includes('/usr/global') ||
    process.env.npm_config_global === 'true'
  );
}

// Get server IP address
function getServerIP() {
  const interfaces = require('os').networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Check if vigilplus is already running
function isVigilPlusRunning() {
  return new Promise((resolve) => {
    exec('pgrep -f "vigilplus.*server"', (error, stdout) => {
      resolve(stdout.trim().length > 0);
    });
  });
}

// Start vigilplus server
function startVigilPlusServer() {
  return new Promise((resolve, reject) => {
    log('🚀 Starting VigilPlus server...');
    
    const serverProcess = spawn('vigilplus', ['server', '--port', '8080', '--host', '0.0.0.0'], {
      detached: true,
      stdio: 'ignore'
    });
    
    serverProcess.unref();
    
    // Wait a moment and check if it started
    setTimeout(async () => {
      const isRunning = await isVigilPlusRunning();
      if (isRunning) {
        resolve(serverProcess.pid);
      } else {
        reject(new Error('Failed to start server'));
      }
    }, 2000);
  });
}

// Create systemd service
function createSystemdService(useApiMode = true, useBothModes = false) {
  return new Promise((resolve, reject) => {
    let execCommand, description;
    
    if (useBothModes) {
      // Both modes: API server as main process, monitor as background
      execCommand = '/usr/local/bin/vigilplus server --port 8080 --host 0.0.0.0 --with-monitor --monitor-interval 5 --monitor-log /var/log/vigilplus/monitor.log';
      description = 'VigilPlus API Server + Terminal Monitor';
    } else if (useApiMode) {
      execCommand = '/usr/local/bin/vigilplus server --port 8080 --host 0.0.0.0';
      description = 'VigilPlus API Server (Flutter App Backend)';
    } else {
      execCommand = '/usr/local/bin/vigilplus monitor --interval 5 --log --log-path /var/log/vigilplus/monitor.log';
      description = 'VigilPlus Terminal Monitor';
    }
    
    const serviceContent = `[Unit]
Description=${description}
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
Group=root
ExecStart=${execCommand}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=vigilplus

# Security settings
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
${useApiMode ? '' : 'ReadWritePaths=/var/log/vigilplus'}

# Environment
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
`;

    // Create log directory for monitor mode
    if (!useApiMode) {
      try {
        const fs = require('fs');
        const { execSync } = require('child_process');
        execSync('mkdir -p /var/log/vigilplus');
        execSync('chown root:root /var/log/vigilplus');
      } catch (err) {
        // Log directory creation is optional
      }
    }

    // Write service file
    const fs = require('fs');
    const serviceFile = '/etc/systemd/system/vigilplus.service';
    
    try {
      fs.writeFileSync(serviceFile, serviceContent);
      
      // Reload systemd and enable service
      exec('systemctl daemon-reload && systemctl enable vigilplus.service', (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Start systemd service
function startSystemdService() {
  return new Promise((resolve, reject) => {
    exec('systemctl start vigilplus.service', (error) => {
      if (error) {
        reject(error);
      } else {
        // Wait a moment and check status
        setTimeout(() => {
          exec('systemctl is-active vigilplus.service', (error, stdout) => {
            if (stdout.trim() === 'active') {
              resolve();
            } else {
              reject(new Error('Service failed to start'));
            }
          });
        }, 2000);
      }
    });
  });
}

// Check if running as root
function isRoot() {
  return process.getuid && process.getuid() === 0;
}

// Main post-install function
async function postInstall() {
  console.log('');
  log('🎉 VigilPlus Installation Complete!', colors.green);
  console.log('');
  
  // Only auto-start for global installations
  if (!isGlobalInstall()) {
    log('📝 Local installation detected - skipping auto-start');
    log('💡 To start server manually: vigilplus server --port 8080 --host 0.0.0.0');
    return;
  }
  
  try {
    // Check if already running
    const alreadyRunning = await isVigilPlusRunning();
    if (alreadyRunning) {
      warn('VigilPlus server is already running');
      const serverIP = getServerIP();
      log(`📊 Server URL: http://${serverIP}:8080`);
      log(`🔍 Health check: http://${serverIP}:8080/health`);
      return;
    }
    
    // Ask user about setup preferences
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Ask about systemd service (only if root)
    if (isRoot()) {
      rl.question('⚙️  Set up as system service (auto-start on boot)? (Y/n): ', async (serviceAnswer) => {
        const useService = serviceAnswer.toLowerCase() !== 'n';
        
        if (useService) {
          rl.question('📊 Choose service mode:\n   1) API Server (for Flutter app) - Recommended\n   2) Terminal Monitor (for console monitoring)\n   3) Both (API Server + Monitor) - Best of both worlds\n   Enter choice (1/2/3): ', async (modeAnswer) => {
            const useApiMode = modeAnswer !== '2';
            const useBothModes = modeAnswer === '3';
            
            rl.question('🚀 Start VigilPlus service now? (Y/n): ', async (startAnswer) => {
              rl.close();
              
              if (startAnswer.toLowerCase() === 'n') {
                try {
                  await createSystemdService(useApiMode, useBothModes);
                  const modeText = useBothModes ? 'API Server + Monitor' : (useApiMode ? 'API Server' : 'Terminal Monitor');
                  success(`Systemd service created (not started) - ${modeText} mode`);
                  log('💡 To start: systemctl start vigilplus');
                } catch (err) {
                  error(`Failed to create service: ${err.message}`);
                }
                return;
              }
              
              try {
                // Create and start systemd service
                const modeText = useBothModes ? 'API Server + Monitor' : (useApiMode ? 'API Server' : 'Terminal Monitor');
                log(`⚙️  Creating systemd service in ${modeText} mode...`);
                await createSystemdService(useApiMode, useBothModes);
                success('Systemd service created and enabled');
                
                log('🚀 Starting VigilPlus service...');
                await startSystemdService();
                
                const serverIP = getServerIP();
                success('VigilPlus service started successfully!');
                console.log('');
                
                if (useBothModes) {
                  log(`📊 API Server running on: http://${serverIP}:8080`, colors.cyan);
                  log(`🔍 Health check: http://${serverIP}:8080/health`, colors.cyan);
                  log(`📈 Metrics API: http://${serverIP}:8080/api/metrics`, colors.cyan);
                  log(`📄 Monitor logs: tail -f /var/log/vigilplus/monitor.log`, colors.cyan);
                  console.log('');
                  success('Ready for Flutter app AND terminal monitoring! 🚀');
                } else if (useApiMode) {
                  log(`📊 API Server running on: http://${serverIP}:8080`, colors.cyan);
                  log(`🔍 Health check: http://${serverIP}:8080/health`, colors.cyan);
                  log(`📈 Metrics API: http://${serverIP}:8080/api/metrics`, colors.cyan);
                  console.log('');
                  success('Ready for your Flutter app! 🚀');
                } else {
                  log(`📊 Terminal Monitor running`, colors.cyan);
                  log(`📄 View logs: tail -f /var/log/vigilplus/monitor.log`, colors.cyan);
                  console.log('');
                  success('Terminal monitoring active! 🚀');
                }
                
                console.log('');
                log('🔧 Service Management:');
                log('   systemctl status vigilplus   # Check status');
                log('   systemctl restart vigilplus  # Restart service');
                log('   systemctl stop vigilplus     # Stop service');
                log('   journalctl -u vigilplus -f   # View logs');
                console.log('');
                success('Production-ready setup complete! 🚀');
                
              } catch (err) {
                error(`Failed to start: ${err.message}`);
                log('💡 Try starting manually: vigilplus server --port 8080 --host 0.0.0.0');
              }
            });
          });
        } else {
          // No service, just start background process
          rl.question('📊 Choose mode:\n   1) API Server (for Flutter app) - Recommended\n   2) Terminal Monitor (for console monitoring)\n   3) Both (API Server + Monitor) - Best of both worlds\n   Enter choice (1/2/3): ', async (modeAnswer) => {
            const useApiMode = modeAnswer !== '2';
            const useBothModes = modeAnswer === '3';
            
            rl.question('🚀 Start VigilPlus now? (Y/n): ', async (startAnswer) => {
              rl.close();
              
              if (startAnswer.toLowerCase() === 'n') {
                log('⏭️  Skipped auto-start');
                if (useBothModes) {
                  log('💡 To start both: vigilplus server --port 8080 --host 0.0.0.0 --with-monitor');
                } else if (useApiMode) {
                  log('💡 To start API server: vigilplus server --port 8080 --host 0.0.0.0');
                } else {
                  log('💡 To start monitor: vigilplus monitor --interval 5');
                }
                return;
              }
              
              try {
                if (useBothModes) {
                  // Start both API server and monitor
                  await startVigilPlusServer();
                  
                  // Start monitor in background
                  const { spawn } = require('child_process');
                  const monitor = spawn('vigilplus', ['monitor', '--interval', '5', '--log'], {
                    detached: true,
                    stdio: 'ignore'
                  });
                  monitor.unref();
                  
                  const serverIP = getServerIP();
                  success('VigilPlus API server + monitor started successfully!');
                  console.log('');
                  log(`📊 API Server running on: http://${serverIP}:8080`, colors.cyan);
                  log(`🔍 Health check: http://${serverIP}:8080/health`, colors.cyan);
                  log(`📈 Metrics API: http://${serverIP}:8080/api/metrics`, colors.cyan);
                  log(`📄 Monitor running in background`, colors.cyan);
                  console.log('');
                  success('Ready for Flutter app AND terminal monitoring! 🚀');
                } else if (useApiMode) {
                  await startVigilPlusServer();
                  const serverIP = getServerIP();
                  
                  success('VigilPlus API server started successfully!');
                  console.log('');
                  log(`📊 Server running on: http://${serverIP}:8080`, colors.cyan);
                  log(`🔍 Health check: http://${serverIP}:8080/health`, colors.cyan);
                  log(`📈 Metrics API: http://${serverIP}:8080/api/metrics`, colors.cyan);
                  console.log('');
                  success('Ready for your Flutter app! 🚀');
                } else {
                  // Start monitor mode
                  const { spawn } = require('child_process');
                  const monitor = spawn('vigilplus', ['monitor', '--interval', '5'], {
                    detached: true,
                    stdio: 'ignore'
                  });
                  monitor.unref();
                  
                  success('VigilPlus terminal monitor started successfully!');
                  console.log('');
                  log(`📊 Monitor running in background`, colors.cyan);
                  log(`💡 View output: vigilplus monitor --interval 5`, colors.cyan);
                  console.log('');
                  success('Terminal monitoring active! 🚀');
                }
                
                console.log('');
                log('🛑 To stop: pkill -f vigilplus');
                log('📊 To check status: ps aux | grep vigilplus');
                console.log('');
                success('Development setup complete! 🚀');
                
              } catch (err) {
                error(`Failed to start: ${err.message}`);
                log('💡 Try starting manually: vigilplus server --port 8080 --host 0.0.0.0');
              }
            });
          });
        }
      });
    } else {
      // Non-root user - simple mode selection and start
      rl.question('📊 Choose mode:\n   1) API Server (for Flutter app) - Recommended\n   2) Terminal Monitor (for console monitoring)\n   3) Both (API Server + Monitor) - Best of both worlds\n   Enter choice (1/2/3): ', async (modeAnswer) => {
        const useApiMode = modeAnswer !== '2';
        const useBothModes = modeAnswer === '3';
        
        rl.question('🚀 Start VigilPlus now? (Y/n): ', async (answer) => {
          rl.close();
          
          if (answer.toLowerCase() === 'n') {
            log('⏭️  Skipped auto-start');
            if (useBothModes) {
              log('💡 To start both: vigilplus server --port 8080 --host 0.0.0.0 --with-monitor');
            } else if (useApiMode) {
              log('💡 To start API server: vigilplus server --port 8080 --host 0.0.0.0');
            } else {
              log('💡 To start monitor: vigilplus monitor --interval 5');
            }
            log('💡 For system service: run with sudo');
            return;
          }
          
          try {
            if (useBothModes) {
              // Start both API server and monitor
              await startVigilPlusServer();
              
              // Start monitor in background
              const { spawn } = require('child_process');
              const monitor = spawn('vigilplus', ['monitor', '--interval', '5', '--log'], {
                detached: true,
                stdio: 'ignore'
              });
              monitor.unref();
              
              const serverIP = getServerIP();
              success('VigilPlus API server + monitor started successfully!');
              console.log('');
              log(`📊 API Server running on: http://${serverIP}:8080`, colors.cyan);
              log(`🔍 Health check: http://${serverIP}:8080/health`, colors.cyan);
              log(`📈 Metrics API: http://${serverIP}:8080/api/metrics`, colors.cyan);
              log(`📄 Monitor running in background`, colors.cyan);
              console.log('');
              success('Ready for Flutter app AND terminal monitoring! 🚀');
            } else if (useApiMode) {
              await startVigilPlusServer();
              const serverIP = getServerIP();
              
              success('VigilPlus API server started successfully!');
              console.log('');
              log(`📊 Server running on: http://${serverIP}:8080`, colors.cyan);
              log(`🔍 Health check: http://${serverIP}:8080/health`, colors.cyan);
              log(`📈 Metrics API: http://${serverIP}:8080/api/metrics`, colors.cyan);
              console.log('');
              success('Ready for your Flutter app! 🚀');
            } else {
              // Start monitor mode
              const { spawn } = require('child_process');
              const monitor = spawn('vigilplus', ['monitor', '--interval', '5'], {
                detached: true,
                stdio: 'ignore'
              });
              monitor.unref();
              
              success('VigilPlus terminal monitor started successfully!');
              console.log('');
              log(`📊 Monitor running in background`, colors.cyan);
              log(`💡 View output: vigilplus monitor --interval 5`, colors.cyan);
              console.log('');
              success('Terminal monitoring active! 🚀');
            }
            
            console.log('');
            log('🛑 To stop: pkill -f vigilplus');
            log('📊 To check status: ps aux | grep vigilplus');
            console.log('');
            success('Development setup complete! 🚀');
            
          } catch (err) {
            error(`Failed to start: ${err.message}`);
            if (useBothModes) {
              log('💡 Try starting manually: vigilplus server --port 8080 --host 0.0.0.0 --with-monitor');
            } else if (useApiMode) {
              log('💡 Try starting manually: vigilplus server --port 8080 --host 0.0.0.0');
            } else {
              log('💡 Try starting manually: vigilplus monitor --interval 5');
            }
          }
        });
      });
    }
    
  } catch (err) {
    error(`Post-install error: ${err.message}`);
  }
}

// Run post-install
postInstall().catch(console.error); 