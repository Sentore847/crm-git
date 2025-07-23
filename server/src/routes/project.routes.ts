import { Router } from 'express';
import { addProject, deleteProject, getProjects } from '../controllers/project.controller';
import {authenticate} from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, addProject);
router.get('/', authenticate, getProjects);
router.delete('/:id', authenticate, deleteProject);


export default router;
