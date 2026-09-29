import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiArrowDown,
  FiArrowUp,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiKey,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
  FiUserCheck,
  FiUserPlus,
  FiUserX,
  FiUsers,
  FiX,
} from "react-icons/fi";
import {
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
} from "../services/api";
import "./UserManagement.css";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

// The system has two roles. Edit the descriptions to match your permissions.
const ROLES = [
  {
    value: "Administrator",
    description: "Full access, including managing users and passwords.",
  },
  {
    value: "User",
    description: "Can use the system but cannot manage other users.",
  },
];

const PAGE_SIZE = 10;
const MIN_PASSWORD_LENGTH = 8;
const SKELETON_ROWS = [0, 1, 2, 3, 4];

const EMPTY_FORM = {
  name: "",
  username: "",
  email: "",
  role: "User",
  password: "",
};

const EMPTY_PASSWORD_FORM = {
  password: "",
  confirmation: "",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function initials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatLastLogin(value) {
  if (!value) return "Never";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Only two roles exist now. Anything that isn't an administrator
// (including old "Staff" / "Encoder" values) is shown as "User".
function normalizeRole(role) {
  const value = String(role || "").toLowerCase();
  return value === "administrator" || value === "admin"
    ? "Administrator"
    : "User";
}

// Converts a Laravel user row into the shape this page uses.
function normalizeUser(user) {
  const loginTime = user.last_login_at
    ? new Date(user.last_login_at).getTime()
    : 0;

  return {
    id: user.id,
    name: user.name || user.username || "",
    username: user.username || "",
    email: user.email || "",
    role: normalizeRole(user.role),
    status: user.status || "Active",
    lastLogin: formatLastLogin(user.last_login_at),
    lastLoginTime: Number.isNaN(loginTime) ? 0 : loginTime,
  };
}

function generatePassword(length = 12) {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);
  return Array.from(values, (value) => characters[value % characters.length]).join(
    ""
  );
}

// Laravel returns validation problems as { errors: { field: ["message"] } }.
function extractFieldErrors(error) {
  const source = error?.errors || error?.data?.errors;
  if (!source || typeof source !== "object") return {};

  return Object.fromEntries(
    Object.entries(source).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages[0] : String(messages),
    ])
  );
}

