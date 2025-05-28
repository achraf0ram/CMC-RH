const https = require('https');
const fs = require('fs');
const path = require('path');

const fonts = [
  {
    name: 'NotoNaskhArabic-Regular.ttf',
    url: 'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoNaskhArabic/NotoNaskhArabic-Regular.ttf'
  },
  {
    name: 'NotoNaskhArabic-Bold.ttf',
    url: 'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoNaskhArabic/NotoNaskhArabic-Bold.ttf'
  }
];

const fontsDir = path.join(__dirname, '..', 'public', 'fonts');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Download each font
fonts.forEach(font => {
  const filePath = path.join(fontsDir, font.name);
  console.log(`Downloading ${font.name} to ${filePath}...`);

  const file = fs.createWriteStream(filePath);

  https.get(font.url, response => {
    if (response.statusCode !== 200) {
      console.error(`Failed to download ${font.name}: ${response.statusCode}`);
      return;
    }

    response.pipe(file);

    file.on('finish', () => {
      file.close();
      console.log(`Successfully downloaded ${font.name}`);
    });
  }).on('error', err => {
    fs.unlink(filePath, () => {}); // Delete the file if there was an error
    console.error(`Error downloading ${font.name}:`, err.message);
  });
}); 