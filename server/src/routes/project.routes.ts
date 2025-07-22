import { Router } from 'express';
import { addProject } from '../controllers/project.controller';
import {authenticate} from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, addProject);

export default router;
