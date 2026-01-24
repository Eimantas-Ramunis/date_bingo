import { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/login', { username, password });
      navigate('/admin');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-serif font-bold text-center">Admin Login</h1>
        {error && <div className="bg-red-50 text-red-600 p-2 text-sm rounded">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-stone-700">Username</label>
          <input 
            className="w-full p-2 border rounded mt-1"
            value={username} onChange={e => setUsername(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Password</label>
          <input 
            type="password" className="w-full p-2 border rounded mt-1"
            value={password} onChange={e => setPassword(e.target.value)} 
          />
        </div>
        <button className="w-full bg-stone-800 text-white py-2 rounded hover:bg-stone-700">
          Login
        </button>
      </form>
    </div>
  );
}
