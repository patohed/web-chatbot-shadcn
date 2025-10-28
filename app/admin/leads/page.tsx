'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

/**
 * 📊 Panel de Administración de Leads - Estilo PmDevOps
 * 
 * Características:
 * - ✅ CRUD completo (Create, Read, Update, Delete)
 * - ✅ Diseño minimalista y limpio
 * - ✅ Paleta de colores: Negro + Violeta (#a855f7)
 * - ✅ Vista en tiempo real desde Supabase
 * - ✅ Auto-refresh cada 10 segundos
 * - ✅ Búsqueda en tiempo real
 * 
 * NOTA: Este es un componente dinámico (no se prerenderiza en build)
 * para evitar exponer las credenciales de Supabase durante el build.
 */

// Forzar renderizado dinámico (no prerender en build)
export const dynamic = 'force-dynamic';

interface Lead {
  id: string;
  created_at: string;
  nombre: string;
  email: string;
  telefono: string | null;
  proyecto: string;
  resumen_conversacion: string | null;
  conversacion: string[] | null;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [editedLead, setEditedLead] = useState<Lead | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // 🔒 Sistema de autenticación simple (temporal hasta implementar login completo)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Inicializar cliente de Supabase dentro del componente
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      console.error('[AdminPanel] ❌ Variables de entorno de Supabase no configuradas');
      return null;
    }
    
    return createClient(url, key);
  }, []);

  // Función para cargar leads
  const fetchLeads = async () => {
    if (!supabase) {
      setError('Variables de entorno de Supabase no configuradas');
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      console.log('[AdminPanel] 📥 Cargando leads desde Supabase...');
      
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[AdminPanel] ❌ Error:', fetchError);
        throw fetchError;
      }

      console.log('[AdminPanel] ✅ Leads cargados:', data?.length || 0);
      setLeads(data || []);
    } catch (err) {
      console.error('[AdminPanel] ❌ Error al cargar leads:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // CREATE - Crear nuevo lead
  const createLead = async (newLead: Omit<Lead, 'id' | 'created_at'>) => {
    if (!supabase) {
      setError('Variables de entorno de Supabase no configuradas');
      return false;
    }
    
    console.log('[AdminPanel] ➕ Creando nuevo lead...');
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([newLead])
        .select();

      if (error) {
        console.error('[AdminPanel] ❌ Error al crear lead:', error);
        throw error;
      }

      console.log('[AdminPanel] ✅ Lead creado:', data);
      await fetchLeads();
      setShowCreateForm(false);
      return true;
    } catch (err) {
      console.error('[AdminPanel] ❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Error al crear lead');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // UPDATE - Actualizar lead existente
  const updateLead = async (id: string, updates: Partial<Lead>) => {
    if (!supabase) {
      setError('Variables de entorno de Supabase no configuradas');
      return false;
    }
    
    console.log('[AdminPanel] ✏️ Actualizando lead:', id);
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('[AdminPanel] ❌ Error al actualizar:', error);
        throw error;
      }

      console.log('[AdminPanel] ✅ Lead actualizado exitosamente');
      await fetchLeads();
      setEditedLead(null);
      setSelectedLead(null);
      return true;
    } catch (err) {
      console.error('[AdminPanel] ❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar lead');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // DELETE - Eliminar lead
  const deleteLead = async (id: string) => {
    if (!supabase) {
      setError('Variables de entorno de Supabase no configuradas');
      return false;
    }
    
    console.log('[AdminPanel] 🗑️ Eliminando lead:', id);
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[AdminPanel] ❌ Error al eliminar:', error);
        throw error;
      }

      console.log('[AdminPanel] ✅ Lead eliminado exitosamente');
      await fetchLeads();
      setDeleteConfirm(null);
      setSelectedLead(null);
      return true;
    } catch (err) {
      console.error('[AdminPanel] ❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar lead');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 🔒 Verificar autenticación al cargar
  useEffect(() => {
    // Verificar si ya está autenticado en sessionStorage
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    } else {
      setLoading(false);
    }
  }, []);

  // Cargar leads al montar el componente (solo si está autenticado)
  useEffect(() => {
    if (isAuthenticated) {
      fetchLeads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // 🔒 Función para validar password
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Password temporal (cambiar por variable de entorno en producción)
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin2024';
    
    if (password === adminPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setAuthError('');
    } else {
      setAuthError('Contraseña incorrecta');
      setPassword('');
    }
  };

  // 🚪 Función para cerrar sesión
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setLeads([]);
  };

  // Auto-refresh cada 10 segundos
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return;

    const interval = setInterval(() => {
      console.log('[AdminPanel] 🔄 Auto-refresh activado');
      fetchLeads();
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  // Filtrar leads por búsqueda
  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.nombre.toLowerCase().includes(searchLower) ||
      lead.email.toLowerCase().includes(searchLower) ||
      lead.proyecto.toLowerCase().includes(searchLower)
    );
  });

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // 🔒 Pantalla de login si no está autenticado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-full max-w-md px-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-block p-3 bg-purple-600/20 rounded-lg mb-4">
                <svg
                  className="w-8 h-8 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Panel de Administración
              </h1>
              <p className="text-gray-400 text-sm">
                Acceso restringido solo para administradores
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  CONTRASEÑA
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa la contraseña"
                  className="w-full px-4 py-3 bg-black text-white rounded-lg border border-gray-800 focus:border-purple-500 focus:outline-none transition-colors"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="bg-red-950 border border-red-800 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{authError}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Ingresar
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-xs text-gray-600 text-center">
                🔒 Página protegida - Solo para administradores autorizados
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header minimalista */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Panel de Leads</h1>
              <p className="text-gray-400">
                Total: <span className="text-purple-400 font-semibold">{leads.length}</span>
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                + Nuevo Lead
              </button>
              
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-900 text-gray-500 hover:bg-gray-800'
                }`}
              >
                {autoRefresh ? '⏸' : '▶'} Auto-refresh
              </button>
              
              <button
                onClick={fetchLeads}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                ↻ Actualizar
              </button>
              
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-red-900 hover:bg-red-800 text-white rounded-lg text-sm font-medium transition-colors"
                title="Cerrar sesión"
              >
                🚪 Salir
              </button>
            </div>
          </div>

          {/* Barra de búsqueda minimalista */}
          <div className="mt-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email o proyecto..."
              className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-800 focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-950 border border-red-800 rounded-lg p-4">
            <p className="text-red-400">Error: {error}</p>
          </div>
        </div>
      )}

      {/* Lista de Leads - Diseño minimalista */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'No se encontraron leads' : 'No hay leads aún'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {lead.nombre}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                      <span>{lead.email}</span>
                      {lead.telefono && <span>· {lead.telefono}</span>}
                      <span>· {formatDate(lead.created_at)}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{lead.proyecto}</p>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditedLead(lead)}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm transition-colors"
                    >
                      Editar
                    </button>
                    
                    <button
                      onClick={() => setDeleteConfirm(lead.id)}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-red-900 text-gray-300 hover:text-red-400 rounded text-sm transition-colors"
                    >
                      Eliminar
                    </button>
                    
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles - Estilo minimalista */}
      {selectedLead && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Detalles del Lead
              </h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Información básica */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">NOMBRE</p>
                  <p className="text-white">{selectedLead.nombre}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 mb-1">EMAIL</p>
                  <p className="text-white">{selectedLead.email}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 mb-1">TELÉFONO</p>
                  <p className="text-white">
                    {selectedLead.telefono || 'No proporcionado'}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 mb-1">FECHA</p>
                  <p className="text-white">
                    {formatDate(selectedLead.created_at)}
                  </p>
                </div>
              </div>

              {/* Proyecto */}
              <div>
                <p className="text-xs text-gray-500 mb-2">PROYECTO</p>
                <p className="text-white">{selectedLead.proyecto}</p>
              </div>

              {/* Resumen de IA */}
              {selectedLead.resumen_conversacion && (
                <div className="border border-purple-900 bg-purple-950/30 rounded-lg p-4">
                  <p className="text-xs text-purple-400 mb-2 font-semibold">
                    RESUMEN GENERADO POR IA
                  </p>
                  <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">
                    {selectedLead.resumen_conversacion}
                  </pre>
                </div>
              )}

              {/* Conversación completa */}
              {selectedLead.conversacion && selectedLead.conversacion.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-3">
                    CONVERSACIÓN ({selectedLead.conversacion.length} mensajes)
                  </p>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {selectedLead.conversacion.map((mensaje, index) => {
                      const isClient = mensaje.startsWith('Cliente:');
                      const text = mensaje.replace(/^(Cliente:|Bot:)\s*/, '');
                      
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            isClient
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-purple-950/30 border-purple-900'
                          }`}
                        >
                          <p className="text-xs text-gray-500 mb-1">
                            {isClient ? 'Cliente' : 'Bot'}
                          </p>
                          <p className="text-white text-sm">{text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear Lead - Estilo minimalista */}
      {showCreateForm && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCreateForm(false)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Crear Nuevo Lead
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createLead({
                  nombre: formData.get('nombre') as string,
                  email: formData.get('email') as string,
                  telefono: formData.get('telefono') as string || null,
                  proyecto: formData.get('proyecto') as string,
                  resumen_conversacion: formData.get('resumen') as string || null,
                  conversacion: null,
                });
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  NOMBRE *
                </label>
                <input
                  type="text"
                  name="nombre"
                  required
                  className="w-full px-4 py-2.5 bg-black text-white rounded-lg border border-gray-800 focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="Nombre completo"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  EMAIL *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-2.5 bg-black text-white rounded-lg border border-gray-800 focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  TELÉFONO
                </label>
                <input
                  type="tel"
                  name="telefono"
                  className="w-full px-4 py-2.5 bg-black text-white rounded-lg border border-gray-800 focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="+54 11 1234-5678"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  PROYECTO *
                </label>
                <textarea
                  name="proyecto"
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 bg-black text-white rounded-lg border border-gray-800 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                  placeholder="Descripción del proyecto..."
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  RESUMEN (OPCIONAL)
                </label>
                <textarea
                  name="resumen"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-black text-white rounded-lg border border-gray-800 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                  placeholder="Resumen de la conversación..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Crear Lead
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Editar Lead - Estilo minimalista */}
      {editedLead && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={() => setEditedLead(null)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Editar Lead
              </h2>
              <button
                onClick={() => setEditedLead(null)}
                className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateLead(editedLead.id, {
                  nombre: formData.get('nombre') as string,
                  email: formData.get('email') as string,
                  telefono: formData.get('telefono') as string || null,
                  proyecto: formData.get('proyecto') as string,
                  resumen_conversacion: formData.get('resumen') as string || null,
                });
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  NOMBRE *
                </label>
                <input
                  type="text"
                  name="nombre"
                  required
                  defaultValue={editedLead.nombre}
                  className="w-full px-4 py-2.5 bg-black text-white rounded-lg border border-gray-800 focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  EMAIL *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={editedLead.email}
                  className="w-full px-4 py-2.5 bg-black text-white rounded-lg border border-gray-800 focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  TELÉFONO
                </label>
                <input
                  type="tel"
                  name="telefono"
                  defaultValue={editedLead.telefono || ''}
                  className="w-full px-4 py-2.5 bg-black text-white rounded-lg border border-gray-800 focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  PROYECTO *
                </label>
                <textarea
                  name="proyecto"
                  required
                  rows={3}
                  defaultValue={editedLead.proyecto}
                  className="w-full px-4 py-2.5 bg-black text-white rounded-lg border border-gray-800 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  RESUMEN
                </label>
                <textarea
                  name="resumen"
                  rows={2}
                  defaultValue={editedLead.resumen_conversacion || ''}
                  className="w-full px-4 py-2.5 bg-black text-white rounded-lg border border-gray-800 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => setEditedLead(null)}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmar Eliminación - Estilo minimalista */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white">
                Confirmar Eliminación
              </h2>
            </div>

            <div className="p-6">
              <p className="text-gray-300 mb-6">
                ¿Estás seguro de que deseas eliminar este lead? Esta acción no se puede deshacer.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => deleteLead(deleteConfirm)}
                  className="flex-1 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
