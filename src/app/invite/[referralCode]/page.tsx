'use client';

import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee, ArrowRight, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { getUserByReferralCode } from '@/lib/firestore';

export default function ReferralLandingPage({ params }: { params: Promise<{ referralCode: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const code = resolvedParams.referralCode;
  const [inviterName, setInviterName] = useState('Arkadaşın');

  useEffect(() => {
    async function fetchInviter() {
      try {
        const inviter = await getUserByReferralCode(code);
        if (inviter) setInviterName(inviter.name.split(' ')[0]);
      } catch { /* fallback to default */ }
    }
    fetchInviter();
  }, [code]);

  const handleStart = () => {
    localStorage.setItem('stampify_referredBy', code.toUpperCase());
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm z-10 text-center"
      >
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-fuchsia-500/20 rounded-full animate-ping"></div>
          <div className="relative w-full h-full bg-neutral-900 border border-fuchsia-500/30 rounded-full flex items-center justify-center shadow-xl shadow-fuchsia-500/20">
            <Gift className="w-10 h-10 text-fuchsia-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-3">
          <span className="text-fuchsia-400">{inviterName}</span> seni davet etti!
        </h1>
        
        <p className="text-neutral-400 mb-8 text-lg">
          Stampify'a katıl ve en sevdiğin kafelerde bedava kahve kazanmaya başla.
        </p>

        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 mb-8 backdrop-blur-sm">
          <h3 className="font-semibold mb-4 text-neutral-300">Nasıl Çalışır?</h3>
          <ul className="space-y-4 text-left text-sm text-neutral-400">
            <li className="flex gap-3">
              <span className="bg-neutral-800 text-fuchsia-400 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</span>
              Hemen kayıt ol ve favori kafene git.
            </li>
            <li className="flex gap-3">
              <span className="bg-neutral-800 text-fuchsia-400 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</span>
              Kasadaki QR kodu okutup ilk damganı kazan.
            </li>
            <li className="flex gap-3">
              <span className="bg-neutral-800 text-fuchsia-400 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</span>
              Bedava kahvelere giden yolda ilk adımı atmış ol!
            </li>
          </ul>
        </div>

        <button 
          onClick={handleStart}
          className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          Hemen Başla
          <ArrowRight className="w-5 h-5" />
        </button>
        
        <p className="mt-6 text-xs text-neutral-600">
          Davet Kodu: {code}
        </p>
      </motion.div>
    </div>
  );
}
