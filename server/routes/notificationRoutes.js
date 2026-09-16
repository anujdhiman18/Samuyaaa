import express from 'express';
import { getNotifications, markNotificationAsRead, createNotification } from '../controllers/notificationController.js';

const router = express.Router();

router.route('/')
  .get(getNotifications)
  .post(createNotification);

router.put('/:id/read', markNotificationAsRead);

export default router;
