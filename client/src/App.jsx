import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ReceiverView from './pages/ReceiverView';
import { useState, useEffect } from 'react';
import api from './api';

function RequireAuth({ children }) {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setAuth(res.data.loggedIn))
      .catch(() => setAuth(false));
  }, []);

  if (auth === null) return <div className="p-10 text-center">Loading...</div>;
  if (auth === false) return <Navigate to="/login" />;
  return children;
}

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-stone-950 text-stone-600 dark:text-stone-300 p-4 text-center">
      <div className="max-w-md bg-white dark:bg-stone-900 p-8 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700">
        <h1 className="text-xl font-serif font-bold text-stone-800 dark:text-stone-100 mb-2">DateBingo</h1>
        <p className="italic mb-6">"Viskas gerai — nuorodą gausi iš Eimanto."</p>
        <p className="text-xs text-stone-400 dark:text-stone-500">Waiting for a valid link...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/*" element={
          <RequireAuth>
            <AdminDashboard />
          </RequireAuth>
        } />
        <Route path="/r" element={<ReceiverView />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
