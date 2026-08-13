/**
 * Standardized Class / Grade Categories for Saumyaa Studies
 * S1 = Nursery to 5th
 * S2 = 6th to 10th
 * S3 = 10th to 12th
 * S4 = Higher than 12th (Post-12th / College level)
 */

export const CLASS_CATEGORIES = [
  { code: 'S1', label: 'S1 (Nursery - 5th)', shortLabel: 'S1 (Nursery - 5th)', description: 'Nursery to 5th Grade' },
  { code: 'S2', label: 'S2 (6th - 10th)', shortLabel: 'S2 (6th - 10th)', description: '6th to 10th Grade' },
  { code: 'S3', label: 'S3 (10th - 12th)', shortLabel: 'S3 (10th - 12th)', description: '10th to 12th Grade' },
  { code: 'S4', label: 'S4 (Higher than 12th)', shortLabel: 'S4 (Higher than 12th)', description: 'Higher than 12th (Post-12th / College)' },
];

export const CLASS_CODES = ['S1', 'S2', 'S3', 'S4'];

/**
 * Format raw class code or legacy class string to formatted category label
 * e.g., 'S1' -> 'S1 (Nursery - 5th)'
 * e.g., '10th' -> 'S2 (6th - 10th)' (Legacy migration fallback)
 */
export const formatClassLabel = (code) => {
  if (!code) return 'S2 (6th - 10th)';
  if (code === 'S1') return 'S1 (Nursery - 5th)';
  if (code === 'S2') return 'S2 (6th - 10th)';
  if (code === 'S3') return 'S3 (10th - 12th)';
  if (code === 'S4') return 'S4 (Higher than 12th)';
  if (code === 'All') return 'All Categories';

  // Legacy fallback mapping
  const normalized = normalizeClassCode(code);
  return formatClassLabel(normalized);
};

/**
 * Normalize old class values (e.g., '9th', '10th', 'Nursery') to standard code ('S1', 'S2', 'S3', 'S4')
 */
export const normalizeClassCode = (val) => {
  if (!val) return 'S2';
  if (CLASS_CODES.includes(val)) return val;

  const str = String(val).trim().toLowerCase();

  // Nursery - 5th
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

  // 6th - 10th
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

  // 10th - 12th (+1, +2)
  if (
    str.includes('11th') ||
    str.includes('12th') ||
    str.includes('+1') ||
    str.includes('+2') ||
    /^(11|12)$/.test(str)
  ) {
    return 'S3';
  }

  // Higher than 12th
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
