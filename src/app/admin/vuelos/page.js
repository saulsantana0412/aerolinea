"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const ESTADOS_VUELO = {
  'P': 'Programado',
  'E': 'En Vuelo',
  'F': 'Finalizado',
  'C': 'Cancelado'
};

export default function AdminVuelos() {
  const { rol, loading: authLoading } = useAuth();
  const router = useRouter();

  const [vuelos, setVuelos] = useState([]);
  const [aeropuertos, setAeropuertos] = useState([]);
  const [aviones, setAviones] = useState([]);
  
  const [vueloEditando, setVueloEditando] = useState(null);
  
  // CORRECCIÓN: Quitamos numero_vuelo y fecha_llegada. Añadimos duracion_minutos
  const [formData, setFormData] = useState({ 
    origen_id: '', 
    destino_id: '', 
    avion_id: '', 
    fecha_salida: '', 
    duracion_minutos: '', 
    precio_base: '' 
  });

  const fetchData = async () => {
    const { data: vuelosData } = await supabase
      .from('v_busqueda_vuelos')
      .select('*')
      .order('fecha_salida', { ascending: true });
    if (vuelosData) setVuelos(vuelosData);

    const { data: aeropuertosData } = await supabase.from('aeropuertos').select('id, codigo_iata, nombre');
    if (aeropuertosData) setAeropuertos(aeropuertosData);

    const { data: avionesData } = await supabase.from('aviones').select('id, matricula, modelo');
    if (avionesData) setAviones(avionesData);
  };

  useEffect(() => {
    if (!authLoading) {
      if (rol !== 1) router.push('/'); 
      else fetchData(); 
    }
  }, [rol, authLoading, router]);

  // CORRECCIÓN: El payload ahora envía duracion_minutos en lugar de fechas calculadas a mano
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      origen_id: formData.origen_id,
      destino_id: formData.destino_id,
      avion_id: formData.avion_id,
      fecha_salida: new Date(formData.fecha_salida).toISOString(),
      duracion_minutos: Number(formData.duracion_minutos),
      precio_base: Number(formData.precio_base),
    };

    if (vueloEditando) {
      await supabase.from('vuelos').update(payload).eq('id', vueloEditando);
    } else {
      await supabase.from('vuelos').insert([payload]);
    }

    cancelarEdicion();
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres borrar este vuelo?")) return;
    await supabase.from('vuelos').delete().eq('id', id);
    fetchData();
  };

  const handleEdit = async (vueloId) => {
    const { data: vueloReal } = await supabase.from('vuelos').select('*').eq('id', vueloId).single();
    
    if (vueloReal) {
      const formatFecha = (isoString) => new Date(isoString).toISOString().slice(0, 16);

      setFormData({ 
        origen_id: vueloReal.origen_id, 
        destino_id: vueloReal.destino_id, 
        avion_id: vueloReal.avion_id, 
        fecha_salida: formatFecha(vueloReal.fecha_salida), 
        duracion_minutos: vueloReal.duracion_minutos || '', // Cargamos la duración real
        precio_base: vueloReal.precio_base 
      });
      setVueloEditando(vueloId);
    }
  };

  const cancelarEdicion = () => {
    setFormData({ origen_id: '', destino_id: '', avion_id: '', fecha_salida: '', duracion_minutos: '', precio_base: '' });
    setVueloEditando(null);
  };

  // Barreras de seguridad
  if (authLoading) return <div className="h-64 flex items-center justify-center"><p className="animate-pulse">Verificando credenciales...</p></div>;
  if (rol !== 1) return null;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Panel de Administración de Vuelos</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-6 text-blue-600">
          {vueloEditando ? '✏️ Editar Vuelo' : '➕ Registrar Nuevo Vuelo'}
        </h2>
        
        {/* CORRECCIÓN: Formulario actualizado sin Nº Vuelo y con Duración */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
            <select required value={formData.origen_id} onChange={(e) => setFormData({...formData, origen_id: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecciona un origen...</option>
              {aeropuertos.map(a => <option key={a.id} value={a.id}>{a.codigo_iata} - {a.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
            <select required value={formData.destino_id} onChange={(e) => setFormData({...formData, destino_id: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecciona un destino...</option>
              {aeropuertos.map(a => <option key={a.id} value={a.id}>{a.codigo_iata} - {a.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Avión Asignado</label>
            <select required value={formData.avion_id} onChange={(e) => setFormData({...formData, avion_id: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecciona el avión...</option>
              {aviones.map(a => <option key={a.id} value={a.id}>{a.matricula} ({a.modelo})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salida</label>
            <input type="datetime-local" required value={formData.fecha_salida} onChange={(e) => setFormData({...formData, fecha_salida: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duración (minutos)</label>
            <input type="number" required value={formData.duracion_minutos} onChange={(e) => setFormData({...formData, duracion_minutos: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. 120" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Base (USD)</label>
            <input type="number" required value={formData.precio_base} onChange={(e) => setFormData({...formData, precio_base: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
          </div>

          <div className="md:col-span-3 flex gap-2 justify-end mt-4">
            {vueloEditando && (
              <button type="button" onClick={cancelarEdicion} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">Cancelar</button>
            )}
            <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition">
              {vueloEditando ? 'Guardar Cambios' : 'Agregar Vuelo'}
            </button>
          </div>
        </form>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-gray-800">Vuelos Programados</h2>
      {/* ... (Aquí va tu grid exacto de tarjetas de vuelos con los botones de Editar/Eliminar) ... */}
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
                <span className="text-[10px] text-gray-400 mt-1 uppercase">
                  {ESTADOS_VUELO[vuelo.estado]} ({vuelo.duracion_minutos} min)
                </span>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold">{vuelo.destino_iata}</p>
                <p className="text-xs text-gray-500">{vuelo.destino_ciudad}</p>
                <p className="text-xs font-medium text-blue-600 mt-1">{new Date(vuelo.fecha_llegada).toLocaleDateString()} {new Date(vuelo.fecha_llegada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 border-t pt-3 mt-auto">
              <button onClick={() => handleEdit(vuelo.vuelo_id)} className="text-sm bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 transition font-medium">Editar</button>
              <button onClick={() => handleDelete(vuelo.vuelo_id)} className="text-sm bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition font-medium">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}