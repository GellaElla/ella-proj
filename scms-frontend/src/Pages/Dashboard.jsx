import React, { useState, useRef, useEffect } from "react";
import {getApplications,getAnnouncements,getSeniorCitizens,} from "../services/api";
import {
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiVolume2,
  FiCalendar,
  FiChevronDown,
  FiInfo,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { BsPinAngleFill } from "react-icons/bs";
import { PiCakeDuotone } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

/* ---------------------------------------------------------------- */
/* Mock data — swap these for real API data                          */
/* ---------------------------------------------------------------- */


const RECENT_APPLICANTS = [
  { id: 1, name: "Juan Dela Cruz", date: "July 25, 2026", time: "10:45 AM", status: "Pending" },
  { id: 2, name: "Maria Santos", date: "July 25, 2026", time: "09:30 AM", status: "Pending" },
  { id: 3, name: "Pedro Reyes", date: "July 24, 2026", time: "04:15 PM", status: "Verified" },
  { id: 4, name: "Andrea Gonzales", date: "July 24, 2026", time: "11:20 AM", status: "Verified" },
  { id: 5, name: "Ramon Bautista", date: "July 23, 2026", time: "02:05 PM", status: "Rejected" },
];

const ANNOUNCEMENTS = [
  {
    id: 1,
    title: "Free Medical Check-up",
    date: "August 15, 2026",
    description:
      "We are pleased to announce a free medical check-up for all senior citizens.",
    pinned: true,
  },
  { id: 2, title: "Senior Citizens Assembly", date: "August 20, 2026" },
  { id: 3, title: "Distribution of ID Cards", date: "August 25, 2026" },
  { id: 4, title: "Nutrition Seminar", date: "August 30, 2026" },
];

const BIRTHDAYS = [
  { id: 1, name: "Teresa Ramirez", date: "July 26, 1954", age: 72, note: "Birthday Tomorrow" },
  { id: 2, name: "Ricardo Lim", date: "July 30, 1949", age: 77, note: "Birthday in 5 days" },
  { id: 3, name: "Elena Cruz", date: "August 2, 1944", age: 82, note: "Birthday in 5 days" },
];



/* Application statistics per period, used to drive the donut chart */
const APPLICATION_STATS = {
  "This Month": { newRegistrations: 156, verified: 102, pending: 54, insight: 12.6 },
  "Last Month": { newRegistrations: 139, verified: 89, pending: 50, insight: 4.1 },
};

const DATE_OPTIONS = ["July 25, 2026", "July 24, 2026", "July 23, 2026", "July 22, 2026"];

/* ---------------------------------------------------------------- */
/* Small reusable bits                                               */
/* ---------------------------------------------------------------- */

function StatCard({ icon: Icon, label, value, sublabel, trend, tone }) {
  return (
    <div className="stat-card">
      <span className={`stat-icon tone-${tone}`}>
        <Icon />
      </span>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value.toLocaleString()}</span>
        <span className="stat-sublabel">{sublabel}</span>
        <span className={`stat-trend ${trend.up ? "up" : "down"}`}>
          {trend.up ? <FiArrowUp /> : <FiArrowDown />}
          {trend.value}
        <span className="stat-trend-text">of total applications</span>
        </span>
      </div>
    </div>
  );
}

const STATUS_CLASS = {
  Pending: "badge-amber",
  Verified: "badge-green",
  Rejected: "badge-red",
};

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

