const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'UI Screenshots');

const snippets = [
    {
        name: 'Real_Time_Optimization_Snippet',
        title: 'Real-Time Optimization & Time Management',
        code: `// Generate live chart data for the last 6 months concurrently
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const chartPromises = Array.from({ length: 6 }).map((_, i) => {
    const dStrStart = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    const dStrEnd = new Date(today.getFullYear(), today.getMonth() - (5 - i) + 1, 1);
    
    return prisma.payment.aggregate({
        where: { createdAt: { gte: dStrStart, lt: dStrEnd }, status: 'VERIFIED' },
        _sum: { amount: true }
    }).then(monthAgg => ({
        month: monthNames[dStrStart.getMonth()],
        amount: Math.round((monthAgg._sum.amount || 0) / 100000)
    }));
});

const chartData = await Promise.all(chartPromises);`,
        language: 'typescript'
    },
    {
        name: 'Bug_Resolution_Snippet',
        title: 'Bug Resolution & Problem-Solving Skills',
        code: `const { page = 1, limit = 20, search = '', class: cls = '' } = req.query;
let parsedPage = Number(page);
let parsedLimit = Number(limit);

if (isNaN(parsedPage) || parsedPage < 1) parsedPage = 1;
if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) parsedLimit = 20;

const skip = (parsedPage - 1) * parsedLimit;

// Usage in query:
take: parsedLimit,
// ...
pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) }`,
        language: 'typescript'
    },
    {
        name: 'Technical_Debugging_Snippet',
        title: 'Technical Debugging & Complex Error Resolution',
        code: `// Prisma foreign key constraint violation
if ((err as any).code === 'P2003') {
    res.status(400).json({
        success: false,
        message: 'Cannot delete or update this record because it is referenced by other records.',
    });
    return;
}

// Scrub sensitive data from body before logging
const safeBody = { ...req.body };
if (safeBody.password) safeBody.password = '***';

// Unknown / programming errors — log in full, don't expose internals
logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: safeBody,
    query: req.query,
    params: req.params,
});`,
        language: 'typescript'
    },
    {
        name: 'UX_Error_Boundary_Snippet',
        title: 'User Experience & Feature Enhancement (Error Boundary)',
        code: `'use client';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error, reset: () => void }) {
    useEffect(() => { console.error('Unhandled UI Exception:', error); }, [error]);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100vh', justifyContent: 'center' }}>
            <h2 style={{ color: '#ef4444' }}>Something went wrong!</h2>
            <button onClick={() => reset()} style={{ backgroundColor: '#3b82f6', color: 'white', padding: '10px 20px', borderRadius: '5px' }}>
                Try again
            </button>
        </div>
    );
}`,
        language: 'typescript'
    },
    {
        name: 'UX_Loading_Snippet',
        title: 'User Experience & Feature Enhancement (Loading State)',
        code: `export default function Loading() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '50vh' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6',
                    borderRadius: '50%', width: '40px', height: '40px',
                    animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto'
                }}></div>
                <p>Loading data, please wait...</p>
            </div>
        </div>
    );
}`,
        language: 'typescript'
    }
];

async function generateCodeImages() {
    console.log('Launching browser for code snippets...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 1000, deviceScaleFactor: 2 }); // High-res

    for (const snippet of snippets) {
        console.log(`Rendering ${snippet.name}...`);
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/typescript.min.js"></script>
            <style>
                body {
                    margin: 0;
                    padding: 40px;
                    display: inline-block;
                    background: transparent;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }
                .container {
                    background: #282c34;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    border: 1px solid #3e4451;
                }
                .title {
                    color: #abb2bf;
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #3e4451;
                }
                pre { margin: 0; }
                code {
                    font-family: "Fira Code", Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
                    font-size: 14px;
                    line-height: 1.5;
                }
            </style>
        </head>
        <body>
            <div class="container" id="code-container">
                <div class="title">${snippet.title}</div>
                <pre><code class="language-${snippet.language}">${snippet.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
            </div>
            <script>hljs.highlightAll();</script>
        </body>
        </html>
        `;

        await page.setContent(html, { waitUntil: 'load' });
        
        const element = await page.$('#code-container');
        const boundingBox = await element.boundingBox();
        
        // Adjust viewport to perfectly fit the snippet plus some padding
        await page.setViewport({
            width: Math.ceil(boundingBox.width + 80),
            height: Math.ceil(boundingBox.height + 80),
            deviceScaleFactor: 2
        });

        const outputPath = path.join(SCREENSHOT_DIR, `${snippet.name}.png`);
        await page.screenshot({
            path: outputPath,
            clip: {
                x: 0,
                y: 0,
                width: Math.ceil(boundingBox.width + 80),
                height: Math.ceil(boundingBox.height + 80)
            },
            omitBackground: true // Transparent background
        });
        console.log(`Saved snippet to ${outputPath}`);
    }

    await browser.close();
    console.log('All snippet images generated successfully.');
}

generateCodeImages().catch(console.error);
