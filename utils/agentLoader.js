const fs = require('fs');
const path = require('path');

const loadAgent = (englishLevel) => {
  const agentPath = path.join(__dirname, `../agents/${englishLevel}.json`);
  const rawData = fs.readFileSync(agentPath);
  return JSON.parse(rawData);
};

module.exports = loadAgent;
