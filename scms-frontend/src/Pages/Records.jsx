import React, { useState, useMemo, useRef, useEffect } from "react";
import { getSeniorCitizens, createSeniorCitizen,  deleteSeniorCitizen,  updateSeniorCitizen} from "../services/api";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiHeart,
  FiAlertCircle,
  FiArchive,
  FiPlus,
  FiDownload,
  FiMoreVertical,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";
import "./Records.css";
import { createPortal } from "react-dom";

/* ---------------------------------------------------------------- */
/* Mock data — swap for real API data                                */
/* ---------------------------------------------------------------- */

const PUROKS = ["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5"];
const STATUSES = ["Active", "Needs follow-up", "Needs attention", "Archived"];
const CONDITIONS = ["Hypertension", "Diabetes", "Arthritis", "Asthma", "None noted"];
const BLOOD_TYPES = ["O+", "A+", "B+", "AB+", "O-"];
const MEDICATIONS = ["Amlodipine", "Metformin", "Ibuprofen", "Salbutamol", "None"];
const GENDERS = ["Male", "Female"];
const NAMES = [
  "Lucia Morales", "Ana Cruz", "Ricardo Lim", "Elena Cruz", "Fernando Castillo",
  "Rosario Aquino", "Manuel Torres", "Corazon Villanueva", "Antonio Mendoza",
  "Remedios Flores", "Eduardo Santos", "Consuelo Reyes", "Alfredo Garcia",
  "Milagros Dela Cruz", "Benjamin Santos", "Soledad Reyes", "Rogelio Perez",
  "Josefina Ramos", "Domingo Cruz", "Aurora Fernandez", "Salvador Diaz",
  "Victoria Marquez", "Teresita Ocampo", "Herminia Salazar", "Bienvenido Rivera",
];

function generateExtra(count, startId) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const name = NAMES[i % NAMES.length];
    const status = STATUSES[(i + 2) % STATUSES.length];
    list.push({
      id: startId + i,
      seniorId: `SC-2026-${String(startId + i).padStart(4, "0")}`,
      name: `${name}`,
      age: 60 + ((i * 3) % 30),
      gender: GENDERS[i % 2],
      purok: PUROKS[i % PUROKS.length],
      contact: `09${10 + (i % 9)} ${String(200 + i * 3).slice(-3)} ${String(4000 + i * 17).slice(-4)}`,
      status,
      lastUpdated: new Date(2026, 4, 20 - (i % 15), 9 + (i % 8), (i * 7) % 60),
      subNote: i % 4 === 0 ? "Updated today" : `Jul ${((i * 3) % 27) + 1}, 2026`,
      medical: {
        bloodType: BLOOD_TYPES[i % BLOOD_TYPES.length],
        condition: CONDITIONS[i % CONDITIONS.length],
        maintenance: MEDICATIONS[i % MEDICATIONS.length],
        lastCheckup: `May ${((i * 2) % 27) + 1}, 2026`,
      },
      other: {
        civilStatus: i % 3 === 0 ? "Widowed" : i % 3 === 1 ? "Married" : "Single",
        emergencyContact: NAMES[(i + 5) % NAMES.length],
        relationship: i % 2 === 0 ? "Child" : "Spouse",
        oscaId: i % 6 === 0 ? "Inactive" : "Active",
      },
    });
  }
  return list;
}

