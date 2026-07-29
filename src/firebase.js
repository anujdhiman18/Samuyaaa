import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBwY91EckPyl9OdwSwBiAv7ddz6o5JJtFc",
  authDomain: "saumya-8e8d4.firebaseapp.com",
  projectId: "saumya-8e8d4",
  storageBucket: "saumya-8e8d4.firebasestorage.app",
  messagingSenderId: "948990834474",
  appId: "1:948990834474:web:e806d5736b17b1d307d053",
  measurementId: "G-BMEBQ5YHV2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const readAsBase64 = (file, onProgress) => {
  return new Promise((resolve, reject) => {
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
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
};

/**
 * Upload a file to Firebase Storage with automatic Base64 fallback if storage bucket CORS or network hangs
 * @param {File} file - File object to upload
 * @param {string} pathFolder - Storage folder path (e.g., 'faculty', 'alumni', 'gallery')
 * @param {Function} [onProgress] - Optional progress callback (0-100)
 * @returns {Promise<string>} Download URL or Data URL
 */
export const uploadFirebaseFile = (file, pathFolder, onProgress) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided for upload'));
    }

    if (onProgress) onProgress(20);

    const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${fileExt}`;
    const storageRef = ref(storage, `${pathFolder}/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    let isCompleted = false;

    // Timeout fallback to FileReader Base64 if Firebase Storage hangs or CORS fails
    const fallbackTimeout = setTimeout(() => {
      if (!isCompleted) {
        console.warn('Firebase Storage upload timed out, falling back to Base64 data URL reader...');
        uploadTask.cancel();
        readAsBase64(file, onProgress).then(resolve).catch(reject);
      }
    }, 4000);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.warn('Firebase Storage upload error/canceled, falling back to Base64:', error.message);
        clearTimeout(fallbackTimeout);
        if (!isCompleted) {
          readAsBase64(file, onProgress).then(resolve).catch(reject);
        }
      },
      async () => {
        isCompleted = true;
        clearTimeout(fallbackTimeout);
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          if (onProgress) onProgress(100);
          resolve(downloadURL);
        } catch (err) {
          readAsBase64(file, onProgress).then(resolve).catch(reject);
        }
      }
    );
  });
};

/**
 * Delete a file from Firebase Storage using its download URL
 * @param {string} fileUrl - Firebase Storage Download URL
 */
export const deleteFirebaseFile = async (fileUrl) => {
  if (!fileUrl || !fileUrl.includes('firebasestorage.googleapis.com')) return;
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn('Firebase Storage delete error (file may not exist):', err.message);
  }
};

export default app;
