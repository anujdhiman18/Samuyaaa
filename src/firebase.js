/**
 * Modern Client-side File Upload & Storage Handler (Zero Firebase SDK dependency)
 * Converts image/document files into optimized Data URLs / Base64 for persistent MongoDB storage
 */

const readAsBase64 = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided for upload.'));
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };
    reader.onload = () => {
      if (onProgress) onProgress(100);
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error('Failed to read image/document file.'));
    reader.readAsDataURL(file);
  });
};

/**
 * Upload a file to storage (Direct Data URL / Base64 encoding for MongoDB persistence)
 * @param {File} file - File object to upload
 * @param {string} [pathFolder] - Target folder identifier
 * @param {Function} [onProgress] - Optional progress callback (0-100)
 * @returns {Promise<string>} Data URL
 */
export const uploadFirebaseFile = async (file, pathFolder = 'uploads', onProgress) => {
  if (!file) {
    throw new Error('No file provided for upload');
  }
  if (onProgress) onProgress(30);
  const result = await readAsBase64(file, onProgress);
  if (onProgress) onProgress(100);
  return result;
};

/**
 * Delete a file (Standalone MongoDB cleanup no-op)
 * @param {string} fileUrl
 */
export const deleteFirebaseFile = async (fileUrl) => {
  return Promise.resolve();
};

export const auth = null;
export const db = null;
export const storage = null;

export default {
  uploadFirebaseFile,
  deleteFirebaseFile,
};
