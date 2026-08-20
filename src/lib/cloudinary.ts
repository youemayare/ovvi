import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/**
 * Uploads a file buffer to Cloudinary and returns the secure URL and public_id.
 * Used in server-side upload routes (never expose api_secret to the client).
 */
export async function uploadToCloudinary(
  file: Buffer | string,
  folder: string,
  options?: Record<string, unknown>
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(
    typeof file === "string" ? file : `data:image/webp;base64,${file.toString("base64")}`,
    {
      folder: `ovvi/${folder}`,
      transformation: [
        { quality: "auto:good" },
        { fetch_format: "auto" }, // auto WebP/AVIF
      ],
      ...options,
    }
  );

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

/**
 * Deletes an image from Cloudinary by its public_id.
 * Call this when a seller deletes a product image.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
