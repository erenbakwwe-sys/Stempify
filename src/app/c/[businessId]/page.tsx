'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee, CheckCircle2, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserByPhone, addStamp, getBusiness } from '@/lib/firestore';

export default function CustomerQRScanPage({ params }: { params: Promise<{ businessId: string }> }) {
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'waiting' | 'pin_entry' | 'success' | 'error' | 'not_found'>('loading');
  const [pin, setPin] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [staffPin, setStaffPin] = useState('1234');
  const [stampResult, setStampResult] = useState<{ newCount: number; rewardEarned: boolean } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // For demo: we'll use a phone stored in localStorage (set during registration)
  const PIN_LENGTH = 4;

  useEffect(() => {
    async function loadBusiness() {
      try {
        const biz = await getBusiness(businessId);
        if (biz) {
          setBusinessName(biz.name);
          setStaffPin(biz.staffPin || '1234');
        } else {
          setBusinessName(businessId.replace(/-/g, ' '));
        }
        setStatus('waiting');
      } catch {
        setBusinessName(businessId.replace(/-/g, ' '));
        setStatus('waiting');
      }
    }
    loadBusiness();
  }, [businessId]);

  const handlePinInput = (digit: string) => {
    if (pin.length < PIN_LENGTH) {
      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === PIN_LENGTH) {
        validatePin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const validatePin = async (enteredPin: string) => {
    if (enteredPin === staffPin) {
      // PIN correct - now give the stamp
      try {
        // Get user phone from localStorage (set during registration)
        const userPhone = localStorage.getItem('stampify_user_phone');
        if (!userPhone) {
          setErrorMsg('Henüz kayıt olmadınız. Lütfen önce Stampify\'a kaydolun.');
          setStatus('not_found');
          return;
        }

        const user = await getUserByPhone(userPhone);
        if (!user) {
          setErrorMsg('Kullanıcı bulunamadı. Lütfen önce Stampify\'a kaydolun.');
          setStatus('not_found');
          return;
        }

        const result = await addStamp(user.id, businessId);
        setStampResult(result);
        setStatus('success');

        setTimeout(() => {
          router.push('/');
        }, 3500);
      } catch (err) {
        console.error('Stamp error:', err);
        setErrorMsg('Damga eklenirken bir hata oluştu.');
        setStatus('error');
        setTimeout(() => { setPin(''); setStatus('pin_entry'); }, 2000);
      }
    } else {
      setStatus('error');
      setTimeout(() => {
        setPin('');
        setStatus('pin_entry');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-fuchsia-600/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-sm z-10">
        
        {/* Business Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-neutral-800 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-neutral-700 shadow-xl">
            <Coffee className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold capitalize">{businessName || 'Yükleniyor...'}</h1>
          <p className="text-neutral-400">1 Damga Kazanımı</p>
        </div>

        <AnimatePresence mode="wait">
          
          {/* STATE: Loading */}
          {status === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-12">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
              <p className="text-neutral-400">İşletme bilgileri yükleniyor...</p>
            </motion.div>
          )}

          {/* STATE: Waiting to show cashier */}
          {status === 'waiting' && (
            <motion.div 
              key="waiting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-neutral-900 border border-indigo-500/30 rounded-3xl p-8 text-center shadow-2xl shadow-indigo-500/10"
            >
              <div className="inline-flex items-center justify-center p-4 bg-indigo-500/20 rounded-full mb-6">
                <ShieldCheck className="w-12 h-12 text-indigo-400" />
              </div>
              <h2 className="text-xl font-semibold mb-3">Personel Onayı Gerekli</h2>
              <p className="text-neutral-400 text-sm mb-8">
                Damganızı kazanmak için lütfen telefonunuzu kasadaki görevliye gösterin.
              </p>
              
              <button 
                onClick={() => setStatus('pin_entry')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
              >
                GÖREVLİ: Onaylamak için dokun
              </button>
            </motion.div>
          )}

          {/* STATE: Staff PIN Entry */}
          {(status === 'pin_entry' || status === 'error') && (
            <motion.div 
              key="pin_entry"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center"
            >
              <h2 className="text-lg font-semibold mb-2">Güvenlik Kodu</h2>
              <p className="text-neutral-400 text-sm mb-6">Kasadaki görevli onay PIN'ini girmelidir.</p>

              {/* PIN Display */}
              <div className="flex justify-center gap-3 mb-8">
                {[...Array(PIN_LENGTH)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-bold border-2 transition-all ${
                      status === 'error' ? 'border-red-500 text-red-500' :
                      pin.length > i ? 'border-indigo-500 text-indigo-400' : 'border-neutral-800 text-neutral-600'
                    }`}
                  >
                    {pin[i] || '•'}
                  </div>
                ))}
              </div>

              {status === 'error' && (
                <p className="text-red-400 text-sm mb-4 animate-pulse">Hatalı PIN kodu.</p>
              )}

              {/* Custom Numpad */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => handlePinInput(num.toString())}
                    className="bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-xl font-semibold py-4 rounded-2xl transition-colors"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setPin('');
                    setStatus('waiting');
                  }}
                  className="bg-neutral-800/50 hover:bg-neutral-700 text-neutral-400 flex items-center justify-center py-4 rounded-2xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <button
                  onClick={() => handlePinInput('0')}
                  className="bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-xl font-semibold py-4 rounded-2xl transition-colors"
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  className="bg-neutral-800/50 hover:bg-neutral-700 text-neutral-400 flex items-center justify-center py-4 rounded-2xl transition-colors"
                >
                  ⌫
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE: Success */}
          {status === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-8 text-center"
            >
              <div className="inline-flex items-center justify-center mb-6">
                <CheckCircle2 className="w-20 h-20 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-emerald-400">Tebrikler!</h2>
              {stampResult?.rewardEarned ? (
                <p className="text-emerald-200/70">
                  🎉 Kartını tamamladın! <strong>Bedava Kahve</strong> kazandın! Ana sayfaya yönlendiriliyorsunuz...
                </p>
              ) : (
                <p className="text-emerald-200/70">
                  1 Damga hesabınıza eklendi ({stampResult?.newCount || 1} damga). Ana sayfaya yönlendiriliyorsunuz...
                </p>
              )}
            </motion.div>
          )}

          {/* STATE: User not found */}
          {status === 'not_found' && (
            <motion.div 
              key="not_found"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-8 text-center"
            >
              <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2 text-amber-400">Kayıt Gerekli</h2>
              <p className="text-amber-200/70 text-sm mb-6">{errorMsg}</p>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Kayıt Ol
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
