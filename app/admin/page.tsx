'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SITE_CONFIG } from '@/lib/site-config';
import { getCoupons, saveCoupon, deleteCoupon, Coupon } from '@/lib/coupons';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState<'manage_products' | 'add_product' | 'discounts' | 'categories' | 'settings'>('manage_products');

  // بيانات الأقسام
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [editCatName, setEditCatName] = useState('');

  // قائمة المنتجات الحالية وإدارتها
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');

  // حالة تعديل منتج
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editOldPrice, setEditOldPrice] = useState('');
  const [editP25, setEditP25] = useState('');
  const [editP35, setEditP35] = useState('');
  const [editP50, setEditP50] = useState('');
  const [editP100, setEditP100] = useState('');
  const [editUploadingImage, setEditUploadingImage] = useState(false);

  // حالة إضافة منتج جديد
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productImage, setProductImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [basePrice, setBasePrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [p25, setP25] = useState({ price: '', orig: '' });
  const [p35, setP35] = useState({ price: '', orig: '' });
  const [p50, setP50] = useState({ price: '', orig: '' });
  const [p100, setP100] = useState({ price: '', orig: '' });

  // أسعار الورد
  const [flowerPrice, setFlowerPrice] = useState(String(SITE_CONFIG.prices.rose));
  const [babyFlowerPrice, setBabyFlowerPrice] = useState(String(SITE_CONFIG.prices.babyFlower));
  const [butterflyPrice, setButterflyPrice] = useState(String(SITE_CONFIG.prices.butterfly));

  // إدارة الكوبونات
  const [discountCode, setDiscountCode] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountExpiresAt, setDiscountExpiresAt] = useState('');
  const [couponsList, setCouponsList] = useState<Coupon[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      initCategoriesAndSettings();
      loadProducts();
      loadCoupons();
    }
  }, [isAuthenticated]);

  // جلب المنتجات من Supabase
  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });

      if (!error && data) {
        setProductsList(data);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoadingProducts(false);
    }
  }

  // جلب الكوبونات
  async function loadCoupons() {
    const list = await getCoupons();
    setCouponsList(list);
  }

  // جلب الأقسام والإعدادات
  async function initCategoriesAndSettings() {
    try {
      let { data: existingCats, error } = await supabase.from('categories').select('*');
      const realCats = (existingCats || []).filter(c => !c.slug?.startsWith('_system'));

      if (error || realCats.length === 0) {
        const defaultCategories = [
          { name: 'برفانات فاخره', slug: 'perfumes' },
          { name: 'ساعات', slug: 'watches' },
          { name: 'نظارات', slug: 'glasses' },
          { name: 'بوكيهات الورد', slug: 'flowers' }
        ];
        
        const { data: insertedCats, error: insertError } = await supabase
          .from('categories')
          .insert(defaultCategories)
          .select();
          
        if (!insertError && insertedCats) {
          setCategories(insertedCats);
          if (insertedCats.length > 0) setSelectedCategory(insertedCats[0].id);
        }
      } else {
        setCategories(realCats);
        if (realCats.length > 0) setSelectedCategory(realCats[0].id);
      }

      try {
        const { data: settingsData, error: sErr } = await supabase.from('settings').select('*');
        if (!sErr && settingsData && Array.isArray(settingsData)) {
          settingsData.forEach((item: any) => {
            if (item.key === 'flower_price') setFlowerPrice(item.value || '');
            if (item.key === 'baby_flower_price') setBabyFlowerPrice(item.value || '');
            if (item.key === 'butterfly_price') setButterflyPrice(item.value || '');
          });
        } else {
          const localSettings = localStorage.getItem('hindse_settings');
          if (localSettings) {
            const parsed = JSON.parse(localSettings);
            if (parsed.flowerPrice) setFlowerPrice(parsed.flowerPrice);
            if (parsed.babyFlowerPrice) setBabyFlowerPrice(parsed.babyFlowerPrice);
            if (parsed.butterflyPrice) setButterflyPrice(parsed.butterflyPrice);
          }
        }
      } catch {
        // تجاهل أخطاء الإعدادات
      }
    } catch (err) {
      console.error('Error init categories:', err);
    }
  }

  // تسجيل الدخول
  const handleAdminLogin = () => {
    const pwd = passwordInput.trim();
    if (!pwd) {
      alert('يرجى كتابة كلمة المرور.');
      return;
    }
    const validPasswords = [
      SITE_CONFIG.adminPassword,
      'karim123',
      'karim1234'
    ];
    if (validPasswords.includes(pwd)) {
      setIsAuthenticated(true);
      setPasswordInput('');
    } else {
      alert('كلمة المرور غير صحيحة!');
    }
  };

  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // رفع الصور لإضافة منتج
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fileExt = file.name ? file.name.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg';
      const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('products-images')
        .upload(fileName, file, { contentType: file.type, upsert: true });

      if (uploadError) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setProductImage(event.target.result as string);
            alert('تم تجهيز الصورة بنجاح! 🖼️');
          }
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data } = supabase.storage.from('products-images').getPublicUrl(fileName);
      if (data?.publicUrl) {
        setProductImage(data.publicUrl);
        alert('تم رفع الصورة بنجاح! 🖼️');
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProductImage(event.target.result as string);
          alert('تم حفظ الصورة محلياً بنجاح! 🖼️');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  }

  // رفع الصور لتعديل منتج
  async function handleEditImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditUploadingImage(true);
    try {
      const fileExt = file.name ? file.name.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg';
      const fileName = `img_edit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('products-images')
        .upload(fileName, file, { contentType: file.type, upsert: true });

      if (uploadError) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) setEditImage(event.target.result as string);
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data } = supabase.storage.from('products-images').getPublicUrl(fileName);
      if (data?.publicUrl) {
        setEditImage(data.publicUrl);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setEditImage(event.target.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setEditUploadingImage(false);
    }
  }

  // إضافة منتج جديد
  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCategory || !productName) {
      alert('يرجى اختيار القسم وتحديد اسم المنتج.');
      return;
    }

    setLoading(true);
    try {
      const finalImage = productImage.trim() || SITE_CONFIG.topLogoUrl;
      const currentCat = categories.find(c => c.id === selectedCategory);
      const isPerfume = (currentCat?.name ?? '').includes('برفان') || (currentCat?.name ?? '').includes('عطور') || (currentCat?.slug ?? '') === 'perfumes';

      let p25Val = Number(p25.price) || null;
      let p35Val = Number(p35.price) || null;
      let p50Val = Number(p50.price) || null;
      let p100Val = Number(p100.price) || null;

      let finalPrice = Number(basePrice) || 0;
      let finalOldPrice = Number(originalPrice) || null;

      if (isPerfume) {
        finalPrice = p50Val || p35Val || p25Val || p100Val || finalPrice || 200;
        finalOldPrice = Number(p50.orig) || Number(p35.orig) || Number(p25.orig) || Number(p100.orig) || finalOldPrice;
      }

      const productData: any = {
        name: productName,
        category_id: selectedCategory,
        description: productDescription || null,
        image_url: finalImage,
        price: finalPrice,
        old_price: finalOldPrice,
        price_25ml: p25Val,
        price_35ml: p35Val,
        price_50ml: p50Val,
        price_100ml: p100Val,
      };

      const { error } = await supabase.from('products').insert([productData]);
      if (error) throw error;

      alert('تم إضافة المنتج بنجاح إلى قاعدة البيانات! 🚀');
      setProductName('');
      setProductDescription('');
      setProductImage('');
      setBasePrice('');
      setOriginalPrice('');
      setP25({ price: '', orig: '' });
      setP35({ price: '', orig: '' });
      setP50({ price: '', orig: '' });
      setP100({ price: '', orig: '' });
      await loadProducts();
      setActiveTab('manage_products');
    } catch (error: any) {
      alert('خطأ أثناء إضافة المنتج: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  // حذف منتج
  async function handleDeleteProduct(prod: any) {
    const ok = confirm(`هل أنت متأكد من حذف المنتج "${prod.name}" نهائياً من المتجر؟`);
    if (!ok) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', prod.id);
      if (error) {
        alert('حدث خطأ أثناء حذف المنتج: ' + error.message);
        return;
      }
      setProductsList(prev => prev.filter(p => p.id !== prod.id));
      alert(`تم حذف المنتج "${prod.name}" بنجاح! 🗑️`);
    } catch (err: any) {
      alert('خطأ: ' + err.message);
    }
  }

  // فتح نافذة تعديل منتج
  function handleStartEdit(prod: any) {
    setEditingProduct(prod);
    setEditName(prod.name || '');
    setEditCategory(prod.category_id || (categories[0]?.id || ''));
    setEditDesc(prod.description || '');
    setEditImage(prod.image_url || '');
    setEditPrice(prod.price !== null && prod.price !== undefined ? String(prod.price) : '');
    setEditOldPrice(prod.old_price ? String(prod.old_price) : '');
    setEditP25(prod.price_25ml ? String(prod.price_25ml) : '');
    setEditP35(prod.price_35ml ? String(prod.price_35ml) : '');
    setEditP50(prod.price_50ml ? String(prod.price_50ml) : '');
    setEditP100(prod.price_100ml ? String(prod.price_100ml) : '');
  }

  // حفظ التعديلات على منتج
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editName.trim() || !editCategory) {
      alert('يرجى تحديد اسم المنتج وقسمه.');
      return;
    }

    setLoading(true);
    try {
      const currentCat = categories.find(c => c.id === editCategory);
      const isPerfume = (currentCat?.name ?? '').includes('برفان') || (currentCat?.name ?? '').includes('عطور') || (currentCat?.slug ?? '') === 'perfumes';

      let p25Val = Number(editP25) || null;
      let p35Val = Number(editP35) || null;
      let p50Val = Number(editP50) || null;
      let p100Val = Number(editP100) || null;

      let finalPrice = Number(editPrice) || 0;
      let finalOldPrice = Number(editOldPrice) || null;

      if (isPerfume && (p25Val || p35Val || p50Val || p100Val)) {
        finalPrice = p50Val || p35Val || p25Val || p100Val || finalPrice || 200;
      }

      const updatePayload: any = {
        name: editName.trim(),
        category_id: editCategory,
        description: editDesc.trim() || null,
        image_url: editImage.trim() || SITE_CONFIG.topLogoUrl,
        price: finalPrice,
        old_price: finalOldPrice,
        price_25ml: p25Val,
        price_35ml: p35Val,
        price_50ml: p50Val,
        price_100ml: p100Val,
      };

      const { error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', editingProduct.id);

      if (error) throw error;

      alert(`تم تحديث بيانات المنتج "${editName}" بنجاح! ✨`);
      setEditingProduct(null);
      await loadProducts();
    } catch (err: any) {
      alert('حدث خطأ أثناء حفظ التعديل: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // إضافة قسم جديد
  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName) return;
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    try {
      const slug = trimmed.toLowerCase().replace(/\s+/g, '-');
      const { data, error } = await supabase.from('categories').insert([{ name: trimmed, slug }]).select();
      if (error) throw error;

      if (data && data[0]) {
        setCategories(prev => [...prev, data[0]]);
        setSelectedCategory(data[0].id);
      }
      setNewCategoryName('');
      alert('تم إضافة القسم بنجاح في قاعدة البيانات! 🎉');
    } catch (err: any) {
      alert('خطأ في إضافة القسم: ' + err.message);
    }
  }

  // حذف قسم
  async function handleDeleteCategory(cat: any) {
    const countProds = productsList.filter(p => p.category_id === cat.id).length;
    const warning = countProds > 0 
      ? `تنبيه: يوجد (${countProds}) منتج مسجل في هذا القسم! هل أنت متأكد تماماً من حذف قسم "${cat.name}" نهائياً؟` 
      : `هل أنت متأكد من حذف قسم "${cat.name}"؟`;

    if (!confirm(warning)) return;

    try {
      const { error } = await supabase.from('categories').delete().eq('id', cat.id);
      if (error) {
        alert('حدث خطأ أثناء حذف القسم: ' + error.message);
        return;
      }
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      if (selectedCategory === cat.id) {
        setSelectedCategory(categories.find(c => c.id !== cat.id)?.id || '');
      }
      alert(`تم حذف قسم "${cat.name}" بنجاح! 🗑️`);
    } catch (err: any) {
      alert('خطأ: ' + err.message);
    }
  }

  // بدء تعديل قسم
  function handleStartEditCat(cat: any) {
    setEditingCat(cat);
    setEditCatName(cat.name);
  }

  // حفظ تعديل قسم
  async function handleSaveEditCat(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCat || !editCatName.trim()) return;

    const trimmed = editCatName.trim();
    const slug = trimmed.toLowerCase().replace(/\s+/g, '-');

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: trimmed, slug })
        .eq('id', editingCat.id);

      if (error) throw error;

      setCategories(prev => prev.map(c => c.id === editingCat.id ? { ...c, name: trimmed, slug } : c));
      alert(`تم تحديث اسم القسم إلى "${trimmed}" بنجاح! ✨`);
      setEditingCat(null);
    } catch (err: any) {
      alert('خطأ أثناء تعديل القسم: ' + err.message);
    }
  }

  // حفظ أسعار الورد
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      localStorage.setItem('hindse_settings', JSON.stringify({
        flowerPrice,
        babyFlowerPrice,
        butterflyPrice
      }));

      try {
        const settings = [
          { key: 'flower_price', value: flowerPrice },
          { key: 'baby_flower_price', value: babyFlowerPrice },
          { key: 'butterfly_price', value: butterflyPrice },
        ];
        for (const s of settings) {
          await supabase.from('settings').upsert({ key: s.key, value: s.value }, { onConflict: 'key' });
        }
      } catch {
        // تجاهل
      }
      alert('تم تحديث أسعار الإضافات بنجاح! ✨');
    } catch (err: any) {
      alert('تم حفظ الإعدادات محلياً بنجاح! ✨');
    }
  }

  // إضافة أو تحديث كود خصم
  async function handleAddDiscount(e: React.FormEvent) {
    e.preventDefault();
    if (!discountCode || !discountValue || !discountExpiresAt) {
      alert('يرجى إدخال كود الخصم، القيمة، وتحديد تاريخ انتهاء الصلاحية.');
      return;
    }

    setLoading(true);
    try {
      const res = await saveCoupon({
        code: discountCode.trim().toUpperCase(),
        value: Number(discountValue),
        type: discountType,
        expires_at: discountExpiresAt,
      });

      if (res.success) {
        alert(`تم حفظ كود الخصم (${discountCode.toUpperCase()}) بصلاحية حتى ${discountExpiresAt} بنجاح! 🎟️`);
        setDiscountCode('');
        setDiscountValue('');
        setDiscountExpiresAt('');
        await loadCoupons();
      } else {
        alert('حدث خطأ: ' + res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDiscount(code: string) {
    if (!confirm(`هل أنت متأكد من حذف كود الخصم (${code})؟`)) return;
    await deleteCoupon(code);
    await loadCoupons();
    alert('تم حذف كود الخصم بنجاح.');
  }

  const isCouponExpired = (expiresAt: string) => {
    if (!expiresAt) return false;
    const exp = new Date(expiresAt);
    exp.setHours(23, 59, 59, 999);
    return new Date() > exp;
  };

  // فلترة المنتجات في صفحة الإدارة
  const filteredProducts = productsList.filter(p => {
    const matchesCat = productCategoryFilter === 'all' || p.category_id === productCategoryFilter;
    const q = productSearch.trim().toLowerCase();
    const matchesSearch = !q || (p.name && p.name.toLowerCase().includes(q)) || (p.description && p.description.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const currentCat = Array.isArray(categories) ? categories.find(c => c.id === selectedCategory) : null;
  const isPerfume = (currentCat?.name ?? '').includes('برفان') || (currentCat?.name ?? '').includes('عطور') || (currentCat?.slug ?? '') === 'perfumes';

  // شاشة تسجيل الدخول السرية
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '30px', maxWidth: '400px', margin: '90px auto', backgroundColor: '#141414', color: '#fff', borderRadius: '18px', border: '1px solid #D4AF37', textAlign: 'center', fontFamily: 'Arial, sans-serif', boxShadow: '0 12px 35px rgba(0,0,0,0.8)' }} dir="rtl">
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛡️</div>
        <h2 style={{ color: '#D4AF37', marginBottom: '8px', fontSize: '22px', fontWeight: 'bold' }}>تسجيل دخول الإدارة</h2>
        <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '22px' }}>أدخل كلمة المرور الخاصة بك للمتابعة</p>
        
        <input 
          type="password" 
          placeholder="أدخل كلمة المرور" 
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdminLogin();
          }}
          autoFocus
          style={{ width: '100%', padding: '14px', backgroundColor: '#222', color: '#fff', border: '1px solid #555', borderRadius: '8px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box', fontSize: '15px', textAlign: 'center' }}
        />
        
        <button 
          onClick={handleAdminLogin}
          style={{ width: '100%', backgroundColor: '#D4AF37', color: '#000', padding: '14px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', marginBottom: '16px' }}
        >
          تسجيل الدخول 🔐
        </button>

        <Link href="/" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none' }}>
          ← العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '20px auto', backgroundColor: '#141414', color: '#fff', borderRadius: '16px', border: '1px solid rgba(212,175,55,0.4)', fontFamily: 'Arial, sans-serif' }} dir="rtl">
      
      {/* شريط التحكم العلوي */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '14px', marginBottom: '20px' }}>
        <Link href="/" style={{ color: '#D4AF37', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', background: '#222', padding: '6px 12px', borderRadius: '6px', border: '1px solid #444' }}>
          ← العودة للمتجر
        </Link>
        <h1 style={{ textAlign: 'center', color: '#D4AF37', margin: 0, fontSize: '22px', fontWeight: 'bold' }}>لوحة تحكم هندسة بيرفيوم 🛡️</h1>
        <button onClick={handleAdminLogout} style={{ background: '#3b1111', color: '#f87171', border: '1px solid #7f1d1d', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
          خروج 🔒
        </button>
      </div>

      {/* التبويبات */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => { setActiveTab('manage_products'); loadProducts(); }} style={tabBtnStyle(activeTab === 'manage_products')}>
          📋 تعديل وحذف المنتجات ({productsList.length})
        </button>
        <button onClick={() => setActiveTab('add_product')} style={tabBtnStyle(activeTab === 'add_product')}>
          ➕ إضافة منتج جديد
        </button>
        <button onClick={() => { setActiveTab('discounts'); loadCoupons(); }} style={tabBtnStyle(activeTab === 'discounts')}>
          🎟️ أكواد الخصم ({couponsList.length})
        </button>
        <button onClick={() => setActiveTab('categories')} style={tabBtnStyle(activeTab === 'categories')}>
          📂 الأقسام ({categories.length})
        </button>
        <button onClick={() => setActiveTab('settings')} style={tabBtnStyle(activeTab === 'settings')}>
          💐 أسعار الورد
        </button>
      </div>

      {/* 1. تبويب إدارة وحذف وتعديل المنتجات */}
      {activeTab === 'manage_products' && (
        <div>
          {/* شريط البحث والفلترة */}
          <div style={{ background: '#202020', padding: '14px', borderRadius: '10px', marginBottom: '18px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="🔍 ابحث عن اسم منتج..." 
              value={productSearch} 
              onChange={(e) => setProductSearch(e.target.value)}
              style={{ flex: 1, minWidth: '200px', padding: '10px', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '6px', fontSize: '13px' }}
            />
            <select 
              value={productCategoryFilter} 
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              style={{ padding: '10px', background: '#111', color: '#fff', border: '1px solid #444', borderRadius: '6px', fontSize: '13px' }}
            >
              <option value="all">جميع الأقسام ({productsList.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button onClick={loadProducts} style={{ background: '#333', color: '#D4AF37', border: '1px solid #D4AF37', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
              تحديث 🔄
            </button>
          </div>

          {loadingProducts ? (
            <p style={{ textAlign: 'center', color: '#D4AF37', padding: '30px' }}>جاري تحميل المنتجات...</p>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', background: '#1a1a1a', padding: '40px', borderRadius: '12px', border: '1px dashed #444' }}>
              <p style={{ color: '#aaa', fontSize: '15px', marginBottom: '12px' }}>لا توجد منتجات مطابقة للبحث أو القسم المحدد.</p>
              <button onClick={() => setActiveTab('add_product')} style={btnStyle}>➕ إضافة منتج الآن</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {filteredProducts.map((prod) => {
                const cat = categories.find(c => c.id === prod.category_id);
                const hasSizes = prod.price_25ml || prod.price_35ml || prod.price_50ml || prod.price_100ml;

                return (
                  <div key={prod.id} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#0d0d0d', marginBottom: '10px', border: '1px solid #292929' }}>
                        <img src={prod.image_url || SITE_CONFIG.topLogoUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px', marginBottom: '6px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: 0 }}>{prod.name}</h3>
                        <span style={{ fontSize: '11px', background: '#2a2208', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.4)', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                          {cat?.name || 'قسم عام'}
                        </span>
                      </div>

                      {prod.description && (
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 8px 0', lineHeight: '1.4', maxClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {prod.description}
                        </p>
                      )}

                      <div style={{ background: '#111', padding: '8px', borderRadius: '6px', fontSize: '12px', marginBottom: '8px' }}>
                        {hasSizes ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', color: '#D4AF37' }}>
                            {prod.price_25ml && <span>25مل: <b>{prod.price_25ml}ج</b></span>}
                            {prod.price_35ml && <span>35مل: <b>{prod.price_35ml}ج</b></span>}
                            {prod.price_50ml && <span>50مل: <b>{prod.price_50ml}ج</b></span>}
                            {prod.price_100ml && <span>100مل: <b>{prod.price_100ml}ج</b></span>}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: '14px' }}>{prod.price} ج.م</span>
                            {prod.old_price && <span style={{ color: '#777', textDecoration: 'line-through', fontSize: '12px' }}>{prod.old_price} ج.م</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* أزرار التعديل والحذف */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid #292929', paddingTop: '10px' }}>
                      <button 
                        onClick={() => handleStartEdit(prod)}
                        style={{ background: '#2b2308', color: '#f59e0b', border: '1px solid #d97706', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        ✏️ تعديل
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(prod)}
                        style={{ background: '#381212', color: '#f87171', border: '1px solid #7f1d1d', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* نافذة تعديل المنتج المختار */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#1c1c1c', border: '2px solid #D4AF37', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative' }}>
            <button onClick={() => setEditingProduct(null)} style={{ position: 'absolute', top: '14px', left: '14px', background: '#333', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            
            <h2 style={{ color: '#D4AF37', fontSize: '20px', margin: '0 0 16px 0', fontWeight: 'bold' }}>✏️ تعديل المنتج: {editingProduct.name}</h2>
            
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#ccc', display: 'block', marginBottom: '4px' }}>القسم:</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={inputStyle} required>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#ccc', display: 'block', marginBottom: '4px' }}>اسم المنتج:</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} required />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#ccc', display: 'block', marginBottom: '4px' }}>وصف المنتج:</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#ccc', display: 'block', marginBottom: '4px' }}>صورة المنتج:</label>
                <input type="file" accept="image/*" onChange={handleEditImageUpload} style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px' }} />
                <input type="text" placeholder="رابط الصورة (URL)" value={editImage} onChange={(e) => setEditImage(e.target.value)} style={inputStyle} />
                {editUploadingImage && <span style={{ fontSize: '12px', color: '#D4AF37' }}>جاري رفع الصورة...</span>}
                {editImage && (
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={editImage} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #D4AF37' }} />
                    <span style={{ fontSize: '12px', color: '#25D366' }}>معاينة الصورة</span>
                  </div>
                )}
              </div>

              <div style={{ background: '#141414', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                <span style={{ fontSize: '13px', color: '#D4AF37', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>💰 الأسعار:</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#aaa', display: 'block' }}>السعر الأساسي (ج.م):</label>
                    <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#aaa', display: 'block' }}>السعر القديم قبل الخصم (اختياري):</label>
                    <input type="number" value={editOldPrice} onChange={(e) => setEditOldPrice(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <span style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '6px' }}>أو أسعار الأحجام (للبرفانات):</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#888' }}>25 مل:</label>
                    <input type="number" value={editP25} onChange={(e) => setEditP25(e.target.value)} placeholder="السعر" style={{ ...inputStyle, padding: '6px', fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#888' }}>35 مل:</label>
                    <input type="number" value={editP35} onChange={(e) => setEditP35(e.target.value)} placeholder="السعر" style={{ ...inputStyle, padding: '6px', fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#888' }}>50 مل:</label>
                    <input type="number" value={editP50} onChange={(e) => setEditP50(e.target.value)} placeholder="السعر" style={{ ...inputStyle, padding: '6px', fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#888' }}>100 مل:</label>
                    <input type="number" value={editP100} onChange={(e) => setEditP100(e.target.value)} placeholder="السعر" style={{ ...inputStyle, padding: '6px', fontSize: '12px' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={loading} style={{ flex: 1, background: 'linear-gradient(to right, #D4AF37, #aa820a)', color: '#000', fontWeight: 'bold', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                  {loading ? 'جاري الحفظ...' : '💾 حفظ التعديلات'}
                </button>
                <button type="button" onClick={() => setEditingProduct(null)} style={{ background: '#333', color: '#fff', padding: '12px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. تبويب إضافة منتج جديد */}
      {activeTab === 'add_product' && (
        <form onSubmit={handleAddProduct} style={formBoxStyle}>
          <h2 style={titleStyle}>➕ إضافة منتج جديد إلى المتجر</h2>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '13px' }}>القسم:</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={inputStyle}
              required
            >
              <option value="">اختر القسم</option>
              {Array.isArray(categories) && categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '13px' }}>اسم المنتج:</label>
            <input 
              type="text" 
              placeholder="مثال: عطر هندسة الملكي" 
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '13px' }}>وصف المنتج (اختياري):</label>
            <textarea 
              placeholder="وصف تفصيلي للمنتج..." 
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
              rows={2}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#fbbf24', fontSize: '14px' }}>صورة المنتج:</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                style={{ color: '#fff', fontSize: '13px' }}
              />
            </div>
            <input 
              type="text"
              placeholder="أو ضع رابط مباشر للصورة هنا (URL)..."
              value={productImage}
              onChange={(e) => setProductImage(e.target.value)}
              style={{ ...inputStyle, fontSize: '12px' }}
            />
            {uploadingImage && <p style={{ color: '#fbbf24', fontSize: '13px' }}>جاري معالجة الصورة...</p>}
            {productImage && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={productImage} alt="Preview" style={{ width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #d97706' }} />
                <span style={{ color: '#10b981', fontSize: '13px' }}>تم إرفاق الصورة بنجاح ✔️</span>
              </div>
            )}
          </div>

          {isPerfume ? (
            <div style={{ marginBottom: '15px', backgroundColor: '#1a1a1a', padding: '12px', borderRadius: '6px', border: '1px solid #444' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#fbbf24', fontWeight: 'bold', fontSize: '13px' }}>أسعار أحجام البرفان:</label>
              
              <div style={sizeRowStyle}>
                <span style={{ width: '60px', fontSize: '13px' }}>25 مل:</span>
                <input type="number" placeholder="السعر" value={p25.price} onChange={(e) => setP25({ ...p25, price: e.target.value })} style={inputStyle} />
                <input type="number" placeholder="قبل الخصم" value={p25.orig} onChange={(e) => setP25({ ...p25, orig: e.target.value })} style={inputStyle} />
              </div>
              <div style={sizeRowStyle}>
                <span style={{ width: '60px', fontSize: '13px' }}>35 مل:</span>
                <input type="number" placeholder="السعر" value={p35.price} onChange={(e) => setP35({ ...p35, price: e.target.value })} style={inputStyle} />
                <input type="number" placeholder="قبل الخصم" value={p35.orig} onChange={(e) => setP35({ ...p35, orig: e.target.value })} style={inputStyle} />
              </div>
              <div style={sizeRowStyle}>
                <span style={{ width: '60px', fontSize: '13px' }}>50 مل:</span>
                <input type="number" placeholder="السعر" value={p50.price} onChange={(e) => setP50({ ...p50, price: e.target.value })} style={inputStyle} />
                <input type="number" placeholder="قبل الخصم" value={p50.orig} onChange={(e) => setP50({ ...p50, orig: e.target.value })} style={inputStyle} />
              </div>
              <div style={sizeRowStyle}>
                <span style={{ width: '60px', fontSize: '13px' }}>100 مل:</span>
                <input type="number" placeholder="السعر" value={p100.price} onChange={(e) => setP100({ ...p100, price: e.target.value })} style={inputStyle} />
                <input type="number" placeholder="قبل الخصم" value={p100.orig} onChange={(e) => setP100({ ...p100, orig: e.target.value })} style={inputStyle} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '13px' }}>السعر الحالي (ج.م):</label>
                <input type="number" placeholder="مثال: 350" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} style={inputStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '13px' }}>السعر قبل الخصم (اختياري):</label>
                <input type="number" placeholder="مثال: 450" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} style={inputStyle} />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} style={mainBtnStyle}>
            {loading ? 'جاري النشر...' : 'نشر المنتج في المتجر 🚀'}
          </button>
        </form>
      )}

      {/* 3. تبويب الأقسام (إضافة وتعديل وحذف) */}
      {activeTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* نموذج إضافة قسم جديد */}
          <form onSubmit={handleAddCategory} style={formBoxStyle}>
            <h2 style={titleStyle}>➕ إضافة قسم جديد 📁</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="اسم القسم (مثال: ساعات رجالي)" 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                style={inputStyle}
                required
              />
              <button type="submit" style={btnStyle}>إضافة القسم 🚀</button>
            </div>
          </form>

          {/* قائمة الأقسام الحالية */}
          <div style={{ backgroundColor: '#202020', padding: '18px', borderRadius: '10px', border: '1px solid #333' }}>
            <h3 style={{ fontSize: '16px', color: '#fbbf24', margin: '0 0 14px 0', fontWeight: 'bold' }}>
              📋 الأقسام المسجلة في المتجر ({categories.length}):
            </h3>

            {categories.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', margin: '20px 0' }}>لا توجد أقسام مسجلة حالياً.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {categories.map((cat) => {
                  const prodCount = productsList.filter(p => p.category_id === cat.id).length;

                  return (
                    <div 
                      key={cat.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#161616',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #2d2d2d',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>📁</span>
                        <div>
                          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', display: 'block' }}>{cat.name}</span>
                          <span style={{ fontSize: '12px', color: '#777' }}>معرّف القسم: {cat.slug || cat.id}</span>
                        </div>
                        <span style={{ fontSize: '11px', background: '#25200e', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                          {prodCount} منتج
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleStartEditCat(cat)}
                          style={{ background: '#2b2308', color: '#f59e0b', border: '1px solid #d97706', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                        >
                          ✏️ تعديل
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat)}
                          style={{ background: '#381212', color: '#f87171', border: '1px solid #7f1d1d', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* نافذة تعديل القسم المختار */}
          {editingCat && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <div style={{ background: '#1c1c1c', border: '2px solid #D4AF37', borderRadius: '16px', width: '100%', maxWidth: '450px', padding: '24px', position: 'relative' }}>
                <button onClick={() => setEditingCat(null)} style={{ position: 'absolute', top: '14px', left: '14px', background: '#333', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                
                <h3 style={{ color: '#D4AF37', fontSize: '18px', margin: '0 0 14px 0', fontWeight: 'bold' }}>✏️ تعديل اسم القسم</h3>
                
                <form onSubmit={handleSaveEditCat} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: '#ccc', display: 'block', marginBottom: '6px' }}>اسم القسم الجديد:</label>
                    <input 
                      type="text" 
                      value={editCatName} 
                      onChange={(e) => setEditCatName(e.target.value)} 
                      style={inputStyle} 
                      required 
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" style={{ flex: 1, background: 'linear-gradient(to right, #D4AF37, #aa820a)', color: '#000', fontWeight: 'bold', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                      💾 حفظ التعديل
                    </button>
                    <button type="button" onClick={() => setEditingCat(null)} style={{ background: '#333', color: '#fff', padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. تبويب أسعار الورد */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} style={formBoxStyle}>
          <h2 style={titleStyle}>تعديل أسعار إضافات الورد والبوكسات 💐</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#ccc' }}>سعر الوردة (ج.م):</label>
              <input type="number" value={flowerPrice} onChange={(e) => setFlowerPrice(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#ccc' }}>سعر بيبي فلاور (ج.م):</label>
              <input type="number" value={babyFlowerPrice} onChange={(e) => setBabyFlowerPrice(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#ccc' }}>سعر الفراشات (ج.م):</label>
              <input type="number" value={butterflyPrice} onChange={(e) => setButterflyPrice(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <button type="submit" style={mainBtnStyle}>حفظ أسعار الإضافات</button>
        </form>
      )}

      {/* 5. تبويب أكواد الخصم */}
      {activeTab === 'discounts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <form onSubmit={handleAddDiscount} style={formBoxStyle}>
            <h2 style={titleStyle}>إنشاء كود خصم مع تحديد مدة الصلاحية 🎟️</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#ccc', display: 'block', marginBottom: '4px' }}>كود الخصم:</label>
                <input 
                  type="text" 
                  placeholder="مثال: HINDSE20" 
                  value={discountCode} 
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} 
                  style={inputStyle} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#ccc', display: 'block', marginBottom: '4px' }}>نوع الخصم:</label>
                  <select 
                    value={discountType} 
                    onChange={(e) => setDiscountType(e.target.value as any)} 
                    style={inputStyle}
                  >
                    <option value="fixed">مبلغ ثابت (ج.م)</option>
                    <option value="percent">نسبة مئوية (%)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#ccc', display: 'block', marginBottom: '4px' }}>
                    {discountType === 'percent' ? 'النسبة المئوية (%):' : 'قيمة الخصم (ج.م):'}
                  </label>
                  <input 
                    type="number" 
                    placeholder={discountType === 'percent' ? 'مثال: 15' : 'مثال: 50'} 
                    value={discountValue} 
                    onChange={(e) => setDiscountValue(e.target.value)} 
                    style={inputStyle} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#fbbf24', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  ⏳ تاريخ انتهاء الصلاحية:
                </label>
                <input 
                  type="date" 
                  value={discountExpiresAt} 
                  onChange={(e) => setDiscountExpiresAt(e.target.value)} 
                  style={{ ...inputStyle, colorScheme: 'dark' }} 
                  required 
                />
                <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginTop: '4px' }}>
                  * بعد انتهاء هذا التاريخ، سيرفض النظام تطبيق الكوبون للعملاء تلقائياً.
                </span>
              </div>
            </div>

            <button type="submit" disabled={loading} style={mainBtnStyle}>
              {loading ? 'جاري الحفظ...' : 'حفظ ونشر كود الخصم 🎟️'}
            </button>
          </form>

          {/* قائمة الكوبونات المسجلة */}
          <div style={{ backgroundColor: '#262626', padding: '15px', borderRadius: '8px', border: '1px solid #404040' }}>
            <h3 style={{ fontSize: '16px', color: '#fbbf24', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📋 الأكواد المسجلة حالياً:</span>
              <button onClick={loadCoupons} style={{ fontSize: '12px', background: '#333', color: '#ccc', border: '1px solid #555', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>تحديث 🔄</button>
            </h3>

            {couponsList.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', margin: '15px 0' }}>لا توجد أكواد خصم مسجلة حالياً.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {couponsList.map((cpn) => {
                  const expired = isCouponExpired(cpn.expires_at);
                  return (
                    <div 
                      key={cpn.code} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '12px', 
                        backgroundColor: '#1a1a1a', 
                        border: expired ? '1px solid #7f1d1d' : '1px solid #065f46', 
                        borderRadius: '6px' 
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff', letterSpacing: '1px' }}>{cpn.code}</span>
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', backgroundColor: expired ? '#7f1d1d' : '#065f46', color: '#fff' }}>
                            {expired ? '⛔ منتهي الصلاحية' : '✅ ساري وفعال'}
                          </span>
                        </div>
                        <span style={{ fontSize: '13px', color: '#D4AF37', display: 'block', marginTop: '2px' }}>
                          الخصم: {cpn.value} {cpn.type === 'percent' ? '%' : 'ج.م'}
                        </span>
                        <span style={{ fontSize: '12px', color: expired ? '#ef4444' : '#9ca3af', display: 'block' }}>
                          تاريخ الانتهاء: {cpn.expires_at || 'غير محدد'}
                        </span>
                      </div>

                      <button 
                        onClick={() => handleDeleteDiscount(cpn.code)}
                        style={{ backgroundColor: '#450a0a', color: '#f87171', border: '1px solid #7f1d1d', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        حذف 🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const formBoxStyle = { padding: '16px', backgroundColor: '#202020', borderRadius: '10px', border: '1px solid #333' };
const titleStyle = { fontSize: '18px', color: '#fbbf24', marginBottom: '15px', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '10px', backgroundColor: '#111', color: '#fff', border: '1px solid #444', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' as const, fontSize: '14px' };
const btnStyle = { backgroundColor: '#d97706', color: '#000', padding: '10px 18px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' as const, fontSize: '14px' };
const mainBtnStyle = { width: '100%', backgroundColor: '#d97706', color: '#000', padding: '12px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' };
const sizeRowStyle = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' };
const tabBtnStyle = (isActive: boolean) => ({
  backgroundColor: isActive ? '#d97706' : '#222',
  color: isActive ? '#000' : '#fff',
  padding: '10px 16px',
  fontWeight: 'bold',
  border: isActive ? '1px solid #d97706' : '1px solid #444',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '13px'
});