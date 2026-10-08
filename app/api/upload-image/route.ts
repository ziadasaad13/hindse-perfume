import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    // 1. تجربة الرفع عبر Catbox (سيرفر رفع صور مباشر ودائم)
    try {
      const catboxForm = new FormData();
      catboxForm.append('reqtype', 'fileupload');
      catboxForm.append('fileToUpload', file);

      const catboxRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: catboxForm,
      });

      if (catboxRes.ok) {
        const text = (await catboxRes.text()).trim();
        if (text.startsWith('http')) {
          return NextResponse.json({ success: true, url: text });
        }
      }
    } catch (err) {
      console.warn('Catbox upload failed, trying tmpfiles fallback:', err);
    }

    // 2. بديل احتياطي عبر tmpfiles
    try {
      const tmpForm = new FormData();
      tmpForm.append('file', file);

      const tmpRes = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: tmpForm,
      });

      if (tmpRes.ok) {
        const json = await tmpRes.json();
        if (json?.data?.url) {
          // تحويل الرابط لرابط تحميل مباشر
          const directUrl = json.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
          return NextResponse.json({ success: true, url: directUrl });
        }
      }
    } catch (err) {
      console.warn('tmpfiles fallback failed:', err);
    }

    return NextResponse.json({ success: false, error: 'Failed to upload image' }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
