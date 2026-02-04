import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
    const { toast } = useToast();

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const normalizeRole = useCallback((role) => {
        if (!role) return undefined;
        const lowered = String(role).toLowerCase();
        if (lowered === 'super-admin') return 'superuser';
        return lowered;
    }, []);

    const buildFallbackProfile = useCallback((authUser) => {
        if (!authUser) return null;
        return {
            id: authUser.id,
            full_name: authUser.email || 'User',
            role: normalizeRole(authUser.role) ?? 'user',
        };
    }, [normalizeRole]);

    const fetchProfile = useCallback(async (userId) => {
        if (!userId) {
            setProfile(null);
            return;
        }
        try {
            const response = await fetch(`/api/profile/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                console.error('Error fetching profile:', response.statusText);
                setProfile(buildFallbackProfile({ id: userId, email: user?.email }));
                return;
            }

            const data = await response.json();
            setProfile({
                ...data,
                role: normalizeRole(data?.role) ?? 'user',
            });
        } catch (err) {
            console.error('Profile fetch failed:', err);
            setProfile(buildFallbackProfile({ id: userId, email: user?.email }));
        }
    }, [token, user?.email, buildFallbackProfile, normalizeRole]);

    const handleSession = useCallback(async (sessionData) => {
        if (sessionData?.user) {
            setUser(sessionData.user);
            setToken(sessionData.token);
            localStorage.setItem('auth-token', sessionData.token);
            localStorage.setItem('auth-user', JSON.stringify(sessionData.user));
            await fetchProfile(sessionData.user.id);
        } else {
            setUser(null);
            setToken(null);
            setProfile(null);
            localStorage.removeItem('auth-token');
            localStorage.removeItem('auth-user');
        }
        setLoading(false);
    }, [fetchProfile]);

    useEffect(() => {
        let isMounted = true;

        const restoreSession = async () => {
            try {
                const storedToken = localStorage.getItem('auth-token');
                const storedUser = localStorage.getItem('auth-user');

                if (storedToken && storedUser) {
                    const user = JSON.parse(storedUser);
                    if (isMounted) {
                        setUser(user);
                        setToken(storedToken);
                        await fetchProfile(user.id);
                    }
                }
            } catch (err) {
                console.error('Session restore failed:', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        restoreSession();

        return () => {
            isMounted = false;
        };
    }, [fetchProfile]);

    const signIn = useCallback(async (email, password) => {
        try {
            const response = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                return { data: null, error };
            }

            const data = await response.json();
            await handleSession(data);
            return { data, error: null };
        } catch (error) {
            console.error('Sign in error:', error);
            return { data: null, error };
        }
    }, [handleSession]);

    const signOut = useCallback(async () => {
        try {
            await fetch('/api/auth/signout', { method: 'POST' });
        } catch (err) {
            console.error('Sign out error:', err);
        }

        setUser(null);
        setToken(null);
        setProfile(null);
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');

        toast({
            title: 'Signed Out',
            description: 'You have been successfully logged out.',
        });

        return { error: null };
    }, [toast]);

    const value = useMemo(() => ({
        user,
        profile,
        token,
        loading,
        signIn,
        signOut,
    }), [user, profile, token, loading, signIn, signOut]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
