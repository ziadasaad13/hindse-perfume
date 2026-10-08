// الملف: lib/site-config.ts
export const SITE_CONFIG = {
  brandName: "هندسة بيرفيوم - Handasa Perfume",
  slogan: "معانا الحياة ريحتها حلوة",
  
  // رابط صفحة الفيسبوك
  facebookUrl: "https://www.facebook.com/share/19n1gxAxMd/",

  // رقم الواتساب الموحد
  whatsappNumber: "201066510085",

  // رابط موقع اكسسوارات تِبـر
  tabarUrl: "https://tepar-ten.vercel.app/",

  // رابط موقع عطور المحاكاة (تطيّب)
  tatayebUrl: "https://tatayab.vercel.app/",

  // رابط لينكد إن
  linkedinUrl: "https://www.linkedin.com/in/amir-gawish-3b7173403?utm_source=share_via&utm_content=profile&utm_medium=member_ios",

  // كلمة مرور الأدمن
  adminPassword: "karim123",

  // روابط اللوجو
  topLogoUrl: "/logo.png",
  bottomLogoUrl: "/logo.png",

  // أسعار الورد والإضافات الافتراضية
  prices: {
    rose: 30,
    babyFlower: 50,
    butterfly: 30,
  },

  // أسعار الشحن حسب المحافظات
  shippingRates: {
    tier65: ['كفر الشيخ', 'البحيرة'],
    tier80: ['الإسكندرية', 'الدقهلية', 'الغربية', 'المنوفية', 'الشرقية', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'مطروح'],
    tier90: ['القاهرة', 'الجيزة', 'القليوبية', 'الفيوم'],
    tier100Default: 100
  }
};