// generate-icons.js — one-off script to render the app icon/splash from SVG
// run with: node generate-icons.js
// not part of the app itself, just a build helper - safe to delete after
// the PNGs in assets/ are generated, or keep around to regenerate later.

const sharp = require('sharp');
const fs = require('fs');

const GOLDEN_GRADIENT = `
  <linearGradient id="golden" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#D4A547"/>
    <stop offset="50%" stop-color="#C4903A"/>
    <stop offset="100%" stop-color="#A67628"/>
  </linearGradient>
`;

// same heart shape used everywhere - logo, splash, adaptive icon foreground -
// just with different backgrounds and padding around it
const heartPath = (scale, offsetX, offsetY) => `
  <path
    transform="translate(${offsetX}, ${offsetY}) scale(${scale})"
    d="M50,30 C35,5 0,5 0,40 C0,65 25,80 50,100 C75,80 100,65 100,40 C100,5 65,5 50,30 Z"
    fill="url(#golden)"
  />
`;

// heartPath's local bounding box is roughly x:[0,100] y:[5,100], so to
// actually center it in a 1024x1024 canvas: offsetX = (1024 - 100*scale)/2,
// offsetY = (1024 - 95*scale)/2 - 5*scale (the -5*scale accounts for the
// path's top starting at y=5, not y=0)
const centered = (scale) => ({
  scale,
  offsetX: (1024 - 100 * scale) / 2,
  offsetY: (1024 - 95 * scale) / 2 - 5 * scale,
});

// main app icon - dark bg + heart, square, used as the generic icon fallback
const iconGeom = centered(6.5);
const icon = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>${GOLDEN_GRADIENT}</defs>
  <rect width="1024" height="1024" fill="#0D0D0D"/>
  ${heartPath(iconGeom.scale, iconGeom.offsetX, iconGeom.offsetY)}
</svg>
`;

// android adaptive icon foreground - transparent bg (app.json sets the
// background color separately), heart kept smaller/centered since adaptive
// icons get cropped into circles/squircles by the OS and anything near the
// edges gets clipped
const adaptiveGeom = centered(4.2);
const adaptiveIcon = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>${GOLDEN_GRADIENT}</defs>
  ${heartPath(adaptiveGeom.scale, adaptiveGeom.offsetX, adaptiveGeom.offsetY)}
</svg>
`;

// splash screen - transparent bg (app.json's splash.backgroundColor matches
// the dark theme already), heart roughly icon-sized
const splashGeom = centered(5.5);
const splash = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>${GOLDEN_GRADIENT}</defs>
  ${heartPath(splashGeom.scale, splashGeom.offsetX, splashGeom.offsetY)}
</svg>
`;

if (!fs.existsSync('assets')) fs.mkdirSync('assets');

async function run() {
  await sharp(Buffer.from(icon)).png().toFile('assets/icon.png');
  await sharp(Buffer.from(adaptiveIcon)).png().toFile('assets/adaptive-icon.png');
  await sharp(Buffer.from(splash)).png().toFile('assets/splash.png');
  console.log('Generated assets/icon.png, assets/adaptive-icon.png, assets/splash.png');
}

run();
