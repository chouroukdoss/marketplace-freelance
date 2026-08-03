'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilPage() {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  
  // États spécifiques au profil Freelance
  const [freelanceData, setFreelanceData] = useState({
    titreProfessionnel: '',
    competences: '',
    cvUrl: '',
    portfolioUrl: '',
    noteMoyenne: 0
  });

  // États spécifiques au profil Entreprise
  const [entrepriseData, setEntrepriseData] = useState({
    nomEntreprise: '',
    secteurActivite: '',
    siteWeb: '',
    description: ''
  });

  // Nouveaux états pour la soumission d'une note (Pour les Entreprises)
  const [targetFreelanceId, setTargetFreelanceId] = useState('');
  const [noteSaisie, setNoteSaisie] = useState(5);
  const [commentaireSaisi, setCommentaireSaisi] = useState('');
  const [avisMessage, setAvisMessage] = useState('');
  const [isSendingAvis, setIsSendingAvis] = useState(false);

  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role') || '';
    const storedNom = localStorage.getItem('nom') || '';
    const storedEmail = localStorage.getItem('email') || '';

    if (!token) {
      router.push('/login');
      return;
    }

    setRole(userRole);
    if (storedNom) setNom(storedNom);
    if (storedEmail) setEmail(storedEmail);

    fetchProfilData(token, userRole);
  }, []);

  // Récupérer les données actuelles depuis le backend
  const fetchProfilData = async (token: string, userRole: string) => {
    try {
      const res = await fetch('http://localhost:3000/profils/moi', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        
        // Extraction robuste du nom et de l'email
        const currentNom = data.utilisateur?.nom || data.user?.nom || data.nom || localStorage.getItem('nom') || '';
        const currentEmail = data.utilisateur?.email || data.user?.email || data.email || localStorage.getItem('email') || '';

        if (currentNom) setNom(currentNom);
        if (currentEmail) setEmail(currentEmail);
        
        if (userRole === 'FREELANCE') {
          setFreelanceData({
            titreProfessionnel: data.titreProfessionnel || '',
            competences: data.competences || '',
            cvUrl: data.cvUrl || '',
            portfolioUrl: data.portfolioUrl || '',
            noteMoyenne: data.noteMoyenne || 0
          });
        } else if (userRole === 'ENTREPRISE') {
          setEntrepriseData({
            nomEntreprise: data.nomEntreprise || currentNom,
            secteurActivite: data.secteurActivite || '',
            siteWeb: data.siteWeb || '',
            description: data.description || ''
          });
        }
      }
    } catch (err) {
      console.error("Erreur lors de la récupération du profil", err);
    }
  };

  // Enregistrer les modifications du profil
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    const token = localStorage.getItem('token');
    
    const url = role === 'FREELANCE' 
      ? 'http://localhost:3000/profils/freelance' 
      : 'http://localhost:3000/profils/entreprise';
      
    const bodyData = role === 'FREELANCE' ? freelanceData : {
      ...entrepriseData,
      nomEntreprise: entrepriseData.nomEntreprise || nom
    };

    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        setMessage('Profil mis à jour avec succès !');
        if (role === 'ENTREPRISE' && entrepriseData.nomEntreprise) {
          localStorage.setItem('nom', entrepriseData.nomEntreprise);
          setNom(entrepriseData.nomEntreprise);
        }
      } else {
        setMessage('Une erreur est survenue lors de l\'enregistrement.');
      }
    } catch (err) {
      setMessage('Impossible de joindre le serveur.');
    } finally {
      setIsSaving(false);
    }
  };

  // Soumettre l'avis et la note au backend NestJS
  const handleSendAvis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFreelanceId) {
      setAvisMessage("Veuillez renseigner l'ID du freelance.");
      return;
    }

    setIsSendingAvis(true);
    setAvisMessage('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://localhost:3000/profils/freelance/${targetFreelanceId}/avis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          note: Number(noteSaisie),
          commentaire: commentaireSaisi
        })
      });

      const data = await res.json();

      if (res.ok) {
        setAvisMessage('Avis et note attribués avec succès !');
        setTargetFreelanceId('');
        setCommentaireSaisi('');
        setNoteSaisie(5);
      } else {
        setAvisMessage(data.message || "Erreur lors de la validation de la note.");
      }
    } catch (err) {
      setAvisMessage("Impossible de transmettre la note au serveur.");
    } finally {
      setIsSendingAvis(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-white text-[#061624]">
      {/* Navbar Modernisée */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#0d6efd]/15 shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo & Identité */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="w-10 h-10 bg-[#0d6efd] rounded-xl flex items-center justify-center font-black text-white text-xl shadow-md shadow-[#0d6efd]/20 hover:scale-105 transition-transform duration-200">
              M
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-[#0d6efd] leading-none">
                Marketplace
              </span>
              <span className="text-xs font-semibold text-[#0d6efd]/70 tracking-wider uppercase mt-1">
                Freelance
              </span>
            </div>
          </div>

          {/* Profil & Actions de Navigation */}
          <div className="flex items-center gap-4">
            {/* Badge Utilisateur */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#0d6efd]/5 border border-[#0d6efd]/10 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0d6efd]/60 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0d6efd]"></span>
              </span>
              <span className="text-xs font-bold text-[#0d6efd]">
                {nom} <span className="font-normal opacity-70">({role})</span>
              </span>
            </div>

            {/* Boutons d'Action */}
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => router.push('/chat')}
                className="flex items-center gap-2 bg-[#0d6efd] text-white px-4 py-2 rounded-lg text-xs font-extrabold hover:bg-[#0d6efd]/90 hover:shadow-md hover:shadow-[#0d6efd]/10 active:scale-95 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-1.074-.765 5.99 5.99 0 0 1 1.01-3.207C4.12 15.68 3 13.977 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
                <span className="hidden sm:inline">Messagerie</span>
              </button>

              <button 
                onClick={() => router.push('/profil')} 
                className="flex items-center gap-1.5 border-2 border-[#0d6efd] text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-extrabold active:scale-95 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <span className="hidden sm:inline">Mon Profil</span>
              </button>

              <button 
                onClick={handleLogout} 
                className="flex items-center gap-1.5 bg-[#0d6efd]/10 text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-extrabold active:scale-95 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-[#0d6efd]/30">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#061624]">Gestion de votre Profil</h1>
          </div>

          {message && (
            <p className={`mb-6 p-3 rounded-md text-sm font-semibold text-center bg-white border ${message.includes('succès') ? 'border-[#0d6efd] text-[#0d6efd]' : 'border-[#061624] text-[#061624]'}`}>
              {message}
            </p>
          )}

          {/* Informations de base (Conforme au design) */}
          <div className="bg-[#061624] text-white p-4 rounded-md mb-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="block font-bold text-[#0d6efd] uppercase text-xs">Nom d'utilisateur</span>
              <span className="text-base font-semibold text-white mt-1 block">
                {nom || 'Non renseigné'}
              </span>
            </div>
            <div>
              <span className="block font-bold text-[#0d6efd] uppercase text-xs">Adresse Email</span>
              <span className="text-base font-semibold text-white mt-1 block">
                {email || 'Non renseignée'}
              </span>
            </div>
            {role === 'FREELANCE' && (
              <div className="col-span-2 pt-2 border-t border-[#0d6efd]/30 flex items-center gap-2 mt-2">
                <span className="font-bold text-[#0d6efd] text-xs uppercase">Évaluation globale :</span>
                <span className="bg-[#0d6efd] text-white px-2 py-0.5 rounded text-xs font-bold">
                  {freelanceData.noteMoyenne} / 5
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* FORMULAIRE UNIQUE : FREELANCE */}
            {role === 'FREELANCE' && (
              <>
                <div>
                  <label className="block text-sm font-bold mb-1 text-[#061624]">Titre Professionnel</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Développeur Fullstack React / Node"
                    className="w-full px-3 py-2 border border-[#0d6efd] rounded-md bg-white text-[#061624] focus:outline-none focus:ring-1 focus:ring-[#0d6efd] placeholder-[#0d6efd]/50"
                    value={freelanceData.titreProfessionnel}
                    onChange={e => setFreelanceData({...freelanceData, titreProfessionnel: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-[#061624]">Vos Compétences (Séparées par des virgules)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: React, NestJS, TypeScript, MySQL"
                    className="w-full px-3 py-2 border border-[#0d6efd] rounded-md bg-white text-[#061624] focus:outline-none focus:ring-1 focus:ring-[#0d6efd] placeholder-[#0d6efd]/50"
                    value={freelanceData.competences}
                    onChange={e => setFreelanceData({...freelanceData, competences: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1 text-[#061624]">Lien du Portfolio (URL)</label>
                    <input 
                      type="url" 
                      placeholder="https://monportfolio.com"
                      className="w-full px-3 py-2 border border-[#0d6efd] rounded-md bg-white text-[#061624] focus:outline-none focus:ring-1 focus:ring-[#0d6efd] placeholder-[#0d6efd]/50"
                      value={freelanceData.portfolioUrl}
                      onChange={e => setFreelanceData({...freelanceData, portfolioUrl: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1 text-[#061624]">Lien du CV en ligne (URL)</label>
                    <input 
                      type="url" 
                      placeholder="https://drive.com/mon-cv.pdf"
                      className="w-full px-3 py-2 border border-[#0d6efd] rounded-md bg-white text-[#061624] focus:outline-none focus:ring-1 focus:ring-[#0d6efd] placeholder-[#0d6efd]/50"
                      value={freelanceData.cvUrl}
                      onChange={e => setFreelanceData({...freelanceData, cvUrl: e.target.value})}
                    />
                  </div>
                </div>
              </>
            )}

            {/* FORMULAIRE UNIQUE : ENTREPRISE */}
            {role === 'ENTREPRISE' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-1 text-[#061624]">Nom de l'Entreprise</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-3 py-2 border border-[#0d6efd] rounded-md bg-white text-[#061624] focus:outline-none focus:ring-1 focus:ring-[#0d6efd]"
                      value={entrepriseData.nomEntreprise}
                      onChange={e => setEntrepriseData({...entrepriseData, nomEntreprise: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1 text-[#061624]">Secteur d'Activité</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Tech, Marketing, E-commerce"
                      className="w-full px-3 py-2 border border-[#0d6efd] rounded-md bg-white text-[#061624] focus:outline-none focus:ring-1 focus:ring-[#0d6efd] placeholder-[#0d6efd]/50"
                      value={entrepriseData.secteurActivite}
                      onChange={e => setEntrepriseData({...entrepriseData, secteurActivite: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-[#061624]">Site Web (URL)</label>
                  <input 
                    type="url" 
                    placeholder="https://entreprise.com"
                    className="w-full px-3 py-2 border border-[#0d6efd] rounded-md bg-white text-[#061624] focus:outline-none focus:ring-1 focus:ring-[#0d6efd] placeholder-[#0d6efd]/50"
                    value={entrepriseData.siteWeb}
                    onChange={e => setEntrepriseData({...entrepriseData, siteWeb: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-[#061624]">Description de l'Entreprise</label>
                  <textarea 
                    rows={4}
                    placeholder="Présentez brièvement votre entreprise et vos valeurs..."
                    className="w-full px-3 py-2 border border-[#0d6efd] rounded-md bg-white text-[#061624] focus:outline-none focus:ring-1 focus:ring-[#0d6efd] placeholder-[#0d6efd]/50"
                    value={entrepriseData.description}
                    onChange={e => setEntrepriseData({...entrepriseData, description: e.target.value})}
                  />
                </div>
              </>
            )}

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isSaving}
                className={`w-full py-2.5 rounded-md font-bold text-white transition ${
                  isSaving ? 'bg-[#0d6efd]/40 cursor-not-allowed' : 'bg-[#0d6efd] hover:bg-[#0d6efd]/80'
                }`}
              >
                {isSaving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}  