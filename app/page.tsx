'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SITE_CONFIG } from '@/lib/site-config';
import { getCoupons, validateCoupon, Coupon } from '@/lib/coupons';

type Category = {
  id: string;
  name: string;
  slug?: string;
};

type Product = {
  id: number | string;
  name: string;
  category?: string;
  category_id?: string;
  price: number;
  old_price?: number;
  desc?: string;
  image?: string;
  sizes?: Record<string, number>;
};

type CartItem = {
  id: number;
  name: string;
  price: number;
  details: string;
  customImage?: string;
  customImageUrl?: string;
};

type BoxSize = {
  name: string;
  price: number;
};

export default function Home() {
  const TAYEEB_URL = SITE_CONFIG.tatayebUrl;
  const TBR_URL = SITE_CONFIG.tabarUrl;
  const WHATSAPP_NUMBER = SITE_CONFIG.whatsappNumber;
  const LOGO_URL = SITE_CONFIG.topLogoUrl;
  const LINKEDIN_URL = SITE_CONFIG.linkedinUrl;
  const ADMIN_PASSWORD = SITE_CONFIG.adminPassword;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientGovernorate, setClientGovernorate] = useState('كفر الشيخ');
  const [clientAddress, setClientAddress] = useState('');

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const [selectedSizes, setSelectedSizes] = useState<Record<string | number, string>>({});

  // بيانات من Supabase
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // إعدادات المتجر (الورد والإضافات) قابلة للتعديل من الأدمن
  const [storeSettings, setStoreSettings] = useState({
    rosePrice: SITE_CONFIG.prices.rose,
    babyBreathPrice: SITE_CONFIG.prices.babyFlower,
    butterflyPrice: SITE_CONFIG.prices.butterfly,
  });

  // جلب البيانات من Supabase عند فتح الموقع
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adminKey = params.get('admin');
    if (adminKey === ADMIN_PASSWORD || adminKey === 'karim123' || adminKey === 'karim1234') {
      setIsAdminOpen(true);
    }

    const fetchData = async () => {
      try {
        const { data: catData } = await supabase.from('categories').select('*');

        if (catData && catData.length > 0) {
          const realCategories = catData.filter((c: any) => !c.slug?.startsWith('_system'));
          setCategories([
            { id: 'all', name: '✨ الكل' },
            ...(realCategories as Category[])
          ]);
        }

        const { data: prodData } = await supabase.from('products').select('*');

        if (prodData && prodData.length > 0) {
          const mappedProducts: Product[] = prodData.map((item: any) => {
            const sizes: Record<string, number> = {};
            if (item.price_25ml) sizes['25ml'] = Number(item.price_25ml);
            if (item.price_35ml) sizes['35ml'] = Number(item.price_35ml);
            if (item.price_50ml) sizes['50ml'] = Number(item.price_50ml);
            if (item.price_100ml) sizes['100ml'] = Number(item.price_100ml);

            return {
              id: item.id,
              name: item.name,
              category: item.category_id,
              category_id: item.category_id,
              price: Number(item.price) || 0,
              old_price: Number(item.old_price) || undefined,
              desc: item.description || item.desc || '',
              image: item.image_url || item.image || LOGO_URL,
              sizes: Object.keys(sizes).length > 0 ? sizes : undefined
            };
          });
          setAllProducts(mappedProducts);
        } else {
          // منتجات افتراضية لو القاعدة فارغة أول مرة
          setAllProducts([
            { 
              id: 1, 
              name: 'عطر هندسة الملكي الفاخر', 
              category: 'perfumes', 
              price: 450, 
              sizes: { '25ml': 200, '35ml': 280, '50ml': 450, '100ml': 750 },
              desc: 'عطر رجالي/نسائي فخم يدوم طويلاً', 
              image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=300&q=80' 
            },
            { id: 2, name: 'بوكيه ورد جوري أحمر فاخر', category: 'flowers', price: 300, desc: 'مع بوكس اسطواني أنيق وتنسيق ملكي', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // إدارة كوبونات الخصم في السلة
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const getShippingFee = (gov: string) => {
    if (SITE_CONFIG.shippingRates.tier65.includes(gov)) return 65;
    if (SITE_CONFIG.shippingRates.tier80.includes(gov)) return 80;
    if (SITE_CONFIG.shippingRates.tier90.includes(gov)) return 90;
    return SITE_CONFIG.shippingRates.tier100Default;
  };

  const currentShipping = getShippingFee(clientGovernorate);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  
  // حساب الخصم
  const discountAmount = appliedCoupon ? validateCoupon(appliedCoupon, subtotal).discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount) + (cartItems.length > 0 ? currentShipping : 0);

  const handleApplyCoupon = async () => {
    setCouponMessage(null);
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) {
      setCouponMessage({ text: 'يرجى كتابة كود الخصم أولاً.', isError: true });
      return;
    }
    setIsApplyingCoupon(true);
    try {
      const allCoupons = await getCoupons();
      const found = allCoupons.find(c => c.code === code);
      if (!found) {
        setCouponMessage({ text: '❌ كود الخصم غير صحيح أو غير موجود!', isError: true });
        setAppliedCoupon(null);
        return;
      }
      const res = validateCoupon(found, subtotal);
      if (!res.valid) {
        setCouponMessage({ text: `❌ ${res.message}`, isError: true });
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(found);
      setCouponMessage({ text: `✅ ${res.message}`, isError: false });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponMessage(null);
  };

  const handleAddToCart = (
    productName: string,
    price: number,
    details: string = '',
    customImage?: string,
    customImageUrl?: string
  ) => {
    const newItem: CartItem = {
      id: Date.now() + Math.random(),
      name: productName,
      price: price,
      details: details,
      customImage: customImage,
      customImageUrl: customImageUrl
    };

    setCartItems(prev => [...prev, newItem]);
    alert(`تم إضافة "${productName}" إلى السلة بنجاح! 🛒`);
  };

  const handleRemoveFromCart = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const handleSendOrderToWhatsApp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !clientAddress) {
      alert('الرجاء إكمال كافة بيانات الاسم, رقم الهاتف, والعنوان.');
      return;
    }

    let message = `🛒 *طلب جديد من متجر هندسة بيرفيوم*%0A`;
    message += `----------------------------------%0A`;
    message += `👤 *الاسم:* ${clientName}%0A`;
    message += `📞 *الهاتف:* ${clientPhone}%0A`;
    message += `📍 *المحافظة:* ${clientGovernorate} (شحن: ${currentShipping} ج.م)%0A`;
    message += `🏠 *العنوان:* ${clientAddress}%0A`;
    message += `----------------------------------%0A`;
    message += `📦 *المنتجات المطلوبة:*%0A`;
    
    cartItems.forEach((item, index) => {
      message += `${index + 1}. ${item.name} ${item.details ? `(${item.details})` : ''} - *${item.price} ج.م*%0A`;
      if (item.customImageUrl) {
        message += `   📸 *صورة التصميم المرفقة:*%0A   ${item.customImageUrl}%0A`;
      } else if (item.customImage) {
        message += `   📸 *مرفق صورة تصميم مختار من العميل لهذه الباقة*%0A`;
      }
    });

    const itemsWithImages = cartItems.filter(i => i.customImageUrl || i.customImage);
    if (itemsWithImages.length > 0) {
      message += `----------------------------------%0A`;
      message += `📸 *صور وتصاميم البوكيهات المطلوبة في الأوردر:*%0A`;
      itemsWithImages.forEach((item) => {
        if (item.customImageUrl) {
          message += `🔗 صورة (${item.name}):%0A${item.customImageUrl}%0A`;
        }
      });
      message += `*(اضغط على الرابط أعلاه لعرض صورة البوكيه وتنفيذه بدقة)*%0A`;
    }

    message += `----------------------------------%0A`;
    message += `💰 *إجمالي المنتجات:* ${subtotal} ج.م%0A`;
    if (appliedCoupon && discountAmount > 0) {
      message += `🎟️ *كود الخصم:* ${appliedCoupon.code} (-${discountAmount} ج.م)%0A`;
      message += `🎁 *بعد الخصم:* ${subtotal - discountAmount} ج.م%0A`;
    }
    message += `🚚 *مصاريف الشحن:* ${currentShipping} ج.م%0A`;
    message += `💎 *الإجمالي النهائي المطلوب:* ${finalTotal} ج.م%0A`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const [boxStep, setBoxStep] = useState('select-size');
  const [selectedBoxSize, setSelectedBoxSize] = useState<BoxSize | null>(null);
  const [boxSelectedItems, setBoxSelectedItems] = useState<Product[]>([]);

  const [flowerStep, setFlowerStep] = useState(1);
  const [roseCount, setRoseCount] = useState(10);
  const [customRoseInput, setCustomRoseInput] = useState('');
  const [flowerAddons, setFlowerAddons] = useState({ babyBreath: false, butterflies: false });
  const [customBouquetFile, setCustomBouquetFile] = useState<File | null>(null);
  const [customBouquetPreview, setCustomBouquetPreview] = useState<string>('');
  const [customBouquetUrl, setCustomBouquetUrl] = useState<string>('');
  const [isUploadingBouquetImg, setIsUploadingBouquetImg] = useState<boolean>(false);

  const [botStep, setBotStep] = useState(1);
  const [botData, setBotData] = useState({ target: '', age: '', occasion: '' });

  const handleCategoryClick = (catId: string) => {
    if (catId === 'simulation-perfumes') {
      window.open(TAYEEB_URL, '_blank');
      return;
    }
    if (catId === 'accessories-tbr') {
      window.open(TBR_URL, '_blank');
      return;
    }
    setActiveCategory(catId);
    if (catId === 'gift-boxes') { setBoxStep('select-size'); setBoxSelectedItems([]); }
    if (catId === 'flowers') { setFlowerStep(1); }
  };

  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImg, setNewProdImg] = useState('');
  
  const [regularPrice, setRegularPrice] = useState('');
  
  // حقول الأحجام الاختيارية الجديدة لأي منتج
  const [enableSizes, setEnableSizes] = useState(false);
  const [size1Name, setSize1Name] = useState('25ml');
  const [size1Price, setSize1Price] = useState('');
  const [size2Name, setSize2Name] = useState('35ml');
  const [size2Price, setSize2Price] = useState('');
  const [size3Name, setSize3Name] = useState('50ml');
  const [size3Price, setSize3Price] = useState('');
  const [size4Name, setSize4Name] = useState('100ml');
  const [size4Price, setSize4Price] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [newCatId, setNewCatId] = useState('');

  // إضافة منتج وحفظه مباشرة في Supabase
  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newProdName) return;

    let finalPrice = parseFloat(regularPrice) || 200;
    let p25Val: number | null = null;
    let p35Val: number | null = null;
    let p50Val: number | null = null;
    let p100Val: number | null = null;

    const sizesObj: Record<string, number> = {};
    if (enableSizes) {
      if (size1Price) { p25Val = parseFloat(size1Price); sizesObj[size1Name || '25ml'] = p25Val; }
      if (size2Price) { p35Val = parseFloat(size2Price); sizesObj[size2Name || '35ml'] = p35Val; }
      if (size3Price) { p50Val = parseFloat(size3Price); sizesObj[size3Name || '50ml'] = p50Val; }
      if (size4Price) { p100Val = parseFloat(size4Price); sizesObj[size4Name || '100ml'] = p100Val; }
      if (Object.keys(sizesObj).length > 0) {
        finalPrice = Object.values(sizesObj)[0];
      }
    }

    let targetCatId = newProdCat;
    const matchedCategory = categories.find(c => c.id === newProdCat || c.slug === newProdCat);
    if (matchedCategory && matchedCategory.id !== 'all') {
      targetCatId = matchedCategory.id;
    } else if (categories.length > 1) {
      targetCatId = categories.filter(c => c.id !== 'all')[0].id;
    }

    const finalImage = newProdImg.trim() || LOGO_URL;

    const productPayload: any = {
      name: newProdName,
      category_id: targetCatId || null,
      description: newProdDesc || 'منتج فاخر من هندسة بيرفيوم',
      image_url: finalImage,
      price: finalPrice,
      price_25ml: p25Val,
      price_35ml: p35Val,
      price_50ml: p50Val,
      price_100ml: p100Val,
    };

    const { data: insertedData, error } = await supabase.from('products').insert([productPayload]).select();

    if (error) {
      alert('حدث خطأ أثناء حفظ المنتج في قاعدة البيانات: ' + error.message);
    } else {
      const createdItem: Product = {
        id: insertedData && insertedData[0] ? insertedData[0].id : Date.now().toString(),
        name: newProdName,
        category: targetCatId,
        category_id: targetCatId,
        desc: newProdDesc || 'منتج فاخر من هندسة بيرفيوم',
        image: finalImage,
        price: finalPrice,
        sizes: Object.keys(sizesObj).length > 0 ? sizesObj : undefined,
      };

      setAllProducts([...allProducts, createdItem]);
      setNewProdName('');
      setNewProdDesc('');
      setNewProdImg('');
      setRegularPrice('');
      setEnableSizes(false);
      setSize1Price(''); setSize2Price(''); setSize3Price(''); setSize4Price('');
      alert('تم إضافة المنتج بنجاح وحفظه على السحابة أونلاين!');
    }
  };

  // إضافة قسم جديد وحفظه في Supabase
  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCatName) return;

    const slug = (newCatId || newCatName).toLowerCase().replace(/\s+/g, '-');
    const { data, error } = await supabase.from('categories').insert([{ name: newCatName.trim(), slug }]).select();

    if (error) {
      alert('حدث خطأ أثناء إضافة القسم: ' + error.message);
    } else {
      if (data && data[0]) {
        setCategories([...categories, data[0]]);
      } else {
        setCategories([...categories, { id: slug, name: newCatName.trim(), slug }]);
      }
      setNewCatName('');
      setNewCatId('');
      alert('تم إضافة القسم الجديد بنجاح!');
    }
  };

  // تصفية المنتجات حسب القسم المحدد وشريط البحث
  const displayedProducts = allProducts.filter(item => {
    const matchesCategory = activeCategory === 'all' || 
      item.category === activeCategory || 
      item.category_id === activeCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || 
      item.name.toLowerCase().includes(q) || 
      (item.desc || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f3f4f6', fontFamily: 'Arial, sans-serif', paddingBottom: '80px', fontSize: '16px' }} dir="rtl">
      

      <header style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(212,175,55,0.3)', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              onClick={() => setIsCheckoutOpen(true)}
              style={{ background: 'linear-gradient(to bottom right, #D4AF37, #aa820a)', padding: '8px 14px', borderRadius: '18px', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', cursor: 'pointer', boxShadow: '0 0 10px rgba(212,175,55,0.3)' }}
            >
              <span>🛒 السلة</span>
              <span style={{ backgroundColor: '#000', color: '#D4AF37', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '900' }}>
                {cartItems.length}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'right' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#D4AF37', margin: 0 }}>هندسة بيرفيوم</h1>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>معانا الحياة ريحتها حلوة</p>
            </div>
            <img src={LOGO_URL} alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '14px', border: '2px solid #D4AF37', objectFit: 'cover' }} />
          </div>

        </div>

        <div style={{ maxWidth: '700px', margin: '14px auto 0', display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setIsBotOpen(true)}
            style={{ backgroundColor: '#141414', border: '1px solid #D4AF37', color: '#D4AF37', padding: '10px 18px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
          >
            🤖 مساعد الهدايا
          </button>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن أي عطر أو منتج فاخر..." 
            style={{ width: '100%', backgroundColor: '#141414', border: '1px solid rgba(212,175,55,0.4)', borderRadius: '14px', padding: '10px 18px', fontSize: '15px', color: '#fff', outline: 'none' }}
          />
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
        
        {/* البنر التعريفي */}
        <div style={{ background: 'linear-gradient(135deg, #18150c 0%, #2a220e 100% , #121212 100%)', border: '2px solid #D4AF37', borderRadius: '20px', padding: '30px 24px', textAlign: 'center', marginBottom: '30px', boxShadow: '0 8px 24px rgba(212,175,55,0.15)' }}>
          <div style={{ display: 'inline-block', backgroundColor: 'rgba(212,175,55,0.15)', border: '1px solid #D4AF37', padding: '6px 20px', borderRadius: '25px', fontSize: '13px', color: '#D4AF37', marginBottom: '12px', fontWeight: 'bold' }}>
            ✨ العطور الشرقية والغربية بمعايير عالمية ✨
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#fff', margin: '0 0 12px 0' }}>
            مرحباً بك في عالم <span style={{ color: '#D4AF37' }}>هندسة بيرفيوم</span> للتميز والفخامة
          </h2>
          <p style={{ fontSize: '16px', color: '#d1d5db', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
            نقدم لك أرقى التركيبات العطرية، بوكيهات الورد الملكية، وبوكسات الهدايا المصممة خصيصاً لتخلد لحظاتك الجميلة وتناسب كل أذواقك الرفيعة.
          </p>
        </div>

        {/* أزرار الأقسام */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px' }}>
          <button onClick={() => setActiveCategory('all')} style={{ padding: '12px 20px', borderRadius: '24px', fontSize: '15px', fontWeight: 'bold', border: activeCategory === 'all' ? '2px solid #D4AF37' : '1px solid #333', background: activeCategory === 'all' ? 'linear-gradient(to right, #D4AF37, #aa820a)' : '#141414', color: activeCategory === 'all' ? '#000' : '#e5e7eb', cursor: 'pointer' }}>✨ الكل</button>
          <button onClick={() => handleCategoryClick('simulation-perfumes')} style={{ padding: '12px 20px', borderRadius: '24px', fontSize: '15px', fontWeight: 'bold', border: '1px solid #333', background: '#141414', color: '#e5e7eb', cursor: 'pointer' }}>🧪 عطور محاكاة</button>
          <button onClick={() => handleCategoryClick('accessories-tbr')} style={{ padding: '12px 20px', borderRadius: '24px', fontSize: '15px', fontWeight: 'bold', border: '1px solid #333', background: '#141414', color: '#e5e7eb', cursor: 'pointer' }}>💎 اكسسوارات تِبـر</button>
          {categories.filter(c => c.id !== 'all').map(cat => (
            <button 
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              style={{ padding: '12px 20px', borderRadius: '24px', fontSize: '15px', fontWeight: 'bold', border: activeCategory === cat.id ? '2px solid #D4AF37' : '1px solid #333', background: activeCategory === cat.id ? 'linear-gradient(to right, #D4AF37, #aa820a)' : '#141414', color: activeCategory === cat.id ? '#000' : '#e5e7eb', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
            >
              {cat.name}
            </button>
          ))}
          <button onClick={() => handleCategoryClick('gift-boxes')} style={{ padding: '12px 20px', borderRadius: '24px', fontSize: '15px', fontWeight: 'bold', border: activeCategory === 'gift-boxes' ? '2px solid #D4AF37' : '1px solid #333', background: activeCategory === 'gift-boxes' ? 'linear-gradient(to right, #D4AF37, #aa820a)' : '#141414', color: activeCategory === 'gift-boxes' ? '#000' : '#e5e7eb', cursor: 'pointer' }}>🎁 املي بوكسك</button>
          <button onClick={() => handleCategoryClick('flowers')} style={{ padding: '12px 20px', borderRadius: '24px', fontSize: '15px', fontWeight: 'bold', border: activeCategory === 'flowers' ? '2px solid #D4AF37' : '1px solid #333', background: activeCategory === 'flowers' ? 'linear-gradient(to right, #D4AF37, #aa820a)' : '#141414', color: activeCategory === 'flowers' ? '#000' : '#e5e7eb', cursor: 'pointer' }}>🌹 بوكيهات الورد</button>
        </div>

        {/* قسم املأ بوكسك */}
        {activeCategory === 'gift-boxes' && (
          <div style={{ maxWidth: '650px', margin: '0 auto 30px', backgroundColor: '#121212', border: '1px solid #D4AF37', borderRadius: '18px', padding: '24px' }}>
            {boxStep === 'select-size' ? (
              <div>
                <h3 style={{ fontSize: '18px', color: '#D4AF37', textAlign: 'center', marginBottom: '16px', fontWeight: 'bold' }}>🎁 اختر حجم البوكس الأساسي</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button onClick={() => { setSelectedBoxSize({ name: 'بوكس صغير', price: 150 }); setBoxStep('fill-box'); }} style={{ padding: '16px', background: '#181818', border: '1px solid #444', borderRadius: '12px', color: '#fff', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', fontSize: '16px' }}>
                    <span style={{ fontWeight: 'bold' }}>📦 بوكس صغير</span>
                    <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>150 ج.م</span>
                  </button>
                  <button onClick={() => { setSelectedBoxSize({ name: 'بوكس وسط', price: 200 }); setBoxStep('fill-box'); }} style={{ padding: '16px', background: '#181818', border: '1px solid #444', borderRadius: '12px', color: '#fff', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', fontSize: '16px' }}>
                    <span style={{ fontWeight: 'bold' }}>📦 بوكس وسط</span>
                    <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>200 ج.م</span>
                  </button>
                  <button onClick={() => { setSelectedBoxSize({ name: 'بوكس كبير', price: 250 }); setBoxStep('fill-box'); }} style={{ padding: '16px', background: '#181818', border: '1px solid #444', borderRadius: '12px', color: '#fff', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', fontSize: '16px' }}>
                    <span style={{ fontWeight: 'bold' }}>📦 بوكس كبير</span>
                    <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>250 ج.م</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #333', paddingBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', color: '#D4AF37', margin: 0 }}>تم اختيار: {selectedBoxSize?.name} ({selectedBoxSize?.price} ج.م)</h3>
                    <p style={{ fontSize: '13px', color: '#9ca3af', margin: '4px 0 0 0' }}>اختر المنتجات لملء البوكس:</p>
                  </div>
                  <button onClick={() => setBoxStep('select-size')} style={{ fontSize: '13px', background: '#222', color: '#D4AF37', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>تغيير الحجم</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', marginBottom: '16px' }}>
                  {allProducts.map(prod => (
                    <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#181818', padding: '10px 14px', borderRadius: '10px', border: '1px solid #333' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={prod.image} alt={prod.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                        <div>
                          <span style={{ fontSize: '14px', color: '#fff', display: 'block', fontWeight: 'bold' }}>{prod.name}</span>
                          <span style={{ fontSize: '12px', color: '#D4AF37' }}>{prod.price} ج.م</span>
                        </div>
                      </div>
                      <button onClick={() => setBoxSelectedItems([...boxSelectedItems, prod])} style={{ background: '#D4AF37', color: '#000', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>إضافة للبوكس</button>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#0a0a0a', padding: '16px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '13px', color: '#9ca3af', display: 'block' }}>إجمالي البوكس:</span>
                    <span style={{ fontSize: '20px', fontWeight: '900', color: '#D4AF37' }}>
                      {(selectedBoxSize ? selectedBoxSize.price : 0) + boxSelectedItems.reduce((sum, item) => sum + item.price, 0)} ج.م
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      const totalBoxPrice = (selectedBoxSize ? selectedBoxSize.price : 0) + boxSelectedItems.reduce((sum, item) => sum + item.price, 0);
                      handleAddToCart(`${selectedBoxSize?.name} مع ${boxSelectedItems.length} عناصر`, totalBoxPrice, 'بوكس مخصص بالكامل');
                    }}
                    style={{ background: 'linear-gradient(to right, #D4AF37, #aa820a)', color: '#000', fontWeight: 'bold', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}
                  >
                    إضافة البوكس للسلة
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* قسم بوكيهات الورد */}
        {activeCategory === 'flowers' && (
          <div style={{ maxWidth: '650px', margin: '0 auto 30px', backgroundColor: '#121212', border: '1px solid #D4AF37', borderRadius: '18px', padding: '24px' }}>
            {flowerStep === 1 && (
              <div>
                <h3 style={{ fontSize: '18px', color: '#D4AF37', textAlign: 'center', marginBottom: '16px', fontWeight: 'bold' }}>🌹 الخطوة 1: حدد عدد الورود</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                  {[5, 10, 15, 20].map((num) => (
                    <button 
                      key={num} 
                      onClick={() => { setRoseCount(num); setCustomRoseInput(''); }} 
                      style={{ padding: '14px 8px', background: (!customRoseInput && roseCount === num) ? '#D4AF37' : '#181818', color: (!customRoseInput && roseCount === num) ? '#000' : '#fff', border: '1px solid #444', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                    >
                      {num} وردات
                    </button>
                  ))}
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>أو اكتب العدد يدوياً:</label>
                  <input 
                    type="number" 
                    placeholder="مثال: 25" 
                    value={customRoseInput} 
                    onChange={(e) => setCustomRoseInput(e.target.value)} 
                    style={{ width: '100%', background: '#181818', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '14px' }} 
                  />
                </div>

                <button onClick={() => setFlowerStep(2)} style={{ width: '100%', background: 'linear-gradient(to right, #D4AF37, #aa820a)', color: '#000', fontWeight: 'bold', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '15px' }}>التالي (الإضافات)</button>
              </div>
            )}

            {flowerStep === 2 && (
              <div>
                <h3 style={{ fontSize: '18px', color: '#D4AF37', textAlign: 'center', marginBottom: '16px', fontWeight: 'bold' }}>🌿 الخطوة 2: الإضافات الخاصة</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#181818', padding: '14px', borderRadius: '10px', cursor: 'pointer', border: '1px solid #444', fontSize: '15px' }}>
                    <span>🌿 بيبي فلاور (+{storeSettings.babyBreathPrice} ج.م)</span>
                    <input type="checkbox" checked={flowerAddons.babyBreath} onChange={(e) => setFlowerAddons({...flowerAddons, babyBreath: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#181818', padding: '14px', borderRadius: '10px', cursor: 'pointer', border: '1px solid #444', fontSize: '15px' }}>
                    <span>🦋 فراشات زينة (+{storeSettings.butterflyPrice} ج.م)</span>
                    <input type="checkbox" checked={flowerAddons.butterflies} onChange={(e) => setFlowerAddons({...flowerAddons, butterflies: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setFlowerStep(1)} style={{ width: '50%', background: '#222', color: '#fff', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>السابق</button>
                  <button onClick={() => setFlowerStep(3)} style={{ width: '50%', background: 'linear-gradient(to right, #D4AF37, #aa820a)', color: '#000', fontWeight: 'bold', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>التالي (التصاميم)</button>
                </div>
              </div>
            )}

            {flowerStep === 3 && (
              <div>
                <h3 style={{ fontSize: '18px', color: '#D4AF37', textAlign: 'center', marginBottom: '16px', fontWeight: 'bold' }}>🌹 الخطوة 3: اختر البوكيه أو ارفع صورة</h3>
                
                <div style={{ background: '#181818', padding: '14px', borderRadius: '10px', marginBottom: '14px', border: '1px solid #444' }}>
                  <p style={{ fontSize: '15px', color: '#fff', margin: '0 0 6px 0', fontWeight: 'bold' }}>بوكيه جوري ملكي</p>
                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>عدد الورد: {customRoseInput ? customRoseInput : roseCount} | الإضافات: {flowerAddons.babyBreath ? 'بيبي فلاور ' : ''}{flowerAddons.butterflies ? 'فراشات' : 'بدون'}</span>
                </div>

                <div style={{ background: '#181818', padding: '14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #444' }}>
                  <span style={{ fontSize: '13px', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>أو ارفع صورة بوكيه خاص من جهازك (لتنفيذ نفس التصميم):</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={async (e) => { 
                      if(e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setCustomBouquetFile(file);
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setCustomBouquetPreview(ev.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);

                        // رفع الصورة للسحابة لتوليد رابط مباشر للواتساب
                        setIsUploadingBouquetImg(true);
                        try {
                          const fd = new FormData();
                          fd.append('file', file);
                          const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
                          const data = await res.json();
                          if (data?.success && data?.url) {
                            setCustomBouquetUrl(data.url);
                          }
                        } catch (err) {
                          console.error('Error uploading custom image:', err);
                        } finally {
                          setIsUploadingBouquetImg(false);
                        }
                      } 
                    }} 
                    style={{ fontSize: '13px', color: '#ccc', width: '100%' }} 
                  />
                  {customBouquetPreview && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', background: '#121212', padding: '10px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.4)' }}>
                      <img src={customBouquetPreview} alt="معاينة البوكيه المطلوب" style={{ width: '54px', height: '54px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #D4AF37' }} />
                      <div>
                        {isUploadingBouquetImg ? (
                          <span style={{ fontSize: '12px', color: '#D4AF37', display: 'block', fontWeight: 'bold' }}>⏳ جاري رفع وتجهيز الصورة لرابط الواتساب...</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#25D366', display: 'block', fontWeight: 'bold' }}>✓ تم تجهيز الصورة بنجاح وستُرسل برابطها المباشر في الواتساب</span>
                        )}
                        <span style={{ fontSize: '11px', color: '#aaa' }}>سيتم إرفاقها مع تفاصيل الفاتورة لتنفيذ نفس التصميم بدقة</span>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ background: '#0d0d0d', padding: '16px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.4)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '13px', color: '#9ca3af', display: 'block' }}>الإجمالي للبوكيه:</span>
                    <span style={{ fontSize: '20px', fontWeight: '900', color: '#D4AF37' }}>
                      {((customRoseInput ? parseInt(customRoseInput) || 0 : roseCount) * storeSettings.rosePrice) + (flowerAddons.babyBreath ? storeSettings.babyBreathPrice : 0) + (flowerAddons.butterflies ? storeSettings.butterflyPrice : 0)} ج.م
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      const totalFlowerPrice = ((customRoseInput ? parseInt(customRoseInput) || 0 : roseCount) * storeSettings.rosePrice) + (flowerAddons.babyBreath ? storeSettings.babyBreathPrice : 0) + (flowerAddons.butterflies ? storeSettings.butterflyPrice : 0);
                      const detailsText = `${customRoseInput ? customRoseInput : roseCount} وردة جوري ${flowerAddons.babyBreath ? '+ بيبي فلاور' : ''} ${flowerAddons.butterflies ? '+ فراشات' : ''}${customBouquetPreview ? ' (مرفق صورة تصميم مخصص)' : ''}`;
                      handleAddToCart('بوكيه ورد جوري ملكي', totalFlowerPrice, detailsText, customBouquetPreview || undefined, customBouquetUrl || undefined);
                    }} 
                    style={{ background: 'linear-gradient(to right, #D4AF37, #aa820a)', color: '#000', fontWeight: 'bold', padding: '12px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                  >
                    إضافة البوكيه للسلة
                  </button>
                </div>

                <button onClick={() => setFlowerStep(2)} style={{ width: '100%', background: '#222', color: '#fff', padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px' }}>السابق</button>
              </div>
            )}
          </div>
        )}

        {/* عرض المنتجات المفلترة بالقسم والبحث */}
        {activeCategory !== 'gift-boxes' && activeCategory !== 'flowers' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {displayedProducts.length > 0 ? (
              displayedProducts.map(product => {
                const availableSizes = product.sizes ? Object.keys(product.sizes) : [];
                const currentSize = selectedSizes[product.id] || (availableSizes.length > 0 ? availableSizes[0] : '');
                const currentPrice = product.sizes && currentSize ? (product.sizes[currentSize] || product.price) : product.price;

                return (
                  <div key={product.id} style={{ backgroundColor: '#121212', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', backgroundColor: '#1a1810', border: '1px solid rgba(212,175,55,0.2)' }}>
                        <img src={product.image || LOGO_URL} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: '0 0 6px 0' }}>{product.name}</h3>
                      <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 12px 0', minHeight: '36px', lineHeight: '1.5' }}>{product.desc}</p>
                      
                      {availableSizes.length > 0 && (
                        <div style={{ marginBottom: '14px', background: '#181818', padding: '10px', borderRadius: '10px', border: '1px solid #333' }}>
                          <span style={{ fontSize: '12px', color: '#D4AF37', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>اختر الحجم:</span>
                          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(availableSizes.length, 4)}, 1fr)`, gap: '6px' }}>
                            {availableSizes.map(sz => (
                              <button 
                                key={sz} 
                                onClick={() => setSelectedSizes({...selectedSizes, [product.id]: sz})}
                                style={{ background: currentSize === sz ? '#D4AF37' : '#222', color: currentSize === sz ? '#000' : '#fff', border: 'none', padding: '6px 4px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #222', paddingTop: '12px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#D4AF37' }}>{currentPrice} ج.م</span>
                      <button 
                        onClick={() => handleAddToCart(product.name, currentPrice, availableSizes.length > 0 ? currentSize : 'حجم قياسي')} 
                        style={{ background: 'linear-gradient(to right, #D4AF37, #aa820a)', color: '#000', fontWeight: 'bold', padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                      >
                        إضافة للسلة
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '15px' }}>لا توجد منتجات مطابقة في هذا القسم أو البحث.</div>
            )}
          </div>
        )}

      </main>

      {/* نافذة السلة والشحن */}
      {isCheckoutOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#141414', border: '1px solid #D4AF37', borderRadius: '20px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
            <button onClick={() => setIsCheckoutOpen(false)} style={{ position: 'absolute', top: '16px', left: '16px', background: 'none', border: 'none', color: '#9ca3af', fontSize: '20px', cursor: 'pointer' }}>✕</button>

            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#D4AF37', marginBottom: '20px', textAlign: 'center' }}>سلة المشتريات وتأكيد الطلب 🛍️</h2>

            {cartItems.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', margin: '30px 0' }}>السلة فارغة حالياً.</p>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {cartItems.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a1a', padding: '12px', borderRadius: '10px', border: '1px solid #333' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {item.customImage && (
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <img 
                              src={item.customImage} 
                              alt="تصميم البوكيه المطلوب" 
                              style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', border: '1.5px solid #D4AF37' }} 
                            />
                            <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#D4AF37', color: '#000', fontSize: '9px', fontWeight: 'bold', padding: '1px 4px', borderRadius: '4px' }}>تصميمك</span>
                          </div>
                        )}
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', display: 'block' }}>{item.name}</span>
                          {item.details && <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>{item.details}</span>}
                          {item.customImage && <span style={{ fontSize: '11px', color: '#25D366', display: 'block', marginTop: '2px' }}>📸 مرفق صورة التصميم المطلوب تنفيذه</span>}
                          <span style={{ fontSize: '13px', color: '#D4AF37', display: 'block', marginTop: '2px' }}>{item.price} ج.م</span>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveFromCart(item.id)} style={{ background: '#331111', color: '#ff6666', border: '1px solid #552222', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}>حذف</button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendOrderToWhatsApp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: '#ccc', display: 'block', marginBottom: '4px' }}>الاسم الكامل:</label>
                    <input type="text" placeholder="اسم المستلم" value={clientName} onChange={(e) => setClientName(e.target.value)} required style={{ width: '100%', background: '#1a1a1a', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '14px' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', color: '#ccc', display: 'block', marginBottom: '4px' }}>رقم الهاتف:</label>
                    <input type="tel" placeholder="رقم الموبايل للتواصل" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} required style={{ width: '100%', background: '#1a1a1a', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '14px' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', color: '#ccc', display: 'block', marginBottom: '4px' }}>اختر المحافظة:</label>
                    <select value={clientGovernorate} onChange={(e) => setClientGovernorate(e.target.value)} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '14px' }}>
                      <optgroup label="شحن 65 ج.م">
                        <option value="كفر الشيخ">كفر الشيخ</option>
                        <option value="البحيرة">البحيرة</option>
                      </optgroup>
                      <optgroup label="محافظات بحري (80 ج.م)">
                        <option value="الإسكندرية">الإسكندرية</option>
                        <option value="الدقهلية">الدقهلية</option>
                        <option value="الغربية">الغربية</option>
                        <option value="المنوفية">المنوفية</option>
                        <option value="الشرقية">الشرقية</option>
                        <option value="دمياط">دمياط</option>
                        <option value="بورسعيد">بورسعيد</option>
                        <option value="الإسماعيلية">الإسماعيلية</option>
                        <option value="السويس">السويس</option>
                        <option value="مطروح">مطروح</option>
                      </optgroup>
                      <optgroup label="محافظات قبلي والقاهرة (90 ج.م)">
                        <option value="القاهرة">القاهرة</option>
                        <option value="الجيزة">الجيزة</option>
                        <option value="القليوبية">القليوبية</option>
                        <option value="الفيوم">الفيوم</option>
                      </optgroup>
                      <optgroup label="الصعيد وسيناء (100 ج.م)">
                        <option value="بني سويف">بني سويف</option>
                        <option value="المنيا">المنيا</option>
                        <option value="أسيوط">أسيوط</option>
                        <option value="سوهاج">سوهاج</option>
                        <option value="قنا">قنا</option>
                        <option value="الأقصر">الأقصر</option>
                        <option value="أسوان">أسوان</option>
                        <option value="البحر الأحمر">البحر الأحمر</option>
                        <option value="الوادي الجديد">الوادي الجديد</option>
                        <option value="شمال سيناء">شمال سيناء</option>
                        <option value="جنوب سيناء">جنوب سيناء</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', color: '#ccc', display: 'block', marginBottom: '4px' }}>العنوان بالتفصيل:</label>
                    <textarea placeholder="الشارع، رقم العمارة، علامة مميزة" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} required rows={2} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '14px', resize: 'none' }}></textarea>
                  </div>

                  {/* قسم كود الخصم */}
                  <div style={{ background: '#181818', padding: '12px', borderRadius: '10px', border: '1px solid rgba(212,175,55,0.4)' }}>
                    <label style={{ fontSize: '13px', color: '#D4AF37', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                      🎟️ هل لديك كود خصم؟
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="أدخل الكود (مثال: HINDSE10)" 
                        value={couponCodeInput} 
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        disabled={!!appliedCoupon}
                        style={{ flex: 1, background: '#111', border: '1px solid #444', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                      />
                      {!appliedCoupon ? (
                        <button 
                          type="button" 
                          onClick={handleApplyCoupon}
                          disabled={isApplyingCoupon}
                          style={{ background: 'linear-gradient(to right, #D4AF37, #aa820a)', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {isApplyingCoupon ? 'فحص...' : 'تطبيق'}
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          onClick={handleRemoveCoupon}
                          style={{ background: '#450a0a', color: '#f87171', border: '1px solid #7f1d1d', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          إلغاء ✕
                        </button>
                      )}
                    </div>
                    {couponMessage && (
                      <p style={{ color: couponMessage.isError ? '#ef4444' : '#10b981', fontSize: '12px', margin: '6px 0 0 0', fontWeight: 'bold' }}>
                        {couponMessage.text}
                      </p>
                    )}
                  </div>

                  <div style={{ background: '#1a1a1a', padding: '12px', borderRadius: '10px', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#bbb' }}>
                      <span>إجمالي المنتجات:</span>
                      <span>{subtotal} ج.م</span>
                    </div>
                    {appliedCoupon && discountAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10b981', fontWeight: 'bold' }}>
                        <span>خصم الكوبون ({appliedCoupon.code}):</span>
                        <span>- {discountAmount} ج.م</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#bbb' }}>
                      <span>مصاريف الشحن ({clientGovernorate}):</span>
                      <span>{currentShipping} ج.م</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', color: '#D4AF37', borderTop: '1px solid #333', paddingTop: '6px', marginTop: '4px' }}>
                      <span>الإجمالي النهائي:</span>
                      <span>{finalTotal} ج.م</span>
                    </div>
                  </div>

                  <button type="submit" style={{ width: '100%', background: 'linear-gradient(to right, #25D366, #1ebd56)', color: '#fff', fontWeight: 'bold', border: 'none', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', marginTop: '6px' }}>
                    💬 إرسال الطلب عبر واتساب
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* لوحة الأدمن (مخفية ولا تفتح إلا بالرابط السري) */}
      {isAdminOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
          <div style={{ background: 'linear-gradient(135deg, #18150f 0%, #121212 100%)', border: '2px solid #D4AF37', borderRadius: '22px', width: '100%', maxWidth: '620px', maxHeight: '92vh', overflowY: 'auto', padding: '28px', position: 'relative', boxShadow: '0 12px 35px rgba(212,175,55,0.25)' }}>
            <button onClick={() => setIsAdminOpen(false)} style={{ position: 'absolute', top: '18px', left: '18px', background: '#222', border: '1px solid #D4AF37', color: '#D4AF37', width: '36px', height: '36px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>✕</button>

            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{ display: 'inline-block', background: 'rgba(212,175,55,0.15)', border: '1px solid #D4AF37', padding: '6px 16px', borderRadius: '20px', color: '#D4AF37', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
                ⭐ لوحة الإدارة العليا
              </div>
              <h2 style={{ fontSize: '22px', color: '#fff', margin: 0, fontWeight: '900' }}>لوحة تحكم <span style={{ color: '#D4AF37' }}>هندسة بيرفيوم</span></h2>
            </div>

            {/* قسم تعديل أسعار الورد والإضافات */}
            <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.06)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '16px', borderRadius: '14px', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '15px', color: '#D4AF37', margin: '0 0 12px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🌹 تعديل أسعار الورد والإضافات (حسب الطلب):
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#ccc', display: 'block', marginBottom: '4px' }}>سعر الوردة (ج.م):</label>
                  <input 
                    type="number" 
                    value={storeSettings.rosePrice} 
                    onChange={(e) => setStoreSettings({...storeSettings, rosePrice: parseFloat(e.target.value) || 0})}
                    style={{ width: '100%', background: '#111', border: '1px solid #D4AF37', color: '#D4AF37', padding: '8px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#ccc', display: 'block', marginBottom: '4px' }}>بيبي فلاور (ج.م):</label>
                  <input 
                    type="number" 
                    value={storeSettings.babyBreathPrice} 
                    onChange={(e) => setStoreSettings({...storeSettings, babyBreathPrice: parseFloat(e.target.value) || 0})}
                    style={{ width: '100%', background: '#111', border: '1px solid #D4AF37', color: '#D4AF37', padding: '8px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#ccc', display: 'block', marginBottom: '4px' }}>الفراشات (ج.م):</label>
                  <input 
                    type="number" 
                    value={storeSettings.butterflyPrice} 
                    onChange={(e) => setStoreSettings({...storeSettings, butterflyPrice: parseFloat(e.target.value) || 0})}
                    style={{ width: '100%', background: '#111', border: '1px solid #D4AF37', color: '#D4AF37', padding: '8px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }} 
                  />
                </div>
              </div>
            </div>

            {/* قسم إضافة قسم جديد */}
            <form onSubmit={handleAddCategory} style={{ backgroundColor: '#161616', padding: '16px', borderRadius: '14px', marginBottom: '18px', border: '1px solid #333' }}>
              <h3 style={{ fontSize: '15px', color: '#D4AF37', margin: '0 0 10px 0', fontWeight: 'bold' }}>📁 إضافة قسم جديد:</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="اسم القسم (مثال: 💍 ساعات فاخرة)" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} style={{ width: '50%', background: '#111', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '13px' }} />
                <input type="text" placeholder="معرف القسم بالإنجليزية (اختياري: watches)" value={newCatId} onChange={(e) => setNewCatId(e.target.value)} style={{ width: '50%', background: '#111', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '13px' }} />
              </div>
              <button type="submit" style={{ width: '100%', marginTop: '10px', background: 'linear-gradient(to right, #D4AF37, #aa820a)', color: '#000', border: 'none', fontWeight: 'bold', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 8px rgba(212,175,55,0.3)' }}>💾 حفظ القسم في القاعدة</button>
            </form>

            {/* قسم إضافة منتج جديد مع دعم الأحجام الاختيارية */}
            <form onSubmit={handleAddProduct} style={{ backgroundColor: '#161616', padding: '16px', borderRadius: '14px', marginBottom: '10px', border: '1px solid #333' }}>
              <h3 style={{ fontSize: '15px', color: '#D4AF37', margin: '0 0 12px 0', fontWeight: 'bold' }}>➕ إضافة منتج جديد:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <div>
                  <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>اسم المنتج:</label>
                  <input type="text" placeholder="مثال: عطر الملك الفاخر" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} required style={{ width: '100%', background: '#111', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '14px' }} />
                </div>
                
                <div>
                  <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>القسم:</label>
                  <select value={newProdCat} onChange={(e) => setNewProdCat(e.target.value)} style={{ width: '100%', background: '#111', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '14px' }}>
                    <option value="">اختر القسم</option>
                    {categories.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {!enableSizes ? (
                  <div>
                    <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>السعر الأساسي (ج.م):</label>
                    <input type="number" placeholder="مثال: 350" value={regularPrice} onChange={(e) => setRegularPrice(e.target.value)} required={!enableSizes} style={{ width: '100%', background: '#111', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '14px' }} />
                  </div>
                ) : null}

                <div style={{ background: '#1a1a1a', padding: '12px', borderRadius: '10px', border: '1px solid rgba(212,175,55,0.4)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: enableSizes ? '10px' : 0 }}>
                    <input type="checkbox" checked={enableSizes} onChange={(e) => setEnableSizes(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#D4AF37' }} />
                    <span style={{ fontSize: '13px', color: '#D4AF37', fontWeight: 'bold' }}>تفعيل أحجام متعددة وأسعار مختلفة (اختياري للبرفان أو غيره)</span>
                  </label>

                  {enableSizes && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input type="text" value={size1Name} onChange={(e) => setSize1Name(e.target.value)} placeholder="اسم الحجم" style={{ width: '40%', background: '#111', border: '1px solid #444', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '12px' }} />
                        <input type="number" value={size1Price} onChange={(e) => setSize1Price(e.target.value)} placeholder="السعر" style={{ width: '60%', background: '#111', border: '1px solid #444', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '12px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input type="text" value={size2Name} onChange={(e) => setSize2Name(e.target.value)} placeholder="اسم الحجم" style={{ width: '40%', background: '#111', border: '1px solid #444', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '12px' }} />
                        <input type="number" value={size2Price} onChange={(e) => setSize2Price(e.target.value)} placeholder="السعر" style={{ width: '60%', background: '#111', border: '1px solid #444', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '12px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input type="text" value={size3Name} onChange={(e) => setSize3Name(e.target.value)} placeholder="اسم الحجم" style={{ width: '40%', background: '#111', border: '1px solid #444', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '12px' }} />
                        <input type="number" value={size3Price} onChange={(e) => setSize3Price(e.target.value)} placeholder="السعر" style={{ width: '60%', background: '#111', border: '1px solid #444', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '12px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input type="text" value={size4Name} onChange={(e) => setSize4Name(e.target.value)} placeholder="اسم الحجم" style={{ width: '40%', background: '#111', border: '1px solid #444', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '12px' }} />
                        <input type="number" value={size4Price} onChange={(e) => setSize4Price(e.target.value)} placeholder="السعر" style={{ width: '60%', background: '#111', border: '1px solid #444', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '12px' }} />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>صورة المنتج:</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => { 
                      if(e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) setNewProdImg(ev.target.result as string);
                        };
                        reader.readAsDataURL(file);
                      } 
                    }} 
                    style={{ fontSize: '12px', color: '#ccc', width: '100%', marginBottom: '6px' }} 
                  />
                  <input 
                    type="text" 
                    placeholder="أو ضع رابط الصورة هنا مباشرة (URL)..." 
                    value={newProdImg} 
                    onChange={(e) => setNewProdImg(e.target.value)} 
                    style={{ width: '100%', background: '#111', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '8px', fontSize: '12px' }} 
                  />
                  {newProdImg && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src={newProdImg} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #D4AF37' }} />
                      <span style={{ fontSize: '12px', color: '#25D366' }}>✓ تم تجهيز الصورة</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>وصف قصير للمنتج:</label>
                  <input type="text" placeholder="اكتب وصفاً جذاباً..." value={newProdDesc} onChange={(e) => setNewProdDesc(e.target.value)} style={{ width: '100%', background: '#111', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '14px' }} />
                </div>
                
                <button type="submit" style={{ background: 'linear-gradient(to right, #D4AF37, #aa820a)', color: '#000', fontWeight: 'bold', border: 'none', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', marginTop: '6px', boxShadow: '0 4px 15px rgba(212,175,55,0.3)' }}>✨ حفظ ونشر المنتج أونلاين</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* المساعد الذكي */}
      {isBotOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#121212', border: '1px solid #D4AF37', borderRadius: '18px', width: '100%', maxWidth: '360px', padding: '20px', position: 'relative' }}>
            <button onClick={() => { setIsBotOpen(false); setBotStep(1); }} style={{ position: 'absolute', top: '14px', left: '14px', background: 'none', border: 'none', color: '#9ca3af', fontSize: '18px', cursor: 'pointer' }}>✕</button>

            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'inline-block', backgroundColor: '#D4AF37', color: '#000', padding: '8px', borderRadius: '50%', marginBottom: '6px', fontSize: '18px' }}>🤖</div>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#D4AF37', margin: 0 }}>مساعد الهدايا الذكي</h3>
            </div>

            {botStep === 1 && (
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#e5e7eb', marginBottom: '10px' }}>1. الهدية لمن؟</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => { setBotData({...botData, target: 'زوجة أو خطيبة'}); setBotStep(2); }} style={{ padding: '10px', background: '#181818', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '13px', cursor: 'pointer', textAlign: 'right' }}>❤️ زوجة أو خطيبة</button>
                  <button onClick={() => { setBotData({...botData, target: 'صديق أو صديقة'}); setBotStep(2); }} style={{ padding: '10px', background: '#181818', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '13px', cursor: 'pointer', textAlign: 'right' }}>🤝 صديق أو صديقة</button>
                </div>
              </div>
            )}

            {botStep === 2 && (
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#e5e7eb', marginBottom: '10px' }}>2. المناسبة إيه؟</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={() => { setBotData({...botData, occasion: 'عيد ميلاد'}); setBotStep(3); }} style={{ padding: '10px', background: '#181818', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '13px', cursor: 'pointer', textAlign: 'right' }}>🎂 عيد ميلاد</button>
                  <button onClick={() => { setBotData({...botData, occasion: 'عيد زواج أو حب'}); setBotStep(3); }} style={{ padding: '10px', background: '#181818', border: '1px solid #333', borderRadius: '10px', color: '#fff', fontSize: '13px', cursor: 'pointer', textAlign: 'right' }}>💖 عيد زواج أو حب</button>
                </div>
              </div>
            )}

            {botStep === 3 && (
              <div>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#D4AF37', marginBottom: '8px' }}>✨ الترشيح المناسب:</p>
                <div style={{ background: '#1a1810', border: '1px solid rgba(212,175,55,0.4)', padding: '12px', borderRadius: '10px', fontSize: '13px', color: '#D4AF37', marginBottom: '12px', lineHeight: '1.5' }}>
                  نرشح لك بقوة:<br />
                  1. عطر هندسة الملكي الفاخر<br />
                  2. بوكيه ورد جوري أحمر فاخر
                </div>
                <button onClick={() => setBotStep(1)} style={{ width: '100%', background: '#333', color: '#fff', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px' }}>إعادة البحث</button>
              </div>
            )}
          </div>
        </div>
      )}

      <footer style={{ marginTop: '50px', textAlign: 'center', borderTop: '1px solid #222', paddingTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <img src={LOGO_URL} alt="Footer Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #D4AF37', objectFit: 'cover' }} />
        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>هندسة بيرفيوم &copy; 2026 - جميع الحقوق محفوظة</p>
        <p style={{ fontSize: '12px', color: '#D4AF37', margin: 0, fontWeight: 'bold' }}>
          Developed by{' '}
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#D4AF37', textDecoration: 'underline' }}>
            Amir Gawish
          </a>
        </p>
      </footer>

    </div>
  );
}