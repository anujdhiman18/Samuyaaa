import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';
import Student from './models/Student.js';
import Subject from './models/Subject.js';
import FeePayment from './models/FeePayment.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saumyaa_db';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Admin.deleteMany();
    await Student.deleteMany();
    await Subject.deleteMany();
    await FeePayment.deleteMany();

    // Create Admin
    const admin = await Admin.create({
      name: 'Jitender Sharma',
      email: 'admin@saumyaa.com',
      password: 'admin123',
      role: 'SuperAdmin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });
    console.log(`✓ Default Admin Created: admin@saumyaa.com / admin123`);

    // Seed Subjects
    const subjects = await Subject.insertMany([
      {
        name: 'Mathematics Advanced',
        className: '10th',
        description: 'Calculus, Algebra, Geometry with board & Olympiad depth',
        teacherName: 'Jitender Sharma',
        batchTime: '5:00 PM - 6:30 PM',
        totalEnrolled: 18,
      },
      {
        name: 'Physics IIT-JEE Prep',
        className: '11th',
        description: 'Mechanics, Electromagnetism, Modern Physics',
        teacherName: 'Jitender Sharma',
        batchTime: '6:30 PM - 8:00 PM',
        totalEnrolled: 15,
      },
      {
        name: 'Chemistry Foundation',
        className: '10th',
        description: 'Organic & Inorganic Chemistry formulation',
        teacherName: 'Dr. Ramesh Verma',
        batchTime: '4:00 PM - 5:30 PM',
        totalEnrolled: 14,
      },
      {
        name: 'Integrated Science',
        className: '9th',
        description: 'Physics, Chemistry, and Biology combined prep',
        teacherName: 'Jitender Sharma',
        batchTime: '4:30 PM - 6:00 PM',
        totalEnrolled: 12,
      },
    ]);
    console.log(`✓ Seeded ${subjects.length} Subjects`);

    // Seed Students
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    const students = await Student.insertMany([
      {
        fullName: 'Rahul Gupta',
        fatherName: 'Rajesh Gupta',
        motherName: 'Sunita Gupta',
        phone: '9816012345',
        parentPhone: '8894190175',
        email: 'rahul.g@gmail.com',
        address: 'House #42, Main Market, Jamula, Palampur',
        className: '10th',
        rollNumber: 'SAU-10-001',
        subjects: ['Mathematics Advanced', 'Integrated Science'],
        dateOfAdmission: new Date('2025-04-10'),
        monthlyFee: 2500,
        feeDueDate: 5,
        status: 'Active',
        paidTillMonth: currentMonth,
      },
      {
        fullName: 'Damini Sharma',
        fatherName: 'Subhash Sharma',
        motherName: 'Kamlesh Sharma',
        phone: '9876543210',
        parentPhone: '8894190175',
        email: 'damini.s@gmail.com',
        address: 'Bagru Garh, Palaid, HP 176093',
        className: '10th',
        rollNumber: 'SAU-10-002',
        subjects: ['Mathematics Advanced'],
        dateOfAdmission: new Date('2025-03-15'),
        monthlyFee: 2000,
        feeDueDate: 5,
        status: 'Active',
        paidTillMonth: currentMonth,
      },
      {
        fullName: 'Aryan Mehta',
        fatherName: 'Vikas Mehta',
        motherName: 'Priya Mehta',
        phone: '9816112233',
        parentPhone: '8894190175',
        email: 'aryan.m@gmail.com',
        address: 'Ward No 4, Civil Lines, HP',
        className: '11th',
        rollNumber: 'SAU-11-003',
        subjects: ['Physics IIT-JEE Prep', 'Chemistry Foundation'],
        dateOfAdmission: new Date('2025-05-01'),
        monthlyFee: 3000,
        feeDueDate: 5,
        status: 'Active',
        paidTillMonth: 'June 2026', // Pending for current month
      },
      {
        fullName: 'Sneha Reddy',
        fatherName: 'K. V. Reddy',
        motherName: 'Anita Reddy',
        phone: '9845011223',
        parentPhone: '9845088776',
        email: 'sneha.reddy@gmail.com',
        address: 'Plot 12, Teacher Colony, Palampur',
        className: '12th',
        rollNumber: 'SAU-12-004',
        subjects: ['Physics IIT-JEE Prep'],
        dateOfAdmission: new Date('2025-04-01'),
        monthlyFee: 2800,
        feeDueDate: 5,
        status: 'Active',
        paidTillMonth: 'June 2026',
      },
      {
        fullName: 'Karan Dhillon',
        fatherName: 'Harpreet Dhillon',
        motherName: 'Gurpreet Dhillon',
        phone: '9817744332',
        parentPhone: '9817799001',
        email: 'karan.d@gmail.com',
        address: 'House #88, Station Road, Kangra',
        className: '9th',
        rollNumber: 'SAU-09-005',
        subjects: ['Integrated Science'],
        dateOfAdmission: new Date('2025-06-15'),
        monthlyFee: 2200,
        feeDueDate: 5,
        status: 'Active',
        paidTillMonth: currentMonth,
      },
    ]);
    console.log(`✓ Seeded ${students.length} Students`);

    // Seed Fee Payments
    const payments = await FeePayment.insertMany([
      {
        student: students[0]._id,
        studentName: students[0].fullName,
        rollNumber: students[0].rollNumber,
        className: students[0].className,
        amountPaid: 2500,
        monthlyFee: 2500,
        pendingAmount: 0,
        paymentDate: new Date(),
        monthYear: currentMonth,
        paymentMode: 'UPI',
        transactionId: 'UPI98726351',
        receiptNumber: 'REC-2026-0001',
        remarks: 'Monthly tuition fee',
      },
      {
        student: students[1]._id,
        studentName: students[1].fullName,
        rollNumber: students[1].rollNumber,
        className: students[1].className,
        amountPaid: 2000,
        monthlyFee: 2000,
        pendingAmount: 0,
        paymentDate: new Date(),
        monthYear: currentMonth,
        paymentMode: 'Cash',
        receiptNumber: 'REC-2026-0002',
        remarks: 'Monthly tuition fee',
      },
      {
        student: students[4]._id,
        studentName: students[4].fullName,
        rollNumber: students[4].rollNumber,
        className: students[4].className,
        amountPaid: 2200,
        monthlyFee: 2200,
        pendingAmount: 0,
        paymentDate: new Date(),
        monthYear: currentMonth,
        paymentMode: 'Bank Transfer',
        transactionId: 'HDFC0001293',
        receiptNumber: 'REC-2026-0003',
        remarks: 'Monthly tuition fee',
      },
    ]);
    console.log(`✓ Seeded ${payments.length} Fee Payment Receipts`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
