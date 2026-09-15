import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';
import PwaInstallerAndOfflineSync from '../components/PwaInstallerAndOfflineSync';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bss-ssiti-erp-and-fee-system.vercel.app';

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
    ],
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
};

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: 'Shri Sai ITI & BSS ERP | Fee & Campus Management Portal',
        template: '%s | Shri Sai ITI ERP',
    },
    description:
        'Official ERP, Student Admission, Workshop Asset Register, and Fee Management Portal for Shri Sai Private Industrial Training Institute (Bhadravati, Maharashtra) and BSS Foundation. Automated DVET receipts, NCVT trade registers, and institutional reporting.',
    applicationName: 'Shri Sai ITI ERP',
    keywords: [
        'Shri Sai ITI',
        'Sai ITI Bhadravati',
        'BSS Foundation',
        'ITI Fee Management Software',
        'Maharashtra DVET Admissions',
        'NCVT Electrician Trade',
        'NCVT Wireman Trade',
        'ITI Student Portal',
        'Fee Receipts PDF',
        'Workshop Inventory System',
        'College ERP India',
        'Chandrapur ITI College',
    ],
    authors: [{ name: 'Rushikesh Pattiwar', url: SITE_URL }],
    creator: 'Rushikesh Pattiwar',
    publisher: 'Shri Sai Private Industrial Training Institute',
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
            { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
            { url: '/icon-192x192.png', type: 'image/png', sizes: '192x192' },
            { url: '/icon-512x512.png', type: 'image/png', sizes: '512x512' },
        ],
        apple: [
            { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
        shortcut: ['/favicon.ico'],
    },
    manifest: '/manifest.json',
    openGraph: {
        type: 'website',
        locale: 'en_IN',
        url: SITE_URL,
        siteName: 'Shri Sai ITI & BSS ERP System',
        title: 'Shri Sai ITI & BSS ERP | Fee & Campus Management Portal',
        description:
            'Official ERP and Fee Management Portal for Shri Sai Private Industrial Training Institute, Bhadravati. Manage student admissions, fee structures, receipts, and workshop store inventory.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Shri Sai ITI ERP System Banner',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Shri Sai ITI & BSS ERP | Fee & Campus Management Portal',
        description:
            'Official ERP and Fee Management Portal for Shri Sai Private Industrial Training Institute, Bhadravati. Automated DVET student admissions and digital fee receipts.',
        images: ['/og-image.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    alternates: {
        canonical: SITE_URL,
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Sai ITI ERP',
    },
};

const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Shri Sai Private Industrial Training Institute',
    alternateName: ['Shri Sai ITI', 'Sai ITI Bhadravati', 'BSS ITI'],
    url: SITE_URL,
    logo: `${SITE_URL}/sai_iti_logo.png`,
    image: `${SITE_URL}/og-image.png`,
    description:
        'Premier vocational training institute affiliated with DVET Maharashtra and NCVT New Delhi offering Electrician and Wireman trades.',
    address: {
        '@type': 'PostalAddress',
        streetAddress: 'Bhadravati Campus',
        addressLocality: 'Bhadravati',
        addressRegion: 'Maharashtra',
        postalCode: '442902',
        addressCountry: 'IN',
    },
    telephone: '+91-9822731852',
    email: 'contact@saiiti.edu.in',
    sameAs: ['https://dvet.gov.in'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <link rel="manifest" href="/manifest.json" />
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link rel="dns-prefetch" href="https://bss-ssiti-erp-and-fee-system.onrender.com" />
                <link rel="preconnect" href="https://bss-ssiti-erp-and-fee-system.onrender.com" crossOrigin="" />
                <link
                    href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400;1,9..40,600&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400;1,600&display=swap"
                    rel="stylesheet"
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(jsonLdData),
                    }}
                />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var storedTheme = localStorage.getItem('theme');
                                    if (storedTheme === 'dark') {
                                        document.documentElement.classList.add('dark');
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body>
                <AuthProvider>
                    {children}
                    <PwaInstallerAndOfflineSync />
                </AuthProvider>
            </body>
        </html>
    );
}
