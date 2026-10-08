'use client';
import { useState } from 'react';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/site-config';

export default function GiftAssistant() {
  const [recipient, setRecipient] = useState('');
  const [age, setAge] = useState('');
  const [occasion, setOccasion] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleOrderWhatsApp = (recommendation: string) => {
    const message = `أهلاً هندسة بيرفيوم، استشرت مساعد الهدايا الذكي ورشح لي:%0a- ${recommendation}%0a- لمن: ${recipient}%0a- المناسبة: ${occasion}`;
    window.open(`https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-gray-900 text-white rounded-xl mt-6 border border-yellow-600" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-sm text-yellow-400 hover:underline">← العودة للرئيسية</Link>
        <h1 className="text-2xl font-bold text-yellow-500 text-center">مساعد الهدايا الذكي 🤖</h1>
        <div style={{ width: '80px' }}></div>
      </div>

      {!showResults ? (
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-semibold">الهدية لمن؟</label>
            <select value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white">
              <option value="">اختر الشخص</option>
              <option value="صديق / صديقة">صديق / صديقة</option>
              <option value="زوج / زوجة / خطيبة">زوج / زوجة / خطيبة</option>
              <option value="أحد أفراد العائلة">أحد أفراد العائلة</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-semibold">العمر كام سنة؟</label>
            <select value={age} onChange={(e) => setAge(e.target.value)} className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white">
              <option value="">اختر الفئة العمرية</option>
              <option value="18-25 سنة">18 - 25 سنة</option>
              <option value="25-40 سنة">25 - 40 سنة</option>
              <option value="أكبر من 40 سنة">أكبر من 40 سنة</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-semibold">ما هي المناسبة؟</label>
            <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white">
              <option value="">اختر المناسبة</option>
              <option value="عيد ميلاد">عيد ميلاد</option>
              <option value="تخرج">تخرج</option>
              <option value="خطوبة / زفاف">خطوبة / زفاف</option>
              <option value="هدية تقدير ومفاجأة">هدية تقدير ومفاجأة</option>
            </select>
          </div>
          <button 
            onClick={() => {
              if (!recipient || !occasion) {
                alert('يرجى اختيار لمن الهدية والمناسبة أولاً.');
                return;
              }
              setShowResults(true);
            }} 
            className="w-full bg-yellow-600 text-black py-3 rounded-lg font-bold hover:bg-yellow-500 transition shadow-md"
          >
            اعرض الهدايا المقترحة المناسبة 🎁
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-yellow-400 mb-2">الترشيحات المناسبة بناءً على اختيارك:</h2>
          
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 space-y-3">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
              <div>
                <h3 className="font-bold text-white">1. عطر هندسة الملكي الفاخر + بوكيه جوري</h3>
                <p className="text-xs text-gray-400">مناسب جداً لـ {recipient} في {occasion}</p>
              </div>
              <button 
                onClick={() => handleOrderWhatsApp('عطر هندسة الملكي + بوكيه ورد جوري')}
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded font-bold hover:bg-green-500"
              >
                طلب عبر واتساب 📲
              </button>
            </div>

            <div className="flex justify-between items-center pt-1">
              <div>
                <h3 className="font-bold text-white">2. بوكس هدايا مخصص بالكامل</h3>
                <p className="text-xs text-gray-400">بوكس أنيق يحتوي على عطر وساعة وورد</p>
              </div>
              <button 
                onClick={() => handleOrderWhatsApp('بوكس هدايا مخصص')}
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded font-bold hover:bg-green-500"
              >
                طلب عبر واتساب 📲
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setShowResults(false)} 
              className="w-1/2 bg-gray-800 text-yellow-500 py-2.5 rounded font-bold border border-yellow-600"
            >
              إعادة الاختيار
            </button>
            <Link 
              href="/" 
              className="w-1/2 bg-yellow-600 text-black py-2.5 rounded font-bold text-center hover:bg-yellow-500 transition"
            >
              تصفح كل المنتجات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}