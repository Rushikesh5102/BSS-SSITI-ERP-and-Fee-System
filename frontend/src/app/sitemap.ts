import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bss-ssiti-erp-and-fee-system.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();

    const routes = [
        {
            url: `${BASE_URL}/`,
            lastModified,
            changeFrequency: 'weekly' as const,
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/foundation`,
            lastModified,
            changeFrequency: 'weekly' as const,
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/login`,
            lastModified,
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/privacy`,
            lastModified,
            changeFrequency: 'yearly' as const,
            priority: 0.4,
        },
        {
            url: `${BASE_URL}/terms`,
            lastModified,
            changeFrequency: 'yearly' as const,
            priority: 0.4,
        },
        {
            url: `${BASE_URL}/refund-policy`,
            lastModified,
            changeFrequency: 'yearly' as const,
            priority: 0.4,
        },
        {
            url: `${BASE_URL}/donation-policy`,
            lastModified,
            changeFrequency: 'yearly' as const,
            priority: 0.4,
        },
        {
            url: `${BASE_URL}/cookie-policy`,
            lastModified,
            changeFrequency: 'yearly' as const,
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/accessibility`,
            lastModified,
            changeFrequency: 'yearly' as const,
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/disclaimer`,
            lastModified,
            changeFrequency: 'yearly' as const,
            priority: 0.3,
        },
    ];

    return routes;
}
