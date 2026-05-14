"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Coffee, ChevronRight, Gift, CheckCircle2, Sparkles, Mail, Phone, CalendarHeart, Share2, Star, Trophy, Wallet, BellRing, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { registerUser, getUserByPhone } from "@/lib/firestore";

type Step = "welcome" | "contact" | "birthday" | "dashboard";

export default function CustomerFlow() {
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthdate, setBirthdate] = useState("");
  
  const [stamps, setStamps] = useState(0);
  const [lifetimeStamps, setLifetimeStamps] = useState(0);
  const totalStamps = 6;
  const currentBranch = "Kadıköy Şubesi";

  // Features States
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);

  // VIP Logic
  const isGold = lifetimeStamps >= 20;
  const isSilver = lifetimeStamps >= 10 && lifetimeStamps < 20;
  
  const cardGradient = isGold 
    ? "from-amber-200 via-yellow-400 to-yellow-600 border-yellow-400 text-yellow-950 shadow-[0_0_50px_rgba(250,204,21,0.4)]" 
    : isSilver 
    ? "from-slate-300 via-slate-400 to-slate-500 border-slate-400 text-slate-900 shadow-[0_0_40px_rgba(148,163,184,0.3)]"
    : "from-card/80 via-card/50 to-primary/10 border-primary/30 shadow-[0_0_40px_rgba(var(--primary-rgb),0.15)]";

  const handleNext = async (nextStep: Step) => {
    if (step === "welcome" && !name.trim()) {
      toast.error("Lütfen adınızı girin.", { style: { background: "var(--destructive)", color: "white", border: "none" }});
      return;
    }
    if (step === "contact") {
      if (!phone.trim()) {
        toast.error("Telefon numaranızı girmeniz gerekiyor.", { style: { background: "var(--destructive)", color: "white", border: "none" }});
        return;
      }
    }
    
    if (nextStep === "dashboard") {
      // Store phone locally immediately (never block UI)
      localStorage.setItem('stampify_user_phone', phone);
      localStorage.setItem('stampify_user_name', name);
      
      toast.success("Hesabınız başarıyla oluşturuldu!", {
        icon: <Sparkles className="text-primary" />,
      });

      // Save to Firebase in background (non-blocking)
      const referredBy = typeof window !== 'undefined' ? localStorage.getItem('stampify_referredBy') || '' : '';
      registerUser({ name, phone, email, birthdate, referredBy })
        .then(() => console.log('User saved to Firebase'))
        .catch((err) => console.warn('Firebase save failed (offline?):', err));

      setTimeout(() => setShowPushModal(true), 2000);
    }
    
    setStep(nextStep);
  };

  // Gamification Simulation
  const handleSimulateStamp = () => {
    setStamps(prev => prev + 1);
    setLifetimeStamps(prev => prev + 1);
  };

  useEffect(() => {
    if (stamps === totalStamps && !rewardClaimed) {
      setTimeout(() => setShowRewardModal(true), 800);
    }
  }, [stamps, rewardClaimed]);

  const handleClaimReward = () => {
    setShowRewardModal(false);
    setRewardClaimed(true);
    setStamps(0);
    toast.success("Ödülünüz hesabınıza tanımlandı!", { icon: <Gift className="text-primary"/> });
    
    // Show review shield after a delay
    setTimeout(() => {
      setShowReviewModal(true);
    }, 1500);
  };

  const submitReview = () => {
    if (rating >= 4) {
      toast.success("Teşekkürler! Google Haritalar'a yönlendiriliyorsunuz...");
    } else if (rating > 0) {
      toast.success("Geri bildiriminiz için teşekkürler! Kendimizi geliştireceğiz.");
    }
    setShowReviewModal(false);
    setRating(0);
  };

  const handleEnablePush = () => {
    setShowPushModal(false);
    toast.success("Harika! Sıcak fırsatları ilk sen duyacaksın.", { icon: <BellRing className="text-green-500"/> });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full min-h-screen relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      {/* REWARD MODAL (GAMIFICATION) */}
      <AnimatePresence>
        {showRewardModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-full max-w-sm"
            >
              <Card className="glass-card border-amber-500/50 shadow-[0_0_60px_rgba(245,158,11,0.4)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent pointer-events-none" />
                <CardHeader className="text-center pt-8">
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                    className="mx-auto bg-gradient-to-r from-amber-400 to-orange-500 w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-amber-500/50 text-white"
                  >
                    <Gift size={48} />
                  </motion.div>
                  <CardTitle className="text-3xl font-heading text-amber-500">Tebrikler!</CardTitle>
                  <CardDescription className="text-lg text-white/90">6. Damganızı tamamladınız.</CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-8 space-y-6">
                  <div className="p-4 bg-black/30 rounded-xl border border-white/10">
                    <p className="text-2xl font-bold text-glow text-white">🎉 BEDAVA KAHVE 🎉</p>
                    <p className="text-sm text-white/70 mt-1">İstediğiniz boy kahve bizden hediye!</p>
                  </div>
                  <Button onClick={handleClaimReward} className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                    Hediyemi Al
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PUSH NOTIFICATION MODAL */}
      <AnimatePresence>
        {showPushModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }}
              className="w-full max-w-sm"
            >
              <Card className="bg-background/95 border-primary/50 shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)] backdrop-blur-xl">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="bg-primary/20 p-4 rounded-full text-primary">
                    <BellRing size={32} className="animate-[ring_2s_ease-in-out_infinite]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-1">Fırsatları Kaçırma!</h3>
                    <p className="text-sm text-muted-foreground">Fırından yeni çıkan tatlıları ve sana özel flaş indirimleri anında haber verelim.</p>
                  </div>
                  <div className="flex gap-3 w-full mt-2">
                    <Button variant="outline" className="flex-1 bg-transparent border-white/10" onClick={() => setShowPushModal(false)}>Belki Sonra</Button>
                    <Button className="flex-1 bg-primary text-primary-foreground font-bold shadow-[0_0_15px_var(--color-primary)]" onClick={handleEnablePush}>İzin Ver</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REVIEW SHIELD MODAL */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm"
            >
              <Card className="glass-card border-white/10">
                <CardHeader className="text-center">
                  <div className="mx-auto bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mb-2">
                    <Star className="text-primary" size={32} />
                  </div>
                  <CardTitle className="text-2xl font-heading">Hizmetimiz Nasıldı?</CardTitle>
                  <CardDescription>Bize puan vererek kendimizi geliştirmemize yardımcı olun.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="transition-transform hover:scale-110 focus:outline-none"
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setRating(star)}
                      >
                        <Star 
                          size={36} 
                          className={`transition-colors ${star <= (hoveredStar || rating) ? "fill-amber-400 text-amber-400" : "text-white/20"}`} 
                        />
                      </button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {rating > 0 && rating <= 3 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 overflow-hidden">
                        <Label className="text-white/80">Sizi memnun etmeyen neydi? (Sadece işletme okuyacak)</Label>
                        <Textarea placeholder="Örn: Kahvem soğuktu..." className="bg-black/30 border-white/10" />
                      </motion.div>
                    )}
                    {rating >= 4 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-center p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                        <p className="text-green-400 font-medium text-sm">Harika! Bizi Google'da değerlendirerek destek olmak ister misiniz?</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3">
                    <Button variant="ghost" className="w-full text-white/50" onClick={() => setShowReviewModal(false)}>Kapat</Button>
                    <Button className="w-full bg-primary" disabled={rating === 0} onClick={submitReview}>
                      {rating >= 4 ? "Google'da Puan Ver" : "Gönder"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div key="welcome" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} className="w-full z-10">
            <div className="text-center mb-10">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-6 ring-1 ring-primary/30">
                <Coffee size={40} />
              </motion.div>
              <h1 className="text-4xl font-bold mb-3 text-glow">Stampify'a<br/>Hoş Geldin</h1>
              <p className="text-muted-foreground text-lg font-light">Sana nasıl hitap edelim?</p>
            </div>
            <Card className="glass-card">
              <CardContent className="pt-8 pb-6 space-y-6">
                <div className="space-y-3">
                  <Input placeholder="Örn: Ahmet Yılmaz" value={name} onChange={(e) => setName(e.target.value)} className="h-14 text-lg bg-background/50 border-white/10" autoFocus />
                </div>
                <Button className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 rounded-xl" onClick={() => handleNext("contact")}>
                  Devam Et <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "contact" && (
          <motion.div key="contact" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="w-full z-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-3 text-glow">Harika, <span className="text-primary">{name.split(' ')[0]}!</span></h1>
              <p className="text-muted-foreground font-light">Hesabını güvenceye almak için bilgilerini gir.</p>
            </div>
            <Card className="glass-card">
              <CardContent className="pt-8 pb-6 space-y-5">
                <div className="space-y-3">
                  <Label><Phone size={14} className="inline mr-1"/> Telefon Numaran</Label>
                  <Input type="tel" placeholder="5XX XXX XX XX" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-14 bg-background/50 border-white/10 tracking-wider" autoFocus />
                </div>
                <Button className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 rounded-xl" onClick={() => handleNext("birthday")}>
                  Son Bir Adım <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "birthday" && (
          <motion.div key="birthday" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="w-full z-10">
             <div className="text-center mb-8">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-pink-500/10 text-pink-500 mb-6 ring-1 ring-pink-500/30">
                <Gift size={40} />
              </motion.div>
              <h1 className="text-3xl font-bold mb-3 text-glow">Ufak Bir Sürpriz!</h1>
              <p className="text-muted-foreground font-light">Doğum gününde hediyeler için tarihini seç.</p>
            </div>
            <Card className="glass-card">
              <CardContent className="pt-8 pb-6 space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  {/* Gün */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Gün</Label>
                    <select
                      value={birthdate.split('-')[2] || ''}
                      onChange={(e) => {
                        const parts = birthdate.split('-');
                        setBirthdate(`${parts[0] || '2000'}-${parts[1] || '01'}-${e.target.value}`);
                      }}
                      className="w-full h-14 rounded-xl bg-background/50 border border-white/10 text-white px-3 text-lg appearance-none cursor-pointer focus:ring-1 focus:ring-primary/50 focus:outline-none"
                    >
                      <option value="" disabled>--</option>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                  {/* Ay */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Ay</Label>
                    <select
                      value={birthdate.split('-')[1] || ''}
                      onChange={(e) => {
                        const parts = birthdate.split('-');
                        setBirthdate(`${parts[0] || '2000'}-${e.target.value}-${parts[2] || '01'}`);
                      }}
                      className="w-full h-14 rounded-xl bg-background/50 border border-white/10 text-white px-3 text-lg appearance-none cursor-pointer focus:ring-1 focus:ring-primary/50 focus:outline-none"
                    >
                      <option value="" disabled>--</option>
                      {['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'].map((ay, i) => (
                        <option key={i} value={String(i + 1).padStart(2, '0')}>{ay}</option>
                      ))}
                    </select>
                  </div>
                  {/* Yıl */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Yıl</Label>
                    <select
                      value={birthdate.split('-')[0] || ''}
                      onChange={(e) => {
                        const parts = birthdate.split('-');
                        setBirthdate(`${e.target.value}-${parts[1] || '01'}-${parts[2] || '01'}`);
                      }}
                      className="w-full h-14 rounded-xl bg-background/50 border border-white/10 text-white px-3 text-lg appearance-none cursor-pointer focus:ring-1 focus:ring-primary/50 focus:outline-none"
                    >
                      <option value="" disabled>--</option>
                      {Array.from({ length: 60 }, (_, i) => {
                        const year = new Date().getFullYear() - 10 - i;
                        return <option key={year} value={String(year)}>{year}</option>;
                      })}
                    </select>
                  </div>
                </div>
                <Button className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 text-white rounded-xl" onClick={() => handleNext("dashboard")}>
                  Kaydı Tamamla <CheckCircle2 className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="ghost" className="w-full text-white/50" onClick={() => handleNext("dashboard")}>Atla</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "dashboard" && (
          <motion.div key="dashboard" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-5 z-10 pb-8">
            <div className="flex items-center justify-between mb-2 pt-2">
              <div>
                <h1 className="text-2xl font-bold">Merhaba, {name.split(' ')[0]}!</h1>
                <div className="flex items-center gap-1 text-primary/80 mt-1">
                  <MapPin size={14} />
                  <span className="text-xs font-medium">{currentBranch}</span>
                </div>
              </div>
              {isGold && <div className="bg-gradient-to-r from-yellow-400 to-amber-600 text-yellow-950 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg shadow-yellow-500/20 border border-yellow-300"><Trophy size={14}/> ALTIN ÜYE</div>}
              {isSilver && !isGold && <div className="bg-gradient-to-r from-slate-300 to-slate-500 text-slate-900 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1"><Trophy size={14}/> GÜMÜŞ ÜYE</div>}
            </div>

            <Card className={`relative overflow-hidden transition-all duration-700 bg-gradient-to-br backdrop-blur-xl ${cardGradient}`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-white/0 to-white/20 pointer-events-none" />
              
              <CardHeader className="pb-4 pt-6">
                <CardTitle className="text-xl flex items-center justify-between font-heading">
                  <span>{isGold ? "ALTIN KART" : isSilver ? "GÜMÜŞ KART" : "SADAKAT KARTI"}</span>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold border ${isGold ? "bg-white/20 border-white/30" : "bg-primary/20 text-primary border-primary/30"}`}>
                    {stamps} / {totalStamps}
                  </div>
                </CardTitle>
                <CardDescription className={`text-sm mt-1 font-medium ${isGold ? "text-yellow-900/70" : isSilver ? "text-slate-800/70" : "text-white/60"}`}>
                  {isGold ? "Altın üyelere tüm ürünlerde %5 indirim!" : `Her ${totalStamps} kahvede 1 kahve hediye!`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <div className="grid grid-cols-3 gap-5 mt-2">
                  {Array.from({ length: totalStamps }).map((_, i) => {
                    const isStampEarned = i < stamps;
                    
                    let earnedClasses = "bg-primary text-primary-foreground border-primary/50 shadow-[0_0_15px_var(--color-primary)]";
                    if (isGold) earnedClasses = "bg-yellow-950 text-yellow-400 border-yellow-700 shadow-[0_0_15px_rgba(66,32,6,0.5)]";
                    if (isSilver) earnedClasses = "bg-slate-900 text-slate-300 border-slate-700 shadow-[0_0_15px_rgba(15,23,42,0.5)]";

                    let unearnedClasses = "border-dashed border-muted-foreground/20 bg-muted/20 text-muted-foreground/30";
                    if (isGold) unearnedClasses = "border-dashed border-yellow-700/30 bg-yellow-900/10 text-yellow-900/30";

                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.1 + (i * 0.1) }}
                        className={`aspect-square rounded-2xl flex items-center justify-center border transition-all duration-500 relative overflow-hidden ${isStampEarned ? earnedClasses : unearnedClasses}`}
                      >
                        {isStampEarned && (
                          <motion.div className="absolute inset-0 bg-white/20" initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }} />
                        )}
                        {i === totalStamps - 1 ? <Gift size={32} /> : <Coffee size={32} />}
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
              <CardFooter className={`border-t flex-col py-6 backdrop-blur-md ${isGold ? "bg-yellow-900/10 border-yellow-700/20" : "bg-black/20 border-white/5"}`}>
                <p className={`text-sm font-medium mb-5 text-center ${isGold ? "text-yellow-950/80" : "text-white/70"}`}>
                  Damga ekletmek için QR kodu kasada okutun
                </p>
                <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-4 rounded-2xl shadow-xl">
                  <QRCodeSVG value={`stampify:add:${phone}`} size={150} level="H" fgColor={isGold ? "#422006" : "#000000"} />
                </motion.div>
                
                {/* WALLET INTEGRATION BUTTON */}
                <Button 
                  className="w-full mt-6 bg-black hover:bg-neutral-900 text-white font-semibold rounded-xl border border-white/20 h-12 flex items-center gap-2 shadow-[0_5px_15px_rgba(0,0,0,0.5)]"
                  onClick={() => toast.success("Apple Cüzdan'a eklendi! (Mock)")}
                >
                  <Wallet size={20} /> Apple Cüzdan'a Ekle
                </Button>
              </CardFooter>
            </Card>

            {/* UPSELL (CROSS-SELL) SECTION */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-lg font-bold">Günün Fırsatı</h3>
                <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-1 rounded-md border border-primary/20">%20 İndirim</span>
              </div>
              <Card className="glass-card border-primary/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
                <CardContent className="p-4 flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl bg-orange-950/50 border border-orange-500/30 flex items-center justify-center flex-shrink-0 text-3xl">
                    🥐
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white leading-tight">Taze Kruvasan</h4>
                    <p className="text-xs text-muted-foreground mt-1">Kahvenin yanına harika gider.</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-bold text-primary">₺45.00</span>
                      <span className="text-xs line-through text-white/30">₺55.00</span>
                    </div>
                  </div>
                  <Button size="sm" className="rounded-full w-10 h-10 p-0 bg-primary text-primary-foreground shadow-[0_0_15px_var(--color-primary)]">
                    <Plus size={20} />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* REFERRAL SYSTEM */}
            <Card className="glass-card border-emerald-500/30 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-5 flex items-center gap-4">
                <div className="bg-emerald-500/20 p-3 rounded-full text-emerald-400 border border-emerald-500/30">
                  <Share2 size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">Arkadaşını Davet Et</h3>
                  <p className="text-xs text-emerald-400 font-medium">1 Kahve Kazandır, 1 Damga Kazan!</p>
                </div>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-4" onClick={() => {
                  const code = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900);
                  const shareUrl = `${window.location.origin}/invite/${code}`;
                  const shareText = `Selam! Stampify ile bedava kahve kazanıyorum. Bu linkten kayıt ol! ${shareUrl}`;
                  
                  if (navigator.share) {
                    navigator.share({ title: 'Stampify Davet', text: shareText, url: shareUrl }).catch(() => {});
                  } else {
                    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                  }
                }}>
                  Paylaş
                </Button>
              </CardContent>
            </Card>



          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
