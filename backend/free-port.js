// Helper script to free port 5000 (or any port specified as argument)
const { exec } = require('child_process');
const port = process.argv[2] || '5000';

console.log(`🔍 Checking for processes using port ${port}...`);

exec(`netstat -ano | findstr :${port} | findstr LISTENING`, (error, stdout, stderr) => {
  if (error || !stdout) {
    console.log(`✅ Port ${port} is free!`);
    process.exit(0);
  }

  const lines = stdout.trim().split('\n');
  const pids = new Set();
  
  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length > 0) {
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        pids.add(pid);
      }
    }
  });

  if (pids.size === 0) {
    console.log(`✅ Port ${port} is free!`);
    process.exit(0);
  }

  console.log(`⚠️  Found ${pids.size} process(es) using port ${port}:`);
  pids.forEach(pid => console.log(`   PID: ${pid}`));

  pids.forEach(pid => {
    console.log(`🛑 Killing process ${pid}...`);
    exec(`taskkill /PID ${pid} /F`, (killError, killStdout, killStderr) => {
      if (killError) {
        console.error(`❌ Failed to kill process ${pid}:`, killError.message);
      } else {
        console.log(`✅ Successfully killed process ${pid}`);
      }
    });
  });

  // Wait a bit for processes to terminate
  setTimeout(() => {
    console.log(`\n✅ Port ${port} should now be free!`);
    process.exit(0);
  }, 1000);
});

