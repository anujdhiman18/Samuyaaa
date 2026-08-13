import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import StudentApplication from './models/StudentApplication.js';
import Faculty from './models/Faculty.js';
import Subject from './models/Subject.js';
import StudyMaterial from './models/StudyMaterial.js';
import Assignment from './models/Assignment.js';
import Announcement from './models/Announcement.js';
import StudentLeave from './models/StudentLeave.js';
import FeePayment from './models/FeePayment.js';
import { normalizeClassCode } from './config/classConfig.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saumyaa_db';

export const runClassCategoryMigration = async () => {
  console.log('🔄 Running Class Category Migration to S1, S2, S3, S4...');

  try {
    // 1. Migrate Students
    const students = await Student.find();
    for (const student of students) {
      const normalized = normalizeClassCode(student.className);
      if (student.className !== normalized) {
        student.className = normalized;
        await student.save();
      }
    }
    console.log(`✓ Migrated ${students.length} Students to S1-S4 categories`);

    // 2. Migrate Student Applications
    const studentApps = await StudentApplication.find();
    for (const app of studentApps) {
      const normalized = normalizeClassCode(app.targetClass);
      if (app.targetClass !== normalized) {
        app.targetClass = normalized;
        await app.save();
      }
    }
    console.log(`✓ Migrated ${studentApps.length} Student Applications`);

    // 3. Migrate Faculty Members
    const facultyMembers = await Faculty.find();
    for (const faculty of facultyMembers) {
      if (Array.isArray(faculty.assignedClasses)) {
        faculty.assignedClasses = Array.from(
          new Set(faculty.assignedClasses.map((c) => normalizeClassCode(c)))
        );
      }
      if (Array.isArray(faculty.responsibilities)) {
        faculty.responsibilities = faculty.responsibilities.map((r) => ({
          ...r.toObject(),
          className: normalizeClassCode(r.className),
        }));
      }
      await faculty.save();
    }
    console.log(`✓ Migrated ${facultyMembers.length} Faculty Profiles`);

    // 4. Migrate Subjects
    const subjects = await Subject.find();
    for (const sub of subjects) {
      const normalized = normalizeClassCode(sub.className);
      if (sub.className !== normalized) {
        sub.className = normalized;
        await sub.save();
      }
    }
    console.log(`✓ Migrated ${subjects.length} Subjects`);

    // 5. Migrate Study Materials
    const materials = await StudyMaterial.find();
    for (const mat of materials) {
      const normalized = normalizeClassCode(mat.className);
      if (mat.className !== normalized) {
        mat.className = normalized;
        await mat.save();
      }
    }

    // 6. Migrate Assignments
    const assignments = await Assignment.find();
    for (const ass of assignments) {
      const normalized = normalizeClassCode(ass.className);
      if (ass.className !== normalized) {
        ass.className = normalized;
        await ass.save();
      }
    }

    // 7. Migrate Announcements
    const announcements = await Announcement.find();
    for (const anc of announcements) {
      if (anc.targetClass && anc.targetClass !== 'All') {
        const normalized = normalizeClassCode(anc.targetClass);
        if (anc.targetClass !== normalized) {
          anc.targetClass = normalized;
          await anc.save();
        }
      }
    }

    // 8. Migrate Student Leaves
    const leaves = await StudentLeave.find();
    for (const l of leaves) {
      const normalized = normalizeClassCode(l.className);
      if (l.className !== normalized) {
        l.className = normalized;
        await l.save();
      }
    }

    // 9. Migrate Fee Payments
    const payments = await FeePayment.find();
    for (const p of payments) {
      const normalized = normalizeClassCode(p.className);
      if (p.className !== normalized) {
        p.className = normalized;
        await p.save();
      }
    }

    console.log('🎉 Class Category Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  }
};

// Executable directly if run from CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  mongoose
    .connect(MONGO_URI)
    .then(async () => {
      await runClassCategoryMigration();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
