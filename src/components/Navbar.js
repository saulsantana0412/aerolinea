// src/components/Navbar.js
"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation'; // 1. Importar el router

export default function Navbar() {
  const { user, rol, logout } = useAuth(); // ¡Magia! Traemos los datos de la nube
  const router = useRouter(); // 2. Inicializar el router

  const handleLogout = async () => {
    await logout();
    router.push('/'); // Redirigir al inicio después de cerrar sesión
  };

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">AeroApp ✈️</Link>
        
        <div className="space-x-6 flex items-center">
          <Link href="/" className="hover:text-blue-200 transition">Inicio</Link>
          <Link href="/vuelos" className="hover:text-blue-200 transition">Vuelos</Link>
          {/* Solo mostramos Gestión de Vuelos si es Admin (rol 1) */}
          {rol === 1 && (
            <Link href="/admin/vuelos" className="hover:text-blue-200 transition bg-blue-800 px-3 py-1 rounded">
              Control Vuelos
            </Link>
          )}

          {/* Renderizado condicional del botón de Login / Logout */}
          {user ? (
            <button 
              onClick={handleLogout} 
              className="hover:text-red-300 font-medium transition"
            >
              Cerrar Sesión
            </button>
          ) : (
            <Link href="/login" className="bg-white text-blue-600 px-4 py-1.5 rounded font-bold hover:bg-gray-100 transition">
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}