/**
 * Client-side File Upload Handler
 * Converts image/document files into Base64 Data URLs for MongoDB storage.
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
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
};

/**
 * Upload a file — reads it as a Base64 Data URL for storage in MongoDB.
 * @param {File} file - File object to upload
 * @param {string} [pathFolder] - Folder identifier (used for future storage routing)
 * @param {Function} [onProgress] - Optional progress callback (0–100)
 * @returns {Promise<string>} Data URL string
 */
export const uploadFile = async (file, pathFolder = 'uploads', onProgress) => {
  if (!file) throw new Error('No file provided for upload');
  if (onProgress) onProgress(30);
  const result = await readAsBase64(file, onProgress);
  if (onProgress) onProgress(100);
  return result;
};

/**
 * Delete a file — no-op for Base64/MongoDB storage.
 * @param {string} fileUrl
 */
export const deleteFile = async (fileUrl) => {
  return Promise.resolve();
};

// Legacy aliases for backward compat (will be removed after full migration)
export const uploadFirebaseFile = uploadFile;
export const deleteFirebaseFile = deleteFile;

export default { uploadFile, deleteFile, uploadFirebaseFile, deleteFirebaseFile };
