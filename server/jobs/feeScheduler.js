import cron from 'node-cron';
import Student from '../models/Student.js';
import FeeReminderLog from '../models/FeeReminderLog.js';

/**
 * Checks if today is the designated reminder day for the current month.
 * Target: 29th of the month.
 * Special handling for February:
 *   - In a leap year (Feb has 29 days), runs on Feb 29.
 *   - In a non-leap year (Feb has 28 days), runs on Feb 28 (the last day of Feb).
 */
export const isReminderDay = (date = new Date()) => {
  const day = date.getDate();
  const month = date.getMonth(); // 0-indexed: 1 = Feb
  const year = date.getFullYear();

  // If February
  if (month === 1) {
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const lastDayOfFeb = isLeapYear ? 29 : 28;
    return day === lastDayOfFeb;
  }

  // All other months: 29th
  return day === 29;
};

/**
 * Job 1: Monthly Fee Status Reset
 * Runs automatically on the 1st of every month at Midnight (00:00).
 * Resets feesPaid = false and paymentDate = null for all active students.
 */
export const runMonthlyFeeReset = async () => {
  try {
    const result = await Student.updateMany(
      { status: 'Active' },
      { $set: { feesPaid: false, paymentDate: null } }
    );
    console.log(`[Cron: Monthly Reset] Reset fee status to 'Unpaid' for ${result.modifiedCount} active students.`);
    return result;
  } catch (error) {
    console.error('[Cron: Monthly Reset Error]', error.message);
  }
};

/**
 * Job 2: 29th-of-Month Automated Fee Reminders
 * Runs daily at 9:00 AM and executes if today is the designated reminder day.
 * Includes duplicate prevention and leap-year / Feb handling.
 */
export const runAutomatedReminders = async () => {
  const today = new Date();

  if (!isReminderDay(today)) {
    return { skipped: true, reason: 'Not a reminder day for this month.' };
  }

  const currentMonthYear = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  const dateStr = today.toISOString().split('T')[0];

  console.log(`[Cron: Reminders] Running 29th monthly reminder check for ${currentMonthYear}...`);

  try {
    // Query unpaid active students for the current month
    const unpaidStudents = await Student.find({
      status: 'Active',
      $or: [
        { feesPaid: false },
        { feesPaid: { $exists: false } },
        { paidTillMonth: { $ne: currentMonthYear } },
      ],
    });

    let sentCount = 0;
    let skippedCount = 0;

    for (const student of unpaidStudents) {
      // DUPLICATE PREVENTION: Check if a reminder log already exists for this student today
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const existingLog = await FeeReminderLog.findOne({
        student: student._id,
        sentAt: { $gte: startOfDay, $lte: endOfDay },
      });

      if (existingLog) {
        skippedCount++;
        continue;
      }

      // Sample Reminder Message Template
      const amountDue = student.monthlyFee || 2500;
      const dueDate = `${student.feeDueDate || 5}th of next month`;
      const reminderMsg = `Dear Parent/Guardian, this is a reminder from Saumyaa Studies. The tuition fee of ₹${amountDue.toLocaleString()} for ${student.fullName} (Roll: ${student.rollNumber}, Class ${student.className}) for ${currentMonthYear} is pending. Please complete payment before ${dueDate} via UPI or Net Banking. Thank you!`;

      // Log reminder dispatch
      await FeeReminderLog.create({
        student: student._id,
        studentName: student.fullName,
        parentPhone: student.parentPhone || student.phone,
        email: student.email || '',
        amountDue,
        monthYear: currentMonthYear,
        channel: 'Email',
        status: 'sent',
        message: reminderMsg,
      });

      sentCount++;
    }

    console.log(`[Cron: Reminders Completed] Sent: ${sentCount}, Skipped (Duplicate): ${skippedCount}`);
    return { success: true, sentCount, skippedCount };
  } catch (error) {
    console.error('[Cron: Reminders Error]', error.message);
  }
};

/**
 * Initialize all Cron Schedulers
 */
export const initSchedulers = () => {
  // 1. Reset Job: 1st of every month at 00:00 AM
  cron.schedule('0 0 1 * *', async () => {
    console.log('[Scheduler Triggered] Running 1st-of-month fee reset...');
    await runMonthlyFeeReset();
  });

  // 2. Reminder Job: Daily at 09:00 AM (internal logic handles 29th/Feb check)
  cron.schedule('0 9 * * *', async () => {
    console.log('[Scheduler Triggered] Checking 29th fee reminders...');
    await runAutomatedReminders();
  });

  console.log('✅ Automated Fee Schedulers initialized (1st-of-month Reset & 29th-of-month Reminders).');
};
