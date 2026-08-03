'use client';

import { useState } from 'react';
// @ts-ignore
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

export default function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    // 1. On active le chargement et on efface les anciennes erreurs
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 2. Confirmation du paiement
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        // Erreur retournée par Stripe (ex: carte refusée, fonds insuffisants)
        setErrorMessage(error.message || 'Une erreur est survenue lors du paiement.');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Succès
        alert('Paiement sécurisé effectué avec succès !');
        onSuccess();
      } else {
        // Cas marginal : le statut nécessite une action ou n'est pas encore complété
        setErrorMessage(`Statut du paiement : ${paymentIntent?.status || 'inconnu'}. Veuillez réessayer.`);
        setIsProcessing(false);
      }
    } catch (err: any) {
      // 3. Capture des erreurs inattendues (réseau, JS, etc.)
      console.error('Erreur Stripe unexpected:', err);
      setErrorMessage('Une erreur inattendue est survenue. Veuillez réanalyser la requête.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {errorMessage && (
        <p className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded border border-red-200">
          {errorMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-[#0d6efd] text-white py-2.5 rounded-md font-bold hover:bg-[#0d6efd]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Traitement en cours...' : 'Payer et Confirmer'}
      </button>
    </form>
  );
}