// @ts-nocheck
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { convertToMinutes } = require('./convertToMinutes');

function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout);
      }
    });
  });
}

async function getSubtitles({ videoId, language = 'en' }) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const tmpDir = os.tmpdir();
  const outputTemplate = path.join(tmpDir, `yt_subs_${videoId}`);
  const outputFile = `${outputTemplate}.${language}.srv1`;

  // Intentar primero subtítulos manuales, si no existen usar auto-generados
  const cookiesPath = path.join(__dirname, '..', 'cookies.txt');
  const cookiesFlag = fs.existsSync(cookiesPath) ? `--cookies "${cookiesPath}"` : '';

  const attempts = [
    `yt-dlp ${cookiesFlag} --remote-components ejs:github --write-sub --sub-lang ${language} --sub-format srv1 --skip-download "${url}" -o "${outputTemplate}" 2>&1`,
    `yt-dlp ${cookiesFlag} --remote-components ejs:github --write-auto-sub --sub-lang ${language} --sub-format srv1 --skip-download "${url}" -o "${outputTemplate}" 2>&1`,
  ];

  let downloaded = false;
  for (const cmd of attempts) {
    try {
      await runCommand(cmd);
      if (fs.existsSync(outputFile)) {
        downloaded = true;
        break;
      }
    } catch (err) {
      console.warn('yt-dlp attempt failed:', err.message);
    }
  }

  if (!downloaded) {
    throw new Error('No subtitles available for the specified video.');
  }

  const raw = fs.readFileSync(outputFile, 'utf-8');
  fs.unlinkSync(outputFile);

  return parseSrv1(raw);
}

function parseSrv1(xml) {
  const subtitlesWithTimestamp = [];
  let totalTextOfVideo = '';
  let totalDurationSec = 0;

  // Cada línea es: <text start="1234" dur="567">texto</text>
  const regex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const dur = parseFloat(match[2]);
    const text = match[3]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n/g, ' ')
      .trim();

    if (!text) continue;

    totalTextOfVideo += text + ' ';
    totalDurationSec = Math.max(totalDurationSec, start + dur);

    subtitlesWithTimestamp.push({ start, dur, text });
  }

  const videoDuration = convertToMinutes(totalDurationSec);

  return { subtitlesWithTimestamp, totalTextOfVideo: totalTextOfVideo.trim(), videoDuration };
}

module.exports = { getSubtitles };
