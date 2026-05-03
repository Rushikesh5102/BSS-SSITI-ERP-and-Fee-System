const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'UI Screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureScreenshots() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: 'new', // or true
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });

    console.log('Logging in...');
    await page.type('input[type="email"]', 'admin@saiiti.edu.in');

    // The password field might just be input[type="password"]
    await page.type('input[type="password"]', 'Admin@123');

    // Click the submit button (assuming it's a button with type submit or the only button)
    // await page.click('button[type="submit"]');
    // Or press Enter
    await Promise.all([
        page.keyboard.press('Enter'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    const pagesToCapture = [
        { name: 'Dashboard', url: 'http://localhost:3000/dashboard' },
        { name: 'Students', url: 'http://localhost:3000/students' },
        { name: 'Fee Structures', url: 'http://localhost:3000/fee-structures' },
        { name: 'Payments', url: 'http://localhost:3000/payments' },
        { name: 'Receipts', url: 'http://localhost:3000/receipts' },
        { name: 'Reports', url: 'http://localhost:3000/reports' }
    ];

    for (const p of pagesToCapture) {
        console.log(`Capturing ${p.name}...`);
        await page.goto(p.url, { waitUntil: 'networkidle0' });
        // wait extra 1s for any animations
        await new Promise(r => setTimeout(r, 1000));
        const filePath = path.join(SCREENSHOT_DIR, `${p.name}.png`);
        await page.screenshot({ path: filePath, fullPage: true });
        console.log(`Saved: ${filePath}`);
    }

    // For login page, we can log out or just incognito
    console.log('Capturing Login page specifically...');
    const context = await browser.createBrowserContext();
    const page2 = await context.newPage();
    await page2.setViewport({ width: 1280, height: 800 });
    await page2.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    const loginFilePath = path.join(SCREENSHOT_DIR, 'Login.png');
    await page2.screenshot({ path: loginFilePath, fullPage: true });
    console.log(`Saved: ${loginFilePath}`);

    await browser.close();
    console.log('Done!');
}

captureScreenshots().catch(err => {
    console.error('Error capturing screenshots:', err);
    process.exit(1);
});
