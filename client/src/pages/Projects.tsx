import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Project, ProjectsListResponse, ProjectsPagination } from '@/types/project.types';
import api from '@/services/api';
import axios from 'axios';

import AddProjectModal from '@/components/AddProjectButton';
import ProjectCard from '@/components/ProjectCard';
import LogoutButton from '@/components/LogoutButton';
import SettingsButton from '@/components/SettingsButton';
import IntroGuide from '@/components/IntroGuide';

interface ProjectProps {
  onLogout: () => void;
}

const PROJECTS_PAGE_SIZE = 3;

const normalizeProjectsResponse = (
  payload: unknown,
  requestedPage: number,
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

const Projects: React.FC<ProjectProps> = ({ onLogout }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [introChecked, setIntroChecked] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFavorites, setShowFavorites] = useState(false);
  const [hasAnyProjects, setHasAnyProjects] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ProjectsPagination>({
    page: 1,
    limit: PROJECTS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchProjects = useCallback(
    async (
      pageToLoad: number,
      filters: {
        search: string;
        platform: string;
        sortBy: string;
        sortDir: string;
        favorite: boolean;
      },
    ) => {
      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('token');
        const params: Record<string, string | number> = {
          page: pageToLoad,
          limit: PROJECTS_PAGE_SIZE,
        };
        if (filters.search) params.search = filters.search;
        if (filters.platform !== 'all') params.platform = filters.platform;
        if (filters.sortBy !== 'createdAt') params.sortBy = filters.sortBy;
        if (filters.sortDir !== 'desc') params.sortDir = filters.sortDir;
        if (filters.favorite) params.favorite = 'true';

        const res = await api.get('/projects', {
          params,
          headers: { Authorization: `Bearer ${token}` },
        });

        const normalized = normalizeProjectsResponse(res.data, pageToLoad);
        setProjects(normalized.items);
        setPagination(normalized.pagination);

        if (!filters.search && filters.platform === 'all') {
          setHasAnyProjects(normalized.pagination.total > 0);
        }

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
    },
    [],
  );

  useEffect(() => {
    void fetchProjects(page, {
      search: debouncedSearch,
      platform,
      sortBy,
      sortDir,
      favorite: showFavorites,
    });
  }, [page, debouncedSearch, platform, sortBy, sortDir, showFavorites, fetchProjects]);

  useEffect(() => {
    if (introChecked) return;
    setIntroChecked(true);
    api
      .get<{ hideIntro: boolean }>('/user/settings')
      .then((res) => {
        if (!res.data.hideIntro) {
          setShowIntro(true);
        }
      })
      .catch(() => {
        // If settings fail to load, don't show intro.
      });
  }, [introChecked]);

  const filtersRef = {
    search: debouncedSearch,
    platform,
    sortBy,
    sortDir,
    favorite: showFavorites,
  };

  const handleAdd = (_newProject: Project) => {
    setHasAnyProjects(true);
    const firstPage = 1;

    if (page !== firstPage) {
      setPage(firstPage);
    }

    void fetchProjects(firstPage, filtersRef);
  };

  const handleUpdate = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDelete = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    void fetchProjects(page, filtersRef);
  };

  const handlePlatformChange = (value: string) => {
    setPlatform(value);
    setPage(1);
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value);
    setPage(1);
  };

  const toggleSortDir = () => {
    setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    setPage(1);
  };

  const toggleFavoritesFilter = () => {
    setShowFavorites((prev) => !prev);
    setPage(1);
  };

  const handleToggleFavorite = async (id: string, currentlyFavorite: boolean) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: !currentlyFavorite } : p)),
    );

    try {
      await api.patch(`/projects/${id}/favorite`);
    } catch {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isFavorite: currentlyFavorite } : p)),
      );
    }
  };

  const isFiltered = debouncedSearch || platform !== 'all' || showFavorites;

  return (
    <div className="container-fluid px-3 py-5" style={{ maxWidth: 1600 }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">Your Projects</h1>
        <nav aria-label="User actions" className="d-flex gap-2">
          {projects.length >= 1 && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
              style={{ minWidth: '150px' }}
              aria-label="Add a new project"
            >
              Add Project
            </button>
          )}
          <SettingsButton />
          <LogoutButton onLogout={onLogout} />
        </nav>
      </header>

      <main id="main-content">
        {(hasAnyProjects || projects.length > 0 || showFavorites) && (
          <div className="projects-toolbar" role="search" aria-label="Filter projects">
            <input
              type="text"
              className="projects-toolbar-search"
              placeholder="Search by name or owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search projects"
            />
            <select
              className="projects-toolbar-select"
              value={platform}
              onChange={(e) => handlePlatformChange(e.target.value)}
              aria-label="Filter by platform"
            >
              <option value="all">All platforms</option>
              <option value="github">GitHub</option>
              <option value="gitlab">GitLab</option>
              <option value="bitbucket">Bitbucket</option>
            </select>
            <select
              className="projects-toolbar-select"
              value={sortBy}
              onChange={(e) => handleSortByChange(e.target.value)}
              aria-label="Sort by"
            >
              <option value="createdAt">Date added</option>
              <option value="stars">Stars</option>
              <option value="forks">Forks</option>
              <option value="issues">Issues</option>
              <option value="name">Name</option>
            </select>
            <button
              type="button"
              className="projects-toolbar-dir"
              onClick={toggleSortDir}
              aria-label={sortDir === 'desc' ? 'Sort descending' : 'Sort ascending'}
              title={sortDir === 'desc' ? 'Descending' : 'Ascending'}
            >
              {sortDir === 'desc' ? '\u2193' : '\u2191'}
            </button>
            <button
              type="button"
              className={`projects-toolbar-fav${showFavorites ? ' active' : ''}`}
              onClick={toggleFavoritesFilter}
              aria-label={showFavorites ? 'Show all projects' : 'Show favorites only'}
              title={showFavorites ? 'Show all projects' : 'Show favorites only'}
            >
              <svg
                viewBox="0 0 24 24"
                fill={showFavorites ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.8"
                width="16"
                height="16"
              >
                <path d="m12 3.6 2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 15.82l-4.8 2.54.92-5.34-3.88-3.78 5.36-.78z" />
              </svg>
            </button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-center" aria-live="polite">
            Loading projects...
          </p>
        ) : projects.length === 0 && isFiltered ? (
          <section className="text-center mt-5" aria-label="No results">
            <p className="lead">No projects match your filters.</p>
          </section>
        ) : projects.length === 0 ? (
          <section className="text-center mt-5" aria-label="Empty state">
            <p className="lead">You don't have any projects yet.</p>
            <button
              className="btn btn-success"
              onClick={() => setShowAddModal(true)}
              style={{ minWidth: '200px' }}
              aria-label="Create your first project"
            >
              Add your first project
            </button>
          </section>
        ) : (
          <section aria-label="Projects list">
            <div className="projects-list" role="list">
              {projects.map((project) => (
                <article key={project.id} className="projects-list-item" role="listitem">
                  <ProjectCard
                    project={project}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </article>
              ))}
            </div>
          </section>
        )}

        {!loading && pagination.totalPages > 1 && (
          <nav aria-label="Projects pagination" className="projects-pagination mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={!pagination.hasPrev}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              aria-label="Go to previous page"
            >
              Previous
            </button>
            <span className="projects-pagination-text" aria-live="polite" aria-atomic="true">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} projects)
            </span>
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={!pagination.hasNext}
              onClick={() => setPage((prev) => prev + 1)}
              aria-label="Go to next page"
            >
              Next
            </button>
          </nav>
        )}
      </main>

      {showAddModal && <AddProjectModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />}

      {showIntro && <IntroGuide onDismiss={() => setShowIntro(false)} />}
    </div>
  );
};

export default Projects;
