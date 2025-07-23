import type { Project } from '../types/project.types';
import DeleteProjectButton from './DeleteProjectButton';
import UpdateProjectButton from './UpdateProjectButton';

interface Props {
  project: Project;
  onUpdate: (project: Project) => void;
  onDelete: (id: string) => void;
}

const ProjectCard = ({ project, onUpdate, onDelete }: Props) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toUTCString();
  };

  return (
    <div className="card shadow-sm h-100">
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{project.owner} / {project.name}</h5>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="card-link mb-2"
        >
          {project.url}
        </a>
        <ul className="list-group list-group-flush mb-3">
          <li className="list-group-item">⭐ Stars: {project.stars}</li>
          <li className="list-group-item">🍴 Forks: {project.forks}</li>
          <li className="list-group-item">🐞 Issues: {project.issues}</li>
          <li className="list-group-item">📅 Created: {formatDate(project.createdAt)}</li>
        </ul>
        <div className="mt-auto d-flex justify-content-between">
          <UpdateProjectButton projectId={project.id} onUpdate={onUpdate} />
          <DeleteProjectButton projectId={project.id} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;