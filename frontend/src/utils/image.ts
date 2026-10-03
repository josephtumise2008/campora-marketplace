/**
 * Client-side image preparation for seller uploads.
 *
 * Phone cameras produce 4–12 MB files, which is slow to upload and heavy to
 * store. We rotate, downscale and re-encode in the browser before the request
 * so a listing photo lands at roughly 150–400 KB while still looking sharp on
 * a retina screen.
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_EDGE = 1600;
const QUALITY = 0.82;

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"];

export const isAcceptedImage = (file: File) =>
  file.type.startsWith("image/") && (ACCEPTED.includes(file.type) || /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(file.name));

export const describeFileSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const loadBitmap = async (file: File): Promise<ImageBitmap | HTMLImageElement> => {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to the <img> decoder */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
};

const dimensions = (source: ImageBitmap | HTMLImageElement) => ({
  width: "width" in source ? source.width : 0,
  height: "height" in source ? source.height : 0,
});

/** SVG and animated formats are passed through untouched. */
const passthrough = (file: File) => file.type === "image/svg+xml" || file.type === "image/gif";

export interface PreparedImage {
  blob: Blob;
  name: string;
  width: number;
  height: number;
  /** True when the browser had to fall back to the untouched original. */
  original: boolean;
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!isAcceptedImage(file)) throw new Error("Choose a JPG, PNG, WEBP, GIF, AVIF or SVG image");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`That photo is ${describeFileSize(file.size)} — pick one under 10 MB`);
  }

  if (passthrough(file)) {
    return { blob: file, name: file.name, width: 0, height: 0, original: true };
  }

  try {
    const source = await loadBitmap(file);
    const { width, height } = dimensions(source);
    if (!width || !height) throw new Error("unknown size");

    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("no 2d context");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source as CanvasImageSource, 0, 0, targetWidth, targetHeight);
    if ("close" in source && typeof source.close === "function") source.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    );
    if (!blob) throw new Error("encode failed");

    const stem = file.name.replace(/\.[^.]+$/, "") || "photo";
    return {
      blob,
      name: `${stem}.jpg`,
      width: targetWidth,
      height: targetHeight,
      original: false,
    };
  } catch {
    // Safari/HEIC and other formats the canvas cannot decode still upload fine.
    return { blob: file, name: file.name, width: 0, height: 0, original: true };
  }
}