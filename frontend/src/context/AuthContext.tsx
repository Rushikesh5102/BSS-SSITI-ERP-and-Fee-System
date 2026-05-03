'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'SUPERADMIN' | 'ADMIN' | 'ACCOUNTANT' | 'TEACHER' | 'STUDENT' | 'DEVELOPER';
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
        if (token) {
            api.get('/auth/me')
                .then(({ data }) => setUser(data.data))
                .catch(() => {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
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
        sessionStorage.setItem('showWelcomeAnimation', 'true');
        setUser(userData);
        router.push('/dashboard');
    };

    const logout = () => {
        api.post('/auth/logout').catch(() => { });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
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
