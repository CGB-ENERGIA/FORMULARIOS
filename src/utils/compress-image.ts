/**
 * Compresses a data URL by resizing to max dimensions and re-encoding as JPEG.
 * Falls back to the original data URL on any error.
 */
export async function compressImage(
  dataUrl: string,
  quality = 0.65,
  maxW = 1024,
  maxH = 768,
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Returns JPEG quality for a given photo count to keep the PDF near 10 MB.
 * Assumes ~35 KB/photo at q=0.65, scaling down proportionally.
 */
export function photoQuality(totalPhotos: number): number {
  if (totalPhotos > 80) return 0.40;
  if (totalPhotos > 50) return 0.50;
  if (totalPhotos > 20) return 0.60;
  return 0.70;
}

/** Compresses an array of data URLs in parallel at the given quality. */
export async function compressAll(
  dataUrls: string[],
  quality: number,
  maxW = 1024,
  maxH = 768,
): Promise<string[]> {
  return Promise.all(dataUrls.map((url) => compressImage(url, quality, maxW, maxH)));
}
