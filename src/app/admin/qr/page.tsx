'use client';

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Share2, Info } from 'lucide-react';

export default function AdminQRPage() {
  const qrRef = useRef<SVGSVGElement>(null);
  
  // Örnek işletme ID'si
  const businessId = "demo-cafe-123";
  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/c/${businessId}` : `https://stampify.app/c/${businessId}`;

  const downloadQR = () => {
    const svg = qrRef.current;
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `stampify-qr-${businessId}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">QR Kodum</h1>
        <p className="text-gray-400">
          Müşterilerinizin damga (pul) kazanması için bu QR kodu kasanızda veya masalarınızda sergileyin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* QR Code Display Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden print:border-none print:bg-white print:text-black">
          {/* Print only header */}
          <div className="hidden print:block mb-8">
            <h2 className="text-4xl font-bold mb-2">Damga Kazan!</h2>
            <p className="text-xl">Kameranı okut, damganı kap.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl mb-6 shadow-xl">
            <QRCodeSVG 
              value={qrUrl}
              size={256}
              level={"H"}
              includeMargin={true}
              ref={qrRef}
              className="w-48 h-48 sm:w-64 sm:h-64"
            />
          </div>
          
          <div className="print:hidden">
            <h3 className="text-xl font-semibold mb-2">Masa Tenekesi Formatı</h3>
            <p className="text-neutral-400 text-sm max-w-xs">
              Bu QR kodunu indirip matbaada bastırabilir veya doğrudan yazıcıdan çıktı alabilirsiniz.
            </p>
          </div>
        </div>

        {/* Actions & Instructions */}
        <div className="flex flex-col gap-6 print:hidden">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-400" />
              Hızlı İşlemler
            </h3>
            <div className="flex flex-col gap-3">
              <button 
                onClick={downloadQR}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                PNG Olarak İndir
              </button>
              <button 
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white py-3 px-4 rounded-xl font-medium transition-colors border border-neutral-700"
              >
                <Printer className="w-5 h-5" />
                Yazdır (A4 Çıktı Al)
              </button>
            </div>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-indigo-400">
              <Info className="w-5 h-5" />
              Nasıl Çalışır?
            </h3>
            <ul className="space-y-3 text-sm text-neutral-300">
              <li className="flex items-start gap-2">
                <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">1</span>
                Müşteri telefon kamerasını açar ve QR kodu okutur.
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">2</span>
                Tarayıcıda işletmenizin sayfası açılır.
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">3</span>
                Müşteri telefonunu kasadaki görevliye gösterir.
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">4</span>
                Kasadaki görevli ekrandaki "Onayla" butonuna basarak 4 haneli güvenlik PIN'ini girer ve müşteriye 1 damga verir.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
