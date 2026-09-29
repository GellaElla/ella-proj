import React, { useState, useEffect, useRef, useMemo } from "react";
import { getApplications,updateApplication, deleteApplication,} from "../services/api";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiEye,
  FiDownload,
  FiMoreVertical,
  FiX,
  FiInfo,
} from "react-icons/fi";
import "./DocumentVerification.css";

/* ---------------------------------------------------------------- */
/* Mock data — swap for real API data                                */
/* ---------------------------------------------------------------- */

const DOC_TEMPLATE = [
  { key: "validId", name: "Valid ID", description: "e.g., Passport, Driver's License" },
  { key: "birthCert", name: "Birth Certificate", description: "Issued by PSA / local civil registrar" },
  { key: "proofResidence", name: "Proof of Residence", description: "Barangay certificate or utility bill" },
  { key: "photo", name: "2x2 Photo", description: "Recent, white background" },
];

function makeDocs(uploadedFlags) {
  return DOC_TEMPLATE.map((d, i) => ({ ...d, uploaded: uploadedFlags[i] }));
}

const INITIAL_APPLICANTS = [
  {
    id: 1,
    appId: "SC-2026-0001",
    name: "Juan Dela Cruz",
    submittedAt: "2026-07-25T10:45:00",
    status: "Pending",
    priority: "High",
    contact: "0917 123 4567",
    barangay: "Poblacion",
    age: 72,
    birthday: "May 27, 1954",
    documents: makeDocs([true, true, true, true]),
    notes: "",
    history: [
      { date: "July 25, 2026 · 10:45 AM", action: "Application submitted" },
      { date: "July 25, 2026 · 11:02 AM", action: "Documents uploaded (4/4)" },
    ],
  },
  {
    id: 2,
    appId: "SC-2026-0002",
    name: "Maria Santos",
    submittedAt: "2026-07-25T09:30:00",
    status: "Pending",
    priority: "Medium",
    contact: "0918 234 5678",
    barangay: "San Isidro",
    age: 69,
    birthday: "May 28, 1955",
    documents: makeDocs([true, true, true, false]),
    notes: "",
    history: [{ date: "July 25, 2026 · 09:30 AM", action: "Application submitted" }],
  },
  {
    id: 3,
    appId: "SC-2026-0003",
    name: "Pedro Reyes",
    submittedAt: "2026-07-24T16:15:00",
    status: "Verified",
    priority: "Low",
    contact: "0920 345 6789",
    barangay: "San Roque",
    age: 75,
    birthday: "May 31, 1950",
    documents: makeDocs([true, true, true, true]),
    notes: "All documents in order.",
    history: [
      { date: "July 24, 2026 · 04:15 PM", action: "Application submitted" },
      { date: "July 24, 2026 · 05:00 PM", action: "Marked as Verified" },
    ],
  },
  {
    id: 4,
    appId: "SC-2026-0004",
    name: "Andrea Gonzales",
    submittedAt: "2026-07-24T11:20:00",
    status: "Pending",
    priority: "High",
    contact: "0916 456 7890",
    barangay: "Poblacion",
    age: 70,
    birthday: "June 1, 1956",
    documents: makeDocs([true, true, false, false]),
    notes: "",
    history: [{ date: "July 24, 2026 · 11:20 AM", action: "Application submitted" }],
  },
  {
    id: 5,
    appId: "SC-2026-0005",
    name: "Ramon Bautista",
    submittedAt: "2026-07-23T14:05:00",
    status: "Rejected",
    priority: "Medium",
    contact: "0915 567 8901",
    barangay: "Mahayag",
    age: 65,
    birthday: "June 2, 1961",
    documents: makeDocs([true, true, true, true]),
    notes: "Proof of residence does not match declared address.",
    history: [
      { date: "July 23, 2026 · 02:05 PM", action: "Application submitted" },
      { date: "July 23, 2026 · 03:30 PM", action: "Marked as Rejected" },
    ],
  },
  {
    id: 6,
    appId: "SC-2026-0006",
    name: "Lucia Morales",
    submittedAt: "2026-07-22T13:00:00",
    status: "Verified",
    priority: "Low",
    contact: "0916 111 2222",
    barangay: "Poblacion",
    age: 70,
    birthday: "June 1, 1956",
    documents: makeDocs([true, true, true, true]),
    notes: "",
    history: [{ date: "July 22, 2026 · 01:00 PM", action: "Application submitted" }],
  },
  {
    id: 7,
    appId: "SC-2026-0007",
    name: "Ana Cruz",
    submittedAt: "2026-07-21T09:10:00",
    status: "Pending",
    priority: "High",
    contact: "0917 333 4444",
    barangay: "San Roque",
    age: 71,
    birthday: "July 20, 1954",
    documents: makeDocs([true, false, false, false]),
    notes: "",
    history: [{ date: "July 21, 2026 · 09:10 AM", action: "Application submitted" }],
  },
  {
    id: 8,
    appId: "SC-2026-0008",
    name: "Ricardo Lim",
    submittedAt: "2026-07-20T15:40:00",
    status: "Verified",
    priority: "Low",
    contact: "0918 555 6666",
    barangay: "San Isidro",
    age: 77,
    birthday: "July 30, 1949",
    documents: makeDocs([true, true, true, true]),
    notes: "",
    history: [{ date: "July 20, 2026 · 03:40 PM", action: "Application submitted" }],
  },
];

