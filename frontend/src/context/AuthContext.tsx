'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'ACCOUNTANT' | 'TEACHER' | 'STUDENT' | 'DEVELOPER' | 'STORE_MANAGER' | 'LIBRARIAN';
    branch: { id: string; name: string } | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Restore session on mount
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const cachedUser = localStorage.getItem('user_cache');
        if (cachedUser) {
            try {
                setUser(JSON.parse(cachedUser));
                setLoading(false);
            } catch {}
        }
        if (token) {
            api.get('/auth/me')
                .then(({ data }) => {
                    setUser(data.data);
                    localStorage.setItem('user_cache', JSON.stringify(data.data));
                })
                .catch(() => {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user_cache');
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const { data } = await api.post('/auth/login', { email, password });
        const { accessToken, refreshToken, user: userData } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user_cache', JSON.stringify(userData));
        sessionStorage.setItem('showWelcomeAnimation', 'true');
        setUser(userData);
        if (userData.role === 'DEVELOPER' || userData.role === 'ADMIN') {
            router.push('/portal');
        } else if (userData.role === 'STORE_MANAGER') {
            router.push('/store/items');
        } else if (userData.role === 'LIBRARIAN') {
            router.push('/library/books');
        } else {
            router.push('/dashboard');
        }
    };

    const logout = () => {
        api.post('/auth/logout').catch(() => { });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user_cache');
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
