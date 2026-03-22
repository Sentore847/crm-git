import React, { useEffect, useState } from 'react';
import type { Project, ProjectsListResponse, ProjectsPagination } from '../types/project.types';
import api from '../services/api';
import axios from 'axios';

import AddProjectModal from '../components/AddProjectButton';
import ProjectCard from '../components/ProjectCard';
import LogoutButton from '../components/LogoutButton';
import SettingsButton from '../components/SettingsButton';
import IntroGuide from '../components/IntroGuide';

interface ProjectProps {
    onLogout: () => void;
}

const PROJECTS_PAGE_SIZE = 3;

const normalizeProjectsResponse = (
  payload: unknown,
  requestedPage: number
): ProjectsListResponse => {
  if (Array.isArray(payload)) {
    const items = payload as Project[];
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / PROJECTS_PAGE_SIZE));
    const page = Math.min(Math.max(1, requestedPage), totalPages);

    return {
      items,
      pagination: {
        page,
        limit: PROJECTS_PAGE_SIZE,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };
  }

  if (payload && typeof payload === 'object') {
    const candidate = payload as Partial<ProjectsListResponse>;
    const items = Array.isArray(candidate.items) ? (candidate.items as Project[]) : [];
    const pagination = candidate.pagination;

    if (
      pagination &&
      typeof pagination.page === 'number' &&
      typeof pagination.limit === 'number' &&
      typeof pagination.total === 'number' &&
      typeof pagination.totalPages === 'number' &&
      typeof pagination.hasPrev === 'boolean' &&
      typeof pagination.hasNext === 'boolean'
    ) {
      return {
        items,
        pagination,
      };
    }

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / PROJECTS_PAGE_SIZE));
    const page = Math.min(Math.max(1, requestedPage), totalPages);

    return {
      items,
      pagination: {
        page,
        limit: PROJECTS_PAGE_SIZE,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };
  }

  return {
    items: [],
    pagination: {
      page: 1,
      limit: PROJECTS_PAGE_SIZE,
      total: 0,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    },
  };
};

const Projects: React.FC<ProjectProps> = ({onLogout}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [introChecked, setIntroChecked] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ProjectsPagination>({
    page: 1,
    limit: PROJECTS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });

  const fetchProjects = async (pageToLoad: number) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/projects', {
        params: { page: pageToLoad, limit: PROJECTS_PAGE_SIZE },
        headers: { Authorization: `Bearer ${token}` },
      });

      const normalized = normalizeProjectsResponse(res.data, pageToLoad);
      setProjects(normalized.items);
      setPagination(normalized.pagination);

      if (normalized.pagination.page !== pageToLoad) {
        setPage(normalized.pagination.page);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to fetch projects');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProjects(page);
  }, [page]);

  useEffect(() => {
    if (introChecked) return;
    setIntroChecked(true);
    api.get<{ hideIntro: boolean }>('/user/settings')
      .then(res => {
        if (!res.data.hideIntro) {
          setShowIntro(true);
        }
      })
      .catch(() => {
        // If settings fail to load, don't show intro.
      });
  }, [introChecked]);

  const handleAdd = (_newProject: Project) => {
    const firstPage = 1;

    if (page !== firstPage) {
      setPage(firstPage);
    }

    void fetchProjects(firstPage);
  };

  const handleUpdate = (updated: Project) => {
    setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const handleDelete = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    void fetchProjects(page);
  };

  return (
    <div className="container-fluid px-3 py-5" style={{ maxWidth: 1600 }}>
      {/* Header Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Your Projects</h2>
        <div className="d-flex gap-2">
          { projects.length >= 1 ? <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ minWidth: '150px' }}
          >
            Add Project
          </button> : ""}
          <SettingsButton />
          <LogoutButton onLogout={onLogout} />
        </div>
      </div>

      {/* Error Alert */}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Content */}
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : projects.length === 0 ? (
        <div className="text-center mt-5">
          <p className="lead">You don't have any projects yet.</p>
          <button
            className="btn btn-success"
            onClick={() => setShowAddModal(true)}
            style={{ minWidth: '200px' }}
          >
            Add your first project
          </button>
        </div>
      ) : (
        <div className="projects-list">
          {projects.map(project => (
            <div key={project.id} className="projects-list-item">
              <ProjectCard
                project={project}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {!loading && pagination.totalPages > 1 && (
        <div className="projects-pagination mt-4">
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={!pagination.hasPrev}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
          >
            Previous
          </button>
          <span className="projects-pagination-text">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} projects)
          </span>
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={!pagination.hasNext}
            onClick={() => setPage(prev => prev + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {showAddModal && (
        <AddProjectModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}

      {showIntro && <IntroGuide onDismiss={() => setShowIntro(false)} />}
    </div>
  );
};

export default Projects;
