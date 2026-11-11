const http = require('http');

console.log("=================================================");
console.log("🚀 Omni-Cron Automated Runner & Watchdog Started");
console.log("=================================================");
console.log("Monitoring and syncing leads from 16+ platforms every 5 minutes.");

let isScanning = false;

function triggerCron() {
  if (isScanning) {
    console.log(`[${new Date().toLocaleTimeString()}] Previous scan still in progress. Skipping cycle...`);
    return;
  }

  isScanning = true;
  const port = process.env.PORT || 3000;
  console.log(`[${stamp}] Firing Omni-Cron API (http://127.0.0.1:${port}/api/cron)...`);

  const req = http.get(`http://127.0.0.1:${port}/api/cron`, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      isScanning = false;
      const endStamp = new Date().toLocaleTimeString();
      try {
        const parsed = JSON.parse(rawData);
        if (parsed.success) {
          console.log(`[${endStamp}] ✅ Success: ${parsed.message} (Total Leads: ${parsed.totalLeads})`);
          if (parsed.errors && parsed.errors.length > 0) {
            console.warn(`[${endStamp}] ⚠️ Non-fatal notices:`, parsed.errors.join(' | '));
          }
        } else {
          console.error(`[${endStamp}] ❌ Scan report error:`, parsed.error || parsed.message);
        }
      } catch (e) {
        console.log(`[${endStamp}] Completed with status code ${res.statusCode}:`, rawData.slice(0, 120));
      }
    });
  });

  req.on('error', (err) => {
    isScanning = false;
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Network error triggering cron. Make sure Next.js is running on port 3000:`, err.message);
  });

  req.setTimeout(45000, () => {
    isScanning = false;
    req.destroy();
    console.warn(`[${new Date().toLocaleTimeString()}] ⚠️ Cron request timed out after 45s. Will retry next cycle.`);
  });
}

// Run immediately on start
triggerCron();

// Run every 5 minutes (300,000 milliseconds)
setInterval(triggerCron, 5 * 60 * 1000);
