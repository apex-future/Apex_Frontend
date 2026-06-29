import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkHealth } from '../services/api';
import { ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';

export default function Login() {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await checkHealth(secret);
      localStorage.setItem('adminSecret', secret);
      navigate('/overview');
    } catch (err) {
      console.error('Login error:', err);
      if (err.message === 'Forbidden') {
        setError('Invalid Admin Secret. Access Denied.');
      } else {
        setError(`Network Error: ${err.message}. It might be a CORS issue. Check the browser console.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-blue-500/10 p-4">
            <ShieldCheck className="w-12 h-12 text-blue-500" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Apex Admin
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Enter the master secret to access the dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-900 py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-gray-800">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="secret" className="block text-sm font-medium text-gray-300">
                Admin Secret
              </label>
              <div className="mt-1">
                <input
                  id="secret"
                  name="secret"
                  type="password"
                  required
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 bg-gray-800 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter X-Admin-Secret"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-md border border-red-400/20">
                <ShieldAlert className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || !secret}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authenticate'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
