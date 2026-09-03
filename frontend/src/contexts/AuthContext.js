import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, role, name, phoneNo) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          phoneNo: phoneNo || '',
          role: role
        }
      }
    });
    
    if (error) throw error;
    
    const user = data.user;
    if (!user) throw new Error("Signup failed.");
    
    const profileData = {
      id: user.id, // Supabase primary keys are usually 'id'
      name: name,
      phoneNo: phoneNo || '',
      email: user.email,
      role: role,
      bio: '',
      skills: [],
      createdAt: new Date().toISOString(),
    };

    // The public.users row will now be created automatically by a database trigger in Supabase!
    
    // We can still set the local state
    setUserProfile(profileData);
    setCurrentUserRole(role); 
    return data;
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async function logout() {
    setUserProfile(null);
    setCurrentUserRole(null);
    setCurrentUser(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (!session?.user) {
         setLoading(false);
      }
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (data && !error) {
          setUserProfile(data);
          setCurrentUserRole(data.role);
        } else {
          setUserProfile(null);
          setCurrentUserRole(null);
        }
      } else {
        setUserProfile(null);
        setCurrentUserRole(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    currentUserRole,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}