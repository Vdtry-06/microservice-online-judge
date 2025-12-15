import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white font-bold">Online Judge</div>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-gray-300">
              {user.username} • {user.solved || 0} solved • {user.score || 0}{" "}
              pts
            </span>
            <button
              onClick={handleLogout}
              className="text-gray-300 hover:text-white"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
