import { useNavigate } from "react-router-dom";

const LogoutButton = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
      <i className="bi bi-box-arrow-right me-1"></i>
      Log Out
    </button>
  );
};

export default LogoutButton;