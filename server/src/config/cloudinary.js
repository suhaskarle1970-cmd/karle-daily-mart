import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const FOLDER = "karke-daily-mart";

/**
 * Upload product/slider image to Cloudinary.
 *
 * - Limits dimensions to 1200x1200
 * - Automatically optimizes quality
 * - Automatically selects modern image format (WebP/AVIF when supported)
 * - Strips unnecessary metadata
 * - Keeps aspect ratio
 */
export function uploadImageBuffer(buffer, { folder = "products" } = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${FOLDER}/${folder}`,
        resource_type: "image",

        transformation: [
          {
            width: 1200,
            height: 1200,
            crop: "limit",
          },
          {
            quality: "auto",
          },
          {
            fetch_format: "auto",
          },
        ],
      },

      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary.
 */
export async function deleteImage(publicId) {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
  } catch (err) {
    console.error(`[cloudinary] failed to delete ${publicId}:`, err.message);
  }
}

export default cloudinary;
