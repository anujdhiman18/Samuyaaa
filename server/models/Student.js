import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    fatherName: {
      type: String,
      required: [true, "Father's name is required"],
      trim: true,
    },
    motherName: {
      type: String,
      required: [true, "Mother's name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Student phone number is required'],
      trim: true,
    },
    parentPhone: {
      type: String,
      required: [true, 'Parent phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    academicStage: {
      type: String,
      default: 'S2',
      trim: true,
    },
    currentClass: {
      type: String,
      default: '',
      trim: true,
    },
    className: {
      type: String,
      default: 'S2',
      trim: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
    },
    subjects: [
      {
        type: String,
        required: true,
      },
    ],
    dateOfAdmission: {
      type: Date,
      default: Date.now,
    },
    monthlyFee: {
      type: Number,
      required: [true, 'Monthly fee amount is required'],
      min: [0, 'Fee must be positive'],
    },
    feeDueDate: {
      type: Number,
      default: 5, // 5th of every month
      min: 1,
      max: 31,
    },
    admissionNumber: {
      type: String,
      trim: true,
      sparse: true,
    },
    course: {
      type: String,
      default: 'General Science',
      trim: true,
    },
    batch: {
      type: String,
      default: '2024-2026',
      trim: true,
    },
    semester: {
      type: String,
      default: 'Semester 1',
      trim: true,
    },
    photo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    },
    attendancePercentage: {
      type: Number,
      default: 90,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Alumni', 'Suspended'],
      default: 'Active',
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
    paidTillMonth: {
      type: String,
      default: '',
    },
    feesPaid: {
      type: Boolean,
      default: false,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    password: {
      type: String,
      default: '',
    },
    mustChangePassword: {
      type: Boolean,
      default: true,
    },
    initialPassword: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
export default Student;
