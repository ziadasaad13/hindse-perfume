import { FaFacebook, FaWhatsapp } from 'react-icons/fa';
import { SITE_CONFIG } from '@/lib/site-config';

export default function FloatingSocials() {
  const whatsappLink = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent('مرحباً هندسة بيرفيوم، أريد الاستفسار عن الأوردر')}`;

  return (
    <div className="fixed bottom-6 left-6 flex flex-col gap-3 z-50">
      <a 
        href={SITE_CONFIG.facebookUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:scale-110 transition flex items-center justify-center"
        aria-label="Facebook"
      >
        <FaFacebook size={24} />
      </a>
      <a 
        href={whatsappLink} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="bg-green-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transition flex items-center justify-center"
        aria-label="WhatsApp"
      >
        <FaWhatsapp size={24} />
      </a>
    </div>
  );
}