// src/context/AuthContext.js
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Creamos el contexto
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Revisar si ya hay una sesión activa al cargar la página
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) await obtenerRol(session.user.id);
      else setLoading(false);
    };
    
    fetchSession();

    // 2. Escuchar cambios EN TIEMPO REAL (cuando haces login o logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        obtenerRol(session.user.id);
      } else {
        setRol(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Buscar si es Admin (1) o Cliente (2)
  const obtenerRol = async (userId) => {
    const { data } = await supabase.from('usuarios').select('rol_id').eq('id', userId).single();
    setRol(data?.rol_id);
    setLoading(false);
  };

  // Función global para cerrar sesión
  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, rol, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar este contexto fácilmente en cualquier archivo
export const useAuth = () => useContext(AuthContext);