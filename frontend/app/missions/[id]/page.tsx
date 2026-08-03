'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Mission {
  id: string | number;
  titre: string;
  description: string;
  budget: number;
  statut: string;
  dateCreation: string;
  // Ajoutez d'autres champs si votre backend NestJS en retourne (ex: entreprise, competencesRequises, etc.)
  entreprise?: {
    nomEntreprise: string;
    secteurActivite?: string;
  };
}

export default function MissionDetailPage() {
  const router = useRouter();
  const { id } = useParams(); // Récupère l'ID depuis l'URL dynamique ([id])
  
  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role') || '';
    const nom = localStorage.getItem('nom') || '';
    
    if (!token) {
      router.push('/login');
      return;
    }

    setUserRole(role);
    setUserName(nom);
    fetchMissionDetails(token);
  }, [id]);

 const fetchMissionDetails = async (token: string) => {
  try {
    setIsLoading(true);
    const res = await fetch(`http://localhost:3000/missions/${id}`, {
      headers: { 
        'Authorization': `Bearer ${token}` 
      }
    });

    if (res.ok) {
      const data = await res.json();
      setMission(data);
    } else {
      // On récupère le message d'erreur renvoyé par NestJS si disponible
      const errorData = await res.json().catch(() => null);
      setError(`Erreur Backend (${res.status}) : ${errorData?.message || "Mission introuvable."}`);
    }
  } catch (err) {
    setError("Erreur de connexion avec le serveur.");
  } finally {
    setIsLoading(false);
  }
};

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-white text-[#061624]">
      {/* Navbar réutilisée pour la cohérence visuelle */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#0d6efd]/15 shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="w-10 h-10 bg-[#0d6efd] rounded-xl flex items-center justify-center font-black text-white text-xl shadow-md shadow-[#0d6efd]/20">
              M
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-[#0d6efd] leading-none">Marketplace</span>
              <span className="text-xs font-semibold text-[#0d6efd]/70 tracking-wider uppercase mt-1">Freelance</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userName && (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#0d6efd]/5 border border-[#0d6efd]/10 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0d6efd]/60 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0d6efd]"></span>
                </span>
                <span className="text-xs font-bold text-[#0d6efd]">
                  {userName} <span className="font-normal opacity-70">({userRole})</span>
                </span>
              </div>
            )}
            
            <button 
              onClick={() => router.push('/dashboard')}
              className="border border-[#0d6efd] text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200"
            >
              Retour aux missions
            </button>
          </div>
        </div>
      </nav>

      {/* Zone de contenu principale */}
      <main className="max-w-4xl mx-auto p-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-[#0d6efd] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-[#0d6efd]">Chargement de la mission...</p>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 text-red-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <h3 className="text-lg font-bold mb-1">Une erreur est survenue</h3>
            <p className="text-sm font-medium mb-4">{error}</p>
            <button onClick={() => router.push('/dashboard')} className="bg-[#061624] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#061624]/80">
              Retour au Dashboard
            </button>
          </div>
        )}

        {!isLoading && !error && mission && (
          <div className="bg-white rounded-2xl border border-[#0d6efd]/20 p-8 shadow-sm space-y-6">
            {/* En-tête de la Mission */}
            <div className="border-b border-gray-100 pb-6 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <span className="inline-block bg-[#0d6efd]/10 text-[#0d6efd] text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                  Mission active
                </span>
                <h1 className="text-3xl font-black text-[#061624] tracking-tight">{mission.titre}</h1>
                {mission.entreprise && (
                  <p className="text-sm text-gray-500 mt-1">
                    Proposé par <span className="font-semibold text-[#061624]">{mission.entreprise.nomEntreprise}</span>
                    {mission.entreprise.secteurActivite && ` • ${mission.entreprise.secteurActivite}`}
                  </p>
                )}
              </div>
              
              {/* Badge de Budget */}
              <div className="bg-[#061624] text-white p-4 rounded-xl text-center md:min-w-[150px]">
                <span className="block text-xs font-bold uppercase tracking-wider text-[#0d6efd]">Budget</span>
                <span className="text-2xl font-black">{mission.budget} €</span>
              </div>
            </div>

            {/* Description détaillée */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-[#061624] flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#0d6efd]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
                Description détaillée
              </h2>
              <div className="text-base text-gray-700 leading-relaxed bg-[#0d6efd]/5 p-6 rounded-xl border border-[#0d6efd]/10 whitespace-pre-wrap">
                {mission.description}
              </div>
            </div>

            {/* Informations complémentaires */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-sm">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-md text-[#0d6efd] shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 font-medium">Publiée le</span>
                  <span className="font-semibold text-[#061624]">
                    {new Date(mission.dateCreation).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-md text-[#0d6efd] shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 font-medium">Statut du projet</span>
                  <span className="font-semibold text-[#061624] capitalize">{mission.statut.toLowerCase()}</span>
                </div>
              </div>
            </div>

            {/* Section Actions de bas de page */}
            <div className="pt-6 flex justify-end gap-3">
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#061624] rounded-xl font-bold text-sm transition"
              >
                Retour
              </button>
              {userRole === 'FREELANCE' && (
                <button 
                  onClick={() => router.push(`/chat?mission=${mission.id}`)}
                  className="px-6 py-2.5 bg-[#0d6efd] hover:bg-[#0d6efd]/90 text-white rounded-xl font-bold text-sm transition shadow-md shadow-[#0d6efd]/20"
                >
                  Postuler / Contacter l'entreprise
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}