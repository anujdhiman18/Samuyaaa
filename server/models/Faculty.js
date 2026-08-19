import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Faculty name is required'],
      trim: true,
    },
    designation: {
      type: String,
      default: 'Senior Faculty Member',
    },
    subject: {
      type: String,
      default: 'General Academics',
    },
    qualification: {
      type: String,
      default: 'Master’s Degree',
    },
    experience: {
      type: String,
      default: '5+ Years Experience',
    },
    photo_url: {
      type: String,
      default: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      default: 'faculty123',
    },
    phone: {
      type: String,
      default: '9816099999',
    },
    department: {
      type: String,
      default: 'Science & Mathematics',
    },
    assignedClasses: {
      type: [{ type: String, enum: ['S1', 'S2', 'S3', 'S4'] }],
      default: ['S2', 'S3'],
    },
    assignedSubjects: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      default: 'Faculty',
    },
    roles: {
      type: [String],
      default: ['SUBJECT_TEACHER'],
    },
    permissionOverrides: {
      type: Object,
      default: {},
    },
    branch: {
      type: String,
      enum: ['Main Center (Bagru)', 'Branch (Daroh)', 'Main Center', 'Branch', 'Bagru', 'Daroh'],
      default: 'Main Center (Bagru)',
    },
    branchId: {
      type: String,
      enum: ['MAIN_CENTER', 'BRANCH'],
      default: 'MAIN_CENTER',
    },
    responsibilities: [
      {
        id: String,
        course: { type: String, default: 'Science (PCM)' },
        batch: { type: String, default: 'Batch A (Morning)' },
        className: { type: String, enum: ['S1', 'S2', 'S3', 'S4'], default: 'S2' },
        semester: { type: String, default: 'Term 1' },
        section: { type: String, default: 'Section A' },
        subject: { type: String, default: 'Mathematics Advanced' },
        academicSession: { type: String, default: '2026-2027' },
        assignedAt: { type: Date, default: Date.now },
        assignedBy: { type: String, default: 'System Admin' },
      },
    ],
    auditLog: [
      {
        id: String,
        actionType: { type: String, enum: ['ASSIGNED', 'UPDATED', 'REMOVED', 'BULK_ASSIGNED'] },
        details: String,
        performedBy: { type: String, default: 'System Admin' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    display_order: {
      type: Number,
      default: 1,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Faculty = mongoose.models.Faculty || mongoose.model('Faculty', facultySchema);
export default Faculty;
