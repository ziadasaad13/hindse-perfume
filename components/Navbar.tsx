import Image from 'next/image';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/site-config';

export default function Navbar() {
  return (
    <nav className="bg-black text-yellow-500 p-4 flex justify-between items-center border-b border-yellow-600">
      <div className="flex items-center gap-3">
        <Image 
          src={SITE_CONFIG.topLogoUrl} 
          alt={SITE_CONFIG.brandName} 
          width={45} 
          height={45} 
          className="rounded-full border border-yellow-500 object-cover" 
        />
        <span className="text-xl font-bold">{SITE_CONFIG.brandName.split('-')[0].trim()}</span>
      </div>
      
      <div className="flex gap-4 items-center font-medium">
        <Link href="/" className="hover:text-white transition">الرئيسية</Link>
        
        <a 
          href={SITE_CONFIG.tabarUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-white transition"
        >
          اكسسوارات تبر
        </a>
        
        <a 
          href={SITE_CONFIG.tatayebUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-white transition"
        >
          عطور محاكاة
        </a>
      </div>
    </nav>
  );
}