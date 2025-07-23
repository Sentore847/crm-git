import { Router } from 'express';
import { addProject, getProjects } from '../controllers/project.controller';
import {authenticate} from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, addProject);
router.get('/', authenticate, getProjects);


export default router;
