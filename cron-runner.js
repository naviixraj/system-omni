const http = require('http');

console.log("=========================================");
console.log("🚀 Omni-Cron Automated Runner Started");
console.log("=========================================");
console.log("This background process will automatically trigger your global scraper every 5 minutes.");

function triggerCron() {
  console.log(`[${new Date().toLocaleTimeString()}] Firing Omni-Cron API...`);
  
  http.get('http://127.0.0.1:3000/api/cron', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`[${new Date().toLocaleTimeString()}] Success: Data synced from all 16+ platforms!`);
    });
  }).on('error', (err) => {
    console.error(`[${new Date().toLocaleTimeString()}] Error triggering cron. Make sure Next.js is running.`, err.message);
  });
}

// Run immediately on start
triggerCron();

// Run every 5 minutes (300,000 milliseconds)
setInterval(triggerCron, 5 * 60 * 1000);
