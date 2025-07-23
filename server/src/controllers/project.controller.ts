import { Request, Response } from 'express';
import { prisma } from "../utils/prisma"
import axios from 'axios';

export const addProject = async (req: Request, res: Response) => {
  try {
    const { repoPath } = req.body;

    if (!repoPath || !repoPath.includes('/')) {
      return res.status(400).json({ message: 'Invalid repo path. Use format "owner/repo".' });
    }

      const [owner, name] = repoPath.split('/');
      
    const githubRes = await axios.get(`https://api.github.com/repos/${owner}/${name}`);

    const {
      html_url: url,
      stargazers_count: stars,
      forks_count: forks,
      open_issues_count: issues,
      created_at,
    } = githubRes.data;

    const userId = (req as any).user.id;

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

export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

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
