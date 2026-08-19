/**
 * Password Security Utility
 * Generates secure temporary passwords and hashes client-side passwords.
 */

export const generateSecureTemporaryPassword = (length = 10) => {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*';

  const allChars = uppercase + lowercase + numbers + symbols;

  let pass = '';
  // Guarantee at least 1 from each set
  pass += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  pass += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
  pass += symbols.charAt(Math.floor(Math.random() * symbols.length));

  for (let i = pass.length; i < length; i++) {
    pass += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle string
  return pass.split('').sort(() => 0.5 - Math.random()).join('');
};

export const hashPasswordClient = async (plainPassword) => {
  if (!plainPassword) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return 'hashed_' + btoa(plainPassword);
  }
};
