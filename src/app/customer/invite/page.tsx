'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, Users, Gift, Coffee, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InvitePage() {
  const [copied, setCopied] = useState(false);
  
  // Mock User Data
  const referralCode = "EREN892";
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/invite/${referralCode}` : `https://stampify.app/invite/${referralCode}`;
  
  // Mock Stats
  const stats = {
    pending: 3, // Arkadaşı üye olmuş ama henüz kahve almamış
    completed: 2, // Kahve almış ve damga kazandırmış
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = `Selam! Stampify ile Starbucks'ta bedava kahve kazanıyorum. Bu linkten kayıt ol, ilk kahveni al! Link: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 max-w-md mx-auto pb-24">
      
      {/* Header */}
      <div className="text-center mb-10 pt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-fuchsia-500/20 rounded-full mb-4">
          <Gift className="w-8 h-8 text-fuchsia-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Arkadaşını Getir</h1>
        <p className="text-neutral-400 text-sm max-w-xs mx-auto">
          Arkadaşını davet et, arkadaşın ilk kahvesini aldığında <strong className="text-fuchsia-400">1 Bedava Damga</strong> kazan!
        </p>
      </div>

      {/* Code Sharing Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 mb-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-2xl rounded-full"></div>
        
        <h2 className="text-sm font-medium text-neutral-400 mb-3 uppercase tracking-wider">Davet Linkin</h2>
        
        <div className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-xl p-4 mb-6">
          <span className="font-mono text-fuchsia-400 font-bold tracking-wider">{referralCode}</span>
          <button 
            onClick={handleCopy}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <button 
          onClick={handleWhatsAppShare}
          className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          WhatsApp'tan Paylaş
        </button>
      </motion.div>

      {/* Stats Section */}
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-indigo-400" />
        Davet İstatistiklerin
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Completed */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <Coffee className="w-6 h-6 text-emerald-400" />
            <span className="text-2xl font-bold text-emerald-400">{stats.completed}</span>
          </div>
          <p className="text-xs text-emerald-400/80 font-medium">Kazanılan Damga</p>
        </div>

        {/* Pending */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden group cursor-help">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span className="text-2xl font-bold text-amber-400">{stats.pending}</span>
          </div>
          <p className="text-xs text-amber-400/80 font-medium">Bekleyen Davet</p>
          
          {/* Tooltip for Pending */}
          <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center p-3 text-[10px] text-center opacity-0 group-hover:opacity-100 transition-opacity">
            Arkadaşının onaylanmış ilk damgası bekleniyor.
          </div>
        </div>
      </div>

    </div>
  );
}
