import express from 'express';
import {
  getSubjects,
  getSubjectStats,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  clearAllSubjects,
} from '../controllers/subjectController.js';

const router = express.Router();

router.get('/stats', getSubjectStats);
router.delete('/all', clearAllSubjects);

router.route('/')
  .get(getSubjects)
  .post(createSubject);

router.route('/:id')
  .get(getSubjectById)
  .put(updateSubject)
  .delete(deleteSubject);

export default router;
