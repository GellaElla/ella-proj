import React, { useState, useRef, useEffect } from "react";
import { FiMenu, FiChevronDown, FiUser, FiLogOut, FiSettings } from "react-icons/fi";
import "./Header.css";

/**
 * Top header bar.
 *
 * Props:
 * - adminName: string shown in "Welcome, {adminName}!" and the profile chip
 * - onMenuClick: called when the hamburger icon is clicked (use to open the
 *   mobile sidebar drawer)
 * - onLogout: called when "Logout" is picked from the profile dropdown
 * - avatarUrl: optional image url for the admin avatar; falls back to an icon
 */
export default function Header({
  adminName = "Admin",
  onMenuClick,
  onLogout,
  avatarUrl,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button
          type="button"
          className="app-header-menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <FiMenu />
        </button>
        <span className="app-header-welcome">Welcome, {adminName}!</span>
      </div>

      <div className="app-header-right" ref={dropdownRef}>
        <button
          type="button"
          className="app-header-profile"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={`Open account menu for ${adminName}`}
        >
          <span className="app-header-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={adminName} />
            ) : (
              <FiUser />
            )}
          </span>
          <span className="app-header-admin-name">{adminName}</span>
          <FiChevronDown
            className={`app-header-chevron${menuOpen ? " open" : ""}`}
          />
        </button>

        {menuOpen && (
          <div className="app-header-dropdown" role="menu">
            <button type="button" className="app-header-dropdown-item" role="menuitem">
              <FiSettings />
              <span>Settings</span>
            </button>
           
          </div>
        )}
      </div>
    </header>
  );
}