/* Donut chart built with plain SVG stroke-dasharray segments — no chart library needed */
function DonutChart({ verified, pending, total }) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const verifiedPct = total > 0 ? verified / total : 0;
const pendingPct = total > 0 ? pending / total : 0;

  const verifiedLen = circumference * verifiedPct;
  const pendingLen = circumference * pendingPct;

  return (
    <svg viewBox="0 0 160 160" className="donut-svg">
      <circle cx="80" cy="80" r={radius} className="donut-track" />
      {/* Blue = verified */}
      <circle
        cx="80"
        cy="80"
        r={radius}
        className="donut-segment donut-blue"
        strokeDasharray={`${verifiedLen} ${circumference - verifiedLen}`}
        strokeDashoffset={0}
      />
      {/* Yellow = pending, starts right after the verified segment */}
      <circle
        cx="80"
        cy="80"
        r={radius}
        className="donut-segment donut-yellow"
        strokeDasharray={`${pendingLen} ${circumference - pendingLen}`}
        strokeDashoffset={-verifiedLen}
      />
      <text x="80" y="70" textAnchor="middle" className="donut-center-label">
        This Month
      </text>
      <text x="80" y="96" textAnchor="middle" className="donut-center-value">
        {total}
      </text>
      <text x="80" y="112" textAnchor="middle" className="donut-center-label">
        Total
      </text>
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/* Main Dashboard component                                          */
/* ---------------------------------------------------------------- */

const STATS = [
  {
    key: "total",
    label: "Total Applicants",
    value: 0,
    sublabel: "All time total",
    trend: { value: "0%", up: true },
    icon: FiUsers,
    tone: "green",
  },
  {
    key: "pending",
    label: "Pending",
    value: 0,
    sublabel: "For verification",
    trend: { value: "0%", up: true },
    icon: FiClock,
    tone: "amber",
  },
  {
    key: "verified",
    label: "Verified",
    value: 0,
    sublabel: "Approved applicants",
    trend: { value: "0%", up: true },
    icon: FiCheckCircle,
    tone: "green",
  },
  {
    key: "rejected",
    label: "Rejected",
    value: 0,
    sublabel: "Rejected applications",
    trend: { value: "0%", up: true },
    icon: FiXCircle,
    tone: "red",
  },
];

export default function Dashboard({
  onViewAllApplicants,
  onViewAllAnnouncements,
  onViewAllBirthdays,
  onSelectApplicant,
}) {
  const [applications, setApplications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [seniors, setSeniors] = useState([]);
  const navigate = useNavigate();

useEffect(() => {
  getApplications()
    .then((data) => {
      setApplications(data);
    })
    .catch((error) => {
      console.error("Failed to load dashboard applications:", error);
    });
}, []);

useEffect(() => {
  getAnnouncements()
    .then((data) => {
      setAnnouncements(data);
    })
    .catch((error) => {
      console.error("Failed to load dashboard announcements:", error);
    });
}, []);

useEffect(() => {
  getSeniorCitizens()
    .then((data) => {
      setSeniors(data);
    })
    .catch((error) => {
      console.error("Failed to load dashboard seniors:", error);
    });
}, []);



const totalApplications = applications.length;

const dashboardStats = STATS.map((stat) => {
  const value =
    stat.key === "total"
      ? totalApplications
      : stat.key === "pending"
      ? applications.filter((a) => a.status === "Pending").length
      : stat.key === "verified"
      ? applications.filter((a) => a.status === "Verified").length
      : stat.key === "rejected"
      ? applications.filter((a) => a.status === "Rejected").length
      : 0;

  const percentage =
    totalApplications > 0
      ? Math.round((value / totalApplications) * 1000) / 10
      : 0;

  return {
    ...stat,
    value,
    trend: {
      value: `${percentage}%`,
      up: true,
    },
  };
});

const recentApplicants = applications.slice(0, 5).map((a) => ({
  id: a.id,
  name: a.name,
  date: new Date(a.submitted_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }),
  time: new Date(a.submitted_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }),
  status: a.status,
}));

const applicationStats = {
  "This Month": {
    newRegistrations: applications.filter((a) => {
      const d = new Date(a.submitted_at);
      const now = new Date();

      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length,

    verified: applications.filter((a) => {
      const d = new Date(a.submitted_at);
      const now = new Date();

      return (
        a.status === "Verified" &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length,

    pending: applications.filter((a) => {
      const d = new Date(a.submitted_at);
      const now = new Date();

      return (
        a.status === "Pending" &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length,

    insight: 0,
  },

  "Last Month": {
    newRegistrations: applications.filter((a) => {
      const d = new Date(a.submitted_at);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      return (
        d.getMonth() === lastMonth.getMonth() &&
        d.getFullYear() === lastMonth.getFullYear()
      );
    }).length,

    verified: applications.filter((a) => {
      const d = new Date(a.submitted_at);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      return (
        a.status === "Verified" &&
        d.getMonth() === lastMonth.getMonth() &&
        d.getFullYear() === lastMonth.getFullYear()
      );
    }).length,

    pending: applications.filter((a) => {
      const d = new Date(a.submitted_at);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      return (
        a.status === "Pending" &&
        d.getMonth() === lastMonth.getMonth() &&
        d.getFullYear() === lastMonth.getFullYear()
      );
    }).length,

    insight: 0,
  },
};

const birthdays = seniors
  .filter((s) => s.birth_date)
  .map((s) => {
    const birthDate = String(s.birth_date).slice(0, 10);
    const [year, month, day] = birthDate.split("-").map(Number);

    const today = new Date();
    const nextBirthday = new Date(today.getFullYear(), month - 1, day);

    if (nextBirthday < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const daysUntil = Math.round(
      (nextBirthday - todayStart) / (1000 * 60 * 60 * 24)
    );

    return {
      id: s.id,
      name: s.name,
      date: new Date(year, month - 1, day).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      age: s.age,
      note:
        daysUntil === 0
          ? "Birthday Today"
          : daysUntil === 1
          ? "Birthday Tomorrow"
          : `Birthday in ${daysUntil} days`,
      daysUntil,
    };
  })
  .sort((a, b) => a.daysUntil - b.daysUntil)
  .slice(0, 3);

  const [selectedDate, setSelectedDate] = useState(DATE_OPTIONS[0]);
  const [dateOpen, setDateOpen] = useState(false);
  const dateRef = useOutsideClose(() => setDateOpen(false));

  const [period, setPeriod] = useState("This Month");
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRef = useOutsideClose(() => setPeriodOpen(false));

  const stats = applicationStats[period];
  const totalThisPeriod = stats.newRegistrations;
  const registrationPercent = totalThisPeriod > 0 ? 100 : 0;

  const verifiedPercent = totalThisPeriod > 0  ? Math.round((stats.verified / totalThisPeriod) * 1000) / 10 : 0;

  const pendingPercent = totalThisPeriod > 0   ? Math.round((stats.pending / totalThisPeriod) * 1000) / 10   : 0;
  const [apiMessage, setApiMessage] = useState("");

  

  return (
    <div className="dashboard">
      {/* Page heading + date filter */}
      <div className="dashboard-heading">
        <div>
          <h1>Dashboard</h1>
<p>Overview of senior citizen applications and system updates.</p>


        </div>

        <div className="date-picker" ref={dateRef}>
          <button
            type="button"
            className="date-picker-btn"
            onClick={() => setDateOpen((o) => !o)}
          >
            <FiCalendar />
            <span>{selectedDate}</span>
            <FiChevronDown className={`chevron${dateOpen ? " open" : ""}`} />
          </button>
          {dateOpen && (
            <div className="dropdown-menu">
              {DATE_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`dropdown-item${d === selectedDate ? " active" : ""}`}
                  onClick={() => {
                    setSelectedDate(d);
                    setDateOpen(false);
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
      {dashboardStats.map(({ key, ...stat }) => (
  <StatCard key={key} {...stat} />
))}
       
      </div>

      {/* Row 1: Recent applicants / Application statistics / Announcements */}
      <div className="dashboard-row row-3">
        <section className="panel">
          <div className="panel-header">
            <h2>
              <FiUsers className="panel-header-icon" />
              Recent Applicants
            </h2>
            <button
              type="button"
              className="btn-outline btn-sm"
             onClick={() => navigate("/document-verification")}
            >
              View All
            </button>
          </div>

          <div className="applicant-list">
           {recentApplicants.map((a) => (
              <button
                key={a.id}
                type="button"
                className="applicant-row"
                onClick={() => onSelectApplicant && onSelectApplicant(a)}
              >
                <span className="applicant-avatar">
                  <FiUsers />
                </span>
                <span className="applicant-info">
                  <span className="applicant-name">{a.name}</span>
                  <span className="applicant-meta">
                    {a.date} &bull; {a.time}
                  </span>
                </span>
                <span className={`badge ${STATUS_CLASS[a.status]}`}>{a.status}</span>
              </button>
            ))}
          </div>

      
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>
              <FiTrendingUp className="panel-header-icon" />
              Application Statistics
            </h2>
            <div className="period-picker" ref={periodRef}>
              <button
                type="button"
                className="date-picker-btn small"
                onClick={() => setPeriodOpen((o) => !o)}
              >
                <span>{period}</span>
                <FiChevronDown className={`chevron${periodOpen ? " open" : ""}`} />
              </button>
              {periodOpen && (
                <div className="dropdown-menu">
                  {Object.keys(APPLICATION_STATS).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`dropdown-item${p === period ? " active" : ""}`}
                      onClick={() => {
                        setPeriod(p);
                        setPeriodOpen(false);
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="donut-wrapper">
            <DonutChart
              verified={stats.verified}
              pending={stats.pending}
              total={totalThisPeriod}
            />

            <div className="donut-legend">
              <div className="legend-item">
                <span className="legend-dot dot-green" />
                <span className="legend-text">
                  <span className="legend-label">New Registrations</span>
                  <span className="legend-value">{stats.newRegistrations}</span>
                </span>
                <span className="legend-trend up">
              <FiArrowUp /> {registrationPercent}%
                </span>
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-blue" />
                <span className="legend-text">
                  <span className="legend-label">Verified</span>
                  <span className="legend-value">{stats.verified}</span>
                </span>
                <span className="legend-trend up">
                <FiArrowUp /> {verifiedPercent}%
                </span>
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-yellow" />
                <span className="legend-text">
                  <span className="legend-label">Pending</span>
                  <span className="legend-value">{stats.pending}</span>
                </span>
                <span className="legend-trend down">
                  <FiArrowDown /> {pendingPercent}%
                </span>
              </div>
            </div>
          </div>

          <div className="insight-box">
            <FiInfo />
            <span>
              There is an increase of {stats.insight}% in new registrations compared
              to last month.
            </span>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>
              <FiVolume2 className="panel-header-icon" />
              Announcements
            </h2>
            <button
              type="button"
              className="btn-outline btn-sm"
             onClick={() => navigate("/announcements")}
            >
              View All
            </button>
          </div>

          <div className="announcement-list">
            {announcements.map((a) =>
              a.pinned ? (
                <div key={a.id} className="pinned-announcement">
                  <div className="pinned-label">
                    <BsPinAngleFill /> Pinned Announcement
                  </div>
                  <h3>{a.title}</h3>
                  <span className="pinned-date">{a.date}</span>
                  <p>{a.description}</p>
                  <BsPinAngleFill className="pin-corner" />
                </div>
              ) : (
                <div key={a.id} className="announcement-row">
                  <span className="announcement-title">{a.title}</span>
                  <span className="announcement-date">{a.date}</span>
                </div>
              )
            )}
          </div>
        </section>
      </div>

      {/* Row 2: Birthday list / Anniversary reminder */}
      <div className="dashboard-row row-2">
        <section className="panel">
          <div className="panel-header">
            <h2>
              <PiCakeDuotone className="panel-header-icon" />
              Birthday List
            </h2>
            <button
              type="button"
              className="btn-outline btn-sm"
              onClick={() => navigate("/birthday-list")}
            >
              View All
            </button>
          </div>

          <div className="birthday-grid">
            {birthdays.map((b) => (
              <div key={b.id} className="birthday-card">
                <span className="birthday-avatar">
                  <FiUsers />
                </span>
                <span className="birthday-name">{b.name}</span>
                <span className="birthday-date">
                  {b.date} &nbsp;({b.age})
                </span>
                <span className="birthday-note">
                  <PiCakeDuotone /> {b.note}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
