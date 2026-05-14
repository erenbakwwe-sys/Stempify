"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Lock, Users, Coffee, Sparkles, Send, PlusCircle, ArrowRight, Gift, ShieldAlert, Zap, MapPin, BellRing, ChevronDown, BarChart3, TrendingUp, Camera, X, UserPlus, Trash2, QrCode, Download, Printer, Info } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getAllUsers, getUserByPhone, addStamp, registerUser, type StampifyUser } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';


// Recharts Mock Data
const WEEKLY_DATA = [
  { name: 'Pzt', ziyaret: 45 }, { name: 'Sal', ziyaret: 52 }, { name: 'Çar', ziyaret: 38 },
  { name: 'Per', ziyaret: 65 }, { name: 'Cum', ziyaret: 85 }, { name: 'Cmt', ziyaret: 120 }, { name: 'Paz', ziyaret: 110 }
];

const BRANCH_DATA = [
  { name: 'Kadıköy', value: 65 }, { name: 'Beşiktaş', value: 35 }
];
const COLORS = ['#f59e0b', '#3b82f6'];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  
  const [selectedBranch, setSelectedBranch] = useState("Tüm Şubeler");
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  const [customers, setCustomers] = useState<any[]>([]);
  const [firebaseUsers, setFirebaseUsers] = useState<(StampifyUser & {id:string})[]>([]);
  const [stampPhone, setStampPhone] = useState("");
  
  const [campaignTone, setCampaignTone] = useState<"friendly" | "professional" | "excited" | "birthday" | "churn">("friendly");
  const [campaignType, setCampaignType] = useState<"email" | "push">("push");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // QR Scanner
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isAddingStamp, setIsAddingStamp] = useState(false);

  // Staff Management
  const [staffList, setStaffList] = useState<{id:string; name:string; role:string; pin:string; createdAt?:any}[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('garson');
  const [newStaffPin, setNewStaffPin] = useState('');

  // QR Code
  const qrRef = useRef<SVGSVGElement>(null);
  const businessId = "demo-cafe-123";
  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/c/${businessId}` : '';

  const downloadQR = () => {
    const svg = qrRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = `stampify-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Load Firebase users on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    getAllUsers().then(users => setFirebaseUsers(users)).catch(() => {});
    loadStaff();
  }, [isAuthenticated]);

  const loadStaff = async () => {
    try {
      // Try Firestore first
      const snap = await getDocs(collection(db, 'staff'));
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as {id:string;name:string;role:string;pin:string;createdAt?:any}[];
        setStaffList(list);
        localStorage.setItem('stampify_staff', JSON.stringify(list));
      } else {
        // Firestore boş — localStorage'dan yükle ve Firestore'a migrate et
        const saved = localStorage.getItem('stampify_staff');
        let localList: {id:string;name:string;role:string;pin:string;createdAt?:any}[] = [];
        if (saved) {
          localList = JSON.parse(saved);
        } else {
          localList = [{ id: '1', name: 'Ahmet Yılmaz', role: 'Kasiyer', pin: '1234' }];
          localStorage.setItem('stampify_staff', JSON.stringify(localList));
        }
        setStaffList(localList);
        // Firestore'a otomatik migrate et (böylece müşteri sayfası PIN'leri okuyabilir)
        for (const s of localList) {
          try {
            await addDoc(collection(db, 'staff'), {
              name: s.name,
              role: s.role,
              pin: s.pin,
              createdAt: serverTimestamp()
            });
          } catch {}
        }
        // Migrate sonrası Firestore'dan tekrar yükle (gerçek ID'leri al)
        const newSnap = await getDocs(collection(db, 'staff'));
        if (!newSnap.empty) {
          const migratedList = newSnap.docs.map(d => ({ id: d.id, ...d.data() })) as {id:string;name:string;role:string;pin:string;createdAt?:any}[];
          setStaffList(migratedList);
          localStorage.setItem('stampify_staff', JSON.stringify(migratedList));
        }
      }
    } catch {
      const saved = localStorage.getItem('stampify_staff');
      if (saved) setStaffList(JSON.parse(saved));
    }
  };

  const handleAddStaff = async () => {
    if (!newStaffName.trim() || !newStaffPin.trim()) {
      toast.error('Ad ve PIN zorunludur.');
      return;
    }
    if (newStaffPin.length !== 4) {
      toast.error('PIN 4 haneli olmalıdır.');
      return;
    }
    try {
      const staffData = {
        name: newStaffName,
        role: newStaffRole,
        pin: newStaffPin,
        createdAt: serverTimestamp()
      };
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'staff'), staffData);
      const newStaff = { id: docRef.id, name: newStaffName, role: newStaffRole, pin: newStaffPin, createdAt: new Date().toISOString() };
      const updatedList = [...staffList, newStaff];
      localStorage.setItem('stampify_staff', JSON.stringify(updatedList));
      setStaffList(updatedList);
      toast.success(`${newStaffName} başarıyla eklendi!`);
      setNewStaffName('');
      setNewStaffPin('');
    } catch (err) {
      // Fallback to localStorage if Firestore fails
      const newStaff = { id: Date.now().toString(), name: newStaffName, role: newStaffRole, pin: newStaffPin, createdAt: new Date().toISOString() };
      const updatedList = [...staffList, newStaff];
      localStorage.setItem('stampify_staff', JSON.stringify(updatedList));
      setStaffList(updatedList);
      toast.success(`${newStaffName} eklendi (çevrimdışı mod).`);
      setNewStaffName('');
      setNewStaffPin('');
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(db, 'staff', id));
    } catch {}
    const updatedList = staffList.filter(s => s.id !== id);
    localStorage.setItem('stampify_staff', JSON.stringify(updatedList));
    setStaffList(updatedList);
    toast.success(`${name} silindi.`);
  };

  // Export to CSV for Marketing
  const handleExportCSV = () => {
    // 1. Prepare data
    const headers = ["ID", "Isim", "Telefon", "E-posta", "Dogum_Tarihi", "Damga_Sayisi", "Kazanilan_Hediyeler", "Kayit_Tarihi"];
    const csvContent = [
      headers.join(","),
      ...filteredCustomers.map(c => [
        c.id,
        `"${c.name}"`, // Quote strings to handle commas in names
        c.phone,
        `"${c.email || ''}"`,
        c.birthdate || '',
        c.stamps,
        c.lifetimeStamps,
        c.lastVisit
      ].join(","))
    ].join("\n");

    // 2. Create Blob and download link
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF is for UTF-8 BOM (Excel compatibility)
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stampify_musteriler_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Müşteri listesi Excel/CSV olarak indirildi!");
  };

  // QR Camera Scanner
  const startScanner = async () => {
    setShowScanner(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      // Use BarcodeDetector API if available
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const scanLoop = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const url = barcodes[0].rawValue;
              handleQRResult(url);
              return;
            }
          } catch {}
          requestAnimationFrame(scanLoop);
        };
        requestAnimationFrame(scanLoop);
      }
    } catch {
      toast.error('Kamera erişimi reddedildi.');
      setShowScanner(false);
    }
  };

  const stopScanner = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowScanner(false);
  };

  const handleQRResult = async (url: string) => {
    stopScanner();
    if (url.startsWith('stampify:add:')) {
      const phone = url.replace('stampify:add:', '').trim();
      setStampPhone(phone);

      try {
        const existingUser = await getUserByPhone(phone);
        if (existingUser) {
          // Tüm kullanıcı listesini Firestore'dan taze yükle — Müşteriler sekmesi anında güncellenir
          getAllUsers()
            .then(users => setFirebaseUsers(users))
            .catch(() => {
              // Fallback: sadece bu kullanıcıyı ekle
              setFirebaseUsers(prev => {
                if (prev.find(u => u.phone === phone)) return prev;
                return [...prev, existingUser];
              });
            });
          toast.success(`✅ Müşteri bulundu: ${existingUser.name} — Müşteriler sekmesine eklendi!`, { icon: <QrCode size={18}/>, duration: 4000 });
        } else {
          toast.warning(`⚠️ Bu telefon numarası henüz kayıtlı değil: ${phone}`, { duration: 4000 });
        }
      } catch (err: any) {
        console.error("QR Error:", err);
        toast.error(`Hata: ${err.message || 'Müşteri aranırken hata oluştu.'}`);
      }
    } else {
      toast.info('QR kod okundu: ' + url);
    }
  };

  const allCustomers = firebaseUsers.map((u, i) => ({
    id: 100 + i,
    name: u.name,
    phone: u.phone,
    email: u.email || '',
    birthdate: u.birthdate || '',
    stamps: 0,
    lifetimeStamps: 0,
    lastVisit: 'Yeni',
    branch: 'Kadıköy Şubesi',
  }));

  const filteredCustomers = selectedBranch === "Tüm Şubeler" ? allCustomers : allCustomers.filter(c => c.branch === selectedBranch);
  const filteredFeedbacks: {id:number;name:string;date:string;rating:number;comment:string;branch:string}[] = [];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
      toast.success("Yönetici paneline hoş geldiniz!", { icon: <Sparkles className="text-primary"/> });
    } else {
      toast.error("Hatalı şifre!", { style: { background: "var(--destructive)", color: "white", border: "none" }});
    }
  };

  const handleAddStamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stampPhone.trim()) return;
    setIsAddingStamp(true);
    try {
      // Look up in firebaseUsers (already loaded) first for speed
      let user = firebaseUsers.find(u => u.phone === stampPhone);

      // If not found locally, query Firestore
      if (!user) {
        const found = await getUserByPhone(stampPhone);
        if (found) {
          user = found;
          setFirebaseUsers(prev => [...prev, found]); // add to local leads list
        }
      }

      if (!user || !user.id) {
        toast.error("Bu numaraya ait kayıtlı müşteri bulunamadı.", { style: { background: "var(--destructive)", color: "white", border: "none" } });
        return;
      }

      const result = await addStamp(user.id, businessId);
      toast.success(
        result.rewardEarned
          ? `🎉 ${user.name} 6. damgasını tamamladı! Ödül kazandı!`
          : `${user.name} için 1 damga eklendi! (${result.newCount}/6)`,
        { icon: <Coffee className="text-primary" /> }
      );
      setStampPhone("");
    } catch (err) {
      toast.error("Damga eklenirken hata oluştu.", { style: { background: "var(--destructive)", color: "white", border: "none" } });
    } finally {
      setIsAddingStamp(false);
    }
  };

  const handleGenerateMessage = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const templates = {
        friendly: "Merhaba canım müşterilerimiz! Özledik sizi 😊 Bugün kahvenizin yanında tatlımız bizden, bekliyoruz!",
        professional: "Değerli misafirlerimiz, yeni sezon menümüzle sizleri ağırlamaktan mutluluk duyarız. İyi günler dileriz.",
        excited: "SÜPER HABER! 🚀 Sadece bu hafta sonuna özel tüm kahvelerde %50 indirim fırsatını kaçırmayın! Hemen gelin!",
        birthday: "Doğum gününüz kutlu olsun! 🎂 Bu özel gününüzü kutlamak için mağazamıza geldiğinizde kahveniz bizden hediye!",
        churn: "Seni çok özledik! 🥺 Uzun zamandır mağazamıza uğramadığını fark ettik. Bu mesajla birlikte ilk kahven bizden! Hemen gel."
      };
      setGeneratedMessage(templates[campaignTone]);
      setIsGenerating(false);
      toast.success("Sihirli mesaj oluşturuldu!", { icon: <Sparkles className="text-primary"/> });
    }, 1500);
  };

  const getVIPTier = (stamps: number) => {
    if (stamps >= 20) return { name: "Altın", color: "text-amber-500", bg: "bg-amber-500/10" };
    if (stamps >= 10) return { name: "Gümüş", color: "text-slate-400", bg: "bg-slate-400/10" };
    return { name: "Standart", color: "text-white/60", bg: "bg-white/5" };
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-background">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm z-10">
          <Card className="glass-card border-white/10 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]">
            <CardHeader className="text-center pt-8">
              <motion.div animate={{ rotateY: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 5 }} className="mx-auto bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-primary/30 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                <Lock className="text-primary" size={28} />
              </motion.div>
              <CardTitle className="text-2xl font-bold font-heading">Yönetici Girişi</CardTitle>
            </CardHeader>
            <CardContent className="pb-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <Input type="password" placeholder="admin123" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-background/50 border-white/10 text-center text-lg focus-visible:ring-primary/50" />
                <Button type="submit" className="w-full h-12 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_var(--color-primary)]">
                  Giriş Yap <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[300px] bg-primary/5 rounded-b-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="glass border-b border-white/5 sticky top-0 z-20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-xl text-primary font-heading tracking-wide">
            <Coffee className="drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" /> STAMPIFY
          </div>
          
          <div className="relative">
            <Button variant="outline" className="bg-black/30 border-white/10 text-white/80" onClick={() => setShowBranchDropdown(!showBranchDropdown)}>
              <MapPin className="mr-2" size={16} /> {selectedBranch} <ChevronDown className="ml-2" size={16} />
            </Button>
            {showBranchDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-black/90 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 backdrop-blur-xl">
                {["Tüm Şubeler", "Kadıköy Şubesi", "Beşiktaş Şubesi"].map(b => (
                  <button key={b} onClick={() => { setSelectedBranch(b); setShowBranchDropdown(false); }} className={`w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition-colors ${selectedBranch === b ? 'text-primary font-bold bg-primary/10' : 'text-white/80'}`}>
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 mt-4 sm:mt-8 relative z-10">
        <Tabs defaultValue="dashboard" className="w-full space-y-4 sm:space-y-8">
          <div className="overflow-x-auto -mx-3 px-3 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-7 sm:max-w-4xl sm:mx-auto bg-black/40 backdrop-blur-md border border-white/10 p-1 rounded-xl h-11 sm:h-12 gap-1">
              <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-primary transition-all text-xs sm:text-sm whitespace-nowrap px-3">Özet</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-primary transition-all text-xs sm:text-sm whitespace-nowrap px-3">Analiz</TabsTrigger>
              <TabsTrigger value="customers" className="rounded-lg data-[state=active]:bg-primary transition-all text-xs sm:text-sm whitespace-nowrap px-3">Müşteriler</TabsTrigger>
              <TabsTrigger value="qrcode" className="rounded-lg data-[state=active]:bg-primary transition-all text-xs sm:text-sm whitespace-nowrap px-3">QR Kodum</TabsTrigger>
              <TabsTrigger value="campaigns" className="rounded-lg data-[state=active]:bg-primary transition-all text-xs sm:text-sm whitespace-nowrap px-3">Pazarlama</TabsTrigger>
              <TabsTrigger value="staff" className="rounded-lg data-[state=active]:bg-primary transition-all text-xs sm:text-sm whitespace-nowrap px-3">Çalışanlar</TabsTrigger>
              <TabsTrigger value="feedback" className="rounded-lg data-[state=active]:bg-primary transition-all flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-3">
                Kalkan <span className="bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">{filteredFeedbacks.length}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="mt-6">
            {/* DASHBOARD TAB */}
            <TabsContent value="dashboard" className="space-y-6 m-0" key="dashboard">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 md:grid-cols-3">
                <Card className="glass-card overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Aktif Müşteriler</CardTitle>
                    <div className="p-2 bg-blue-500/10 rounded-lg"><Users className="h-4 w-4 text-blue-400" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold font-heading">{filteredCustomers.length}</div>
                    <p className="text-xs text-blue-400/80 mt-1 font-medium">+2 Geçen aydan</p>
                  </CardContent>
                </Card>
                <Card className="glass-card overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Dağıtılan Damga</CardTitle>
                    <div className="p-2 bg-primary/10 rounded-lg"><Coffee className="h-4 w-4 text-primary" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold font-heading text-primary">
                      {filteredCustomers.reduce((acc, curr) => acc + curr.lifetimeStamps, 0)}
                    </div>
                    <p className="text-xs text-primary/80 mt-1 font-medium">+12 Bu hafta</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] border-none">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Hızlı Damga Ekle</CardTitle>
                    <PlusCircle className="h-5 w-5" />
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddStamp} className="flex gap-2 mt-2">
                      <Input placeholder="Tel No (5XX...)" value={stampPhone} onChange={(e) => setStampPhone(e.target.value)} className="bg-black/20 border-white/20 text-white" disabled={isAddingStamp} />
                      <Button variant="secondary" type="submit" size="sm" className="h-10 font-bold bg-white text-primary" disabled={isAddingStamp}>
                        {isAddingStamp ? '...' : 'Ekle'}
                      </Button>
                    </form>
                    <Button onClick={startScanner} disabled={isAddingStamp} className="w-full mt-3 bg-black/30 hover:bg-black/50 text-white border border-white/20 gap-2">
                      <Camera size={18}/> Kamera ile QR Oku
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* QR CAMERA SCANNER MODAL */}
              <AnimatePresence>
                {showScanner && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-neutral-900 rounded-3xl overflow-hidden border border-white/10">
                      <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <h3 className="font-semibold flex items-center gap-2"><Camera size={18}/> QR Tarayıcı</h3>
                        <button onClick={stopScanner} className="text-white/50 hover:text-white"><X size={20}/></button>
                      </div>
                      <div className="relative aspect-square bg-black">
                        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                        <div className="absolute inset-8 border-2 border-white/30 rounded-2xl pointer-events-none" />
                      </div>
                      <div className="p-4 text-center text-neutral-400 text-sm">
                        Müşterinin telefonundaki QR kodu kameraya gösterin.
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* ANALYTICS TAB */}
            <TabsContent value="analytics" className="m-0" key="analytics">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 md:grid-cols-3">
                
                {/* AI INSIGHTS CARD */}
                <Card className="glass-card border-white/5 md:col-span-1 relative overflow-hidden bg-gradient-to-b from-primary/10 to-transparent">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={100}/></div>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary font-heading">
                      <Zap className="fill-primary text-primary" /> Yapay Zeka İçgörüleri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                      <p className="text-sm text-white/90 leading-relaxed">
                        <strong className="text-primary block mb-1">Düşük Yoğunluk Uyarısı:</strong> 
                        Grafiklere göre <span className="text-white font-bold">Çarşamba</span> günleri siparişleriniz %30 düşüş gösteriyor. Çarşamba sabahına özel bir <span className="text-green-400 font-bold">Anlık Bildirim (Push)</span> kampanyası oluşturmamı ister misiniz?
                      </p>
                      <Button size="sm" className="w-full mt-3 bg-primary/20 text-primary hover:bg-primary hover:text-white border border-primary/30">Kampanya Oluştur</Button>
                    </div>
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                      <p className="text-sm text-white/90 leading-relaxed">
                        <strong className="text-blue-400 block mb-1">Şube Performansı:</strong> 
                        Kadıköy şubenizdeki sadakat kartı kullanım oranı Beşiktaş'a göre %85 daha yüksek.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* CHARTS */}
                <div className="md:col-span-2 space-y-6">
                  <Card className="glass-card border-white/5">
                    <CardHeader>
                      <CardTitle className="font-heading flex items-center gap-2"><TrendingUp size={18}/> Haftalık Ziyaret Trafiği</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={WEEKLY_DATA}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="name" stroke="#ffffff50" axisLine={false} tickLine={false} />
                          <YAxis stroke="#ffffff50" axisLine={false} tickLine={false} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#000', borderColor: '#ffffff20', borderRadius: '8px' }} />
                          <Line type="monotone" dataKey="ziyaret" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-white/5">
                    <CardHeader>
                      <CardTitle className="font-heading">Şube Yoğunluk Dağılımı</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={BRANCH_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {BRANCH_DATA.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ backgroundColor: '#000', borderColor: '#ffffff20', borderRadius: '8px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 space-y-3">
                        {BRANCH_DATA.map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}/>
                            <span className="text-sm text-white/80">{entry.name} (%{entry.value})</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </motion.div>
            </TabsContent>

            {/* CUSTOMERS TAB */}
            <TabsContent value="customers" className="m-0" key="customers">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="glass-card border-white/5">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-heading text-2xl">Müşteri Listesi</CardTitle>
                      <CardDescription>{selectedBranch} şubenize ait sadakat durumu.</CardDescription>
                    </div>
                    <Button onClick={handleExportCSV} variant="outline" className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10">
                      <Download className="mr-2" size={16} /> Excel İndir (Lead)
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border border-white/10 overflow-hidden bg-black/20 overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-black/40">
                          <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-white/70">İsim / Seviye</TableHead>
                            <TableHead className="text-white/70">İletişim</TableHead>
                            <TableHead className="text-white/70">Toplam Damga</TableHead>
                            <TableHead className="text-white/70">Güncel Kart</TableHead>
                            <TableHead className="text-white/70 text-right">Son Ziyaret</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCustomers.length === 0 && (
                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-white/50">Bu şubede kayıtlı müşteri yok.</TableCell></TableRow>
                          )}
                          {filteredCustomers.map((c) => {
                            const tier = getVIPTier(c.lifetimeStamps);
                            return (
                              <TableRow key={c.id} className="border-white/5 hover:bg-white/5">
                                <TableCell>
                                  <div className="font-medium text-white/90">{c.name}</div>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold mt-1 inline-block ${tier.bg} ${tier.color}`}>{tier.name}</span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col"><span className="text-white/90 font-mono text-sm">{c.phone}</span></div>
                                </TableCell>
                                <TableCell><span className="text-white font-bold text-lg">{c.lifetimeStamps}</span></TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Progress value={(c.stamps / 6) * 100} className="w-[80px] h-2 bg-white/10 [&>div]:bg-primary" />
                                    <span className="text-xs font-bold text-primary">{c.stamps}/6</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-sm">
                                  {c.lastVisit}
                                  {c.id === 3 && <div className="text-purple-400 text-[10px] font-bold mt-1">💤 Uyuyan Müşteri</div>}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* QR CODE TAB */}
            <TabsContent value="qrcode" className="m-0" key="qrcode">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 md:grid-cols-2">
                <Card className="glass-card border-white/5">
                  <CardContent className="pt-8 pb-6 flex flex-col items-center text-center">
                    <div className="bg-white p-5 rounded-2xl mb-6 shadow-xl">
                      <QRCodeSVG value={qrUrl || 'https://stampify.vercel.app'} size={220} level="H" includeMargin={true} ref={qrRef} />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">Masa / Kasa QR Kodu</h3>
                    <p className="text-neutral-400 text-sm mb-6 max-w-xs">Bu kodu kasanıza veya masalara koyun. Müşteriler okutarak damga kazanır.</p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                      <Button onClick={downloadQR} className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2">
                        <Download size={16}/> PNG İndir
                      </Button>
                      <Button onClick={() => window.print()} variant="outline" className="flex-1 border-white/10 gap-2">
                        <Printer size={16}/> Yazdır
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-indigo-500/20">
                  <CardHeader>
                    <CardTitle className="font-heading text-xl flex items-center gap-2 text-indigo-400">
                      <Info size={20}/> Nasıl Çalışır?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4 text-sm text-neutral-300">
                      <li className="flex items-start gap-3">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                        Müşteri telefonunun kamerasıyla QR kodu okuttur.
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                        Tarayıcıda işletmenizin damga sayfası açılır.
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                        Müşteri telefonu kasadaki görevliye gösterir.
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                        Görevli 4 haneli PIN'ini girer → müşteriye 1 damga eklenir!
                      </li>
                    </ul>
                    <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <p className="text-amber-400 text-xs font-semibold mb-1">⚠️ PIN neden gerekli?</p>
                      <p className="text-amber-200/60 text-xs">PIN kodu, müşterinin QR kodun fotoğrafını çekip evden sahte damga eklemesini engeller. Sadece kasadaki çalışan PIN'i bilir.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="campaigns" className="m-0" key="campaigns">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 md:grid-cols-2">
                <Card className="glass-card border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-heading text-xl"><Sparkles className="text-amber-500" /> AI Metin Yazarı</CardTitle>
                    <CardDescription>Hedef kitlenize uygun mükemmel mesajı saniyeler içinde oluşturun.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-muted-foreground ml-1">Mesaj Tonu</Label>
                      <div className="flex flex-wrap gap-2">
                        {(["friendly", "professional", "excited", "birthday", "churn"] as const).map((tone) => {
                          const isActive = campaignTone === tone;
                          let specificStyle = "bg-black/20 border-white/10 hover:bg-white/10";
                          if (tone === "birthday") specificStyle = isActive ? "bg-pink-600 text-white shadow-[0_0_15px_rgba(219,39,119,0.5)]" : "border-pink-500/30 text-pink-400 hover:text-pink-300";
                          if (tone === "churn") specificStyle = isActive ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]" : "border-purple-500/30 text-purple-400 hover:text-purple-300";
                          if (isActive && tone !== "birthday" && tone !== "churn") specificStyle = "bg-primary text-primary-foreground shadow-[0_0_15px_var(--color-primary)]";
                          
                          return (
                            <Button key={tone} variant={isActive && tone !== "birthday" && tone !== "churn" ? "default" : "outline"} onClick={() => setCampaignTone(tone)} className={`capitalize transition-all ${specificStyle}`}>
                              {tone === "friendly" ? "Samimi" : tone === "professional" ? "Profesyonel" : tone === "excited" ? "Heyecanlı" : tone === "birthday" ? "🎂 Doğum Günü" : "💤 Uyuyan (Churn)"}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <Button onClick={handleGenerateMessage} disabled={isGenerating} className="w-full h-12 gap-2 text-md font-semibold relative overflow-hidden group">
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      {isGenerating ? <span className="animate-pulse">Oluşturuluyor...</span> : <>Yapay Zeka ile Üret <Sparkles size={18} /></>}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="glass-card border-white/5">
                  <CardHeader>
                    <CardTitle className="font-heading text-xl">Toplu Gönderim</CardTitle>
                    <CardDescription>Mesajınızı tüm müşterilerin telefonlarına iletin.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-muted-foreground ml-1">Mesaj İçeriği</Label>
                      <textarea className="flex min-h-[110px] w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm focus-visible:ring-1 focus-visible:ring-primary/50 resize-none text-white/90" value={generatedMessage} onChange={(e) => setGeneratedMessage(e.target.value)} placeholder="Mesajınızı buraya yazın..." />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className={`h-12 border-white/10 ${campaignType === 'email' ? 'bg-white/10 ring-1 ring-white/30' : 'bg-black/30'}`} onClick={() => setCampaignType('email')}>
                        📧 E-Posta
                      </Button>
                      <Button variant="outline" className={`h-12 border-white/10 ${campaignType === 'push' ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/50' : 'bg-black/30 text-white/70'}`} onClick={() => setCampaignType('push')}>
                        <BellRing size={16} className="mr-2"/> Push Bildirim
                      </Button>
                    </div>

                    <Button 
                      className={`w-full h-12 gap-2 text-white font-semibold text-md transition-all ${campaignType === 'push' ? 'bg-green-600 hover:bg-green-500 shadow-[0_0_20px_rgba(22,163,74,0.3)]' : campaignTone === "churn" ? "bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.3)]" : "bg-primary hover:bg-primary/90 shadow-[0_0_20px_var(--color-primary)]"}`}
                      onClick={() => {
                        if(!generatedMessage) return toast.error("Mesaj boş olamaz.");
                        toast.success(`${campaignType === 'push' ? 'Anlık Push Bildirimi' : 'E-posta'} başarıyla gönderildi! (Mock)`, { icon: <Send size={18} /> });
                        setGeneratedMessage("");
                      }}
                    >
                      <Send size={18} /> Gönder
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* FEEDBACK SHIELD TAB */}
            <TabsContent value="feedback" className="m-0" key="feedback">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="glass-card border-red-500/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
                  <CardHeader>
                    <CardTitle className="font-heading text-2xl flex items-center gap-2 text-red-400">
                      <ShieldAlert /> Yorum Kalkanı
                    </CardTitle>
                    <CardDescription>
                      {selectedBranch} şubeniz için gizlenen (Google Maps'e gitmeyen) kötü yorumlar.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredFeedbacks.length === 0 && (
                        <div className="text-center py-8 text-white/50">Harika! Bu şubede hiç şikayet yok. 🎉</div>
                      )}
                      {filteredFeedbacks.map(f => (
                        <div key={f.id} className="p-4 bg-black/40 border border-red-500/20 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-bold text-white/90">{f.name}</span>
                              <span className="text-muted-foreground text-xs ml-3">{f.date}</span>
                              <div className="text-xs text-white/50 mt-0.5"><MapPin size={10} className="inline mr-1"/>{f.branch}</div>
                            </div>
                            <div className="flex gap-1 bg-red-500/20 px-2 py-1 rounded-full border border-red-500/30 text-red-400 font-bold text-xs">
                              ⭐ {f.rating} Yıldız
                            </div>
                          </div>
                          <p className="text-white/80 text-sm">{f.comment}</p>
                          <div className="mt-4 flex gap-2">
                            <Button size="sm" variant="outline" className="border-white/10 text-white/70 hover:bg-white/10">İncele</Button>
                            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">Özür Mesajı Gönder & Telafi Et</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* STAFF MANAGEMENT TAB */}
            <TabsContent value="staff" className="m-0" key="staff">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 md:grid-cols-2">
                {/* Add Staff Form */}
                <Card className="glass-card border-white/5">
                  <CardHeader>
                    <CardTitle className="font-heading text-xl flex items-center gap-2">
                      <UserPlus className="text-indigo-400" size={20}/> Yeni Çalışan Ekle
                    </CardTitle>
                    <CardDescription>Garson veya kasiyer hesabı oluşturun.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Ad Soyad</Label>
                      <Input placeholder="Örn: Ali Veli" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} className="bg-background/50 border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label>Rol</Label>
                      <div className="flex gap-2">
                        {['garson','kasiyer','müdür'].map(r => (
                          <Button key={r} variant="outline" onClick={() => setNewStaffRole(r)}
                            className={`capitalize flex-1 ${newStaffRole === r ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-black/30 border-white/10'}`}>
                            {r === 'garson' ? '🍽️' : r === 'kasiyer' ? '💳' : '👔'} {r}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Onay PIN Kodu (4 haneli)</Label>
                      <Input type="text" maxLength={4} placeholder="Örn: 5678" value={newStaffPin} onChange={e => setNewStaffPin(e.target.value.replace(/\D/g,''))} className="bg-background/50 border-white/10 text-center text-2xl tracking-[0.5em] font-mono" />
                    </div>
                    <Button onClick={handleAddStaff} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 font-semibold gap-2">
                      <UserPlus size={18}/> Çalışan Ekle
                    </Button>
                  </CardContent>
                </Card>

                {/* Staff List */}
                <Card className="glass-card border-white/5">
                  <CardHeader>
                    <CardTitle className="font-heading text-xl">Mevcut Çalışanlar</CardTitle>
                    <CardDescription>{staffList.length} çalışan kayıtlı</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {staffList.length === 0 ? (
                      <div className="text-center py-8 text-white/40">Henüz çalışan eklenmemiş.</div>
                    ) : (
                      <div className="space-y-3">
                        {staffList.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                            <div>
                              <div className="font-semibold text-white">{s.name}</div>
                              <div className="text-xs text-white/50 capitalize">{s.role === 'garson' ? '🍽️' : s.role === 'kasiyer' ? '💳' : '👔'} {s.role} · PIN: {s.pin}</div>
                            </div>
                            <button onClick={() => handleDeleteStaff(s.id, s.name)} className="text-red-400/50 hover:text-red-400 transition-colors p-2">
                              <Trash2 size={18}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
