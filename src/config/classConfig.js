/**
 * Standardized Class / Grade Categories for Saumyaa Studies
 * S1 = Nursery to 5th
 * S2 = 6th to 10th
 * S3 = 11th to 12th
 * S4 = Higher Education
 */

export const CLASS_CATEGORIES = [
  {
    code: 'S1',
    label: 'S1 — Nursery to 5th',
    shortLabel: 'S1 (Nursery - 5th)',
    title: 'Primary & Foundation Wing',
    gradeSpan: 'Nursery, LKG, UKG, 1st – 5th Grade',
    description: 'Foundational literacy, numeracy, phonics, environmental awareness, and early creative logic.',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    colorHex: '#059669',
    icon: 'child_care',
    classes: ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', 'Class S1'],
    availableStreams: ['Foundation', 'Early Learner', 'Skill Track', 'Activity Club', 'General'],
    defaultSubjects: [
      {
        name: 'Foundational Mathematics & Mental Math',
        category: 'Foundation',
        description: 'Basic number sense, rapid mental arithmetic, pattern recognition, and geometric shapes.',
        batchTime: '4:00 PM – 5:15 PM',
        teacherName: 'Jitender Sharma',
      },
      {
        name: 'English Phonics, Reading & Communication',
        category: 'Early Learner',
        description: 'Phonetics, vocabulary building, interactive storytelling, and handwriting confidence.',
        batchTime: '3:00 PM – 4:15 PM',
        teacherName: 'Mrs. Sunita Sharma',
      },
      {
        name: 'Environmental Studies (EVS) & Young Science',
        category: 'Foundation',
        description: 'Nature exploration, human body, ecosystem awareness, and hands-on mini experiments.',
        batchTime: '5:15 PM – 6:30 PM',
        teacherName: 'Dr. Ramesh Verma',
      },
      {
        name: 'Hindi & Regional Language Literacy',
        category: 'Foundation',
        description: 'Varnamala, matra practice, conversational fluency, and creative writing basics.',
        batchTime: '2:00 PM – 3:15 PM',
        teacherName: 'Mrs. Sunita Sharma',
      },
      {
        name: 'Creative Thinking & Junior Coding Basics',
        category: 'Skill Track',
        description: 'Visual block-based logic, puzzle solving, creative design, and digital literacy.',
        batchTime: '5:30 PM – 6:45 PM',
        teacherName: 'Jitender Sharma',
      },
    ],
  },
  {
    code: 'S2',
    label: 'S2 — 6th to 10th',
    shortLabel: 'S2 (6th - 10th)',
    title: 'Middle & Secondary School Foundation',
    gradeSpan: '6th, 7th, 8th, 9th, 10th Grade',
    description: 'Rigorous conceptual mastery in Mathematics, Sciences, Olympiads, NTSE, and Board Exam preparation.',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    colorHex: '#0284c7',
    icon: 'school',
    classes: ['6th', '7th', '8th', '9th', '10th', 'Class S2'],
    availableStreams: ['Foundation', 'Advanced', 'Olympiad', 'Board Prep', 'NTSE Prep'],
    defaultSubjects: [
      {
        name: 'Mathematics Foundation',
        category: 'Foundation',
        description: 'Core algebra, geometry, trigonometry, and arithmetic with step-by-step problem-solving.',
        batchTime: '4:00 PM – 5:30 PM',
        teacherName: 'Jitender Sharma',
      },
      {
        name: 'Mathematics Olympiad & Advanced',
        category: 'Olympiad',
        description: 'High-level analytical problem solving, logic puzzles, and national Olympiad / NTSE prep.',
        batchTime: '3:00 PM – 4:30 PM',
        teacherName: 'Jitender Sharma',
      },
      {
        name: 'Physics Foundation & Experimentation',
        category: 'Foundation',
        description: 'Mechanics, light, electricity, motion, and physical phenomena experimentation.',
        batchTime: '4:30 PM – 6:00 PM',
        teacherName: 'Jitender Sharma',
      },
      {
        name: 'Chemistry Fundamentals & Reactions',
        category: 'Foundation',
        description: 'Atomic structure, periodic table, chemical bonding, and practical lab formulas.',
        batchTime: '3:30 PM – 5:00 PM',
        teacherName: 'Dr. Ramesh Verma',
      },
      {
        name: 'Biology & Life Science Principles',
        category: 'Foundation',
        description: 'Cell biology, human physiology, genetics, and plant life processes.',
        batchTime: '2:00 PM – 3:30 PM',
        teacherName: 'Dr. Ramesh Verma',
      },
      {
        name: 'Social Science & Civics',
        category: 'Board Prep',
        description: 'Comprehensive historical analysis, geography, democratic politics, and board exam mastery.',
        batchTime: '5:00 PM – 6:30 PM',
        teacherName: 'Mrs. Sunita Sharma',
      },
      {
        name: 'English Language & Literary Analysis',
        category: 'Board Prep',
        description: 'Advanced grammar, comprehension, debate, essay composition, and classic literature.',
        batchTime: '4:00 PM – 5:00 PM',
        teacherName: 'Mrs. Sunita Sharma',
      },
      {
        name: 'Computer Science & Python Coding',
        category: 'Advanced',
        description: 'Algorithmic thinking, Python programming, web essentials, and database basics.',
        batchTime: '6:00 PM – 7:15 PM',
        teacherName: 'Jitender Sharma',
      },
    ],
  },
  {
    code: 'S3',
    label: 'S3 — 11th to 12th',
    shortLabel: 'S3 (11th - 12th)',
    title: 'Senior Secondary & Competitive Entrance',
    gradeSpan: '11th (+1) & 12th (+2) Grade',
    description: 'Targeted JEE Main/Advanced, NEET Medical, and CBSE/State Board preparation with top-tier faculty.',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    colorHex: '#d97706',
    icon: 'psychology',
    classes: ['11th (+1)', '12th (+2)', '11th', '12th', 'Class S3'],
    availableStreams: ['JEE', 'JEE Prep', 'NEET', 'Advanced', 'Foundation', 'Board Prep'],
    defaultSubjects: [
      {
        name: 'Mathematics (Calculus & Vectors)',
        category: 'Advanced',
        description: 'Calculus, Algebra, and Geometry with problem-solving speed, numerical confidence, and conceptual depth.',
        batchTime: '5:00 PM – 6:30 PM',
        teacherName: 'Jitender Sharma',
      },
      {
        name: 'Mathematics IIT-JEE Entrance',
        category: 'JEE',
        description: 'Advanced engineering entrance preparation, coordinate geometry, and analytical problem sets.',
        batchTime: '6:00 PM – 7:30 PM',
        teacherName: 'Jitender Sharma',
      },
      {
        name: 'Physics IIT-JEE Prep',
        category: 'JEE Prep',
        description: 'Mechanics, Electromagnetism, and Modern Physics with step-by-step numerical analytics.',
        batchTime: '6:30 PM – 8:00 PM',
        teacherName: 'Jitender Sharma',
      },
      {
        name: 'Physics for NEET Medical',
        category: 'NEET',
        description: 'Targeted physics numericals, formula shortcuts, and conceptual clarity for medical aspirants.',
        batchTime: '5:00 PM – 6:30 PM',
        teacherName: 'Jitender Sharma',
      },
      {
        name: 'Chemistry for IIT-JEE',
        category: 'JEE',
        description: 'Organic reaction mechanisms, chemical kinetics, thermodynamics, and inorganic coordination.',
        batchTime: '4:00 PM – 5:30 PM',
        teacherName: 'Dr. Ramesh Verma',
      },
      {
        name: 'Chemistry for NEET Medical',
        category: 'NEET',
        description: 'Organic & Inorganic Chemistry high-yield question patterns for NEET medical entrance examinations.',
        batchTime: '5:30 PM – 7:00 PM',
        teacherName: 'Dr. Ramesh Verma',
      },
      {
        name: 'Biology for NEET Medical',
        category: 'NEET',
        description: 'Higher level Botany, Zoology, Human Anatomy, genetics, and NCERT-focused NEET biology prep.',
        batchTime: '3:30 PM – 5:00 PM',
        teacherName: 'Dr. Ramesh Verma',
      },
      {
        name: 'Computer Science (Python & SQL)',
        category: 'Advanced',
        description: 'Data structures, object-oriented programming, MySQL queries, and computer networking.',
        batchTime: '6:00 PM – 7:30 PM',
        teacherName: 'Jitender Sharma',
      },
    ],
  },
  {
    code: 'S4',
    label: 'S4 — Higher Education',
    shortLabel: 'S4 (Higher Ed / College)',
    title: 'Higher Education & Career Entrance',
    gradeSpan: 'College / University & Entrance Aspirants',
    description: 'Undergraduate & postgraduate level science, engineering mathematics, coding, and aptitude.',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    colorHex: '#7c3aed',
    icon: 'workspace_premium',
    classes: ['College / University', 'Undergraduate', 'Postgraduate', 'Higher Education', 'Class S4', 'Other'],
    availableStreams: ['Undergraduate', 'Postgraduate', 'Entrance / Target', 'Skill & Tech', 'General'],
    defaultSubjects: [
      {
        name: 'Higher Engineering Mathematics',
        category: 'Undergraduate',
        description: 'Differential equations, linear algebra, Laplace transforms, and complex variables.',
        batchTime: '7:00 PM – 8:30 PM',
        teacherName: 'Jitender Sharma',
      },
      {
        name: 'Applied Physics & Mechanics',
        category: 'Undergraduate',
        description: 'Quantum mechanics, solid state physics, electromagnetic theory, and mathematical physics.',
        batchTime: '6:00 PM – 7:30 PM',
        teacherName: 'Jitender Sharma',
      },
      {
        name: 'Advanced Chemical Sciences',
        category: 'Undergraduate',
        description: 'Spectroscopy, advanced organic synthesis, chemical kinetics, and physical chemistry research.',
        batchTime: '4:30 PM – 6:00 PM',
        teacherName: 'Dr. Ramesh Verma',
      },
      {
        name: 'Data Science, Python & AI Foundations',
        category: 'Skill & Tech',
        description: 'Machine learning algorithms, Pandas, NumPy, model evaluation, and practical AI applications.',
        batchTime: '6:30 PM – 8:00 PM',
        teacherName: 'Jitender Sharma',
      },
      {
        name: 'Competitive Exam Aptitude & Logical Reasoning',
        category: 'Entrance / Target',
        description: 'Quantitative aptitude, data interpretation, verbal ability, and speed strategy for competitive exams.',
        batchTime: '5:00 PM – 6:30 PM',
        teacherName: 'Dr. Ramesh Verma',
      },
    ],
  },
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

/**
 * Get standard list of subjects tailored for an academic category/stage (S1, S2, S3, S4)
 */
export const getSubjectsForStage = (stageCode) => {
  if (!stageCode) return STAGE_SUBJECTS.S2;
  const code = normalizeClassCode(stageCode);
  return STAGE_SUBJECTS[code] || STAGE_SUBJECTS.S2;
};

/**
 * Get category configuration object for a category code (S1, S2, S3, S4)
 */
export const getCategoryConfig = (code) => {
  const normalized = normalizeClassCode(code);
  return CLASS_CATEGORIES.find((c) => c.code === normalized) || CLASS_CATEGORIES[1];
};

/**
 * Get the category code (S1, S2, S3, S4) for a subject offering object
 */
export const getSubjectCategory = (sub) => {
  if (!sub) return 'S2';
  if (sub.className) {
    const code = normalizeClassCode(sub.className);
    if (CLASS_CODES.includes(code)) return code;
  }
  if (sub.category) {
    const code = normalizeClassCode(sub.category);
    if (CLASS_CODES.includes(code)) return code;
  }
  return 'S2';
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

  const sClean = sClass.replace(/^class\s+/, '');
  const qClean = qClass.replace(/^class\s+/, '');
  if (sClean === qClean) return true;

  // Handle +1 and +2 aliases
  if ((sClean === '11th (+1)' || sClean === '11th') && (qClean === '11th (+1)' || qClean === '11th')) return true;
  if ((sClean === '12th (+2)' || sClean === '12th') && (qClean === '12th (+2)' || qClean === '12th')) return true;

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
  const raw = String(val).trim();
  if (CLASS_CODES.includes(raw.toUpperCase())) return raw.toUpperCase();

  const str = raw.toLowerCase();

  // Explicit S1-S4 checks
  if (str === 's1' || str === 'class s1' || str.startsWith('class s1') || str.includes('s1')) return 'S1';
  if (str === 's2' || str === 'class s2' || str.startsWith('class s2') || str.includes('s2')) return 'S2';
  if (str === 's3' || str === 'class s3' || str.startsWith('class s3') || str.includes('s3')) return 'S3';
  if (str === 's4' || str === 'class s4' || str.startsWith('class s4') || str.includes('s4')) return 'S4';

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


