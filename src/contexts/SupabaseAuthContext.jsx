import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeRole = useCallback((role) => {
    if (!role) return undefined;
    const lowered = String(role).toLowerCase();
    if (lowered === 'super-admin') return 'superuser';
    return lowered;
  }, []);

  const buildFallbackProfile = useCallback((authUser) => {
    if (!authUser) return null;
    const roleFromMetadata = authUser.user_metadata?.role ?? authUser.app_metadata?.role;
    const fullNameFromMetadata = authUser.user_metadata?.full_name ?? authUser.user_metadata?.name;

    return {
      id: authUser.id,
      full_name: fullNameFromMetadata ?? authUser.email,
      role: normalizeRole(roleFromMetadata) ?? 'admin', // Default to admin for now
    };
  }, [normalizeRole]);

  const fetchProfile = useCallback(async (authUser) => {
    const userId = authUser?.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(buildFallbackProfile(authUser));
      } else {
        setProfile({
          ...data,
          role: normalizeRole(data?.role) ?? 'admin', // Default to admin
        });
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
      setProfile(buildFallbackProfile(authUser));
    }
  }, [buildFallbackProfile, normalizeRole]);

  const handleSession = useCallback(async (session) => {
    console.log('handleSession called with session:', !!session);
    setSession(session);
    const currentUser = session?.user ?? null;
    console.log('Setting user to:', !!currentUser);
    setUser(currentUser);
    await fetchProfile(currentUser);
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    let isMounted = true;
    
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        if (isMounted) {
          await handleSession(session);
        }
      } catch (err) {
        console.error('Session fetch failed:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    // Safety timeout - ensure loading is false after 5 seconds max
    const timeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, !!session);
        if (isMounted) {
          await handleSession(session);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [handleSession]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

     if (error) {
       console.error("Sign in error:", error);
    }

    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    console.log('SignOut called');
    const { error } = await supabase.auth.signOut();
    console.log('SignOut result:', { error });

    if (error) {
      console.error('Sign out error:', error);
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    } else {
      console.log('Sign out successful');
      // Manual state reset as fallback
      setUser(null);
      setProfile(null);
      setSession(null);
      toast({
        title: "Signed Out",
        description: "You have been successfully logged out."
      });
    }

    return { error };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
  }), [user, profile, session, loading, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
