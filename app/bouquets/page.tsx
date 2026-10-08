'use client';
import { useState } from 'react';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/site-config';

export default function BouquetBuilder() {
  const [roseCount, setRoseCount] = useState<number>(10);
  const [includeBabyFlower, setIncludeBabyFlower] = useState(false);
  const [includeButterfly, setIncludeButterfly] = useState(false);

  const [customImage, setCustomImage] = useState<string>('');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const rosePrice = SITE_CONFIG.prices.rose;
  const babyFlowerPrice = SITE_CONFIG.prices.babyFlower;
  const butterflyPrice = SITE_CONFIG.prices.butterfly;

  const totalPrice = 
    (roseCount * rosePrice) + 
    (includeBabyFlower ? babyFlowerPrice : 0) + 
    (includeButterfly ? butterflyPrice : 0);

  const handleOrderWhatsApp = () => {
    const details = `${roseCount} وردة ${includeBabyFlower ? '+ بيبي فلاور ' : ''}${includeButterfly ? '+ فراشات زينة' : ''}`;
    let message = `🛒 *طلب بوكيه ورد من متجر هندسة بيرفيوم*%0A`;
    message += `----------------------------------%0A`;
    message += `🌹 *التفاصيل:* ${details}%0A`;
    message += `💰 *السعر الإجمالي:* ${totalPrice} ج.م%0A`;
    if (customImageUrl) {
      message += `----------------------------------%0A`;
      message += `📸 *رابط صورة التصميم المطلوب من العميل:*%0A${customImageUrl}%0A`;
      message += `*(اضغط على الرابط أعلاه لعرض صورة البوكيه وتنفيذه بدقة)*%0A`;
    } else if (customImage) {
      message += `----------------------------------%0A`;
      message += `📸 *تنبيه للبائع:* العميل اختار تصميم بوكيه مخصص، ومرفق مع الطلب!%0A`;
    }
    window.open(`https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-gray-900 text-white rounded-xl mt-6 border border-yellow-600" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-sm text-yellow-400 hover:underline">← العودة للرئيسية</Link>
        <h1 className="text-2xl font-bold text-yellow-500 text-center">تصميم بوكيه الورد 💐</h1>
        <div style={{ width: '80px' }}></div>
      </div>
      
      {/* عدد الورود */}
      <div className="mb-5">
        <label className="block mb-2 font-semibold">كم عدد الورود التي تريدها؟ (سعر الوردة {rosePrice} ج.م)</label>
        <div className="flex gap-2 mb-3">
          {[5, 10, 15, 20].map((num) => (
            <button 
              key={num} 
              onClick={() => setRoseCount(num)}
              className={`px-4 py-2 rounded font-bold transition ${roseCount === num ? 'bg-yellow-600 text-black' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
            >
              {num} ورَدات
            </button>
          ))}
        </div>
        <input 
          type="number" 
          value={roseCount} 
          onChange={(e) => setRoseCount(Math.max(1, Number(e.target.value)))}
          className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white"
          placeholder="أو اكتب العدد يدوياً هنا"
        />
      </div>

      {/* الإضافات (بيبي فلاور / فراشات) */}
      <div className="mb-6 space-y-3 bg-gray-800 p-4 rounded-lg">
        <label className="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={includeBabyFlower} 
            onChange={(e) => setIncludeBabyFlower(e.target.checked)}
            className="w-5 h-5 accent-yellow-600"
          />
          <span>إضافة بيبي فلاور (+{babyFlowerPrice} ج.م)</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={includeButterfly} 
            onChange={(e) => setIncludeButterfly(e.target.checked)}
            className="w-5 h-5 accent-yellow-600"
          />
          <span>إضافة فراشات زينة (+{butterflyPrice} ج.م)</span>
        </label>
      </div>

      {/* رفع صورة تصميم مخصص */}
      <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <label className="block mb-2 font-semibold text-yellow-400">
          📸 هل لديك صورة لتصميم بوكيه معين تريد تنفيذه؟ (اختياري)
        </label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={async (e) => {
            if (e.target.files && e.target.files[0]) {
              const file = e.target.files[0];
              setImageFileName(file.name);
              const reader = new FileReader();
              reader.onload = (ev) => {
                if (ev.target?.result) setCustomImage(ev.target.result as string);
              };
              reader.readAsDataURL(file);

              setIsUploading(true);
              try {
                const fd = new FormData();
                fd.append('file', file);
                const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
                const data = await res.json();
                if (data?.success && data?.url) {
                  setCustomImageUrl(data.url);
                }
              } catch (err) {
                console.error(err);
              } finally {
                setIsUploading(false);
              }
            }
          }}
          className="w-full text-sm text-gray-300"
        />
        {customImage && (
          <div className="mt-3 flex items-center gap-3 bg-gray-900 p-2 rounded border border-yellow-600/50">
            <img src={customImage} alt="معاينة التصميم" className="w-14 h-14 object-cover rounded border border-yellow-500" />
            <div>
              {isUploading ? (
                <span className="text-xs text-yellow-400 font-bold block">⏳ جاري رفع وتجهيز الصورة لرابط الواتساب...</span>
              ) : (
                <span className="text-xs text-green-400 font-bold block">✓ تم تجهيز الصورة بنجاح ({imageFileName})</span>
              )}
              <span className="text-xs text-gray-400">ستُرسل الصورة برابط مباشر للبائع مع رسالة الواتساب لتنفيذها</span>
            </div>
          </div>
        )}
      </div>

      {/* إجمالي السعر */}
      <div className="border-t border-gray-700 pt-4 mb-4 flex justify-between items-center text-xl font-bold">
        <span>إجمالي السعر:</span>
        <span className="text-yellow-500">{totalPrice} ج.م</span>
      </div>

      <button 
        onClick={handleOrderWhatsApp}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-500 transition shadow-lg"
      >
        طلب البوكيه عبر واتساب 📲
      </button>
    </div>
  );
}