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
    className: {
      type: String,
      required: [true, 'Class is required'],
      enum: ['8th', '9th', '10th', '11th', '12th', 'Olympiad'],
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
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    paidTillMonth: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
export default Student;
