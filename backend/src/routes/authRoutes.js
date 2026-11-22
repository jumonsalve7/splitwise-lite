import { Router } from 'express';
import { signup, signin, demoLogin } from '../controllers/authController.js';

const router = Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/demo', demoLogin);

export default router;