// src/app/layout.js
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'AeroApp - Vuelos',
  description: 'Proyecto académico de aerolínea',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900">
        {/* Envolvemos toda la app en el AuthProvider */}
        <AuthProvider>
          <Navbar />
          <main className="max-w-6xl mx-auto p-4 mt-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}