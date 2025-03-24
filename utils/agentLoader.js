const fs = require('fs');
const path = require('path');

const loadAgent = (level) => {
  const agentPath = path.join(__dirname, `../agents/${level}.json`);
  const rawData = fs.readFileSync(agentPath);
  return JSON.parse(rawData);
};

module.exports = loadAgent;
