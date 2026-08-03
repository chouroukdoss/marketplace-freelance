'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'FREELANCE' | 'ENTREPRISE'>('FREELANCE');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    motDePasse: '',
    // Champs spécifiques Entreprise
    nomEntreprise: '',
    description: '',
    matriculeFiscal: '',
    registreCommerce: '',
    adresseSiege: '',
    telephonePro: '',
    siteWeb: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        router.push('/login');
      } else {
        setMessage(data.message || "Erreur lors de l'inscription.");
      }
    } catch (err) {
      setMessage('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0d6efd] flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-[#0d6efd]/30 shadow-lg max-w-lg w-full space-y-4">
        <h2 className="text-2xl font-black text-[#0d6efd] text-center">Créer un compte</h2>
        
        {message && <p className="text-sm text-red-500 font-bold text-center">{message}</p>}

        {/* Choix du Rôle */}
        <div>
          <label className="block text-xs font-bold uppercase mb-1">Je suis un :</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'FREELANCE' | 'ENTREPRISE')}
            className="w-full p-2.5 border border-[#0d6efd] rounded-md bg-white text-[#0d6efd] font-bold focus:outline-none"
          >
            <option value="FREELANCE">Freelance (Prestataire)</option>
            <option value="ENTREPRISE">Entreprise (Recruteur)</option>
          </select>
        </div>

        {/* Champs Communs */}
        <div>
          <label className="block text-xs font-bold uppercase mb-1">Nom complet / Responsable</label>
          <input
            type="text"
            name="nom"
            required
            className="w-full p-2.5 border border-[#0d6efd] rounded-md focus:outline-none bg-white"
            value={formData.nom}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase mb-1">Adresse E-mail</label>
          <input
            type="email"
            name="email"
            required
            className="w-full p-2.5 border border-[#0d6efd] rounded-md focus:outline-none bg-white"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase mb-1">Mot de passe</label>
          <input
            type="password"
            name="motDePasse"
            required
            className="w-full p-2.5 border border-[#0d6efd] rounded-md focus:outline-none bg-white"
            value={formData.motDePasse}
            onChange={handleChange}
          />
        </div>

        {/* SECTION SPÉCIFIQUE ENTREPRISE */}
        {role === 'ENTREPRISE' && (
          <div className="pt-4 border-t border-[#0d6efd]/20 space-y-4">
            <h3 className="text-sm font-black text-[#0d6efd] uppercase tracking-wider">
              Vérification & Coordonnées de la société
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">Raison sociale / Nom de la société *</label>
              <input
                type="text"
                name="nomEntreprise"
                required
                placeholder="Ex: Tech Solutions SARL"
                className="w-full p-2.5 border border-[#0d6efd] rounded-md focus:outline-none bg-white"
                value={formData.nomEntreprise}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Matricule Fiscal / SIRET *</label>
                <input
                  type="text"
                  name="matriculeFiscal"
                  required
                  placeholder="Ex: 1234567/A/M/000"
                  className="w-full p-2.5 border border-[#0d6efd] rounded-md focus:outline-none bg-white"
                  value={formData.matriculeFiscal}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">N° Registre Commerce</label>
                <input
                  type="text"
                  name="registreCommerce"
                  placeholder="Ex: RNE / RCS 98765"
                  className="w-full p-2.5 border border-[#0d6efd] rounded-md focus:outline-none bg-white"
                  value={formData.registreCommerce}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">Adresse du siège social *</label>
              <input
                type="text"
                name="adresseSiege"
                required
                placeholder="Ex: Avenue Habib Bourguiba, Tunis"
                className="w-full p-2.5 border border-[#0d6efd] rounded-md focus:outline-none bg-white"
                value={formData.adresseSiege}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Téléphone Pro *</label>
                <input
                  type="tel"
                  name="telephonePro"
                  required
                  placeholder="Ex: +216 71 000 000"
                  className="w-full p-2.5 border border-[#0d6efd] rounded-md focus:outline-none bg-white"
                  value={formData.telephonePro}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Site Web officiel</label>
                <input
                  type="url"
                  name="siteWeb"
                  placeholder="https://maboite.com"
                  className="w-full p-2.5 border border-[#0d6efd] rounded-md focus:outline-none bg-white"
                  value={formData.siteWeb}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0d6efd] text-white py-3 rounded-md font-bold hover:bg-[#0d6efd]/90 transition"
        >
          {loading ? "S'inscrire..." : "Créer mon compte"}
        </button>
      </form>
    </div>
  );
}