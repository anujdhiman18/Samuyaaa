export const courses = [
  {
    id: 'math',
    category: 'math',
    icon: 'functions',
    iconBg: 'bg-primary-fixed',
    iconColor: 'text-primary',
    title: 'Mathematics',
    tags: ['Class Nursery - 12', 'Board'],
    description:
      'A deep dive into Calculus, Algebra, and Geometry with a focus on problem-solving speed, numerical confidence, and conceptual depth.',
    batch: 'Mon-Wed | 5:00 PM',
    program: 'Advanced Mathematics',
  },
  {
    id: 'science',
    category: 'science',
    icon: 'biotech',
    iconBg: 'bg-secondary-container',
    iconColor: 'text-on-secondary-container',
    title: 'Science',
    tags: ['Class Nursery - 10', 'JEE/NEET Prep'],
    description:
      'Combining Physics, Chemistry, and Biology to build a robust foundation for future competitive engineering and medical aspirants.',
    batch: 'Tue-Thu | 4:30 PM',
    program: 'Integrated Science Foundation',
  },
  {
    id: 'physics',
    category: 'science',
    icon: 'bolt',
    iconBg: 'bg-primary-fixed-dim',
    iconColor: 'text-primary',
    title: 'Physics',
    tags: ['Class 11 - 12', 'JEE/NEET Advanced'],
    description:
      'Rigorous coverage of Mechanics, Electromagnetism, and Modern Physics, utilizing numerical analytics and step-by-step problem sets.',
    batch: 'Tue-Thu-Sat | 6:30 PM',
    program: 'Senior Physics (IIT-JEE / NEET)',
  },
  {
    id: 'chemistry',
    category: 'science',
    icon: 'science',
    iconBg: 'bg-secondary-fixed-dim',
    iconColor: 'text-secondary',
    title: 'Chemistry',
    tags: ['Class 11 - 12', 'Organic + Inorganic'],
    description:
      'Master complex chemical formulations, reaction mechanisms, stoichiometry, and physical chemistry theory designed for top scores.',
    batch: 'Mon-Wed-Fri | 6:30 PM',
    program: 'Senior Chemistry Crackers',
  },
];

export const courseFilters = [
  { id: 'all', label: 'All Programs' },
  { id: 'math', label: 'Mathematics' },
  { id: 'science', label: 'Sciences & NEET/JEE' },
  { id: 'english', label: 'English & Comm' },
];

export const testimonials = [
  {
    id: 1,
    quote:
      "Before joining Saumyaa Studies, my son Rahul struggled to sit through a Math paper. Jitender sir's patience changed everything. Not only did his marks improve from 62 to 89, but he's actually excited about Algebra now.",
    initials: 'RG',
    initialsBg: 'bg-secondary-container',
    initialsColor: 'text-on-secondary-container',
    name: 'Mr. Rajesh Gupta',
    role: 'Parent of Rahul (Grade 10)',
    stars: 5,
  },
  {
    id: 2,
    quote:
      'Jitender sir makes science feel alive. The practical formulas and conceptual clarity we developed in the classes helped me clear CBSE board physics and chemistry exams with top scores.',
    initials: 'AM',
    initialsBg: 'bg-primary-fixed',
    initialsColor: 'text-on-primary-container',
    name: 'Aryan Mehta',
    role: 'Student (Class 10 CBSE 98.4%)',
    stars: 5,
  },
  {
    id: 3,
    quote:
      'The class size is limited to 15. This meant I could stop the lesson at any second and clear my doubts. That individual accountability is completely missing in larger institutes.',
    initials: 'SR',
    initialsBg: 'bg-tertiary-fixed',
    initialsColor: 'text-on-tertiary-fixed',
    name: 'Sneha Reddy',
    role: 'JEE Foundation Student',
    stars: 5,
  },
  {
    id: 4,
    quote:
      'English literature class and grammatical deep-dives here helped me secure 96 in class 12 Boards. The answer writing strategies they teach are gold.',
    initials: 'KD',
    initialsBg: 'bg-surface-container-highest',
    initialsColor: 'text-secondary',
    name: 'Karan Dhillon',
    role: 'Student (Class 12 Boards)',
    stars: 4,
  },
];

export const faqs = [
  {
    question: 'What is the batch size at Saumyaa Studies?',
    answer:
      "We maintain a strict limit of 15 students max per batch. This allows Jitender sir and our faculty to provide individualized attention, review students' answers personally, and monitor cognitive progress.",
  },
  {
    question: 'Do you offer individual coaching or only group batches?',
    answer:
      'We primarily focus on our structured, small-group interactive batches since student-peer study shows higher outcomes. However, we do provide strategic 1-on-1 coaching for specific entrance prep milestones like JEE / NEET revision cycles.',
  },
  {
    question: 'Is study material included in the course structure?',
    answer:
      'Yes, all students enrolled in our main courses receive comprehensive printed booklets containing concept summaries, custom-solved worksheets, and a question bank covering Board and Olympiad levels.',
  },
  {
    question: "How can parents track their child's progress?",
    answer:
      'We believe in tripartite collaborative feedback. We share scorecards of weekly mock tests via WhatsApp, coordinate monthly detailed parents-teacher reviews, and keep tracking logs open on parent request.',
  },
];

export const subjectOptions = [
  'Advanced Mathematics',
  'Integrated Science Foundation',
  'Elite English & Communication',
  'Senior Physics (IIT-JEE / NEET)',
  'Senior Chemistry Crackers',
  'Mental Ability & Logical Reasoning',
];

export const timeSlots = [
  '4:00 PM - 5:00 PM',
  '5:30 PM - 6:30 PM',
  '7:00 PM - 8:00 PM',
  '10:30 AM - 11:30 AM',
];

export const branches = [
  {
    id: 'bagru',
    name: 'Bagru (Main Branch)',
    shortName: 'Bagru Main',
    address: 'Saumyaa Studies, Bagru Garh, Jamula, Palaid, Himachal Pradesh 176093',
    coordinates: 'Jamula, Palaid',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Bagru+Garh%2C+Jamula%2C+Palaid%2C+Himachal+Pradesh+176093',
    phone: '+91 98164 77341',
    isMain: true,
  },
  {
    id: 'daroh',
    name: 'Daroh (Branch 2)',
    shortName: 'Daroh Branch',
    address: 'Saumyaa Studies, Daroh, PTC Road, Himachal Pradesh 176092',
    coordinates: 'Daroh, HP',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=31.997361,76.478083',
    phone: '+91 98164 77341',
    isMain: false,
  },
];

