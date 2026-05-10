// src/app/vuelos/page.js
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const ESTADOS_VUELO = { 'P': 'Programado', 'E': 'En Vuelo', 'F': 'Finalizado', 'C': 'Cancelado' };

export default function BusquedaVuelosPublica() {
  const [vuelos, setVuelos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVuelos = async () => {
      // Aquí en el futuro agregaremos los filtros (origen, destino, fecha)
      const { data } = await supabase
        .from('v_busqueda_vuelos')
        .select('*')
        .eq('estado', 'P') // Solo mostrar vuelos Programados al público
        .order('fecha_salida', { ascending: true });
        
      if (data) setVuelos(data);
      setLoading(false);
    };
    
    fetchVuelos();
  }, []);

  if (loading) return <p className="text-center mt-10">Buscando vuelos disponibles...</p>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Descubre tu próximo destino</h1>
      
      {/* Próximamente: Aquí irá el componente de Filtros de Búsqueda */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {vuelos.map((vuelo) => (
          <div key={vuelo.vuelo_id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition">
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">{vuelo.numero_vuelo}</span>
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{vuelo.avion_modelo}</span>
              </div>
              <p className="text-2xl font-black text-green-600">${vuelo.precio_base}</p>
            </div>

            <div className="flex items-center justify-between gap-3 text-gray-800 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{vuelo.origen_iata}</p>
                <p className="text-xs text-gray-500">{vuelo.origen_ciudad}</p>
                <p className="text-xs font-medium text-blue-600 mt-1">{new Date(vuelo.fecha_salida).toLocaleDateString()} {new Date(vuelo.fecha_salida).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
              
              <div className="flex-1 flex flex-col items-center">
                <span className="text-gray-300 text-2xl">✈️</span>
                <span className="text-[10px] text-gray-400 mt-1 uppercase">Directo - {vuelo.duracion_minutos} min</span>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold">{vuelo.destino_iata}</p>
                <p className="text-xs text-gray-500">{vuelo.destino_ciudad}</p>
                <p className="text-xs font-medium text-blue-600 mt-1">{new Date(vuelo.fecha_llegada).toLocaleDateString()} {new Date(vuelo.fecha_llegada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 border-t pt-4 mt-auto">
              {/* <Link href={`/reservar/${vuelo.vuelo_id}`} className="w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-bold">
                Seleccionar Asientos
              </Link> */}
              <Link href={`/vuelos`} className="w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-bold">
                Seleccionar Asientos
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}