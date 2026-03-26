export interface Project {
  id: string;
  owner: string;
  name: string;
  url: string;
  stars: number;
  forks: number;
  issues: number;
  createdAt: number;
  isFavorite: boolean;
}

export interface ProjectsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface ProjectsListResponse {
  items: Project[];
  pagination: ProjectsPagination;
}
