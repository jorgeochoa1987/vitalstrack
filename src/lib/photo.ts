import { supabase } from "./supabase";

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.72;

export async function fileToCompressedBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY),
  );
  return blob ?? file;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function uploadMeasurementPhoto(
  userId: string,
  file: File,
): Promise<string> {
  const compressed = await fileToCompressedBlob(file);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage
    .from("measurement-photos")
    .upload(path, compressed, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("measurement-photos")
    .getPublicUrl(path);

  return data.publicUrl;
}

/** Sube a Storage; si falla (bucket/tabla), guarda data URL local. */
export async function resolvePhotoUrl(
  userId: string,
  file: File | null,
  preferLocal: boolean,
): Promise<string | undefined> {
  if (!file) return undefined;

  if (preferLocal) {
    const compressed = await fileToCompressedBlob(file);
    return blobToDataUrl(compressed);
  }

  try {
    return await uploadMeasurementPhoto(userId, file);
  } catch {
    const compressed = await fileToCompressedBlob(file);
    return blobToDataUrl(compressed);
  }
}
