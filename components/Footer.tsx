import { SITE_CONFIG } from '@/lib/site-config';

export default function Footer() {
  return (
    <footer className="bg-black text-center p-6 text-yellow-500 border-t border-yellow-600 mt-10">
      <p className="mb-2 text-sm">{SITE_CONFIG.slogan}</p>
      <p className="text-sm">
        Made & Developed by{' '}
        <a 
          href={SITE_CONFIG.linkedinUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="underline font-bold text-white hover:text-yellow-400 transition"
        >
          Amir Gawish
        </a>
      </p>
    </footer>
  );
}