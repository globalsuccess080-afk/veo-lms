const https = require('https');
const fs = require('fs');
const path = require('path');

const destDir = path.join(__dirname, '../apps/server/src/modules/certificate');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      } else if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      } else {
        reject(new Error(`Status ${response.statusCode} for ${url}`));
      }
    }).on('error', err => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

function getGoogleFontTtfUrl(familyStr) {
  return new Promise((resolve, reject) => {
    const url = `https://fonts.googleapis.com/css?family=${familyStr}`;
    const options = {
      headers: {
        // This old User-Agent forces Google Fonts to serve .ttf instead of .woff2
        'User-Agent': 'Mozilla/5.0 (Linux; U; Android 4.1.1; en-gb; Build/KLP) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Safari/534.30'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/url\((https:\/\/[^)]+\.ttf)\)/);
        if (match && match[1]) {
          resolve(match[1]);
        } else {
          reject(new Error('No TTF URL found in CSS'));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const fontsToDownload = [
    { name: 'Cinzel-Bold.ttf', query: 'Cinzel:700' },
    { name: 'Cormorant-SemiBold.ttf', query: 'Cormorant+Garamond:600' },
    { name: 'Inter-Regular.ttf', query: 'Inter:400' }
  ];

  for (const font of fontsToDownload) {
    try {
      console.log(`Resolving TTF URL for ${font.name}...`);
      const ttfUrl = await getGoogleFontTtfUrl(font.query);
      console.log(`Downloading ${font.name} from ${ttfUrl}...`);
      await downloadFile(ttfUrl, path.join(destDir, font.name));
      console.log(`Successfully saved ${font.name}`);
    } catch (err) {
      console.error(`Failed to process ${font.name}:`, err.message);
    }
  }
}

main();
