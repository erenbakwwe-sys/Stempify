'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Coffee, Star, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Data for nearby cafes
const MOCK_CAFES = [
  { id: 1, name: "Starbucks Kadıköy", distance: 0.4, rating: 4.8, category: "Kahve & Tatlı", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80" },
  { id: 2, name: "EspressoLab Moda", distance: 0.8, rating: 4.9, category: "Nitelikli Kahve", image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=300&q=80" },
  { id: 3, name: "Federal Coffee", distance: 1.2, rating: 4.7, category: "Kahve Kavurucusu", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80" },
  { id: 4, name: "Minoa Akaretler", distance: 3.5, rating: 4.6, category: "Kitap Kafe", image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=300&q=80" },
];

export default function NearbyPage() {
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [cafes, setCafes] = useState(MOCK_CAFES);

  const requestLocation = () => {
    setLocationStatus('loading');
    
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setErrorMessage("Tarayıcınız konum özelliğini desteklemiyor.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // In a real app, we would send position.coords.latitude/longitude to the backend
        // and fetch the actual nearby cafes. Here we just mock the success state.
        console.log("Location found:", position.coords.latitude, position.coords.longitude);
        
        // Simulate network delay
        setTimeout(() => {
          setLocationStatus('success');
          // Sort cafes by distance as a visual effect
          setCafes([...MOCK_CAFES].sort((a, b) => a.distance - b.distance));
        }, 800);
      },
      (error) => {
        setLocationStatus('error');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrorMessage("Konum izni reddedildi. Lütfen ayarlardan izin verin.");
            break;
          case error.POSITION_UNAVAILABLE:
            setErrorMessage("Konum bilgisine ulaşılamıyor.");
            break;
          case error.TIMEOUT:
            setErrorMessage("Konum isteği zaman aşımına uğradı.");
            break;
          default:
            setErrorMessage("Bilinmeyen bir konum hatası oluştu.");
            break;
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 max-w-md mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Keşfet</h1>
          <p className="text-neutral-400 text-sm">Sana en yakın Stampify mekanları</p>
        </div>
        <div className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800">
          <MapPin className="w-5 h-5 text-indigo-400" />
        </div>
      </div>

      {locationStatus === 'idle' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Navigation className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Konum İzni Gerekli</h2>
          <p className="text-neutral-400 text-sm mb-6">
            Çevrenizdeki kafeleri ve size özel fırsatları görebilmek için konum izni vermeniz gerekmektedir.
          </p>
          <button 
            onClick={requestLocation}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors"
          >
            Konum İzni Ver
          </button>
        </motion.div>
      )}

      {locationStatus === 'loading' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-400">Konumunuz bulunuyor...</p>
        </div>
      )}

      {locationStatus === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-red-400 font-semibold mb-1">Konum Bulunamadı</h3>
          <p className="text-red-300/70 text-sm">{errorMessage}</p>
          <button 
            onClick={requestLocation}
            className="mt-4 text-sm bg-red-500/20 text-red-300 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {locationStatus === 'success' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium text-emerald-500 uppercase tracking-wider">Canlı Konum</span>
          </div>
          
          {cafes.map((cafe, index) => (
            <motion.div 
              key={cafe.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex gap-4 items-center group hover:bg-neutral-800/80 transition-colors cursor-pointer"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
                <img src={cafe.image} alt={cafe.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-1">{cafe.name}</h3>
                <p className="text-xs text-neutral-400 mb-2">{cafe.category}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <Navigation className="w-3 h-3" />
                    {cafe.distance} km
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {cafe.rating}
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
