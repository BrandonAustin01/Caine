const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '../logs/security.log');

// Ensure the logs directory exists
if (!fs.existsSync(path.dirname(logFile))) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
}

const timestamp = () => new Date().toISOString();

module.exports = {
  log: (...args) => {
    const line = `[${timestamp()}] ${args.join(' ')}\n`;
    fs.appendFileSync(logFile, line, 'utf8');
  }
};
