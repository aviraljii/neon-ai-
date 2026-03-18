import { v2 as cloudinary, type UploadApiOptions } from 'cloudinary';

let isCloudinaryConfigured = false;

function configureCloudinary() {
  if (isCloudinaryConfigured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Missing Cloudinary environment variables. Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.',
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  isCloudinaryConfigured = true;
}

export async function uploadImageToCloudinary(
  file: string,
  options: UploadApiOptions = {},
) {
  configureCloudinary();

  const result = await cloudinary.uploader.upload(file, {
    folder: 'posts',
    resource_type: 'image',
    ...options,
  });

  if (!result.secure_url) {
    throw new Error('Cloudinary upload failed: secure_url missing in response.');
  }

  return result.secure_url;
}
