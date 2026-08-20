/**
 * Standardized Class / Grade Categories for Server-side Mongoose Schemas & Validation
 * S1 = Nursery to 5th
 * S2 = 6th to 10th
 * S3 = 11th to 12th
 * S4 = Higher Education
 */

export const CLASS_CODES = ['S1', 'S2', 'S3', 'S4'];

export const STAGE_CLASSES = {
  S1: ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th'],
  S2: ['6th', '7th', '8th', '9th', '10th'],
  S3: ['11th (+1)', '12th (+2)', '11th', '12th'],
  S4: ['College / University', 'Undergraduate', 'Postgraduate', 'Other'],
};

export const getStageForClass = (val) => {
  if (!val) return '';
  const trimmed = String(val).trim();
  if (CLASS_CODES.includes(trimmed)) return trimmed;

  for (const [stage, classes] of Object.entries(STAGE_CLASSES)) {
    if (classes.includes(trimmed)) return stage;
  }

  return normalizeClassCode(trimmed);
};

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
    str.includes('undergraduate') ||
    str.includes('postgraduate') ||
    str.includes('repeater') ||
    str.includes('entrance') ||
    str.includes('target')
  ) {
    return 'S4';
  }

  return 'S2';
};

