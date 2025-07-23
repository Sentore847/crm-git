import React, { useEffect, useState } from 'react';
import type { Project } from '../types/project.types';
import api from '../services/api';
import axios from 'axios';

import AddProjectModal from '../components/AddProjectButton';
import ProjectCard from '../components/ProjectCard';
import LogoutButton from '../components/LogoutButton';

interface ProjectProps {
    onLogout: () => void;
}

const Projects: React.FC<ProjectProps> = ({onLogout}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
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
    fetchProjects();
  }, []);

  const handleAdd = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
  };

  const handleUpdate = (updated: Project) => {
    setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const handleDelete = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
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
        <div
          className="projects-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(400px, 1fr))',
            gap: '30px',
            maxWidth: '100%',
          }}
        >
          {projects.map(project => (
            <div key={project.id}>
              <ProjectCard
                project={project}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showAddModal && (
        <AddProjectModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}
    </div>
  );
};

export default Projects;
