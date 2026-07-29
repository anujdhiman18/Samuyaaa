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

/**
 * Upload a file to Firebase Storage
 * @param {File} file - File object to upload
 * @param {string} pathFolder - Storage folder path (e.g., 'faculty', 'alumni', 'gallery')
 * @param {Function} [onProgress] - Optional progress callback (0-100)
 * @returns {Promise<string>} Download URL
 */
export const uploadFirebaseFile = (file, pathFolder, onProgress) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided for upload'));
    }

    const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${fileExt}`;
    const storageRef = ref(storage, `${pathFolder}/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (err) {
          reject(err);
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
