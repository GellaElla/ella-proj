import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiClock,
  FiEdit2,
  FiEye,
  FiPlus,
  FiSearch,
  FiX,
} from "react-icons/fi";
import {
  getMedicalRequests,
  createMedicalRequest,
  updateMedicalRequest,
} from "../services/api";
import "./Medical.css";

// Frontend version: saves only in this browser. No Laravel endpoint is assumed.
// Replace readRecords / saveRequest with your API calls when the backend is ready.
const STORAGE_KEY = "scms_medical_requests_v1";
const PAGE_SIZE = 8;
const ASSISTANCE_TYPES = [
  "Medicine",
  "Consultation",
  "Laboratory",
  "Hospital assistance",
  "Other",
];
const STATUS_INFO = {
  Pending: { tone: "pending", description: "Waiting for review." },
  Approved: { tone: "approved", description: "Approved; assistance is not yet provided." },
  Completed: { tone: "completed", description: "Assistance has been provided." },
  "On Hold": { tone: "hold", description: "Waiting for documents or follow-up." },
};

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) &&
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` === value;
}

function formatDate(value) {
  return validDate(value)
    ? new Date(`${value}T12:00:00`).toLocaleDateString("en-PH", {
        month: "short", day: "numeric", year: "numeric",
      })
    : "Not recorded";
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function emptyForm() {
  return {
    seniorName: "", seniorId: "", purok: "", contact: "",
    assistanceType: "Medicine", requestDate: today(), facility: "",
    status: "Pending", completedDate: "", receivedBy: "", remarks: "",
  };
}

function readRecords() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  const records = JSON.parse(raw);
  const fields = Object.keys(emptyForm());
  if (!Array.isArray(records) || records.some((record) =>
    !record || typeof record.id !== "string" ||
    typeof record.reference !== "string" || typeof record.createdAt !== "string" ||
    fields.some((key) => typeof record[key] !== "string") ||
    !record.seniorName.trim() || !Object.hasOwn(STATUS_INFO, record.status) ||
    !ASSISTANCE_TYPES.includes(record.assistanceType) || !validDate(record.requestDate)
  )) {
    throw new Error("The saved medical records could not be read. Existing browser data has not been changed.");
  }
  return records;
}

function initialState() {
  try {
    return { records: readRecords(), error: "" };
  } catch (error) {
    return {
      records: [],
      error: error instanceof SyntaxError
        ? "The saved medical records could not be read. Existing browser data has not been changed."
        : error.message || "Allow browser storage, then reload this page to access your records.",
    };
  }
}

function nextReference(records) {
  const prefix = `MED-${new Date().getFullYear()}-`;
  const sequence = records.reduce((max, record) => {
    const number = record.reference.startsWith(prefix)
      ? Number(record.reference.slice(prefix.length)) : 0;
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0) + 1;
  return `${prefix}${String(sequence).padStart(4, "0")}`;
}

function StatusBadge({ status }) {
  return <span className={`med-status med-status--${STATUS_INFO[status].tone}`}>
    <span aria-hidden="true" />{status}
  </span>;
}

function Field({ name, label, required = false, error, wide = false, children }) {
  return <div className={`med-field${wide ? " med-field--wide" : ""}`}>
    <label htmlFor={`med-${name}`}>
      {label}{required ? <span className="med-required" aria-hidden="true"> *</span> : <span className="med-optional"> (optional)</span>}
    </label>
    {children}
    {error && <span id={`med-${name}-error`} className="med-field-error">{error}</span>}
  </div>;
}

function Detail({ label, children }) {
  return <div className="med-detail"><dt>{label}</dt><dd>{children || "Not recorded"}</dd></div>;
}

function Medical() {
 const [data, setData] = useState({
  records: [],
  error: "",
});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const { records, error } = data;

 useEffect(() => {
  let cancelled = false;

  getMedicalRequests()
    .then((records) => {
      if (!cancelled) {
        setData({
          records,
          error: "",
        });
      }
    })
    .catch((error) => {
      if (!cancelled) {
        setData({
          records: [],
          error: error.message || "Failed to load medical requests.",
        });
      }
    });

  return () => {
    cancelled = true;
  };
}, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) =>
      (!query || [record.seniorName, record.seniorId, record.reference, record.purok]
        .some((value) => value.toLowerCase().includes(query))) &&
      (status === "All" || record.status === status) &&
      (type === "All" || record.assistanceType === type)
    ).sort((a, b) => {
      const difference = a.requestDate.localeCompare(b.requestDate) || a.createdAt.localeCompare(b.createdAt);
      return sort === "oldest" ? difference : -difference;
    });
  }, [records, search, status, type, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const hasFilters = Boolean(search.trim() || status !== "All" || type !== "All");
  const stats = [
    { label: "Total requests", value: records.length, icon: FiClipboard, tone: "neutral" },
    { label: "Pending", value: records.filter((r) => r.status === "Pending").length, icon: FiClock, tone: "pending" },
    { label: "Approved", value: records.filter((r) => r.status === "Approved").length, icon: FiCheckCircle, tone: "approved" },
    { label: "Completed", value: records.filter((r) => r.status === "Completed").length, icon: FiCheck, tone: "completed" },
  ];

  function resetFilters() {
    setSearch(""); setStatus("All"); setType("All"); setPage(1);
  }

 async function saveRequest(form, existing) {
  try {
    const saved = existing
      ? await updateMedicalRequest(existing.id, form)
      : await createMedicalRequest(form);

    setData((current) => ({
      records: existing
        ? current.records.map((record) =>
            record.id === existing.id ? saved : record
          )
        : [saved, ...current.records],
      error: "",
    }));

    setModal(null);

    setNotice(
      `${saved.reference || saved.id} ${
        existing ? "updated" : "added"
      }. Saved to the database.`
    );

    if (!existing) {
      resetFilters();
      setSort("newest");
    }
  } catch (error) {
    setData((current) => ({
      ...current,
      error: error.message || "Failed to save medical request.",
    }));

    throw error;
  }
}

  return <section className="scms-medical" aria-labelledby="med-page-title">
    <header className="med-page-header">
      <div>
        <p className="med-eyebrow">Program Management</p>
        <h1 id="med-page-title">Medical Assistance</h1>
        <p className="med-subtitle">Manage requests and keep track of support for senior citizens.</p>
      </div>
      <button className="med-button med-button--primary" onClick={() => setModal({ mode: "add" })} disabled={Boolean(error)} type="button">
        <FiPlus aria-hidden="true" /> New request
      </button>
    </header>

    {error && <div className="med-message med-message--error" role="alert">
      <FiAlertCircle aria-hidden="true" /><span>{error}</span>
      <button className="med-text-button" type="button" onClick={() => setData(initialState())}>Try again</button>
    </div>}
    {notice && <div className="med-message med-message--success" role="status">
      <FiCheckCircle aria-hidden="true" /><span>{notice}</span>
      <button className="med-icon-button" type="button" aria-label="Dismiss notification" onClick={() => setNotice("")}><FiX aria-hidden="true" /></button>
    </div>}

    <div className="med-stats" aria-label="Medical assistance summary">
      {stats.map(({ label, value, icon: Icon, tone }) => <div className="med-stat" key={label}>
        <span className={`med-stat-icon med-stat-icon--${tone}`}><Icon aria-hidden="true" /></span>
        <div><span className="med-stat-label">{label}</span><strong className="med-stat-value">{error ? "—" : value}</strong></div>
      </div>)}
    </div>

    <section className="med-panel" aria-labelledby="med-list-title">
      <div className="med-panel-heading">
        <div><h2 id="med-list-title">Assistance requests</h2><p>Review each request and update its progress.</p></div>
        <div className="med-sort">
          <label htmlFor="med-sort">Sort by</label>
          <select id="med-sort" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
            <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>
      <div className="med-toolbar">
        <div className="med-search-group">
          <label htmlFor="med-search">Search records</label>
          <div className="med-search-box">
            <FiSearch aria-hidden="true" />
            <input id="med-search" type="search" placeholder="Search name, senior ID or reference…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          </div>
        </div>
        <div className="med-filter">
          <label htmlFor="med-status-filter">Status</label>
          <select id="med-status-filter" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="All">All statuses</option>{Object.keys(STATUS_INFO).map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div className="med-filter">
          <label htmlFor="med-type-filter">Assistance</label>
          <select id="med-type-filter" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}>
            <option value="All">All types</option>{ASSISTANCE_TYPES.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        {hasFilters && <button className="med-text-button med-reset" type="button" onClick={resetFilters}>Clear filters</button>}
      </div>

      {error ? <div className="med-empty"><FiAlertCircle aria-hidden="true" /><h3>Records are unavailable</h3><p>Resolve the storage message above to view your saved requests.</p></div>
      : filtered.length === 0 ? <div className="med-empty">
        <span className="med-empty-icon">{hasFilters ? <FiSearch aria-hidden="true" /> : <FiActivity aria-hidden="true" />}</span>
        <h3>{hasFilters ? "No matching requests" : "No medical requests yet"}</h3>
        <p>{hasFilters ? "Try another name or adjust the filters." : "Add the first request to start tracking medical assistance."}</p>
        <button className="med-button med-button--secondary" type="button" onClick={hasFilters ? resetFilters : () => setModal({ mode: "add" })}>
          {hasFilters ? "Clear filters" : <><FiPlus aria-hidden="true" /> Add first request</>}
        </button>
      </div>
      : <div className="med-table-wrap">
        <table className="med-table">
          <caption className="med-sr-only">Medical assistance requests. Use View or Edit to open a record.</caption>
          <thead><tr><th scope="col">Senior citizen</th><th scope="col">Assistance</th><th scope="col">Date requested</th><th scope="col">Status</th><th scope="col" className="med-actions-heading">Actions</th></tr></thead>
          <tbody>{visible.map((record) => <tr key={record.id}>
            <td className="med-person-cell"><div className="med-person">
              <span className="med-avatar" aria-hidden="true">{initials(record.seniorName)}</span>
              <div><strong>{record.seniorName}</strong><span>{record.seniorId || "No senior ID"} · {record.reference}</span></div>
            </div></td>
            <td data-label="Assistance"><div className="med-cell-stack"><span>{record.assistanceType}</span><small>{record.facility || "Facility not recorded"}</small></div></td>
            <td data-label="Requested"><span className="med-date">{formatDate(record.requestDate)}</span></td>
            <td data-label="Status"><StatusBadge status={record.status} /></td>
            <td className="med-actions-cell"><div className="med-row-actions">
              <button className="med-row-button" type="button" aria-label={`View request ${record.reference} for ${record.seniorName}`} onClick={() => setModal({ mode: "view", record })}><FiEye aria-hidden="true" /> View</button>
              <button className="med-row-button" type="button" aria-label={`Edit request ${record.reference} for ${record.seniorName}`} onClick={() => setModal({ mode: "edit", record })}><FiEdit2 aria-hidden="true" /> Edit</button>
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>}

      <footer className="med-table-footer">
        <p aria-live="polite">{error ? "Records unavailable" : filtered.length ? `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length} requests` : "0 requests"}</p>
        {totalPages > 1 && <nav className="med-pagination" aria-label="Medical request pages">
          <button className="med-icon-button" type="button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><FiChevronLeft aria-hidden="true" /></button>
          <span>Page {currentPage} of {totalPages}</span>
          <button className="med-icon-button" type="button" aria-label="Next page" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}><FiChevronRight aria-hidden="true" /></button>
        </nav>}
      </footer>
    </section>
   
    {modal && <MedicalDialog key={`${modal.mode}-${modal.record?.id || "new"}`} mode={modal.mode} record={modal.record}
      onClose={() => setModal(null)} onSave={saveRequest} onEdit={() => setModal({ mode: "edit", record: modal.record })} />}
  </section>;
}

function MedicalDialog({ mode, record, onClose, onSave, onEdit }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState(() => ({ ...emptyForm(), ...record }));
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState("");
  const viewing = mode === "view";

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const containers = [document.body];
    let parent = dialog.parentElement;
    while (parent && parent !== document.body) {
      if (parent.scrollHeight > parent.clientHeight) containers.push(parent);
      parent = parent.parentElement;
    }
    const overflow = containers.map((node) => node.style.overflow);
    containers.forEach((node) => { node.style.overflow = "hidden"; });
    dialog.showModal();
    dialog.querySelector("[data-initial-focus]")?.focus();
    return () => {
      dialog.close();
      containers.forEach((node, index) => { node.style.overflow = overflow[index]; });
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  function inputProps(name) {
    return {
      id: `med-${name}`, name, value: form[name],
      "aria-invalid": Boolean(errors[name]),
      "aria-describedby": errors[name] ? `med-${name}-error` : undefined,
      onChange: (event) => {
        const value = event.target.value;
        setForm((previous) => ({ ...previous, [name]: value }));
        setErrors((previous) => ({ ...previous, [name]: "" }));
        setSaveError("");
      },
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const cleaned = Object.fromEntries(Object.keys(emptyForm()).map((key) => [key, form[key].trim()]));
    const nextErrors = {};
    if (!cleaned.seniorName) nextErrors.seniorName = "Enter the senior citizen’s full name.";
    if (cleaned.contact && (!/^[+\d\s()-]+$/.test(cleaned.contact) || !/^\d{7,15}$/.test(cleaned.contact.replace(/\D/g, "")))) nextErrors.contact = "Enter a valid contact number with 7–15 digits.";
    if (!ASSISTANCE_TYPES.includes(cleaned.assistanceType)) nextErrors.assistanceType = "Choose an assistance type.";
    if (!Object.hasOwn(STATUS_INFO, cleaned.status)) nextErrors.status = "Choose a status.";
    if (!validDate(cleaned.requestDate) || cleaned.requestDate > today()) nextErrors.requestDate = "Choose a valid request date that is today or earlier.";
    if (cleaned.status === "Completed") {
      if (!validDate(cleaned.completedDate) || cleaned.completedDate > today() || cleaned.completedDate < cleaned.requestDate) nextErrors.completedDate = "Choose a completion date from the request date through today.";
    } else {
      cleaned.completedDate = "";
      cleaned.receivedBy = "";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      dialogRef.current.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }
await onSave(cleaned, record);
   
  }

  return <dialog ref={dialogRef} className="scms-medical-dialog" aria-labelledby="med-dialog-title" aria-describedby="med-dialog-subtitle" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="med-dialog-frame">
      <header className="med-dialog-header">
        <div><h2 id="med-dialog-title" tabIndex={viewing ? -1 : undefined} data-initial-focus={viewing ? true : undefined}>{viewing ? "Request details" : mode === "edit" ? "Edit medical request" : "New medical request"}</h2>
          <p id="med-dialog-subtitle">{viewing ? record.reference : "Fields marked with * are required."}</p></div>
        <button type="button" className="med-icon-button" aria-label="Close dialog" onClick={onClose}><FiX aria-hidden="true" /></button>
      </header>
      {viewing ? <>
        <div className="med-dialog-body">
          <div className="med-profile"><span className="med-avatar med-avatar--large" aria-hidden="true">{initials(record.seniorName)}</span><div><h3>{record.seniorName}</h3><p>{record.seniorId || "Senior ID not recorded"}</p></div><StatusBadge status={record.status} /></div>
          <h3 className="med-section-title">Senior citizen</h3>
          <dl className="med-details"><Detail label="Purok / area">{record.purok}</Detail><Detail label="Contact number">{record.contact}</Detail></dl>
          <h3 className="med-section-title">Assistance details</h3>
          <dl className="med-details">
            <Detail label="Assistance type">{record.assistanceType}</Detail><Detail label="Date requested">{formatDate(record.requestDate)}</Detail>
            <Detail label="Hospital / facility">{record.facility}</Detail><Detail label="Status">{record.status}</Detail>
            {record.status === "Completed" && <><Detail label="Date completed">{formatDate(record.completedDate)}</Detail><Detail label="Received by">{record.receivedBy}</Detail></>}
          </dl>
          <h3 className="med-section-title">Remarks</h3><p className="med-remarks">{record.remarks || "No remarks added."}</p>
        </div>
        <footer className="med-dialog-footer"><button className="med-button med-button--secondary" type="button" onClick={onClose}>Close</button><button className="med-button med-button--primary" type="button" onClick={onEdit}><FiEdit2 aria-hidden="true" /> Edit request</button></footer>
      </> : <form className="modal-form" onSubmit={handleSubmit}>
        <div className="med-dialog-body">
          {saveError && <div className="med-message med-message--error" role="alert"><FiAlertCircle aria-hidden="true" /><span>{saveError}</span></div>}
          <fieldset className="med-fieldset"><legend>Senior citizen</legend><div className="med-form-grid">
            <Field name="seniorName" label="Full name" required error={errors.seniorName}><input {...inputProps("seniorName")} data-initial-focus required maxLength={100} autoComplete="off" placeholder="Enter full name" /></Field>
            <Field name="seniorId" label="Senior ID"><input {...inputProps("seniorId")} maxLength={40} placeholder="Enter senior ID" /></Field>
            <Field name="purok" label="Purok / area"><input {...inputProps("purok")} maxLength={80} placeholder="Enter purok or area" /></Field>
            <Field name="contact" label="Contact number" error={errors.contact}><input {...inputProps("contact")} type="tel" maxLength={24} autoComplete="off" placeholder="09XX XXX XXXX" /></Field>
          </div></fieldset>
          <fieldset className="med-fieldset"><legend>Assistance details</legend><div className="med-form-grid">
            <Field name="assistanceType" label="Assistance type" required error={errors.assistanceType}><select {...inputProps("assistanceType")} required>{ASSISTANCE_TYPES.map((value) => <option key={value}>{value}</option>)}</select></Field>
            <Field name="requestDate" label="Date requested" required error={errors.requestDate}><input {...inputProps("requestDate")} type="date" required max={today()} /></Field>
            <Field name="facility" label="Hospital / facility"><input {...inputProps("facility")} maxLength={120} placeholder="Enter hospital, clinic or provider" /></Field>
            <Field name="status" label="Status" required error={errors.status}><select {...inputProps("status")} required>{Object.keys(STATUS_INFO).map((value) => <option key={value}>{value}</option>)}</select><span className="med-field-hint">{STATUS_INFO[form.status].description}</span></Field>
            {form.status === "Completed" && <>
              <Field name="completedDate" label="Date completed" required error={errors.completedDate}><input {...inputProps("completedDate")} type="date" required min={form.requestDate} max={today()} /></Field>
              <Field name="receivedBy" label="Received by"><input {...inputProps("receivedBy")} maxLength={100} placeholder="Senior citizen or representative" /></Field>
            </>}
            <Field name="remarks" label="Remarks" wide><textarea {...inputProps("remarks")} rows={3} maxLength={1000} placeholder="Add request details or a follow-up note…" /></Field>
          </div></fieldset>
        </div>
        <footer className="med-dialog-footer"><button className="med-button med-button--secondary" type="button" onClick={onClose}>Cancel</button><button className="med-button med-button--primary" type="submit"><FiCheck aria-hidden="true" />{mode === "edit" ? "Save changes" : "Save request"}</button></footer>
      </form>}
    </div>
  </dialog>;
}

export default Medical;
