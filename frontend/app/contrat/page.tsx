'use client';
import { useRouter } from 'next/navigation';

export default function ContratsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-[#0d6efd] p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 flex items-center gap-2 text-xs font-bold text-[#0d6efd] hover:underline"
        >
          ← Retour au Dashboard
        </button>
        <h1 className="text-3xl font-black mb-4">Mes Contrats</h1>
        <p className="text-sm text-[#0d6efd]/70 mb-6">
          Retrouvez ici la liste de tous vos contrats signés et en cours.
        </p>
        
        <div className="bg-[#0d6efd]/5 border border-[#0d6efd]/20 rounded-lg p-6 text-center text-sm font-semibold">
          Vos contrats apparaîtront ici.
        </div>
      </div>
    </div>
  );
}