function validateUserForm(form, { isAdd, users, editingId }) {
  const errors = {};
  const name = form.name.trim();
  const username = form.username.trim();
  const email = form.email.trim();

  if (!name) errors.name = "Enter the user's full name.";

  if (!username) {
    errors.username = "Enter a username.";
  } else if (
    users.some(
      (user) =>
        user.id !== editingId &&
        user.username.toLowerCase() === username.toLowerCase()
    )
  ) {
    errors.username = "This username is already taken.";
  }

  if (!email) {
    errors.email = "Enter an email address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address, like name@example.com.";
  } else if (
    users.some(
      (user) =>
        user.id !== editingId && user.email.toLowerCase() === email.toLowerCase()
    )
  ) {
    errors.email = "This email address is already used by another user.";
  }

  if (isAdd && form.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return errors;
}

/* -------------------------------------------------------------------------- */
/* Small building blocks                                                      */
/* -------------------------------------------------------------------------- */

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="um-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="um-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="um-modal-title"
      >
        <div className="um-modal-header">
          <h2 id="um-modal-title">{title}</h2>
          <button
            type="button"
            className="um-icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div className={`um-field${error ? " has-error" : ""}`}>
      {htmlFor ? (
        <label htmlFor={htmlFor}>{label}</label>
      ) : (
        <span className="um-label">{label}</span>
      )}
      {children}
      {error ? (
        <p className="um-field-error" id={`${htmlFor}-error`}>
          <FiAlertCircle aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="um-field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

function PasswordInput({ id, value, onChange, error, autoFocus, onGenerate }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="um-password">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete="new-password"
        autoFocus={autoFocus}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <button
        type="button"
        className="um-icon-btn"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
      >
        {visible ? <FiEyeOff /> : <FiEye />}
      </button>
      {onGenerate && (
        <button
          type="button"
          className="um-btn um-btn-secondary um-btn-sm"
          onClick={() => {
            onGenerate(generatePassword());
            setVisible(true);
          }}
        >
          <FiRefreshCw />
          Generate
        </button>
      )}
    </div>
  );
}

function RoleSelect({ value, onChange }) {
  return (
    <div className="um-role-options" role="radiogroup" aria-label="Role">
      {ROLES.map((role) => (
        <label
          key={role.value}
          className={`um-role-option${value === role.value ? " selected" : ""}`}
        >
          <input
            type="radio"
            name="um-role"
            value={role.value}
            checked={value === role.value}
            onChange={() => onChange(role.value)}
          />
          <span className="um-role-icon">
            {role.value === "Administrator" ? <FiShield /> : <FiUser />}
          </span>
          <span className="um-role-text">
            <strong>{role.value}</strong>
            <small>{role.description}</small>
          </span>
        </label>
      ))}
    </div>
  );
}

function SortHeader({ label, sortKey, sort, onSort, className }) {
  const active = sort.key === sortKey;
  const ariaSort = active
    ? sort.dir === "asc"
      ? "ascending"
      : "descending"
    : "none";

  return (
    <th aria-sort={ariaSort} className={className}>
      <button type="button" className="um-sort" onClick={() => onSort(sortKey)}>
        {label}
        {active && (sort.dir === "asc" ? <FiArrowUp /> : <FiArrowDown />)}
      </button>
    </th>
  );
}

function RoleBadge({ role }) {
  return (
    <span
      className={`um-badge ${
        role === "Administrator" ? "um-badge-admin" : "um-badge-user"
      }`}
    >
      {role === "Administrator" ? <FiShield /> : <FiUser />}
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`um-status ${status.toLowerCase()}`}>
      <span className="um-status-dot" />
      {status}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  const [toasts, setToasts] = useState([]);

  /* ------------------------------ Data loading ----------------------------- */

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setLoadError("");

    getUsers()
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data) ? data : data.data || [];
        setUsers(rows.map(normalizeUser));
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load users:", error);
        setLoadError(error.message || "Failed to load users.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  /* ------------------------------ Derived data ----------------------------- */

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    const rows = users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || user.status === statusFilter;

      const matchesRole = roleFilter === "All" || user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });

    if (!sort.key) return rows;

    const direction = sort.dir === "asc" ? 1 : -1;

    return [...rows].sort((a, b) => {
      if (sort.key === "lastLogin") {
        return (a.lastLoginTime - b.lastLoginTime) * direction;
      }

      return (
        String(a[sort.key]).localeCompare(String(b[sort.key]), undefined, {
          sensitivity: "base",
        }) * direction
      );
    });
  }, [users, search, statusFilter, roleFilter, sort]);

  const stats = {
    total: users.length,
    active: users.filter((user) => user.status === "Active").length,
    inactive: users.filter((user) => user.status === "Inactive").length,
    administrators: users.filter((user) => user.role === "Administrator")
      .length,
  };

  const activeAdminCount = users.filter(
    (user) => user.role === "Administrator" && user.status === "Active"
  ).length;

  const isLastActiveAdmin = (user) =>
    user.role === "Administrator" &&
    user.status === "Active" &&
    activeAdminCount <= 1;

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filteredUsers.slice(pageStart, pageStart + PAGE_SIZE);

  const hasFilters =
    Boolean(search.trim()) || statusFilter !== "All" || roleFilter !== "All";

  const showTable = loading || (!loadError && filteredUsers.length > 0);

  /* -------------------------------- Toasts --------------------------------- */

  const pushToast = (message, type = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((previous) => [...previous, { id, message, type }]);
    setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 4500);
  };

  const dismissToast = (id) =>
    setToasts((previous) => previous.filter((toast) => toast.id !== id));

  /* ------------------------------- Filtering ------------------------------- */

  const applyFilters = ({ status = "All", role = "All" }) => {
    setStatusFilter(status);
    setRoleFilter(role);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    applyFilters({});
  };

  const handleSort = (key) => {
    setSort((previous) => {
      if (previous.key !== key) return { key, dir: "asc" };
      if (previous.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: "asc" };
    });
    setPage(1);
  };

  /* -------------------------------- Modals --------------------------------- */

  const resetModal = () => {
    setModal(null);
    setForm(EMPTY_FORM);
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setErrors({});
    setFormError("");
  };

  const requestClose = () => {
    if (saving || busyId !== null) return;
    resetModal();
  };

  const openAddModal = () => {
    resetModal();
    setModal({ type: "add" });
  };

  const openEditModal = (user) => {
    resetModal();
    setForm({
      ...EMPTY_FORM,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    });
    setModal({ type: "edit", user });
  };

  const openResetModal = (user) => {
    resetModal();
    setModal({ type: "reset", user });
  };

  const openViewModal = (user) => {
    resetModal();
    setModal({ type: "view", user });
  };

  const requestToggleStatus = (user) => {
    if (user.status === "Active") {
      if (isLastActiveAdmin(user)) {
        pushToast(
          "This is the only active administrator. Make another user an administrator first.",
          "error"
        );
        return;
      }
      resetModal();
      setModal({ type: "deactivate", user });
      return;
    }

    changeStatus(user, "Active");
  };

  /* -------------------------------- Forms ---------------------------------- */

  const setField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setFormError("");
  };

  const updateForm = (field) => (event) => setField(field, event.target.value);

  const setPasswordField = (field, value) => {
    setPasswordForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setFormError("");
  };

  const replaceUser = (updated) => {
    const next = normalizeUser(updated);
    setUsers((previous) =>
      previous.map((user) => (user.id === next.id ? next : user))
    );
  };

  const isDirty =
    modal?.type === "edit" &&
    (form.name.trim() !== modal.user.name ||
      form.username.trim() !== modal.user.username ||
      form.email.trim() !== modal.user.email ||
      form.role !== modal.user.role);

  const showSaveFailure = (error, fallback) => {
    console.error(fallback, error);
    const fieldErrors = extractFieldErrors(error);

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
    } else {
      setFormError(error.message || fallback);
    }
  };

  const saveUser = async (event) => {
    event.preventDefault();

    const isAdd = modal.type === "add";
    const found = validateUserForm(form, {
      isAdd,
      users,
      editingId: isAdd ? null : modal.user.id,
    });

    if (!isAdd && form.role !== "Administrator" && isLastActiveAdmin(modal.user)) {
      found.role =
        "This is the only active administrator. Make another user an administrator first.";
    }

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    const payload = {
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      role: form.role,
    };

    setSaving(true);
    setFormError("");

    try {
      if (isAdd) {
        const created = await createUser({
          ...payload,
          password: form.password,
        });

        setUsers((previous) => [normalizeUser(created), ...previous]);
        // Make sure the new user is visible at the top of the list.
        setSearch("");
        setStatusFilter("All");
        setRoleFilter("All");
        setSort({ key: null, dir: "asc" });
        setPage(1);
        pushToast(`${payload.name} was added.`);
      } else {
        const updated = await updateUser(modal.user.id, payload);
        replaceUser(updated);
        pushToast(`${payload.name}'s details were saved.`);
      }

      resetModal();
    } catch (error) {
      showSaveFailure(error, "Unable to save user.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (user, nextStatus) => {
    setBusyId(user.id);

    try {
      const updated = await updateUser(user.id, { status: nextStatus });
      replaceUser(updated);
      pushToast(
        nextStatus === "Active"
          ? `${user.name} was activated.`
          : `${user.name} was deactivated.`
      );
      resetModal();
    } catch (error) {
      console.error("Failed to change status:", error);
      pushToast(error.message || "Unable to change user status.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();

    const found = {};

    if (passwordForm.password.length < MIN_PASSWORD_LENGTH) {
      found.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    if (passwordForm.password !== passwordForm.confirmation) {
      found.confirmation = "The passwords do not match.";
    }

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      await resetUserPassword(
        modal.user.id,
        passwordForm.password,
        passwordForm.confirmation
      );
      pushToast(`Password reset for ${modal.user.name}.`);
      resetModal();
    } catch (error) {
      showSaveFailure(error, "Unable to reset password.");
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------- Render --------------------------------- */

  const statCards = [
    {
      key: "total",
      label: "Total users",
      value: stats.total,
      tone: "green",
      icon: <FiUsers />,
      active: statusFilter === "All" && roleFilter === "All",
      onClick: () => applyFilters({}),
    },
    {
      key: "active",
      label: "Active",
      value: stats.active,
      tone: "blue",
      icon: <FiUserCheck />,
      active: statusFilter === "Active" && roleFilter === "All",
      onClick: () => applyFilters({ status: "Active" }),
    },
    {
      key: "inactive",
      label: "Inactive",
      value: stats.inactive,
      tone: "amber",
      icon: <FiUserX />,
      active: statusFilter === "Inactive" && roleFilter === "All",
      onClick: () => applyFilters({ status: "Inactive" }),
    },
    {
      key: "admins",
      label: "Administrators",
      value: stats.administrators,
      tone: "purple",
      icon: <FiShield />,
      active: statusFilter === "All" && roleFilter === "Administrator",
      onClick: () => applyFilters({ role: "Administrator" }),
    },
  ];

  return (
    <div className="user-management-page">
      {/* Heading */}
      <header className="um-heading">
        <div className="um-title-row">
          <span className="um-title-icon">
            <FiUsers />
          </span>
          <div>
            <h1>User Management</h1>
            <p>Add people, choose their role, and control who can log in.</p>
          </div>
        </div>

        <button
          type="button"
          className="um-btn um-btn-primary"
          onClick={openAddModal}
        >
          <FiUserPlus />
          Add user
        </button>
      </header>

      {/* Stats double as quick filters */}
      <div className="um-stats">
        {statCards.map((card) => (
          <button
            key={card.key}
            type="button"
            className={`um-stat${card.active ? " active" : ""}`}
            onClick={card.onClick}
            aria-pressed={card.active}
            title={`Show ${card.label.toLowerCase()}`}
          >
            <span className={`um-stat-icon ${card.tone}`}>{card.icon}</span>
            <span className="um-stat-text">
              <strong>{loading ? "–" : card.value}</strong>
              <span>{card.label}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Table panel */}
      <section className="um-panel">
        <div className="um-toolbar">
          <div className="um-search">
            <FiSearch aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by name, username or email"
              aria-label="Search users"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                className="um-search-clear"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="All">All roles</option>
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.value}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              className="um-btn um-btn-ghost um-btn-sm"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Error state */}
        {!loading && loadError && (
          <div className="um-state" role="alert">
            <span className="um-state-icon error">
              <FiAlertCircle />
            </span>
            <h3>Users could not be loaded</h3>
            <p>{loadError}</p>
            <button
              type="button"
              className="um-btn um-btn-secondary"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              <FiRefreshCw />
              Try again
            </button>
          </div>
        )}

        {/* Empty states */}
        {!loading && !loadError && filteredUsers.length === 0 && (
          <div className="um-state">
            <span className="um-state-icon">
              <FiUsers />
            </span>
            {users.length === 0 ? (
              <>
                <h3>No users yet</h3>
                <p>Add the first user to give someone access to SCMS.</p>
                <button
                  type="button"
                  className="um-btn um-btn-primary"
                  onClick={openAddModal}
                >
                  <FiUserPlus />
                  Add user
                </button>
              </>
            ) : (
              <>
                <h3>No matching users</h3>
                <p>Try a different search or clear the filters.</p>
                <button
                  type="button"
                  className="um-btn um-btn-secondary"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        )}

        {/* Table */}
        {showTable && (
          <div className="um-table-wrap">
            <table className="um-table">
              <thead>
                <tr>
                  <SortHeader
                    label="User"
                    sortKey="name"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <th>Email</th>
                  <SortHeader
                    label="Role"
                    sortKey="role"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortHeader
                    label="Status"
                    sortKey="status"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortHeader
                    label="Last login"
                    sortKey="lastLogin"
                    sort={sort}
                    onSort={handleSort}
                    className="um-col-hide-sm"
                  />
                  <th className="um-actions-head">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading &&
                  SKELETON_ROWS.map((row) => (
                    <tr key={row} aria-hidden="true">
                      <td>
                        <div className="um-user-cell">
                          <span className="um-skeleton um-skeleton-avatar" />
                          <span className="um-skeleton um-skeleton-line" />
                        </div>
                      </td>
                      <td>
                        <span className="um-skeleton um-skeleton-line" />
                      </td>
                      <td>
                        <span className="um-skeleton um-skeleton-pill" />
                      </td>
                      <td>
                        <span className="um-skeleton um-skeleton-pill" />
                      </td>
                      <td className="um-col-hide-sm">
                        <span className="um-skeleton um-skeleton-line" />
                      </td>
                      <td />
                    </tr>
                  ))}

                {!loading &&
                  pageRows.map((user) => {
                    const busy = busyId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className={user.status === "Inactive" ? "is-inactive" : ""}
                      >
                        <td>
                          <button
                            type="button"
                            className="um-user-cell um-user-link"
                            onClick={() => openViewModal(user)}
                            title="View details"
                          >
                            <span className="um-avatar">
                              {initials(user.name)}
                            </span>
                            <span className="um-user-text">
                              <strong>{user.name}</strong>
                              {user.username && <small>@{user.username}</small>}
                            </span>
                          </button>
                        </td>
                        <td className="um-email">{user.email}</td>
                        <td>
                          <RoleBadge role={user.role} />
                        </td>
                        <td>
                          <StatusBadge status={user.status} />
                        </td>
                        <td className="um-col-hide-sm um-muted">
                          {user.lastLogin}
                        </td>
                        <td>
                          <div className="um-actions">
                            <button
                              type="button"
                              className="um-icon-btn"
                              title="Edit user"
                              aria-label={`Edit ${user.name}`}
                              onClick={() => openEditModal(user)}
                              disabled={busy}
                            >
                              <FiEdit2 />
                            </button>

                            <button
                              type="button"
                              className="um-icon-btn"
                              title="Reset password"
                              aria-label={`Reset password for ${user.name}`}
                              onClick={() => openResetModal(user)}
                              disabled={busy}
                            >
                              <FiKey />
                            </button>

                            <button
                              type="button"
                              className={`um-icon-btn ${
                                user.status === "Active" ? "danger" : "success"
                              }`}
                              title={
                                user.status === "Active"
                                  ? "Deactivate user"
                                  : "Activate user"
                              }
                              aria-label={
                                user.status === "Active"
                                  ? `Deactivate ${user.name}`
                                  : `Activate ${user.name}`
                              }
                              onClick={() => requestToggleStatus(user)}
                              disabled={busy}
                            >
                              {user.status === "Active" ? (
                                <FiUserX />
                              ) : (
                                <FiUserCheck />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer: count + pagination */}
        {!loading && !loadError && filteredUsers.length > 0 && (
          <div className="um-footer">
            <span className="um-muted">
              {filteredUsers.length > PAGE_SIZE
                ? `Showing ${pageStart + 1}–${Math.min(
                    pageStart + PAGE_SIZE,
                    filteredUsers.length
                  )} of ${filteredUsers.length} users`
                : hasFilters
                ? `${filteredUsers.length} of ${users.length} users`
                : `${users.length} ${users.length === 1 ? "user" : "users"}`}
            </span>

            {pageCount > 1 && (
              <div className="um-pagination">
                <button
                  type="button"
                  className="um-icon-btn"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <FiChevronLeft />
                </button>
                <span>
                  Page {currentPage} of {pageCount}
                </span>
                <button
                  type="button"
                  className="um-icon-btn"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === pageCount}
                  aria-label="Next page"
                >
                  <FiChevronRight />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* View details */}
      {modal?.type === "view" && (
        <Modal title="User details" onClose={requestClose}>
          <div className="um-modal-body">
            <div className="um-profile">
              <span className="um-avatar um-avatar-lg">
                {initials(modal.user.name)}
              </span>
              <div>
                <h3>{modal.user.name}</h3>
                {modal.user.username && <p>@{modal.user.username}</p>}
              </div>
            </div>

            <dl className="um-details">
              <div>
                <dt>Email</dt>
                <dd>{modal.user.email || "-"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>
                  <RoleBadge role={modal.user.role} />
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={modal.user.status} />
                </dd>
              </div>
              <div>
                <dt>Last login</dt>
                <dd>{modal.user.lastLogin}</dd>
              </div>
            </dl>
          </div>

          <div className="um-modal-actions">
            <button
              type="button"
              className="um-btn um-btn-secondary"
              onClick={() => openResetModal(modal.user)}
            >
              <FiKey />
              Reset password
            </button>
            <button
              type="button"
              className="um-btn um-btn-primary"
              onClick={() => openEditModal(modal.user)}
            >
              <FiEdit2 />
              Edit user
            </button>
          </div>
        </Modal>
      )}

      {/* Add / edit */}
      {(modal?.type === "add" || modal?.type === "edit") && (
        <Modal
          title={modal.type === "add" ? "Add user" : "Edit user"}
          onClose={requestClose}
        >
          <form className="um-form" onSubmit={saveUser} noValidate>
            <div className="um-modal-body">
              {formError && (
                <div className="um-banner" role="alert">
                  <FiAlertCircle aria-hidden="true" />
                  {formError}
                </div>
              )}

              <Field label="Full name" htmlFor="um-name" error={errors.name}>
                <input
                  id="um-name"
                  type="text"
                  value={form.name}
                  onChange={updateForm("name")}
                  autoFocus
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "um-name-error" : undefined}
                />
              </Field>

              <div className="um-field-row">
                <Field
                  label="Username"
                  htmlFor="um-username"
                  error={errors.username}
                >
                  <input
                    id="um-username"
                    type="text"
                    value={form.username}
                    onChange={updateForm("username")}
                    autoComplete="off"
                    aria-invalid={Boolean(errors.username)}
                    aria-describedby={
                      errors.username ? "um-username-error" : undefined
                    }
                  />
                </Field>

                <Field label="Email" htmlFor="um-email" error={errors.email}>
                  <input
                    id="um-email"
                    type="email"
                    value={form.email}
                    onChange={updateForm("email")}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "um-email-error" : undefined}
                  />
                </Field>
              </div>

              <Field label="Role" error={errors.role}>
                <RoleSelect
                  value={form.role}
                  onChange={(role) => setField("role", role)}
                />
              </Field>

              {modal.type === "add" && (
                <Field
                  label="Temporary password"
                  htmlFor="um-password"
                  error={errors.password}
                  hint={`At least ${MIN_PASSWORD_LENGTH} characters. Share it with the user securely.`}
                >
                  <PasswordInput
                    id="um-password"
                    value={form.password}
                    onChange={updateForm("password")}
                    error={errors.password}
                    onGenerate={(password) => setField("password", password)}
                  />
                </Field>
              )}
            </div>

            <div className="um-modal-actions">
              <button
                type="button"
                className="um-btn um-btn-secondary"
                onClick={requestClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="um-btn um-btn-primary"
                disabled={saving || (modal.type === "edit" && !isDirty)}
              >
                {saving
                  ? "Saving..."
                  : modal.type === "add"
                  ? "Add user"
                  : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset password */}
      {modal?.type === "reset" && (
        <Modal title="Reset password" onClose={requestClose}>
          <form className="um-form" onSubmit={resetPassword} noValidate>
            <div className="um-modal-body">
              <p className="um-modal-note">
                Set a new password for <strong>{modal.user.name}</strong>. They
                will need it the next time they log in.
              </p>

              {formError && (
                <div className="um-banner" role="alert">
                  <FiAlertCircle aria-hidden="true" />
                  {formError}
                </div>
              )}

              <Field
                label="New password"
                htmlFor="um-new-password"
                error={errors.password}
                hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
              >
                <PasswordInput
                  id="um-new-password"
                  value={passwordForm.password}
                  onChange={(event) =>
                    setPasswordField("password", event.target.value)
                  }
                  error={errors.password}
                  autoFocus
                  onGenerate={(password) => {
                    setPasswordForm({ password, confirmation: password });
                    setErrors({});
                  }}
                />
              </Field>

              <Field
                label="Confirm new password"
                htmlFor="um-confirm-password"
                error={errors.confirmation}
              >
                <PasswordInput
                  id="um-confirm-password"
                  value={passwordForm.confirmation}
                  onChange={(event) =>
                    setPasswordField("confirmation", event.target.value)
                  }
                  error={errors.confirmation}
                />
              </Field>
            </div>

            <div className="um-modal-actions">
              <button
                type="button"
                className="um-btn um-btn-secondary"
                onClick={requestClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="um-btn um-btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Reset password"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Deactivate confirmation */}
      {modal?.type === "deactivate" && (
        <Modal title="Deactivate user?" onClose={requestClose}>
          <div className="um-modal-body">
            <p className="um-modal-note">
              <strong>{modal.user.name}</strong> will no longer be able to log
              in. You can activate them again at any time.
            </p>
          </div>

          <div className="um-modal-actions">
            <button
              type="button"
              className="um-btn um-btn-secondary"
              onClick={requestClose}
              disabled={busyId !== null}
            >
              Cancel
            </button>
            <button
              type="button"
              className="um-btn um-btn-danger"
              onClick={() => changeStatus(modal.user, "Inactive")}
              disabled={busyId !== null}
            >
              {busyId !== null ? "Deactivating..." : "Deactivate"}
            </button>
          </div>
        </Modal>
      )}

      {/* Toasts */}
      <div className="um-toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`um-toast ${toast.type}`}>
            {toast.type === "error" ? <FiAlertCircle /> : <FiCheckCircle />}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss"
            >
              <FiX />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
