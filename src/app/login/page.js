"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e) => {
  e.preventDefault();
  setLoading(true);

  console.log("hola x1");

  try {
    if (isRegistering) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      console.log("signUp result:", data, error);

      if (error) {
        alert(error.message);
      } else {
        alert("¡Registro exitoso! Revisa tu correo de confirmación.");
      }
    } else {
      console.log("hola x2");

      const result = await supabase.auth.signInWithPassword({ email, password });
      console.log("signIn result:", result);

      if (result.error) {
        alert(result.error.message);
      } else {
        console.log("hola x3");
        const user = result.data.user;

        // Redirigir según el rol
        const { data: perfil, error: perfilError } = await supabase
          .from('usuarios')
          .select('rol_id')
          .eq('id', user.id)
          .single();

        if (perfilError) {
          console.error("Error perfil:", perfilError);
          alert(perfilError.message);
        } else {
          console.log("perfil:", perfil);
          if (perfil?.rol_id === 1) router.push('/vuelos');
          else router.push('/');
        }
      }
    }
  } catch (err) {
    console.error("Error inesperado:", err);
    alert("Error inesperado: " + err.message);
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">
          {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h1>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 border-gray-100" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition">
            {loading ? 'Cargando...' : isRegistering ? 'Registrarse' : 'Entrar'}
          </button>
        </form>

        <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-4 text-sm text-blue-500 hover:underline">
          {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate gratis'}
        </button>
      </div>
    </div>
  );
}