/**
 * Standardized Class / Grade Categories for Saumyaa Studies
 * S1 = Nursery to 5th
 * S2 = 6th to 10th
 * S3 = 11th to 12th
 * S4 = Higher Education
 */

export const CLASS_CATEGORIES = [
  { code: 'S1', label: 'S1 — Nursery to 5th', shortLabel: 'S1 — Nursery to 5th', description: 'Nursery to 5th Grade' },
  { code: 'S2', label: 'S2 — 6th to 10th', shortLabel: 'S2 — 6th to 10th', description: '6th to 10th Grade' },
  { code: 'S3', label: 'S3 — 11th to 12th', shortLabel: 'S3 — 11th to 12th', description: '11th to 12th Grade' },
  { code: 'S4', label: 'S4 — Higher Education', shortLabel: 'S4 — Higher Education', description: 'Higher Education (College / University)' },
];

export const CLASS_CODES = ['S1', 'S2', 'S3', 'S4'];

export const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Science',
  'Social Studies',
  'Computer Science',
];


export const DEFAULT_CENTER_CONFIGS = {
  'Main Center': {
    name: 'Main Center',
    latitude: 30.7333,
    longitude: 76.7794,
    radiusMeters: 100,
    reportingTime: '09:00',
    gracePeriodMinutes: 5,
  },
  'Branch': {
    name: 'Branch',
    latitude: 32.0850,
    longitude: 76.5350,
    radiusMeters: 100,
    reportingTime: '09:00',
    gracePeriodMinutes: 5,
  },
};

export const SORTED_CLASS_ORDER = [
  'S1',
  'S2',
  'S3',
  'S4',
  'Nursery',
  'LKG',
  'UKG',
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th',
  '7th',
  '8th',
  '9th',
  '10th',
  '11th (+1)',
  '12th (+2)',
  '11th',
  '12th',
  'Higher Education',
];

export const sortClassList = (classes = []) => {
  if (!Array.isArray(classes)) return [];
  const rawList = classes.filter(Boolean);
  const normalized = [];
  for (const item of rawList) {
    if (item === '11th' && rawList.includes('11th (+1)')) continue;
    if (item === '12th' && rawList.includes('12th (+2)')) continue;
    if (!normalized.includes(item)) {
      normalized.push(item);
    }
  }
  return normalized.sort((a, b) => {
    const indexA = SORTED_CLASS_ORDER.indexOf(a);
    const indexB = SORTED_CLASS_ORDER.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });
};

export const STAGE_CLASSES = {
  S1: ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th'],
  S2: ['6th', '7th', '8th', '9th', '10th'],
  S3: ['11th (+1)', '12th (+2)'],
  S4: ['College / University', 'Undergraduate', 'Postgraduate', 'Higher Education', 'Other'],
};

/**
 * Get stage code (S1, S2, S3, S4) for a given class or code
 */
export const getStageForClass = (val) => {
  if (!val) return '';
  const trimmed = String(val).trim();
  if (CLASS_CODES.includes(trimmed)) return trimmed;

  for (const [stage, classes] of Object.entries(STAGE_CLASSES)) {
    if (classes.includes(trimmed)) return stage;
  }

  return normalizeClassCode(trimmed);
};

export const isClassOrStageMatch = (studentClass, queryClass) => {
  if (!queryClass || queryClass === 'All') return true;
  if (!studentClass) return true;
  if (studentClass === queryClass) return true;
  const qStage = getStageForClass(queryClass);
  const sStage = getStageForClass(studentClass);
  if (qStage && sStage && qStage === sStage) return true;
  return false;
};

export const isExactClassMatch = (studentClass, queryClass) => {
  if (!queryClass || queryClass === 'All') return true;
  if (!studentClass) return false;

  const sClass = String(studentClass).trim().toLowerCase();
  const qClass = String(queryClass).trim().toLowerCase();

  if (sClass === qClass) return true;

  // Handle +1 and +2 aliases
  if ((sClass === '11th (+1)' || sClass === '11th') && (qClass === '11th (+1)' || qClass === '11th')) return true;
  if ((sClass === '12th (+2)' || sClass === '12th') && (qClass === '12th (+2)' || qClass === '12th')) return true;

  return false;
};

/**
 * Format raw class code or exact current class to formatted label
 * Prioritizes exact current class as primary information.
 */
export const formatClassLabel = (code, currentClass) => {
  if (currentClass) {
    return currentClass.startsWith('Class') ? currentClass : `Class ${currentClass}`;
  }

  if (!code) return 'Class 10th';
  if (code === 'S1') return 'Class 5th';
  if (code === 'S2') return 'Class 10th';
  if (code === 'S3') return 'Class 11th (+1)';
  if (code === 'S4') return 'Class 12th (+2)';
  if (code === 'All') return 'All Classes';

  if (code.startsWith('Class')) return code;
  if (['6th', '7th', '8th', '9th', '10th', '11th (+1)', '12th (+2)'].includes(code)) {
    return `Class ${code}`;
  }

  return code;
};

/**
 * Normalize old class values to standard stage code ('S1', 'S2', 'S3', 'S4')
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

  // 11th - 12th (+1, +2)
  if (
    str.includes('11th') ||
    str.includes('12th') ||
    str.includes('+1') ||
    str.includes('+2') ||
    /^(11|12)$/.test(str)
  ) {
    return 'S3';
  }

  // Higher Education
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

