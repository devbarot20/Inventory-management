'use strict';

const mongoose = require('mongoose');
const env = require('../src/config/env');
const { checkUpcomingStockouts } = require('../src/services/scheduledStockoutChecker.service');

async function main() {
  const windowHours = parseInt(process.env.WINDOW_HOURS || '48', 10);

  console.log('================================================================');
  console.log('       FORECASTIQ - AUTOMATED SCHEDULED STOCKOUT CHECKER        ');
  console.log('================================================================');
  console.log(`Scanning flash sales starting within next ${windowHours} hours…`);
  console.log(`Connecting to MongoDB at ${env.mongodbUri}…`);

  await mongoose.connect(env.mongodbUri);
  console.log('Connected to database.\n');

  try {
    const summary = await checkUpcomingStockouts({ windowHours });

    console.log(`Evaluated at:             ${summary.evaluatedAt}`);
    console.log(`Total upcoming sales:     ${summary.totalSalesEvaluated}`);
    console.log(`Total high-risk SKUs:     ${summary.totalHighRiskItems}`);
    console.log(`Alert notifications sent: ${summary.totalAlertsSent}\n`);

    if (summary.results.length > 0) {
      console.log('Detailed Sale Event Breakdown:');
      for (const r of summary.results) {
        console.log(`- [${r.saleName}] (Starts: ${new Date(r.startDate).toISOString()})`);
        console.log(`  Status: ${r.status}`);
        if (r.highRiskCount > 0) {
          console.log(`  ⚠️ High-Risk SKUs (${r.highRiskCount}): ${r.highRiskSkus.join(', ')}`);
          console.log(`  Notification dispatched: ${r.emailSent ? 'YES' : 'NO'}`);
        } else {
          console.log('  ✅ No high-risk stockout hazards identified.');
        }
      }
    } else {
      console.log('No upcoming flash sales found in the specified lookahead window.');
    }
  } catch (err) {
    console.error('Stockout check error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase connection closed. Check complete.');
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}

module.exports = { main };
