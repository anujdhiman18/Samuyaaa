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

export const STAGE_SUBJECTS = {
  S1: [
    'Foundational Mathematics & Mental Math',
    'English Phonics, Reading & Communication',
    'Environmental Studies (EVS) & Young Science',
    'Hindi & Regional Language Literacy',
    'Creative Thinking & Junior Coding Basics',
    'Art, Craft & Activity Skills',
  ],
  S2: [
    'Mathematics Foundation',
    'Mathematics Olympiad & NTSE',
    'Science (Physics, Chemistry & Biology)',
    'Social Science & Civics',
    'English Language & Literature',
    'Computer Science & Python Coding',
  ],
  S3: [
    'Mathematics (IIT-JEE & Board)',
    'Physics (IIT-JEE & NEET Prep)',
    'Chemistry (Organic, Inorganic & Physical)',
    'Biology (NEET Medical Entrance & Zoology)',
    'Computer Science (Python & SQL)',
    'English Core & Academic Communication',
  ],
  S4: [
    'Higher Engineering Mathematics',
    'Applied Physics & Mechanics',
    'Advanced Chemical Sciences',
    'Data Science, Python & AI Foundations',
    'Competitive Exam Aptitude & Logical Reasoning',
    'UGC / CSIR / Target Entrance Prep',
  ],
};

export const getSubjectsForStage = (stageCode) => {
  if (!stageCode) return STAGE_SUBJECTS.S2;
  const code = normalizeClassCode(stageCode);
  return STAGE_SUBJECTS[code] || STAGE_SUBJECTS.S2;
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
  const raw = String(val).trim();
  if (CLASS_CODES.includes(raw.toUpperCase())) return raw.toUpperCase();

  const str = raw.toLowerCase();

  // Explicit S1-S4 checks
  if (str === 's1' || str === 'class s1' || str.startsWith('class s1') || str.includes('s1')) return 'S1';
  if (str === 's2' || str === 'class s2' || str.startsWith('class s2') || str.includes('s2')) return 'S2';
  if (str === 's3' || str === 'class s3' || str.startsWith('class s3') || str.includes('s3')) return 'S3';
  if (str === 's4' || str === 'class s4' || str.startsWith('class s4') || str.includes('s4')) return 'S4';

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


