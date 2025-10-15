// Script to generate placeholder PNG icons from SVG
const fs = require("fs");
const path = require("path");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, "../public/icons");

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG template
function generateSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Rounded square background -->
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
  
  <!-- Book icon -->
  <g transform="translate(${size * 0.25}, ${size * 0.25})">
    <path d="M ${size * 0.08} 0 L ${size * 0.42} 0 C ${size * 0.47} 0 ${size * 0.5} ${size * 0.03} ${size * 0.5} ${size * 0.08} L ${size * 0.5} ${size * 0.42} C ${size * 0.5} ${size * 0.47} ${size * 0.47} ${size * 0.5} ${size * 0.42} ${size * 0.5} L ${size * 0.08} ${size * 0.5} C ${size * 0.03} ${size * 0.5} 0 ${size * 0.47} 0 ${size * 0.42} L 0 ${size * 0.08} C 0 ${size * 0.03} ${size * 0.03} 0 ${size * 0.08} 0 Z" 
          fill="white" opacity="0.9"/>
    <rect x="${size * 0.1}" y="${size * 0.15}" width="${size * 0.3}" height="${size * 0.03}" fill="#3b82f6" rx="${size * 0.01}"/>
    <rect x="${size * 0.1}" y="${size * 0.23}" width="${size * 0.25}" height="${size * 0.03}" fill="#3b82f6" rx="${size * 0.01}"/>
    <rect x="${size * 0.1}" y="${size * 0.31}" width="${size * 0.28}" height="${size * 0.03}" fill="#3b82f6" rx="${size * 0.01}"/>
  </g>
</svg>`;
}

console.log("🎨 Generišem PWA ikonice...\n");

sizes.forEach((size) => {
  const svg = generateSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);

  fs.writeFileSync(filepath, svg);
  console.log(`✅ ${filename}`);
});

console.log("\n✨ Sve ikonice su kreirane!");
console.log("\n💡 Za produkciju, zamenite SVG fajlove sa PNG verzijama.");
console.log(
  "   Možete koristiti tool kao što je https://realfavicongenerator.net",
);
