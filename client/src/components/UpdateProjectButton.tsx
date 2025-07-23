import type { Project } from '../types/project.types';
import api from '../services/api';
import axios from 'axios';

interface Props {
  projectId: string;
  onUpdate: (project: Project) => void;
}

const UpdateProjectButton = ({ projectId, onUpdate }: Props) => {
  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.patch(`/projects/${projectId}/update`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onUpdate(res.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Failed to update project';
        alert(`Update failed: ${message}`);
      } else {
        alert('Unknown error while updating project');
      }
    }
  };

  return (
    <button className="btn btn-sm btn-secondary" onClick={handleUpdate}>
      Update
    </button>
  );
};

export default UpdateProjectButton;
