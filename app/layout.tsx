import './globals.css';
import FloatingSocials from '@/components/FloatingSocials';

export const metadata = {
  title: 'هندسة بيرفيوم',
  description: 'معانا الحياة ريحتها حلوة',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
        <FloatingSocials />
      </body>
    </html>
  );
}