const PAGE_SIZE = 5;
const TABS = ["All", "Pending", "Verified", "Rejected"];
const SORT_OPTIONS = ["Newest First", "Oldest First"];
const PRIORITY_OPTIONS = ["High", "Medium", "Low"];

/* Header stat cards can reflect broader backend totals, independent of the
   paginated table sample above — swap these for real aggregate counts. */

/* ---------------------------------------------------------------- */
/* Helpers                                                            */
/* ---------------------------------------------------------------- */

function formatDate(iso) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return { date, time };
}

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_TONES = ["tone-1", "tone-2", "tone-3", "tone-4", "tone-5"];
function avatarTone(id) {
  return AVATAR_TONES[id % AVATAR_TONES.length];
}

const STATUS_BADGE = {
  Pending: "badge-amber",
  Verified: "badge-green",
  Rejected: "badge-red",
};

const PRIORITY_BADGE = {
  High: "badge-red-soft",
  Medium: "badge-amber-soft",
  Low: "badge-green-soft",
};

function docCountTone(uploadedCount) {
  if (uploadedCount === 4) return "doc-green";
  if (uploadedCount >= 3) return "doc-amber";
  return "doc-red";
}

function useOutsideClose(onClose) {
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return ref;
}

/* ---------------------------------------------------------------- */
/* Side panel: applicant detail + verification                       */
/* ---------------------------------------------------------------- */

