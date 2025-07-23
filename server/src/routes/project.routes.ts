import { Router } from 'express';
import { addProject, deleteProject, getProjects, updateProject } from '../controllers/project.controller';
import {authenticate} from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, addProject);
router.get('/', authenticate, getProjects);
router.delete('/:id', authenticate, deleteProject);
router.patch('/:id/update', authenticate, updateProject);


export default router;
