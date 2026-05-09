import './globals.css'
    import Link from 'next/link'

    export const metadata = {
      title: 'AeroApp - Vuelos',
      description: 'Proyecto académico de aerolínea',
    }

    export default function RootLayout({ children }) {
      return (
        <html lang="es">
          <body className="bg-gray-50 text-gray-900">
            
            <nav className="bg-blue-600 text-white p-4 shadow-md">
              <div className="max-w-6xl mx-auto flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold">Aerolinea</Link>
                <div className="space-x-6">
                  <Link href="/" className="hover:text-blue-200">Inicio</Link>
                  <Link href="/vuelos" className="hover:text-blue-200">Buscar Vuelos</Link>
                  <Link href="/mis-reservas" className="hover:text-blue-200">Mis Reservas</Link>
                </div>
              </div>
            </nav>

            
            <main className="max-w-6xl mx-auto p-4 mt-8">
              {children}
            </main>
          </body>
        </html>
      )
    }