function ApplicantPanel({ applicant, onClose, onDecision }) {
  const [tab, setTab] = useState("Documents");
  const [choice, setChoice] = useState("verify");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!applicant) return;
    setTab("Documents");
    setChoice(applicant.status === "Rejected" ? "reject" : "verify");
    setNotes(applicant.notes || "");
    setMessage("");
  }, [applicant]);

  if (!applicant) return null;

  const { date, time } = formatDate(applicant.submittedAt);
  const uploadedCount = applicant.documents.filter((d) => d.uploaded).length;

  const commit = (status) => {
    onDecision(applicant.id, status, notes);
    setMessage(status === "Verified" ? "Application approved." : "Application rejected.");
  };

  return (
    <aside className="applicant-panel">
      <button type="button" className="panel-close" onClick={onClose} aria-label="Close">
        <FiX />
      </button>

      <div className="panel-profile">
        <span className={`panel-avatar ${avatarTone(applicant.id)}`}>{initials(applicant.name)}</span>
        <h3>{applicant.name}</h3>
        <span className="panel-app-id">{applicant.appId}</span>
        <span className="panel-submitted">
          Submitted on {date} &nbsp;|&nbsp; {time}
        </span>
      </div>

      <div className="panel-tabs">
        {["Documents", "Details", "History"].map((t) => (
          <button
            key={t}
            type="button"
            className={`panel-tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Documents" && (
        <>
          <div className="checklist-card">
            <h4>
              Document Checklist ({uploadedCount} / {applicant.documents.length})
            </h4>
            <div className="checklist-items">
              {applicant.documents.map((doc) => (
                <div className="checklist-item" key={doc.key}>
                  <span className={`check-icon${doc.uploaded ? " done" : ""}`}>
                    {doc.uploaded ? <FiCheckCircle /> : <FiClock />}
                  </span>
                  <span className="doc-file-icon">
                    <FiFileText />
                  </span>
                  <div className="checklist-text">
                    <span className="checklist-name">{doc.name}</span>
                    <span className="checklist-desc">{doc.description}</span>
                    <span className={`checklist-status${doc.uploaded ? " uploaded" : " missing"}`}>
                      {doc.uploaded ? "Uploaded" : "Missing"}
                    </span>
                  </div>
                  <div className="checklist-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      disabled={!doc.uploaded}
                      title="View"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-only"
                      disabled={!doc.uploaded}
                      title="Download"
                    >
                      <FiDownload />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="verification-card">
            <h4>Verification Section</h4>

            <div className="verify-status-row">
              <span className="verify-status-label">Status</span>
              <label className="radio-option">
                <input
                  type="radio"
                  name={`status-${applicant.id}`}
                  checked={choice === "verify"}
                  onChange={() => setChoice("verify")}
                />
                <span className="radio-dot verify" />
                Verify
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name={`status-${applicant.id}`}
                  checked={choice === "reject"}
                  onChange={() => setChoice("reject")}
                />
                <span className="radio-dot reject" />
                Reject
              </label>
            </div>

            <label className="notes-label" htmlFor={`notes-${applicant.id}`}>
              Verification Notes (Optional)
            </label>
            <textarea
              id={`notes-${applicant.id}`}
              className="notes-textarea"
              placeholder="Add notes here..."
              maxLength={250}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <span className="notes-counter">{notes.length} / 250</span>

            {message && <div className="panel-message">{message}</div>}

            <div className="panel-actions">
              <button type="button" className="btn-approve" onClick={() => commit("Verified")}>
                <FiCheckCircle /> Approve
              </button>
              <button type="button" className="btn-reject" onClick={() => commit("Rejected")}>
                <FiXCircle /> Reject
              </button>
            </div>
          </div>
        </>
      )}

      {tab === "Details" && (
        <div className="details-card">
          <div className="details-row">
            <span className="details-label">Contact Number</span>
            <span className="details-value">{applicant.contact}</span>
          </div>
          <div className="details-row">
            <span className="details-label">Barangay</span>
            <span className="details-value">{applicant.barangay}</span>
          </div>
          <div className="details-row">
            <span className="details-label">Age</span>
            <span className="details-value">{applicant.age}</span>
          </div>
          <div className="details-row">
            <span className="details-label">Birthday</span>
            <span className="details-value">{applicant.birthday}</span>
          </div>
          <div className="details-row">
            <span className="details-label">Priority</span>
            <span className={`badge ${PRIORITY_BADGE[applicant.priority]}`}>
              {applicant.priority}
            </span>
          </div>
        </div>
      )}

      {tab === "History" && (
        <div className="history-card">
          {applicant.history.map((h, idx) => (
            <div className="history-item" key={idx}>
              <span className="history-dot" />
              <div>
                <span className="history-action">{h.action}</span>
                <span className="history-date">{h.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

/* ---------------------------------------------------------------- */
/* Main component                                                     */
/* ---------------------------------------------------------------- */

export default function DocumentVerification() {
 const [applicants, setApplicants] = useState([]);
 const headerStats = useMemo(
  () => ({
    total: applicants.length,
    pending: applicants.filter((a) => a.status === "Pending").length,
    verified: applicants.filter((a) => a.status === "Verified").length,
    rejected: applicants.filter((a) => a.status === "Rejected").length,
  }),
  [applicants]
);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [sortBy, setSortBy] = useState("Newest First");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [kebabOpenId, setKebabOpenId] = useState(null);

  const sortRef = useOutsideClose(() => setSortOpen(false));
  const filterRef = useOutsideClose(() => setFilterOpen(false));
  const kebabRef = useOutsideClose(() => setKebabOpenId(null));

useEffect(() => {
  getApplications()
    .then((data) => {
      const formattedApplicants = data.map((a) => ({
        id: a.id,
        appId: a.application_id,
        name: a.name,
        submittedAt: a.submitted_at,
        status: a.status,
        priority: a.priority,
        contact: a.contact || "",
        barangay: a.purok || "",
        age: a.age || "",
        birthday: a.birth_date
          ? new Date(
              `${String(a.birth_date).slice(0, 10)}T00:00:00`
            ).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : "-",

        documents: makeDocs([
          Boolean(a.valid_id_uploaded),
          Boolean(a.birth_certificate_uploaded),
          Boolean(a.proof_residence_uploaded),
          Boolean(a.photo_uploaded),
        ]),

        notes: a.notes || "",
        history: Array.isArray(a.history) ? a.history : [],
      }));

      setApplicants(formattedApplicants);
    })
    .catch((error) => {
      console.error("Failed to load applications:", error);
    });
}, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, priorityFilter, sortBy]);


  const counts = useMemo(
    () => ({
      All: applicants.length,
      Pending: applicants.filter((a) => a.status === "Pending").length,
      Verified: applicants.filter((a) => a.status === "Verified").length,
      Rejected: applicants.filter((a) => a.status === "Rejected").length,
    }),
    [applicants]
  );

  const filtered = useMemo(() => {
    let list = applicants;

    if (activeTab !== "All") {
      list = list.filter((a) => a.status === activeTab);
    }

    if (priorityFilter.length > 0) {
      list = list.filter((a) => priorityFilter.includes(a.priority));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (a) => a.name.toLowerCase().includes(q) || a.appId.toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      const diff = new Date(a.submittedAt) - new Date(b.submittedAt);
      return sortBy === "Newest First" ? -diff : diff;
    });

    return list;
  }, [applicants, activeTab, priorityFilter, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedApplicant = applicants.find((a) => a.id === selectedId) || null;

  const handleDecision = async (id, status, notes) => {
  const selected = applicants.find((a) => a.id === id);

  if (!selected) return;

  const newHistory = [
    ...selected.history,
    {
      date: new Date().toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      action: `Marked as ${status}`,
    },
  ];

  try {
    const updated = await updateApplication(id, {
      status,
      notes,
      history: newHistory,
    });

    setApplicants((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: updated.status,
              notes: updated.notes || "",
              history: Array.isArray(updated.history)
                ? updated.history
                : newHistory,
            }
          : a
      )
    );
  } catch (error) {
    console.error("Failed to update application:", error);
    alert("Unable to update application.");
  }
};

const handleRemoveApplication = async (id) => {
  const confirmed = window.confirm(
    "Remove this application? This cannot be undone."
  );

  if (!confirmed) return;

  try {
    await deleteApplication(id);

    setApplicants((prev) =>
      prev.filter((applicant) => applicant.id !== id)
    );
  } catch (error) {
    console.error("Failed to delete application:", error);
    alert("Unable to remove application.");
  }
};

  const togglePriority = (p) => {
    setPriorityFilter((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    if (pages.length <= 6) return pages;
    const set = new Set([1, 2, totalPages - 1, totalPages, page - 1, page, page + 1]);
    const trimmed = [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
    const withDots = [];
    trimmed.forEach((p, idx) => {
      if (idx > 0 && p - trimmed[idx - 1] > 1) withDots.push("...");
      withDots.push(p);
    });
    return withDots;
  }, [totalPages, page]);

  return (
    <div className={`doc-verification${selectedApplicant ? " with-panel" : ""}`}>
      <div className="dv-main">
        <div className="dv-heading">
          <div>
            <h1>Document Verification</h1>
            <p>Review and verify uploaded documents submitted by senior citizens.</p>
          </div>

          <div className="dv-heading-controls">
            <div className="search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Search applicant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-wrap" ref={filterRef}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setFilterOpen((o) => !o)}
              >
                <FiFilter /> Filter
                <FiChevronDown className={`chevron${filterOpen ? " open" : ""}`} />
              </button>
              {filterOpen && (
                <div className="dropdown-menu filter-menu">
                  <span className="dropdown-heading">Priority</span>
                  {PRIORITY_OPTIONS.map((p) => (
                    <label className="checkbox-option" key={p}>
                      <input
                        type="checkbox"
                        checked={priorityFilter.includes(p)}
                        onChange={() => togglePriority(p)}
                      />
                      {p}
                    </label>
                  ))}
                  {priorityFilter.length > 0 && (
                    <button
                      type="button"
                      className="dropdown-clear"
                      onClick={() => setPriorityFilter([])}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="dv-stats">
          <div className="stat-card">
            <span className="stat-icon tone-green">
              <FiUsers />
            </span>
            <div className="stat-body">
              <span className="stat-label">Total Applications</span>
              <span className="stat-value">{headerStats.total}</span>
              <span className="stat-sublabel">All time total</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon tone-amber">
              <FiClock />
            </span>
            <div className="stat-body">
              <span className="stat-label">Pending Verification</span>
              <span className="stat-value">{headerStats.pending}</span>
              <span className="stat-sublabel">Needs review</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon tone-green">
              <FiCheckCircle />
            </span>
            <div className="stat-body">
              <span className="stat-label">Verified</span>
              <span className="stat-value">{headerStats.verified}</span>
              <span className="stat-sublabel">Approved documents</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon tone-red">
              <FiXCircle />
            </span>
            <div className="stat-body">
              <span className="stat-label">Rejected</span>
              <span className="stat-value">{headerStats.rejected}</span>
              <span className="stat-sublabel">Rejected applications</span>
            </div>
          </div>
        </div>

        {/* Tabs + sort */}
        <div className="dv-tabs-row">
          <div className="dv-tabs">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                className={`dv-tab${activeTab === t ? " active" : ""}`}
                onClick={() => setActiveTab(t)}
              >
                {t} ({counts[t]})
              </button>
            ))}
          </div>

          <div className="sort-wrap" ref={sortRef}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setSortOpen((o) => !o)}
            >
              Sort by: {sortBy}
              <FiChevronDown className={`chevron${sortOpen ? " open" : ""}`} />
            </button>
            {sortOpen && (
              <div className="dropdown-menu">
                {SORT_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`dropdown-item${s === sortBy ? " active" : ""}`}
                    onClick={() => {
                      setSortBy(s);
                      setSortOpen(false);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="dv-table-card">
          <div className="dv-table-scroll">
            <table className="dv-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Submitted</th>
                  <th>Documents</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((a) => {
                  const { date, time } = formatDate(a.submittedAt);
                  const uploadedCount = a.documents.filter((d) => d.uploaded).length;
                  return (
                    <tr key={a.id} className={selectedId === a.id ? "row-selected" : ""}>
                      <td>
                        <div className="applicant-cell">
                          <span className={`row-avatar ${avatarTone(a.id)}`}>
                            {initials(a.name)}
                          </span>
                          <div>
                            <span className="row-name">{a.name}</span>
                            <span className="row-id">{a.appId}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="row-date">{date}</span>
                        <span className="row-time">{time}</span>
                      </td>
                      <td>
                        <span className={`doc-count ${docCountTone(uploadedCount)}`}>
                          <FiFileText /> {uploadedCount} / {a.documents.length}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[a.status]}`}>{a.status}</span>
                      </td>
                      <td>
                        <span className={`badge ${PRIORITY_BADGE[a.priority]}`}>
                          {a.priority}
                        </span>
                      </td>
                      <td>
                        <div className="action-cell">
                          <button
                            type="button"
                            className={a.status === "Pending" ? "btn-review" : "btn-view"}
                            onClick={() => setSelectedId(a.id)}
                          >
                            {a.status === "Pending" ? "Review" : "View"}
                          </button>
                          <div className="kebab-wrap" ref={kebabOpenId === a.id ? kebabRef : null}>
                            <button
                              type="button"
                              className="icon-btn icon-only"
                              onClick={() =>
                                setKebabOpenId((cur) => (cur === a.id ? null : a.id))
                              }
                              aria-label="More actions"
                            >
                              <FiMoreVertical />
                            </button>
                            {kebabOpenId === a.id && (
                              <div className="dropdown-menu kebab-menu">
                                <button
                                  type="button"
                                  className="dropdown-item"
                                  onClick={() => {
                                    setSelectedId(a.id);
                                    setKebabOpenId(null);
                                  }}
                                >
                                  View Details
                                </button>
                               <button
                        type="button"
                              className="dropdown-item danger"
                                  onClick={() => { handleRemoveApplication(a.id); setKebabOpenId(null); }}
                                        >
                                     Remove Application
                                        </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      No applicants match your search or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="dv-pagination">
            <span className="pagination-summary">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                className="page-btn"
                disabled={page === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                &lsaquo;
              </button>
              {pageNumbers.map((p, idx) =>
                p === "..." ? (
                  <span key={`dots-${idx}`} className="page-dots">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    className={`page-btn${p === page ? " active" : ""}`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                type="button"
                className="page-btn"
                disabled={page === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                &rsaquo;
              </button>
            </div>
          </div>
        </div>     
      </div>

      {selectedApplicant && (
        <ApplicantPanel
          applicant={selectedApplicant}
          onClose={() => setSelectedId(null)}
          onDecision={handleDecision}
        />
      )}
    </div>
  );
}
