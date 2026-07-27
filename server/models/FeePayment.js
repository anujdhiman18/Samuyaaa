import mongoose from 'mongoose';

const feePaymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    studentName: String,
    rollNumber: String,
    className: String,
    amountPaid: {
      type: Number,
      required: [true, 'Amount paid is required'],
      min: [0, 'Amount must be positive'],
    },
    monthlyFee: {
      type: Number,
      required: true,
    },
    pendingAmount: {
      type: Number,
      default: 0,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    monthYear: {
      type: String,
      required: true, // e.g. "July 2026"
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque'],
      default: 'UPI',
    },
    transactionId: {
      type: String,
      default: '',
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
    remarks: {
      type: String,
      default: 'Monthly tuition fee',
    },
  },
  { timestamps: true }
);

const FeePayment = mongoose.models.FeePayment || mongoose.model('FeePayment', feePaymentSchema);
export default FeePayment;
