import type { Metadata } from 'next';
import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';

export const metadata: Metadata = {
    title: 'Shri Sai I.T.I Fee Management System',
    description: 'Comprehensive fee management system for Shri Sai I.T.I — track student fees, payments, and generate receipts.',
    keywords: ['ITI', 'fee management', 'school fees', 'student management'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
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
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
