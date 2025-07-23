import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Project } from '../types/project.types';
import api from '../services/api';
import axios from 'axios';

interface Props {
  onClose: () => void;
  onAdd: (project: Project) => void;
}

interface FormData {
  repoPath: string;
}

const AddProjectModal = ({ onClose, onAdd }: Props) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: { repoPath: '' },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await api.post(
        '/projects',
        { repoPath: data.repoPath }, // ✅ ВИПРАВЛЕНО: було path
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      onAdd(res.data);
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to add project');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="d-flex align-items-center justify-content-center position-fixed top-0 start-0 w-100 h-100" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
    >
      <div className="bg-white p-4 rounded shadow" style={{ maxWidth: 400, width: '100%' }}>
        <h5 className="mb-3">Add GitHub Project</h5>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            type="text"
            className={`form-control mb-3 ${errors.repoPath ? 'is-invalid' : ''}`}
            placeholder="e.g. facebook/react"
            {...register('repoPath', {
              required: 'Project path is required',
              pattern: {
                value: /^[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+$/,
                message: 'Invalid repo path. Use format "owner/repo".',
              },
            })}
          />
          {errors.repoPath && (
            <div className="invalid-feedback">{errors.repoPath.message}</div>
          )}
          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-secondary me-2"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={!isValid || loading}>
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectModal;