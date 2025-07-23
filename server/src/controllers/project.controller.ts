import { Response } from 'express';
import { prisma } from "../utils/prisma"
import { AuthRequest } from '../middlewares/auth.middleware';
import axios from 'axios';

export const addProject = async (req: AuthRequest, res: Response) => {
  try {
    const { repoPath } = req.body;

    if (!repoPath || !repoPath.includes('/')) {
      return res.status(400).json({ message: 'Invalid repo path. Use format "owner/repo".' });
    }

    const [owner, name] = repoPath.split('/');

    const existingProject = await prisma.project.findFirst({
      where: {
        owner,
        name,
        userId: req.userId!,
      },
    });

    if (existingProject) {
      return res.status(400).json({ message: 'Project already added' });
    }

    const githubRes = await axios.get(`https://api.github.com/repos/${owner}/${name}`);

    const {
      html_url: url,
      stargazers_count: stars,
      forks_count: forks,
      open_issues_count: issues,
      created_at,
    } = githubRes.data;

    const userId = req.userId!;

    const createdProject = await prisma.project.create({
      data: {
        owner,
        name,
        url,
        stars,
        forks,
        issues,
        createdAt: Math.floor(new Date(created_at).getTime() / 1000),
        userId,
      },
    });

    res.status(201).json(createdProject);
  } catch (error: any) {
    console.error(error);

    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'Repository not found on GitHub' });
    }

    res.status(500).json({ message: 'Failed to add project' });
  }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project || project.userId !== userId) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    await prisma.project.delete({ where: { id } });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete project' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project || project.userId !== userId) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    const githubRes = await axios.get(`https://api.github.com/repos/${project.owner}/${project.name}`);

    const {
      html_url: url,
      stargazers_count: stars,
      forks_count: forks,
      open_issues_count: issues,
      created_at,
    } = githubRes.data;

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        url,
        stars,
        forks,
        issues,
        createdAt: Math.floor(new Date(created_at).getTime() / 1000),
      },
    });

    res.json(updatedProject);
  } catch (error: any) {
    console.error(error);

    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'Repository not found on GitHub' });
    }

    res.status(500).json({ message: 'Failed to update project' });
  }
};