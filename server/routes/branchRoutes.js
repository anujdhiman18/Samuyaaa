import express from 'express';
import { getBranches, createBranch } from '../controllers/branchController.js';

const router = express.Router();

router.route('/')
  .get(getBranches)
  .post(createBranch);

export default router;
