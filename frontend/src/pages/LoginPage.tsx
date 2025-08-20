import React, { useState } from 'react';
import { useAuction } from '../context/AuctionContext';
import { authService } from '../services/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { dispatch } = useAuction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 Intentando login con email:', email);
      const response = await authService.login(email);
      console.log('📦 Respuesta de login:', response);
      
      if (response.success && response.data) {
        console.log('✅ Login exitoso, usuario:', response.data);
        dispatch({ type: 'SET_USUARIO', payload: response.data });
      } else {
        console.log('❌ Error en login:', response.error);
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Error al iniciar sesión' });
      }
    } catch (error) {
      console.error('❌ Error de conexión en login:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏆 Subasta App</h1>
          <p className="text-gray-600">Inicia sesión para participar en la subasta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="tu@email.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Para pruebas, usa cualquier email válido
          </p>
        </div>
      </div>
    </div>
  );
}
