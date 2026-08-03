'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({ email: '', motDePasse: '' });
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    setSucces('');

    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', data.role || data.user?.role || '');
        localStorage.setItem('nom', data.nom || data.user?.nom || '');

        // Extraction multi-sources de l'ID utilisateur + secours JWT
        let extractedId =
          data.id ||
          data.userId ||
          data.sub ||
          (data.user && data.user.id);

        if (!extractedId && data.access_token) {
          try {
            const base64Url = data.access_token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            extractedId = payload.id || payload.sub || payload.userId;
          } catch (e) {
            // Ignorer les erreurs de décodage
          }
        }

        localStorage.setItem('userId', String(extractedId || ''));

        setSucces(
          `Ravi de vous revoir ${data.nom || data.user?.nom || ''} ! Connexion réussie.`
        );

        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setErreur(data.message || 'Email ou mot de passe incorrect.');
      }
    } catch (err) {
      setErreur('Impossible de contacter le serveur backend.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0d6efd]">
      {/* Navbar Modernisée */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#0d6efd]/15 shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0d6efd] rounded-xl flex items-center justify-center font-black text-white text-xl shadow-md shadow-[#0d6efd]/20 hover:scale-105 transition-transform duration-200">
              M
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-[#0d6efd] leading-none">
                Marketplace
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[#061624]/5 p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white p-8 rounded-lg shadow-md text-[#061624] border border-[#0d6efd]/20"
        >
          <h2 className="text-2xl font-bold mb-6 text-center text-[#061624]">
            Connexion
          </h2>

          {erreur && (
            <p className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm text-center font-semibold">
              {erreur}
            </p>
          )}
          {succes && (
            <p className="bg-green-100 text-green-600 p-2 rounded mb-4 text-sm text-center font-semibold">
              {succes}
            </p>
          )}

          <div className="mb-4">
            <label className="block text-[#061624] text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-[#0d6efd]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d6efd] bg-white text-[#061624]"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="mb-6">
            <label className="block text-[#061624] text-sm font-bold mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-[#0d6efd]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d6efd] bg-white text-[#061624]"
              onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#0d6efd] text-white py-2 rounded-md hover:bg-[#061624] font-bold transition"
          >
            Se connecter
          </button>

          <p className="mt-4 text-sm text-center text-[#061624]/75">
            Pas encore de compte ?{' '}
            <a
              href="/registrer"
              className="text-[#0d6efd] hover:underline font-semibold"
            >
              S'inscrire
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}