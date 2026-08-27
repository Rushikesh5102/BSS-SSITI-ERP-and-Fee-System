'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';
import { safeStorage } from '../utils/safeStorage';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'SUPERADMIN' | 'ACCOUNTANT' | 'STUDENT' | 'DEVELOPER' | 'STORE_MANAGER' | 'LIBRARIAN' | 'TEACHER';
    branch: { id: string; name: string } | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string, isOfflineFallbackAllowed?: boolean) => Promise<void>;
    logout: () => void;
    isRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const INSTITUTIONAL_OFFLINE_USERS: Record<string, { pass: string; role: User['role']; name: string }> = {
    'admin@saiiti.edu.in': { pass: 'Admin@123', role: 'ADMIN', name: 'Branch Administrator' },
    'superadmin@saiiti.edu.in': { pass: 'Admin@123', role: 'SUPERADMIN', name: 'Super Administrator' },
    'accountant@saiiti.edu.in': { pass: 'Accountant@123', role: 'ACCOUNTANT', name: 'Fee Accountant' },
    'storemanager@saiiti.edu.in': { pass: 'Store@123', role: 'STORE_MANAGER', name: 'Workshop Store Manager' },
    'librarian@saiiti.edu.in': { pass: 'Library@123', role: 'LIBRARIAN', name: 'Chief Librarian' },
    'teacher@saiiti.edu.in': { pass: 'Teacher@123', role: 'TEACHER', name: 'Senior Trade Instructor' },
    'pattiwarrushikesh5102@gmail.com': { pass: 'Rushikesh@5102', role: 'DEVELOPER', name: 'Rushikesh Pattiwar' },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const redirectUser = (userData: User) => {
        if (userData.role === 'DEVELOPER' || userData.role === 'ADMIN' || userData.role === 'SUPERADMIN') {
            router.push('/portal');
        } else if (userData.role === 'STORE_MANAGER') {
            router.push('/store');
        } else if (userData.role === 'LIBRARIAN') {
            router.push('/library');
        } else if (userData.role === 'TEACHER') {
            router.push('/students');
        } else {
            // Fee Accountant & Students strictly land on dashboard (No access to Developer / Admin portal)
            router.push('/dashboard');
        }
    };

    // ── Persistent Session Restoration on Page Reload ─────────────────────────
    useEffect(() => {
        try {
            const rawToken = safeStorage.get<string | null>('accessToken', null) || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
            const token = rawToken ? String(rawToken).replace(/^"(.*)"$/, '$1') : null;
            const cachedUser = safeStorage.get<User | null>('user_cache', null);

            if (token && cachedUser && cachedUser.id && cachedUser.role) {
                setUser(cachedUser);
                setLoading(false);

                // Background session verification with backend without blocking or dropping the session
                if (!token.startsWith('mock_offline_')) {
                    api.get('/auth/me', { timeout: 8000 })
                        .then(({ data }) => {
                            if (data?.data) {
                                setUser(data.data);
                                safeStorage.set('user_cache', data.data);
                            }
                        })
                        .catch((err) => {
                            // Only clear session if explicitly rejected with 401/403 response
                            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                                safeStorage.clearSession();
                                setUser(null);
                            }
                            // If network error / cold start, keep user logged in seamlessly!
                        });
                }
            } else if (token) {
                // Token exists but cachedUser wasn't found in storage, fetch from server
                api.get('/auth/me', { timeout: 8000 })
                    .then(({ data }) => {
                        if (data?.data) {
                            setUser(data.data);
                            safeStorage.set('user_cache', data.data);
                        } else {
                            setUser(null);
                        }
                    })
                    .catch(() => {
                        setUser(null);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            } else {
                setUser(null);
                setLoading(false);
            }
        } catch {
            setUser(null);
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string, isOfflineFallbackAllowed: boolean = false) => {
        if (!email || !password) {
            throw new Error('Please enter both email and password.');
        }

        try {
            const { data } = await api.post('/auth/login', { email, password });
            const { accessToken, refreshToken, user: userData } = data.data;
            safeStorage.set('accessToken', accessToken);
            safeStorage.set('refreshToken', refreshToken);
            safeStorage.set('user_cache', userData);
            sessionStorage.setItem('showWelcomeAnimation', 'true');
            setUser(userData);
            redirectUser(userData);
        } catch (err: any) {
            // Definite authentication rejection from server (invalid password or email)
            if (err.response?.status === 401 || err.response?.status === 400 || err.response?.status === 403) {
                throw new Error(err.response?.data?.message || 'Invalid email or password.');
            }

            // If offline fallback verification is allowed (after 30s countdown completes)
            if (isOfflineFallbackAllowed) {
                const lowerEmail = (email || '').toLowerCase().trim();
                const offlineRecord = INSTITUTIONAL_OFFLINE_USERS[lowerEmail];

                if (offlineRecord && offlineRecord.pass === password) {
                    const offlineUser: User = {
                        id: `usr-${offlineRecord.role.toLowerCase()}-offline`,
                        name: offlineRecord.name,
                        email: lowerEmail,
                        role: offlineRecord.role,
                        branch: { id: '00000000-0000-0000-0000-000000000001', name: 'Shri Sai ITI Main Campus' }
                    };
                    safeStorage.set('accessToken', 'mock_offline_access_token');
                    safeStorage.set('refreshToken', 'mock_offline_refresh_token');
                    safeStorage.set('user_cache', offlineUser);
                    sessionStorage.setItem('showWelcomeAnimation', 'true');
                    setUser(offlineUser);
                    redirectUser(offlineUser);
                    return;
                } else {
                    throw new Error('Invalid email or password. Please check your credentials.');
                }
            }

            // Propagate network/timeout error so LoginPage can activate 30s cold-start timer
            throw err;
        }
    };

    const logout = () => {
        api.post('/auth/logout').catch(() => { });
        safeStorage.clearSession();
        setUser(null);
        router.push('/login');
    };

    const isRole = (...roles: string[]) => !!user && roles.includes(user.role);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
