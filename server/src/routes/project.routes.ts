import { Router } from 'express';
import { addProject, getProjects } from '../controllers/project.controller';
import {authenticate} from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, addProject);
router.post('/', authenticate, getProjects);


export default router;
