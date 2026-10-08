import { supabase } from './supabase';

export type Coupon = {
  id?: string;
  code: string;
  value: number; // قيمة الخصم بالجنية أو النسبة
  type?: 'fixed' | 'percent'; // خصم ثابت بالجنيه أو نسبة مئوية
  expires_at: string; // تاريخ الانتهاء بصيغة YYYY-MM-DD
  created_at?: string;
};

const STORAGE_KEY = 'hindse_coupons';

/**
 * جلب قائمة الكوبونات المسجلة من Supabase مع كاش محلي
 */
export async function getCoupons(): Promise<Coupon[]> {
  try {
    // 1. محاولة الجلب من جدول discount_codes في حال تم إنشاؤه
    const { data: dbData, error: dbErr } = await supabase.from('discount_codes').select('*');
    if (!dbErr && dbData && Array.isArray(dbData) && dbData.length > 0) {
      const mapped: Coupon[] = dbData.map(c => ({
        id: c.id,
        code: (c.code || '').toUpperCase(),
        value: Number(c.value) || 0,
        type: c.type || 'fixed',
        expires_at: c.expires_at || c.expiry_date || '',
        created_at: c.created_at,
      }));
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
      }
      return mapped;
    }

    // 2. الجلب من السجل السحابي في Supabase عبر _system_coupons
    const { data: sysData, error: sysErr } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', '_system_coupons')
      .maybeSingle();

    if (!sysErr && sysData && sysData.name) {
      try {
        const parsed = JSON.parse(sysData.name);
        if (Array.isArray(parsed)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          }
          return parsed;
        }
      } catch {
        // تجاهل أخطاء الـ parse
      }
    }
  } catch (err) {
    console.error('Error fetching coupons from Supabase:', err);
  }

  // 3. استرجاع من التخزين المحلي في حال عدم الاتصال
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) return JSON.parse(local);
    } catch {
      return [];
    }
  }

  return [];
}

/**
 * حفظ كوبون جديد ومزامنته سحابياً
 */
export async function saveCoupon(coupon: Coupon): Promise<{ success: boolean; error?: string }> {
  try {
    const formatted: Coupon = {
      ...coupon,
      code: coupon.code.trim().toUpperCase(),
      value: Number(coupon.value),
      type: coupon.type || 'fixed',
      expires_at: coupon.expires_at,
      created_at: new Date().toISOString(),
    };

    // جلب القائمة الحالية وتحديثها
    const current = await getCoupons();
    // إزالة أي كوبون سابق بنفس الكود
    const filtered = current.filter(c => c.code !== formatted.code);
    const updated = [...filtered, formatted];

    // حفظ محلياً
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    // حفظ سحابياً في Supabase
    try {
      await supabase.from('categories').upsert(
        [{ name: JSON.stringify(updated), slug: '_system_coupons' }],
        { onConflict: 'slug' }
      );
    } catch {
      // استمرار
    }

    // محاولة الإضافة في جدول discount_codes إن وجد
    try {
      await supabase.from('discount_codes').upsert({
        code: formatted.code,
        value: formatted.value,
        type: formatted.type,
        expires_at: formatted.expires_at,
      }, { onConflict: 'code' });
    } catch {
      // استمرار
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'حدث خطأ أثناء حفظ الكوبون' };
  }
}

/**
 * حذف كوبون من السحابة والمحلي
 */
export async function deleteCoupon(code: string): Promise<boolean> {
  try {
    const targetCode = code.trim().toUpperCase();
    const current = await getCoupons();
    const updated = current.filter(c => c.code !== targetCode);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    await supabase.from('categories').upsert(
      [{ name: JSON.stringify(updated), slug: '_system_coupons' }],
      { onConflict: 'slug' }
    );

    try {
      await supabase.from('discount_codes').delete().eq('code', targetCode);
    } catch {
      // استمرار
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * التحقق من صلاحية الكوبون وحساب قيمة الخصم
 */
export function validateCoupon(coupon: Coupon, subtotal: number): {
  valid: boolean;
  discountAmount: number;
  message?: string;
} {
  if (!coupon || !coupon.code) {
    return { valid: false, discountAmount: 0, message: 'كود الخصم غير موجود!' };
  }

  // فحص تاريخ الصلاحية
  if (coupon.expires_at) {
    const expiryDate = new Date(coupon.expires_at);
    // تمديد الوقت لآخر ثانية في اليوم المحدد
    expiryDate.setHours(23, 59, 59, 999);
    const now = new Date();

    if (now > expiryDate) {
      return {
        valid: false,
        discountAmount: 0,
        message: `عذراً، هذا الكوبون انتهت صلاحيته في تاريخ (${coupon.expires_at})!`
      };
    }
  }

  // حساب قيمة الخصم
  let discount = 0;
  if (coupon.type === 'percent') {
    discount = (subtotal * coupon.value) / 100;
  } else {
    discount = coupon.value;
  }

  // التأكد من أن الخصم لا يتجاوز إجمالي المنتجات
  if (discount > subtotal) {
    discount = subtotal;
  }

  return {
    valid: true,
    discountAmount: Math.round(discount),
    message: `تم تطبيق الخصم بنجاح! تم خصم ${Math.round(discount)} ج.م`
  };
}
