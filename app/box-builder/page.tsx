'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SITE_CONFIG } from '@/lib/site-config';

export default function FillYourBox() {
  const [step, setStep] = useState(1);
  const [boxSize, setBoxSize] = useState<{name: string, price: number} | null>(null);
  const [boxShape, setBoxShape] = useState<string>('');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  const boxSizes = [
    { name: 'صغير', price: 150 },
    { name: 'وسط', price: 200 },
    { name: 'كبير', price: 250 },
  ];

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('products').select('*');
      if (data && data.length > 0) {
        setProducts(data);
      }
    }
    load();
  }, []);

  const total = (boxSize?.price || 0) + selectedProducts.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

  const handleOrderWhatsApp = () => {
    const itemsList = selectedProducts.map(p => p.name).join(', ') || 'بدون منتجات إضافية';
    const message = `أهلاً هندسة بيرفيوم، أريد طلب بوكس هدايا:%0a- حجم وشكل البوكس: ${boxSize?.name} (${boxShape})%0a- المنتجات المختارة: ${itemsList}%0a- الإجمالي: ${total} ج.م`;
    window.open(`https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-gray-900 text-white rounded-xl mt-6 border border-yellow-600" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-sm text-yellow-400 hover:underline">← العودة للرئيسية</Link>
        <h1 className="text-2xl font-bold text-yellow-500 text-center">مود: املأ بوكسك 🎁</h1>
        <div style={{ width: '80px' }}></div>
      </div>

      {/* الخطوة 1: اختيار حجم البوكس */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-yellow-500 mb-4 text-center">اختر حجم البوكس 🎁</h2>
          <div className="space-y-3">
            {boxSizes.map((size) => (
              <button 
                key={size.name}
                onClick={() => { setBoxSize(size); setStep(2); }}
                className="w-full p-4 bg-gray-800 border border-yellow-600 rounded-xl hover:bg-yellow-600 hover:text-black transition flex justify-between items-center font-bold text-lg"
              >
                <span>بوكس {size.name}</span>
                <span className="text-yellow-400">{size.price} ج.م</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* الخطوة 2: اختيار شكل البوكس */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold text-yellow-500 mb-4 text-center">اختر شكل البوكس</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {['اسطواني', 'مستطيل'].map((shape) => (
              <button 
                key={shape}
                onClick={() => { setBoxShape(shape); setStep(3); }}
                className="p-6 bg-gray-800 border border-yellow-600 rounded-xl hover:bg-yellow-600 hover:text-black transition text-center text-xl font-bold"
              >
                {shape}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="w-full bg-gray-800 text-gray-300 py-2 rounded">السابق</button>
        </div>
      )}

      {/* الخطوة 3: ملء البوكس */}
      {step === 3 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-lg font-bold text-yellow-500">البوكس: {boxSize?.name} ({boxShape})</h2>
              <p className="text-sm text-gray-400">سعر البوكس: {boxSize?.price} ج.م</p>
            </div>
            <button onClick={() => setStep(2)} className="text-xs bg-gray-800 text-yellow-400 px-3 py-1 rounded border border-gray-700">تغيير الشكل</button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 mb-4 bg-gray-800 p-3 rounded-lg border border-gray-700">
            {products.length > 0 ? (
              products.map((p) => {
                const isSelected = selectedProducts.some(sp => sp.id === p.id);
                return (
                  <div key={p.id} className="flex justify-between items-center p-2 bg-gray-900 rounded">
                    <div>
                      <span className="text-sm font-bold block">{p.name}</span>
                      <span className="text-xs text-yellow-400">{p.price} ج.م</span>
                    </div>
                    <button 
                      onClick={() => {
                        if (isSelected) {
                          setSelectedProducts(selectedProducts.filter(sp => sp.id !== p.id));
                        } else {
                          setSelectedProducts([...selectedProducts, p]);
                        }
                      }}
                      className={`text-xs px-3 py-1.5 rounded font-bold transition ${isSelected ? 'bg-red-600 text-white' : 'bg-yellow-600 text-black'}`}
                    >
                      {isSelected ? 'إزالة' : 'إضافة'}
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-sm text-gray-400">لا توجد منتجات مسجلة حالياً.</p>
            )}
          </div>

          <div className="border-t border-gray-700 pt-3 mb-4 flex justify-between items-center text-lg font-bold">
            <span>الإجمالي:</span>
            <span className="text-yellow-400">{total} ج.م</span>
          </div>

          <button 
            onClick={handleOrderWhatsApp}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-500 transition shadow-lg"
          >
            تأكيد وطلب البوكس عبر واتساب 📲
          </button>
        </div>
      )}
    </div>
  );
}