const BASE_RECORDS = [
  {
    id: 1, seniorId: "SC-2026-0001", name: "Maria Santos", age: 84, gender: "Female",
    purok: "Purok 1", contact: "0917 111 2222", status: "Needs attention",
    lastUpdated: new Date(2026, 4, 25, 10, 45), subNote: "Updated today",
    medical: { bloodType: "A+", condition: "Arthritis", maintenance: "Ibuprofen", lastCheckup: "May 20, 2026" },
    other: { civilStatus: "Widowed", emergencyContact: "Juan Santos", relationship: "Son", oscaId: "Active" },
  },
  {
    id: 2, seniorId: "SC-2026-0002", name: "Juan Dela Cruz", age: 72, gender: "Male",
    purok: "Purok 2", contact: "0917 123 4567", status: "Needs follow-up",
    lastUpdated: new Date(2026, 4, 25, 9, 30), subNote: "Jul 25, 2026",
    medical: { bloodType: "O+", condition: "Hypertension", maintenance: "Amlodipine", lastCheckup: "May 10, 2026" },
    other: { civilStatus: "Married", emergencyContact: "Maria Dela Cruz", relationship: "Wife", oscaId: "Active" },
  },
  {
    id: 3, seniorId: "SC-2026-0003", name: "Pedro Reyes", age: 74, gender: "Male",
    purok: "Purok 3", contact: "0920 345 6789", status: "Active",
    lastUpdated: new Date(2026, 4, 24, 16, 15), subNote: "Jul 24, 2026",
    medical: { bloodType: "B+", condition: "None noted", maintenance: "None", lastCheckup: "May 12, 2026" },
    other: { civilStatus: "Married", emergencyContact: "Elena Reyes", relationship: "Wife", oscaId: "Active" },
  },
  {
    id: 4, seniorId: "SC-2026-0004", name: "Andrea Gonzales", age: 81, gender: "Female",
    purok: "Purok 1", contact: "0916 456 7890", status: "Needs follow-up",
    lastUpdated: new Date(2026, 4, 24, 11, 20), subNote: "Jul 24, 2026",
    medical: { bloodType: "AB+", condition: "Diabetes", maintenance: "Metformin", lastCheckup: "May 8, 2026" },
    other: { civilStatus: "Widowed", emergencyContact: "Carlos Gonzales", relationship: "Son", oscaId: "Active" },
  },
  {
    id: 5, seniorId: "SC-2026-0005", name: "Ramon Bautista", age: 66, gender: "Male",
    purok: "Purok 4", contact: "0915 567 8901", status: "Active",
    lastUpdated: new Date(2026, 4, 24, 14, 5), subNote: "Jul 24, 2026",
    medical: { bloodType: "O-", condition: "Asthma", maintenance: "Salbutamol", lastCheckup: "May 15, 2026" },
    other: { civilStatus: "Single", emergencyContact: "Liza Bautista", relationship: "Sister", oscaId: "Active" },
  },
  ...generateExtra(243, 6),
];

const PAGE_SIZE = 5;

/* ---------------------------------------------------------------- */
/* Helpers                                                            */
/* ---------------------------------------------------------------- */

function initials(name) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_TONES = ["tone-1", "tone-2", "tone-3", "tone-4", "tone-5"];
function avatarTone(id) {
  return AVATAR_TONES[id % AVATAR_TONES.length];
}

const STATUS_DOT = {
  Active: "dot-green",
  "Needs follow-up": "dot-amber",
  "Needs attention": "dot-red",
  Archived: "dot-gray",
};

