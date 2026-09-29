import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./AdminLayout.css";

const PATH_TO_KEY = {
  "/dashboard": "dashboard",
  "/document-verification": "verification",
  "/records": "records",
  "/announcements": "announcements",
  "/birthday-list": "birthday",
  "/pension": "pension",
  "/user-management": "user-management",
  "/medical": "medical",
  "/burial": "burial"
};

const KEY_TO_PATH = Object.fromEntries(
  Object.entries(PATH_TO_KEY).map(([path, key]) => [key, path])
);

export default function AdminLayout({ onLogout, adminName }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const activeKey = PATH_TO_KEY[location.pathname] || "dashboard";

  const handleNavigate = (key) => {
    navigate(KEY_TO_PATH[key] || "/dashboard");
  };

  const handleMenuClick = () => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      setSidebarOpen((open) => !open);
    } else {
      setSidebarCollapsed((collapsed) => !collapsed);
    }
  };

  return (
    <div
      className={`admin-layout${
        sidebarCollapsed ? " sidebar-collapsed" : ""
      }`}
    >
      <Sidebar
        activeKey={activeKey}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="admin-layout-content">
        <Header
          adminName={adminName}
          onMenuClick={handleMenuClick}
          onLogout={onLogout}
        />

        <main className="admin-layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}