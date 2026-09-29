import React, { useState } from "react";
import {
  FiHome,
  FiCheckSquare,
  FiFolder,
  FiVolume2,
  FiLogOut,
  FiX,
  FiUsers,
} from "react-icons/fi";
import { PiCakeDuotone } from "react-icons/pi";
import scmsLogo from "../assets/scms-logo.png";
import "./Sidebar.css";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: FiHome },
  { key: "user-management", label: "User Management", icon: FiUsers },
  { key: "verification", label: "Document Verification", icon: FiCheckSquare },
  { key: "records", label: "Records", icon: FiFolder },
  { key: "announcements", label: "Announcements", icon: FiVolume2 },
  { key: "birthday", label: "Birthday List", icon: PiCakeDuotone },
  {
    key: "programs",
    label: "Program Management",
    icon: FiFolder,
    children: [
      { key: "pension", label: "Pension" },
      { key: "medical", label: "Medical" },
      { key: "burial", label: "Burial" },
    ],
  },
];

/**
 * Responsive behavior (see Sidebar.css):
 * - Desktop (>768px): sticky sidebar. Full width by default; collapses to an
 *   icon-only rail when the parent layout has the `sidebar-collapsed` class.
 * - Mobile (<=768px): off-canvas drawer, hidden by default and slid in over the
 *   content when `isOpen` is true.
 */
export default function Sidebar({
  activeKey = "dashboard",
  onNavigate,
  onLogout,
  isOpen = false,
  onClose,
}) {
  // Start with Program Management open if the current page is one of its children.
  const [programOpen, setProgramOpen] = useState(() =>
    NAV_ITEMS.some(
      (item) => item.children && item.children.some((c) => c.key === activeKey)
    )
  );

  const handleNavigate = (key) => {
    onNavigate && onNavigate(key);
    // auto-close the drawer on mobile after picking a page
    onClose && onClose();
  };

  return (
    <>
      {/* Dark overlay behind the drawer on mobile, click to dismiss */}
      <div
        className={`sidebar-overlay${isOpen ? " visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar${isOpen ? " open" : ""}`}>
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">
            <img src={scmsLogo} alt="Senior Citizen Management System logo" />
          </span>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">Senior Citizen</span>
            <span className="sidebar-logo-subtitle">Management System</span>
          </div>

          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ key, label, icon: Icon, children }) => {
            const childActive =
              children && children.some((child) => child.key === activeKey);
            const isActive = key === activeKey || childActive;

            return (
              <div key={key} className="sidebar-nav-group">
                <button
                  type="button"
                  title={label}
                  className={`sidebar-nav-item${isActive ? " active" : ""}`}
                  onClick={() => {
                    if (children) {
                      setProgramOpen((open) => !open);
                    } else {
                      handleNavigate(key);
                    }
                  }}
                  aria-current={key === activeKey ? "page" : undefined}
                  aria-expanded={children ? programOpen : undefined}
                >
                  <Icon className="sidebar-nav-icon" />
                  <span className="sidebar-nav-label">{label}</span>
                  {children && (
                    <span
                      className={`sidebar-submenu-arrow${
                        programOpen ? " open" : ""
                      }`}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  )}
                </button>

                {children && programOpen && (
                  <div className="sidebar-submenu">
                    {children.map((child) => (
                      <button
                        key={child.key}
                        type="button"
                        className={`sidebar-submenu-item${
                          child.key === activeKey ? " active" : ""
                        }`}
                        onClick={() => handleNavigate(child.key)}
                        aria-current={child.key === activeKey ? "page" : undefined}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            title="Logout"
            className="sidebar-logout"
            onClick={onLogout}
          >
            <FiLogOut className="sidebar-nav-icon" />
            <span className="sidebar-nav-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
