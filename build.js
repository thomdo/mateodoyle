const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'dist');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const ASSETS_DIR = path.join(__dirname, 'assets');
const CSS_DIR = path.join(__dirname, 'css');
const FONTS_DIR = path.join(__dirname, 'fonts');

// Helper to ensure directory exists
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Clean/Create dist
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
ensureDir(DIST_DIR);

// Load data
const cars = JSON.parse(fs.readFileSync(path.join(__dirname, 'cars.json'), 'utf8'));
const indexTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'index.html'), 'utf8');
const detailTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'car-detail.html'), 'utf8');

// Generate Index Page
console.log('Generating index.html...');
const carsListHtml = cars.map(car => `
    <a href="${car.id}.html" class="thumbnail">
        <img src="${car.image}" alt="${car.name}" class="thumbnail-image" width="1" height="1" loading="lazy">
    </a>
`).join('');

const indexHtml = indexTemplate.replace('<!-- CAR_LIST_PLACEHOLDER -->', carsListHtml);
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);

// Generate Detail Pages
console.log('Generating detail pages...');
cars.forEach(car => {
    let carHtml = detailTemplate
        .replace(/{{name}}/g, car.name)
        .replace(/{{color}}/g, car.color)
        .replace(/{{image}}/g, car.image);

    fs.writeFileSync(path.join(DIST_DIR, `${car.id}.html`), carHtml);
});

// Copy Assets
console.log('Copying assets...');
if (fs.existsSync(ASSETS_DIR)) {
    fs.cpSync(ASSETS_DIR, path.join(DIST_DIR, 'assets'), { recursive: true });
}
if (fs.existsSync(CSS_DIR)) {
    fs.cpSync(CSS_DIR, path.join(DIST_DIR, 'css'), { recursive: true });
}
if (fs.existsSync(FONTS_DIR)) {
    fs.cpSync(FONTS_DIR, path.join(DIST_DIR, 'fonts'), { recursive: true });
}

console.log('Build complete!');
