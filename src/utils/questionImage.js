// Serializable media contract shared by the editor and server. A future upload
// service can return an HTTPS imageUrl without changing any question views.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
// Base64 plus the question stays below the existing 500 KB socket command cap.
export const MAX_IMAGE_BYTES = 320 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validateQuestionImage(question) {
  const { imageUrl, imageAlt } = question;
  if (imageAlt != null && (typeof imageAlt !== 'string' || imageAlt.length > 200))
    throw new Error('Keep the image description under 200 characters.');
  if (imageUrl == null || imageUrl === '') return;
  if (typeof imageUrl !== 'string') throw new Error('Choose a valid question image.');
  if (/^https:\/\//i.test(imageUrl) && imageUrl.length <= 2048) {
    const url = new URL(imageUrl);
    if (url.username || url.password) throw new Error('Image links cannot contain credentials.');
    return;
  }
  if (imageUrl.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 32)
    throw new Error('This image is too large to save. Choose a smaller image.');
  if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(imageUrl))
    throw new Error('Choose a PNG, JPEG, WebP or GIF image using the upload button.');
}

export async function prepareQuestionImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Please choose a PNG, JPEG, WebP or GIF image.');
  if (!file.size || file.size > MAX_UPLOAD_BYTES) throw new Error('Please choose an image smaller than 4 MB.');
  const previewUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = previewUrl;
    await img.decode().catch(() => { throw new Error('This image could not be opened. Try another file.'); });
    if (img.naturalWidth * img.naturalHeight > 40000000)
      throw new Error('This image has very large dimensions. Resize it and try again.');
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    // Flatten animated files and strip metadata; never persist temporary blob URLs.
    for (const quality of [.85, .65, .45]) {
      const imageUrl = canvas.toDataURL('image/webp', quality);
      if (imageUrl.length <= Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 32) {
        validateQuestionImage({ imageUrl });
        return imageUrl;
      }
    }
    throw new Error('This image is too detailed to save. Try a smaller version.');
  } finally { URL.revokeObjectURL(previewUrl); }
}
