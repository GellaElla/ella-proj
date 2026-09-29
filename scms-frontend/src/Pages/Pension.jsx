import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiSearch, FiEdit2, FiEye } from "react-icons/fi";
import "./Pension.css";

import {createPensionRelease, getPensionReleases, } from "../services/api";


const INITIAL_RELEASES = [];

const STATUS_OPTIONS = ["Released", "Pending", "On Hold"];

export default function Pension() {
  const [releases, setReleases] = useState(INITIAL_RELEASES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);

const [form, setForm] = useState({
  seniorId: "",
  name: "",
  period: "",
  releaseDate: "",
  receivedBy: "Senior",
  status: "Pending",
  reference: "",
  remarks: "",
});
useEffect(() => {
  getPensionReleases()
    .then((data) => {
      setReleases(data);
    })
    .catch((error) => {
      console.error("Failed to load pension releases:", error);
    });
}, []);

const updateForm = (field) => (event) => {
  setForm((previous) => ({
    ...previous,
    [field]: event.target.value,
  }));
};

const resetForm = () => {
  setForm({
    seniorId: "",
    name: "",
    period: "",
    releaseDate: "",
    receivedBy: "Senior",
    status: "Pending",
    reference: "",
    remarks: "",
  });
};

  const filteredReleases = useMemo(() => {
    const query = search.trim().toLowerCase();

    return releases.filter((release) => {
      const matchesSearch =
        !query ||
        release.name.toLowerCase().includes(query) ||
        release.seniorId.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || release.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [releases, search, statusFilter]);

  const stats = {
    total: releases.length,
    released: releases.filter((r) => r.status === "Released").length,
    pending: releases.filter((r) => r.status === "Pending").length,
    onHold: releases.filter((r) => r.status === "On Hold").length,
  };

  const saveRelease = async (event) => {
  event.preventDefault();

  if (!form.name.trim() || !form.seniorId.trim() || !form.period.trim()) {
    alert("Please fill in Senior ID, Senior Name, and Pension Period.");
    return;
  }

  try {
    const savedRelease = await createPensionRelease({
      senior_id: form.seniorId,
      name: form.name,
      period: form.period,
      release_date: form.releaseDate || null,
      received_by: form.receivedBy,
      status: form.status,
      reference: form.reference || null,
      remarks: form.remarks || null,
    });

    setReleases((previous) => [savedRelease, ...previous]);
    setModalOpen(false);
  } catch (error) {
    console.error("Failed to save pension release:", error);
    alert("Unable to save pension release.");
  }
};

  return (
    <div className="pension-page">
      <div className="pension-heading">
        <div>
          <h1>Pension Management</h1>
          <p>Manage pension release records for senior citizens.</p>
        </div>

        <button
  type="button"
  className="btn-primary"
  onClick={() => {
    resetForm();
    setModalOpen(true);
  }}
>
  <FiPlus /> Add Release Record
</button>
      </div>

      <div className="pension-stats">
        <div className="stat-card">
          <span className="stat-label">Total Beneficiaries</span>
          <strong>{stats.total}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Released</span>
          <strong>{stats.released}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">Pending</span>
          <strong>{stats.pending}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">On Hold</span>
          <strong>{stats.onHold}</strong>
        </div>
      </div>

      <section className="pension-panel">
        <div className="pension-toolbar">
          <div className="pension-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by name or Senior ID..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="pension-table-wrap">
          <table className="pension-table">
            <thead>
              <tr>
                <th>Senior ID</th>
                <th>Senior Name</th>
                <th>Pension Period</th>
                <th>Release Date</th>
                <th>Received By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredReleases.map((release) => (
                <tr key={release.id}>
                  <td>{release.seniorId}</td>
                  <td>{release.name}</td>
                  <td>{release.period}</td>
                  <td>{release.releaseDate}</td>
                  <td>{release.receivedBy}</td>
                  <td>
                    <span className={`pension-status ${release.status.toLowerCase().replace(" ", "-")}`}>
                      {release.status}
                    </span>
                  </td>
                  <td>
                    <button type="button" title="View">
                      <FiEye />
                    </button>
                    <button type="button" title="Edit">
                      <FiEdit2 />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredReleases.length === 0 && (
                <tr>
                  <td colSpan="7" className="pension-empty">
                    No pension release records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {modalOpen && (
  <div
    className="modal-overlay"
    onMouseDown={() => setModalOpen(false)}
  >
    <div
      className="modal-card"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="modal-header">
        <h3>Add Pension Release Record</h3>

        <button
          type="button"
          className="modal-close"
          onClick={() => setModalOpen(false)}
        >
          ×
        </button>
      </div>

      <form className="modal-form" onSubmit={saveRelease}>
        <label className="field-label">Senior ID</label>
        <input
          className="field-input"
          type="text"
          placeholder="Example: SC-2026-0001"
          value={form.seniorId}
          onChange={updateForm("seniorId")}
          required
        />

        <label className="field-label">Senior Name</label>
        <input
          className="field-input"
          type="text"
          placeholder="Enter senior name"
          value={form.name}
          onChange={updateForm("name")}
          required
        />

        <label className="field-label">Pension Period</label>
        <input
          className="field-input"
          type="text"
          placeholder="Example: January–March 2026"
          value={form.period}
          onChange={updateForm("period")}
          required
        />

        <label className="field-label">Release Date</label>
        <input
          className="field-input"
          type="date"
          value={form.releaseDate}
          onChange={updateForm("releaseDate")}
        />

        <label className="field-label">Received By</label>
        <select
          className="field-input"
          value={form.receivedBy}
          onChange={updateForm("receivedBy")}
        >
          <option value="Senior">Senior</option>
          <option value="Representative">Representative</option>
          <option value="Authorized Person">Authorized Person</option>
        </select>

        <label className="field-label">Status</label>
        <select
          className="field-input"
          value={form.status}
          onChange={updateForm("status")}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <label className="field-label">Reference Number</label>
        <input
          className="field-input"
          type="text"
          value={form.reference}
          onChange={updateForm("reference")}
        />

        <label className="field-label">Remarks</label>
        <textarea
          className="field-input"
          rows="3"
          value={form.remarks}
          onChange={updateForm("remarks")}
        />

        <div className="modal-actions">
          <button
            type="button"
            className="btn-outline"
            onClick={() => setModalOpen(false)}
          >
            Cancel
          </button>

          <button type="submit" className="btn-primary">
            Save Release Record
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}