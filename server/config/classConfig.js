/**
 * Standardized Class / Grade Categories for Server-side Mongoose Schemas & Validation
 * S1 = Nursery to 5th
 * S2 = 6th to 10th
 * S3 = 10th to 12th
 * S4 = Higher than 12th (Post-12th / College level)
 */

export const CLASS_CODES = ['S1', 'S2', 'S3', 'S4'];

export const normalizeClassCode = (val) => {
  if (!val) return 'S2';
  if (CLASS_CODES.includes(val)) return val;

  const str = String(val).trim().toLowerCase();

  if (
    str.includes('nursery') ||
    str.includes('lkg') ||
    str.includes('ukg') ||
    str.includes('1st') ||
    str.includes('2nd') ||
    str.includes('3rd') ||
    str.includes('4th') ||
    str.includes('5th') ||
    /^[1-5]$/.test(str)
  ) {
    return 'S1';
  }

  if (
    str.includes('6th') ||
    str.includes('7th') ||
    str.includes('8th') ||
    str.includes('9th') ||
    str.includes('10th') ||
    /^(6|7|8|9|10)$/.test(str)
  ) {
    return 'S2';
  }

  if (
    str.includes('11th') ||
    str.includes('12th') ||
    str.includes('+1') ||
    str.includes('+2') ||
    /^(11|12)$/.test(str)
  ) {
    return 'S3';
  }

  if (
    str.includes('higher') ||
    str.includes('college') ||
    str.includes('repeater') ||
    str.includes('entrance') ||
    str.includes('target')
  ) {
    return 'S4';
  }

  return 'S2';
};
