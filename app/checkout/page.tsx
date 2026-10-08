'use client';
import { useState } from 'react';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/site-config';
import { getCoupons, validateCoupon, Coupon } from '@/lib/coupons';

export default function Checkout() {
  const [governorate, setGovernorate] = useState('كفر الشيخ');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // إدارة الكوبون
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const getShippingCost = (gov: string) => {
    if (SITE_CONFIG.shippingRates.tier65.includes(gov)) return 65;
    if (SITE_CONFIG.shippingRates.tier80.includes(gov)) return 80;
    if (SITE_CONFIG.shippingRates.tier90.includes(gov)) return 90;
    return SITE_CONFIG.shippingRates.tier100Default;
  };

  const shippingCost = getShippingCost(governorate);

  const handleApplyCoupon = async () => {
    setCouponMessage(null);
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) {
      setCouponMessage({ text: 'يرجى كتابة كود الخصم أولاً.', isError: true });
      return;
    }
    setIsApplying(true);
    try {
      const allCoupons = await getCoupons();
      const found = allCoupons.find(c => c.code === code);
      if (!found) {
        setCouponMessage({ text: '❌ كود الخصم غير صحيح أو غير موجود!', isError: true });
        setAppliedCoupon(null);
        return;
      }
      const res = validateCoupon(found, 500); // قيمة تقريبية افتراضية
      if (!res.valid) {
        setCouponMessage({ text: `❌ ${res.message}`, isError: true });
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(found);
      setCouponMessage({ text: `✅ تم تفعيل الكوبون (${found.code}) بنجاح!`, isError: false });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponMessage(null);
  };

  const handleWhatsAppCheckout = () => {
    if (!name || !phone || !address) {
      alert('يرجى كتابة الاسم ورقم الهاتف والعنوان.');
      return;
    }
    let message = `أهلاً هندسة بيرفيوم، أريد تأكيد الأوردر:%0a- الاسم: ${name}%0a- الهاتف: ${phone}%0a- العنوان: ${address}%0a- المحافظة: ${governorate}%0a- مصاريف الشحن: ${shippingCost} ج.م`;
    if (appliedCoupon) {
      message += `%0a- كود الخصم: ${appliedCoupon.code} (${appliedCoupon.value} ${appliedCoupon.type === 'percent' ? '%' : 'ج.م'})`;
    }
    window.open(`https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-gray-900 text-white rounded-xl mt-6 border border-yellow-600" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <Link href="/" className="text-sm text-yellow-400 hover:underline">← العودة للرئيسية</Link>
        <h2 className="text-2xl font-bold text-yellow-500 text-center">إتمام الأوردر والشحن 🚚</h2>
        <div style={{ width: '80px' }}></div>
      </div>

      <div className="space-y-4">
        <input 
          type="text" 
          placeholder="اسمك الكامل" 
          value={name} 
          onChange={(e)=>setName(e.target.value)} 
          className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white" 
        />
        <input 
          type="tel" 
          placeholder="رقم الهاتف" 
          value={phone} 
          onChange={(e)=>setPhone(e.target.value)} 
          className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white" 
        />
        <textarea 
          placeholder="العنوان بالتفصيل" 
          value={address} 
          onChange={(e)=>setAddress(e.target.value)} 
          className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white"
        ></textarea>
        
        <div>
          <label className="block mb-2 font-semibold">اختر المحافظة:</label>
          <select 
            value={governorate} 
            onChange={(e)=>setGovernorate(e.target.value)} 
            className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-white"
          >
            <option value="كفر الشيخ">كفر الشيخ (65 ج.م)</option>
            <option value="البحيرة">البحيرة (65 ج.م)</option>
            <option value="الإسكندرية">الإسكندرية (80 ج.م)</option>
            <option value="الدقهلية">الدقهلية (80 ج.م)</option>
            <option value="الغربية">الغربية (80 ج.م)</option>
            <option value="القاهرة">القاهرة (90 ج.م)</option>
            <option value="الجيزة">الجيزة (90 ج.م)</option>
            <option value="الصعيد وسيناء">الصعيد وسيناء (100 ج.م)</option>
          </select>
        </div>

        {/* قسم كود الخصم */}
        <div className="bg-gray-800 p-3 rounded-lg border border-yellow-600/40">
          <label className="block text-sm text-yellow-500 font-bold mb-2">🎟️ هل لديك كود خصم؟</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="مثال: HINDSE10" 
              value={couponCodeInput} 
              onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
              disabled={!!appliedCoupon}
              className="flex-1 p-2 bg-gray-900 rounded border border-gray-700 text-white text-sm"
            />
            {!appliedCoupon ? (
              <button 
                type="button" 
                onClick={handleApplyCoupon}
                disabled={isApplying}
                className="bg-yellow-600 text-black px-4 py-2 rounded font-bold text-sm hover:bg-yellow-500"
              >
                {isApplying ? 'فحص...' : 'تطبيق'}
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleRemoveCoupon}
                className="bg-red-800 text-red-200 px-3 py-2 rounded font-bold text-sm hover:bg-red-700"
              >
                إلغاء ✕
              </button>
            )}
          </div>
          {couponMessage && (
            <p className={`text-xs mt-2 font-bold ${couponMessage.isError ? 'text-red-400' : 'text-green-400'}`}>
              {couponMessage.text}
            </p>
          )}
        </div>

        <div className="bg-gray-800 p-3 rounded flex justify-between items-center font-bold">
          <span>تكلفة الشحن التلقائية:</span>
          <span className="text-yellow-400">{shippingCost} ج.م</span>
        </div>

        <button 
          onClick={handleWhatsAppCheckout} 
          className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-500 transition"
        >
          إرسال الفاتورة عبر واتساب لتأكيد الأوردر 📲
        </button>
      </div>
    </div>
  );
}