import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bss-ssiti-erp-and-fee-system.vercel.app';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/foundation',
                    '/login',
                    '/privacy',
                    '/terms',
                    '/refund-policy',
                    '/donation-policy',
                    '/cookie-policy',
                    '/accessibility',
                    '/disclaimer',
                    '/_next/static/',
                    '/media/',
                    '/sai_iti_logo.png',
                    '/logo-preview.png',
                    '/og-image.png',
                    '/opengraph-image.png',
                    '/twitter-image.png',
                    '/manifest.json',
                    '/favicon.ico',
                ],
                disallow: [
                    '/api/',
                    '/dashboard',
                    '/payments',
                    '/students',
                    '/fee-structures',
                    '/receipts',
                    '/reports',
                    '/settings',
                    '/system',
                    '/access',
                    '/store/',
                    '/library/',
                    '/donation-admin/',
                    '/portal',
                ],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
        host: BASE_URL,
    };
}
