
export const uploadToCloudinary = async (file: File, folder: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "abode-admin");
  formData.append("folder", folder);

  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not defined");
  }

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json()
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
}