const STATUS_BADGE = {
  Active: "badge-green",
  "Needs follow-up": "badge-amber",
  "Needs attention": "badge-red",
  Archived: "badge-gray",
  Inactive: "badge-amber",
  Deceased: "badge-gray",
};
function formatDateTime(d) {
  const date = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return { date, time };
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

function downloadCSV(filename, rows) {
  const header = ["Senior ID", "Name", "Age", "Gender", "Purok", "Contact", "Status", "Last Updated"];
  const csvRows = rows.map((r) => [
    r.seniorId, r.name, r.age, r.gender, r.purok, r.contact, r.status, formatDateTime(r.lastUpdated).date,
  ]);
  const csv = [header, ...csvRows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------------- */
/* Add New Senior modal                                              */
/* ---------------------------------------------------------------- */

const EMPTY_FORM = {name: "",age: "",birthDate: "",gender: "Male",purok: PUROKS[0],contact: "",};

function AddSeniorModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.age) return;
    onSave(form);
  };

  return (
    <div className="records-page modal-overlay archive-overlay">
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Senior</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={submit} className="modal-form">
          <label className="field-label">Full Name</label>
          <input className="field-input" type="text" value={form.name} onChange={update("name")} required />

            <label className="field-label">Birth Date</label>
<input
  className="field-input"
  type="date"
  value={form.birthDate}
  onChange={(event) => {
    const birthDate = event.target.value;
    let age = "";

    if (birthDate) {
      const [year, month, day] = birthDate.split("-").map(Number);
      const today = new Date();

      age = today.getFullYear() - year;

      if (
        today.getMonth() + 1 < month ||
        (today.getMonth() + 1 === month && today.getDate() < day)
      ) {
        age -= 1;
      }
    }

    setForm((previous) => ({
      ...previous,
      birthDate,
      age,
    }));
  }}
  required
/>

<div className="field-row">
  <div>
    <label className="field-label">Age</label>
    <input
      className="field-input"
      type="number"
      value={form.age}
      readOnly
      placeholder="Calculated from birth date"
    />
  </div>
            <div>
              <label className="field-label">Gender</label>
              <select className="field-input" value={form.gender} onChange={update("gender")}>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-row">
            <div>
              <label className="field-label">Purok</label>
              <select className="field-input" value={form.purok} onChange={update("purok")}>
                {PUROKS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Contact Number</label>
              <input className="field-input" type="text" placeholder="09XX XXX XXXX" value={form.contact} onChange={update("contact")} />
            </div>
          </div>
<h4>Medical Information</h4>

<div className="field-row">
  <div>
    <label className="field-label">Blood Type</label>
    <input
      className="field-input"
      type="text"
      value={form.bloodType ?? ""}
      onChange={update("bloodType")}
    />
  </div>
  <div>
    <label className="field-label">Condition</label>
    <input
      className="field-input"
      type="text"
      value={form.condition ?? ""}
      onChange={update("condition")}
    />
  </div>
</div>

<div className="field-row">
  <div>
    <label className="field-label">Maintenance</label>
    <input
      className="field-input"
      type="text"
      value={form.maintenance ?? ""}
      onChange={update("maintenance")}
    />
  </div>
</div>

<h4>Other Information</h4>

<div className="field-row">
  <div>
    <label className="field-label">Civil Status</label>
   <select
  className="field-input"
  value={form.civilStatus ?? ""}
  onChange={update("civilStatus")}
>
  <option value="">Select civil status</option>
  <option value="Single">Single</option>
  <option value="Married">Married</option>
  <option value="Widowed">Widowed</option>
  <option value="Separated">Separated</option>
  <option value="Divorced">Divorced</option>
</select>
  </div>
  <div>
    <label className="field-label">OSCA ID Status</label>
    <select
      className="field-input"
      value={form.oscaId ?? "Active"}
      onChange={update("oscaId")}
    >
      <option value="Active">Active</option>
      <option value="Inactive">Inactive</option>
    </select>
  </div>
</div>

<label className="field-label">Emergency Contact</label>
<input
  className="field-input"
  type="text"
  value={form.emergencyContact ?? ""}
  onChange={update("emergencyContact")}
/>

<label className="field-label"> Emergency Contact’s Relationship to Senior</label>
<input
  className="field-input"
  type="text"
  value={form.relationship ?? ""}
  onChange={update("relationship")}
/>
          <div className="modal-actions">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Add Senior</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Side panel                                                         */
/* ---------------------------------------------------------------- */
function EditSeniorModal({ record, onClose, onSave }) {
  const [form, setForm] = useState({
    name: record.name || "",
    age: record.age || "",
    birthDate: record.birthDate || "",
    gender: record.gender || "Male",
    purok: record.purok || PUROKS[0],
    contact: record.contact || "",

    bloodType: record.medical?.bloodType || "",
    condition: record.medical?.condition || "",
    maintenance: record.medical?.maintenance || "",
    lastCheckup:
      record.medical?.lastCheckup &&
      record.medical.lastCheckup !== "-"
        ? String(record.medical.lastCheckup).slice(0, 10)
        : "",

    civilStatus: record.other?.civilStatus || "",
    emergencyContact: record.other?.emergencyContact || "",
    relationship: record.other?.relationship || "",
    oscaId: record.other?.oscaId || "Active",
  });

  const update = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSave(record.id, form);
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal-card"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="modal-header">
          <h3>Edit Senior Record</h3>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>

      <form
  className="modal-form"
  onSubmit={(event) => {
    if (
      !form.birthDate ||
      form.age === "" ||
      !Number.isFinite(Number(form.age)) ||
      Number(form.age) < 60
    ) {
      event.preventDefault();
      alert("Please select a valid birth date. Senior citizens must be at least 60 years old.");
      return;
    }

    submit(event);
  }}
>
          <label className="field-label">Full Name</label>
          <input
            className="field-input"
            type="text"
            value={form.name}
            onChange={update("name")}
            required
          />

          <label className="field-label">Birth Date</label>
              <input className="field-input" type="date" value={form.birthDate} onChange={update("birthDate")}/>

          <div className="field-row">
            <div>
              <label className="field-label">Age</label>
              <input
                className="field-input"
                type="number"
                min="60"
                value={form.age}
                onChange={update("age")}
                required
              />
            </div>

            <div>
              <label className="field-label">Gender</label>
              <select
                className="field-input"
                value={form.gender}
                onChange={update("gender")}
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-row">
            <div>
              <label className="field-label">Purok</label>
              <select
                className="field-input"
                value={form.purok}
                onChange={update("purok")}
              >
                {PUROKS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Contact Number</label>
              <input
                className="field-input"
                type="text"
                value={form.contact}
                onChange={update("contact")}
              />
            </div>
          </div>

          <h4>Medical Information</h4>

          <div className="field-row">
            <div>
              <label className="field-label">Blood Type</label>
              <input
                className="field-input"
                type="text"
                value={form.bloodType}
                onChange={update("bloodType")}
              />
            </div>

            <div>
              <label className="field-label">Condition</label>
              <input
                className="field-input"
                type="text"
                value={form.condition}
                onChange={update("condition")}
              />
            </div>
          </div>

          <div className="field-row">
            <div>
              <label className="field-label">Maintenance</label>
              <input
                className="field-input"
                type="text"
                value={form.maintenance}
                onChange={update("maintenance")}
              />
            </div>

         
          </div>

          <h4>Other Information</h4>

          <div className="field-row">
            <div>
              <label className="field-label">Civil Status</label>
             <select
  className="field-input"
  value={form.civilStatus ?? ""}
  onChange={update("civilStatus")}
>
  <option value="">Select civil status</option>
  <option value="Single">Single</option>
  <option value="Married">Married</option>
  <option value="Widowed">Widowed</option>
  <option value="Separated">Separated</option>
  <option value="Divorced">Divorced</option>
</select>
            </div>

            <div>
              <label className="field-label">OSCA ID Status</label>
              <select
                className="field-input"
                value={form.oscaId}
                onChange={update("oscaId")}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <label className="field-label">Emergency Contact</label>
          <input
            className="field-input"
            type="text"
            value={form.emergencyContact}
            onChange={update("emergencyContact")}
          />

          <label className="field-label"> Emergency Contact’s Relationship to Senior</label>
          <input
            className="field-input"
            type="text"
            value={form.relationship}
            onChange={update("relationship")}
          />

          <div className="modal-actions">
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
            >
              Cancel
            </button>

            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecordPanel({ record, onClose }) {
  if (!record) return null;
  return (
    <aside className="record-panel">
      <button type="button" className="panel-close" onClick={onClose} aria-label="Close">
        <FiX />
      </button>

      <div className="panel-profile">
        <span className={`panel-avatar ${avatarTone(record.id)}`}>{initials(record.name)}</span>
        <h3>{record.name}</h3>
        <span className="panel-id">{record.seniorId}</span>
      </div>

      <div className="info-section">
        <h4>Personal Information</h4>
        <div className="info-row"><span>Age</span><strong>{record.age}</strong></div>
        <div className="info-row">
        <span>Birth Date</span><strong>
        {record.birthDate  ? new Date(`${record.birthDate.slice(0, 10)}T00:00:00`) 
        .toLocaleDateString("en-US", {    month: "long", day: "numeric",  year: "numeric",  
        }): "Not provided"} </strong></div>
        <div className="info-row"><span>Gender</span><strong>{record.gender}</strong></div>
        <div className="info-row"><span>Purok</span><strong>{record.purok}</strong></div>
        <div className="info-row"><span>Contact</span><strong>{record.contact}</strong></div>
        <div className="info-row">
          <span>Status</span>
          <span className={`badge ${STATUS_BADGE[record.status]}`}>{record.status}</span>
        </div>
      </div>

      <div className="info-section">
        <h4>Medical Information</h4>
        <div className="info-row"><span>Blood Type</span><strong>{record.medical.bloodType}</strong></div>
        <div className="info-row"><span>Condition</span><strong>{record.medical.condition}</strong></div>
        <div className="info-row"><span>Maintenance</span><strong>{record.medical.maintenance}</strong></div>
       
      </div>

      <div className="info-section">
        <h4>Other Information</h4>
        <div className="info-row"><span>Civil Status</span><strong>{record.other.civilStatus}</strong></div>
        <div className="info-row"><span>Emergency Contact</span><strong>{record.other.emergencyContact}</strong></div>
        <div className="info-row"><span>Relationship</span><strong>{record.other.relationship}</strong></div>
        <div className="info-row">
          <span>OSCA ID</span>
          <span className={`badge ${record.other.oscaId === "Active" ? "badge-green" : "badge-gray"}`}>
            {record.other.oscaId}
          </span>
        </div>
      </div>

      <button type="button" className="btn-view-full" onClick={() => window.print()}>
        <FiCheckCircle /> View Full Record
      </button>
    </aside>
  );
}

/* ---------------------------------------------------------------- */
/* Main component                                                     */
/* ---------------------------------------------------------------- */

export default function Records() {
 
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [kebabOpenId, setKebabOpenId] = useState(null);
  const [archiveRecord, setArchiveRecord] = useState(null);
  const [kebabPosition, setKebabPosition] = useState({
  top: 0,
  left: 0,
});
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const filterRef = useOutsideClose(() => setFilterOpen(false));
  const kebabRef = useOutsideClose(() => setKebabOpenId(null));

  useEffect(() => {
  getSeniorCitizens()
    .then((data) => {
      console.log("Laravel senior citizens:", data);

      const formattedRecords = data.map((r) => ({
        id: r.id,
        seniorId: r.senior_id,
         name: r.name,
         age: r.age,
        birthDate: r.birth_date? String(r.birth_date).slice(0, 10): "",
        gender: r.gender,
        purok: r.purok,
        contact: r.contact || "",
        status: r.status,
        lastUpdated: new Date(r.updated_at),
        subNote: "Updated from database",

        medical: {
          bloodType: r.blood_type || "-",
          condition: r.condition || "None noted",
          maintenance: r.maintenance || "None",
          lastCheckup: r.last_checkup || "-",
        },

        other: {
          civilStatus: r.civil_status || "-",
          emergencyContact: r.emergency_contact || "-",
          relationship: r.relationship || "-",
          oscaId: r.osca_id || "Active",
        },
      }));

      console.log("Formatted records:", formattedRecords);

      setRecords(formattedRecords);
    })
    .catch((error) => {
      console.error("Failed to load senior citizens:", error);
    });
}, []);

useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, statusFilter]);


  const stats = useMemo(
    () => ({
      total: records.length,
      healthAlert: records.filter((r) => r.status === "Needs follow-up").length,
      needsAttention: records.filter((r) => r.status === "Needs attention").length,
      archived: records.filter((r) => r.status === "Archived").length,
    }),
    [records]
  );

const tabCounts = useMemo(() => {
  const counts = { All: records.length };

  STATUSES.forEach((status) => {
    counts[status] = records.filter((record) =>
      status === "Archived"
        ? ["Archived", "Inactive", "Deceased"].includes(record.status)
        : record.status === status
    ).length;
  });
console.table(
  records.map((record) => ({
    id: record.id,
    status: JSON.stringify(record.status),
  }))
);

  return counts;
}, [records]);

  const activeTab = statusFilter.length === 1 ? statusFilter[0] : "All";

  const selectTab = (key) => {
    setStatusFilter(key === "All" ? [] : [key]);
  };

  const filtered = useMemo(() => {
  let list = records;

  if (statusFilter.length > 0) {
    list = list.filter((r) =>
      statusFilter.includes(r.status) ||
      (
        statusFilter.includes("Archived") &&
        ["Inactive", "Deceased"].includes(r.status)
      )
    );
  }

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();

    list = list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.seniorId.toLowerCase().includes(q)
    );
  }

  return list;
}, [records, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedRecord = records.find((r) => r.id === selectedId) || null;

  const toggleStatusFilter = (s) => {
    setStatusFilter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

 const toggleArchive = async (id) => {
  const record = records.find((r) => r.id === id);
  if (!record) return;

  setKebabOpenId(null);

  const isArchived = ["Archived", "Inactive", "Deceased"].includes(
    record.status
  );

  if (!isArchived) {
    setArchiveRecord(record);
    return;
  }

  try {
    const updated = await updateSeniorCitizen(id, {
      status: "Active",
    });

    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: updated.status,
              lastUpdated: new Date(updated.updated_at),
            }
          : r
      )
    );
  } catch (error) {
    console.error("Failed to restore senior:", error);
    alert("Unable to restore senior citizen.");
  }
};

const saveArchiveStatus = async (status) => {
  if (!archiveRecord) return;

  try {
    const updated = await updateSeniorCitizen(archiveRecord.id, {
      status,
    });

    setRecords((prev) =>
      prev.map((r) =>
        r.id === archiveRecord.id
          ? {
              ...r,
              status: updated.status,
              lastUpdated: new Date(updated.updated_at),
            }
          : r
      )
    );

    setArchiveRecord(null);
  } catch (error) {
    console.error("Failed to archive senior:", error);
    alert("Unable to archive senior citizen.");
  }
};

  const deleteRecord = async (id) => {
  if (!window.confirm("Delete this senior record? This cannot be undone.")) {
    setKebabOpenId(null);
    return;
  }

  try {
    await deleteSeniorCitizen(id);

    setRecords((prev) => prev.filter((r) => r.id !== id));

    if (selectedId === id) {
      setSelectedId(null);
    }
  } catch (error) {
    console.error("Failed to delete senior:", error);
    alert("Unable to delete senior citizen.");
  }

  setKebabOpenId(null);
};

 const handleAddSenior = async (form) => {
  try {
    const created = await createSeniorCitizen({
      name: form.name,
      age: Number(form.age),
      birth_date: form.birthDate || null,
      gender: form.gender,
      purok: form.purok,
      contact: form.contact,

      blood_type: form.bloodType || null,
      condition: form.condition || null,
      maintenance: form.maintenance || null,
      

      civil_status: form.civilStatus || null,
      emergency_contact: form.emergencyContact || null,
      relationship: form.relationship || null,
      osca_id: form.oscaId || "Active",
    });
    
    const newRecord = {
      id: created.id,
      seniorId: created.senior_id,
      name: created.name,
      age: created.age,
      birthDate: created.birth_date
  ? String(created.birth_date).slice(0, 10)
  : "",
      gender: created.gender,
      purok: created.purok,
      contact: created.contact || "",
      status: created.status,
      lastUpdated: new Date(created.updated_at),
      subNote: "Updated from database",

      medical: {
        bloodType: created.blood_type || "-",
        condition: created.condition || "None noted",
        maintenance: created.maintenance || "None",
        lastCheckup: created.last_checkup || "-",
      },

      other: {
        civilStatus: created.civil_status || "-",
        emergencyContact: created.emergency_contact || "-",
        relationship: created.relationship || "-",
        oscaId: created.osca_id || "Active",
      },
    };

    setRecords((prev) => [newRecord, ...prev]);
    setAddModalOpen(false);
  } catch (error) {
    console.error("Failed to add senior:", error);
    alert("Unable to add senior citizen.");
  }
};

const handleEditSenior = async (id, form) => {
  try {
    const updated = await updateSeniorCitizen(id, {
      name: form.name,
      age: Number(form.age),
      birth_date: form.birthDate || null,
      gender: form.gender,
      purok: form.purok,
      contact: form.contact,

      blood_type: form.bloodType || null,
      condition: form.condition || null,
      maintenance: form.maintenance || null,
      last_checkup: form.lastCheckup || null,

      civil_status: form.civilStatus || null,
      emergency_contact: form.emergencyContact || null,
      relationship: form.relationship || null,
      osca_id: form.oscaId,
    });

    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              name: updated.name,
              age: updated.age,
              birthDate: updated.birth_date? String(updated.birth_date).slice(0, 10): "",
              gender: updated.gender,
              purok: updated.purok,
              contact: updated.contact || "",
              status: updated.status,
              lastUpdated: new Date(updated.updated_at),

              medical: {
                bloodType: updated.blood_type || "-",
                condition: updated.condition || "None noted",
                maintenance: updated.maintenance || "None",
                lastCheckup: updated.last_checkup || "-",
              },

              other: {
                civilStatus: updated.civil_status || "-",
                emergencyContact: updated.emergency_contact || "-",
                relationship: updated.relationship || "-",
                oscaId: updated.osca_id || "Active",
              },
            }
          : r
      )
    );

    setEditingRecord(null);
  } catch (error) {
    console.error("Failed to edit senior:", error);
    alert("Unable to update senior citizen.");
  }
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
    <div className={`records-page${selectedRecord ? " with-panel" : ""}`}>
      <div className="records-main">
        <div className="records-heading">
          <div>
            <h1>Records</h1>
            <p>View, manage and organize all senior citizen records.</p>
          </div>

          <div className="heading-controls">
            <button type="button" className="btn-outline" onClick={() => downloadCSV("senior-records.csv", filtered)}>
              <FiDownload /> Export
            </button>
            <button type="button" className="btn-primary" onClick={() => setAddModalOpen(true)}>
              <FiPlus /> Add New Record
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="records-stats">
          <div className="stat-card">
            <span className="stat-icon tone-green"><FiUsers /></span>
            <div className="stat-body">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Seniors</span>
              <span className="stat-sublabel">All registered</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon tone-amber"><FiHeart /></span>
            <div className="stat-body">
              <span className="stat-value">{stats.healthAlert}</span>
              <span className="stat-label">Health Alert</span>
              <span className="stat-sublabel">Needs follow-up</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon tone-red"><FiAlertCircle /></span>
            <div className="stat-body">
              <span className="stat-value">{stats.needsAttention}</span>
              <span className="stat-label">Needs Attention</span>
              <span className="stat-sublabel">High Priority</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon tone-blue"><FiArchive /></span>
            <div className="stat-body">
           <span className="stat-value">{tabCounts.Archived ?? 0}</span>
              <span className="stat-label">Archived</span>
              <span className="stat-sublabel">Inactive / Deceased</span>
            </div>
          </div>
        </div>

        {/* Search + filter */}
        <div className="search-filter-row">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-wrap" ref={filterRef}>
            <button type="button" className="btn-outline" onClick={() => setFilterOpen((o) => !o)}>
              <FiFilter /> Filter
              <FiChevronDown className={`chevron${filterOpen ? " open" : ""}`} />
            </button>
            {filterOpen && (
              <div className="dropdown-menu filter-menu">
                <span className="dropdown-heading">Status</span>
                {STATUSES.map((s) => (
                  <label className="checkbox-option" key={s}>
                    <input type="checkbox" checked={statusFilter.includes(s)} onChange={() => toggleStatusFilter(s)} />
                    {s}
                  </label>
                ))}
                {statusFilter.length > 0 && (
                  <button type="button" className="dropdown-clear" onClick={() => setStatusFilter([])}>
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status tabs */}
        <div className="records-tabs">
          <div className="tabs-list">
            {["All", ...STATUSES].map((key) => (
              <button
                type="button"
                key={key}
                className={`tab-item${activeTab === key ? " active" : ""}`}
                onClick={() => selectTab(key)}
              >
                {key} <span className="tab-count">({tabCounts[key] ?? 0})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="records-table-card">
          <div className="table-scroll">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Purok</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => {
                  const { date, time } = formatDateTime(r.lastUpdated);
                  return (
                    <tr key={r.id} className={selectedId === r.id ? "row-selected" : ""}>
                      <td>
                        <div className="name-cell">
                          <span className={`status-dot ${STATUS_DOT[r.status]}`} />
                          <span className={`row-avatar ${avatarTone(r.id)}`}>{initials(r.name)}</span>
                          <div>
                            <span className="row-name">{r.name}</span>
                            <span className="row-id">{r.seniorId}</span>
                            <span className="row-subnote">{r.subNote}</span>
                          </div>
                        </div>
                      </td>
                      <td>{r.age}</td>
                      <td>{r.purok}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status}</span>
                      </td>
                      <td>
                        <span className="row-date">{date}</span>
                        <span className="row-time">{time}</span>
                      </td>
                      <td>
                        <div className="action-cell">
                          <button type="button" className="btn-view" onClick={() => setSelectedId(r.id)}>
                            View
                          </button>
                          <div className="kebab-wrap" ref={kebabOpenId === r.id ? kebabRef : null}>
                           <button
                       type="button"
                    className="icon-btn"
                   onClick={(event) => {
                 const rect = event.currentTarget.getBoundingClientRect();

                       setKebabPosition({
                      top: rect.bottom + 6,
                  left: Math.max(8, Math.min(rect.right - 190, window.innerWidth - 198)),
                           });

                    setKebabOpenId((cur) => (cur === r.id ? null : r.id));
                     }}
                 aria-label="More actions"
                   aria-expanded={kebabOpenId === r.id}
                    >
                                <FiMoreVertical />
                            </button>
                           {kebabOpenId === r.id &&
                  createPortal(
                    <div className="records-page" style={{ display: "contents" }}>
                       <div
        className="dropdown-menu kebab-menu"
        style={{
          position: "fixed",
          top: Math.max(
            8,
            Math.min(kebabPosition.top, window.innerHeight - 248)
          ),
          left: kebabPosition.left,
          right: "auto",
          width: 190,
          maxHeight: "calc(100dvh - 16px)",
          overflowY: "auto",
          zIndex: 2000,
        }}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") setKebabOpenId(null);
        }}
      >
        <button
          type="button"
          className="dropdown-item"
          onClick={() => {
            setEditingRecord(r);
            setKebabOpenId(null);
          }}
        >
          Edit Record
        </button>

       <button
  type="button"
  className="dropdown-item"
  onClick={() => toggleArchive(r.id)}
>
  {["Archived", "Inactive", "Deceased"].includes(r.status)
    ? "Unarchive"
    : "Archive"}
</button>
       
      </div>
    </div>,
    document.body
  )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-row">No records match your search or filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="records-pagination">
            <span className="pagination-summary">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} records
            </span>
            <div className="pagination-controls">
              <button type="button" className="page-btn" disabled={page === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                <FiChevronLeft />
              </button>
              {pageNumbers.map((p, idx) =>
                p === "..." ? (
                  <span key={`dots-${idx}`} className="page-dots">...</span>
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
              <button type="button" className="page-btn" disabled={page === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>

      </div>

   {selectedRecord &&
  createPortal(
    <div className="records-page record-view-overlay">
      <RecordPanel
        record={selectedRecord}
        onClose={() => setSelectedId(null)}
      />
    </div>,
    document.body
  )}
  {archiveRecord && createPortal(
  <div
   className="records-page modal-overlay archive-overlay"
    onMouseDown={() => setArchiveRecord(null)}
  >
    <div
      className="modal-card"
      style={{ width: "100%", maxWidth: 420 }}
      onMouseDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-title"
    >
      <div className="modal-header">
        <h3 id="archive-title">Archive Record</h3>
        <button
          type="button"
          className="modal-close"
          onClick={() => setArchiveRecord(null)}
          aria-label="Close"
        >
          <FiX />
        </button>
      </div>

      <div className="modal-form">
        <p>Why are you archiving {archiveRecord.name}?</p>

        <button
          type="button"
          className="btn-outline"
          onClick={() => saveArchiveStatus("Inactive")}
        >
          Inactive — no longer living in the area
        </button>

        <button
          type="button"
          className="btn-outline"
          onClick={() => saveArchiveStatus("Deceased")}
        >
          Deceased — has passed away
        </button>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-outline"
            onClick={() => setArchiveRecord(null)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>,
  document.body
)}
      {addModalOpen && <AddSeniorModal onClose={() => setAddModalOpen(false)} onSave={handleAddSenior} />}
        {editingRecord && <EditSeniorModal record={editingRecord} onClose={() => setEditingRecord(null)} onSave={handleEditSenior}/>}
    </div>
  );
}

