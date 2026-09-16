import express from 'express';
import { getMarks, getStudentMarks, recordMarks } from '../controllers/marksController.js';

const router = express.Router();

router.route('/')
  .get(getMarks)
  .post(recordMarks);

router.get('/student/:id', getStudentMarks);

export default router;
