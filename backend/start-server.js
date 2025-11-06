// Quick start script to ensure clean server start
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function startServer() {
  console.log('🔍 Checking for processes on port 5000...');
  
  try {
    // Try to find and kill processes on port 5000
    const { stdout } = await execAsync('netstat -ano | findstr :5000 | findstr LISTENING');
    const lines = stdout.trim().split('\n');
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length > 0) {
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          console.log(`🛑 Killing process ${pid} on port 5000...`);
          try {
            await execAsync(`taskkill /PID ${pid} /F`);
            console.log(`✅ Killed process ${pid}`);
          } catch (err) {
            console.log(`⚠️ Could not kill process ${pid}: ${err.message}`);
          }
        }
      }
    }
  } catch (err) {
    // No processes found, that's fine
    console.log('✅ Port 5000 is free');
  }
  
  // Wait a moment for port to be released
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('🚀 Starting server...');
  // Start the server
  require('./index.js');
}

startServer().catch(console.error);

