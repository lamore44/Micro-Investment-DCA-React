import RNFS from 'react-native-fs';

function toBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  const bytes = new TextEncoder().encode(str);
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const enc1 = b1 >> 2;
    const enc2 = ((b1 & 3) << 4) | (b2 >> 4);
    const enc3 = ((b2 & 15) << 2) | (b3 >> 6);
    const enc4 = b3 & 63;
    result += chars[enc1] + chars[enc2];
    if (i + 1 < bytes.length) result += chars[enc3]; else result += '=';
    if (i + 2 < bytes.length) result += chars[enc4]; else result += '=';
  }
  return result;
}

// ── PDFBolt API ────────────────────────────────────────

export async function convertHtmlToPdf(
  html: string,
  apiKey: string,
): Promise<string> {
  const res = await fetch('https://api.pdfbolt.com/v1/direct', {
    method: 'POST',
    headers: {
      'API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html: toBase64(html),
      isEncoded: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = `PDFBolt error: ${res.status}`;
    try {
      const err = JSON.parse(text);
      message = err.errorMessage || err.errorCode || message;
    } catch {}
    throw new Error(message);
  }

  // Response is base64-encoded PDF (isEncoded=true)
  const base64 = await res.text();
  const pdfPath = `${RNFS.CachesDirectoryPath}/microdca_report.pdf`;

  await RNFS.writeFile(pdfPath, base64, 'base64');

  return pdfPath;
}
