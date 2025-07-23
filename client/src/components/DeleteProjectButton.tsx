import api from '../services/api';
import axios from 'axios';

interface Props {
  projectId: string;
  onDelete: (id: string) => void;
}

const DeleteProjectButton = ({ projectId, onDelete }: Props) => {
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDelete(projectId);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message || 'Failed to delete');
      } else {
        alert('Error deleting project');
      }
    }
  };

  return (
    <button className="btn btn-sm btn-danger" onClick={handleDelete}>
      Delete
    </button>
  );
};

export default DeleteProjectButton;
