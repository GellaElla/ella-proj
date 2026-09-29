import React, { useState, useMemo, useRef, useEffect } from "react";
import { getSeniorCitizens } from "../services/api";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiPrinter,
  FiDownload,
  FiCalendar,
  FiGift,
  FiBell,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";
import { PiCakeDuotone } from "react-icons/pi";
import "./BirthdayList.css";

/* ---------------------------------------------------------------- */
/* Reference "today" for this demo dataset. In a real app, swap      */
/* every use of TODAY for `new Date()`.                              */
/* ---------------------------------------------------------------- */
const TODAY = new Date();
const CURRENT_MONTH = TODAY.getMonth() + 1;
const CURRENT_YEAR = TODAY.getFullYear();

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const BARANGAYS = ["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5"];

/* ---------------------------------------------------------------- */
/* Mock data — swap for real API data                                */
/* ---------------------------------------------------------------- */

const EXTRA_NAMES = [
  "Andrea Gonzales", "Ramon Bautista", "Teresa Ramirez", "Ricardo Lim", "Elena Cruz",
  "Fernando Castillo", "Rosario Aquino", "Manuel Torres", "Corazon Villanueva",
  "Antonio Mendoza", "Remedios Flores", "Eduardo Santos", "Consuelo Reyes",
  "Alfredo Garcia", "Milagros Dela Cruz", "Benjamin Santos", "Soledad Reyes",
  "Rogelio Perez", "Josefina Ramos", "Domingo Cruz", "Aurora Fernandez",
  "Salvador Diaz", "Victoria Marquez",
];

function generatePhone(i) {
  const mid = String(100 + i * 7).slice(-3);
  const last = String(1000 + i * 37).slice(-4);
  return `09${10 + (i % 9)} ${mid} ${last}`;
}

const BASE_SENIORS = [
  {
    id: 1, seniorId: "SC-2026-0001", name: "Juan Dela Cruz", birthMonth: 5, birthDay: 27,
    age: 72, barangay: "Poblacion", contact: "0917 123 4567", celebration: "Gift Distributed",
  },
  {
    id: 2, seniorId: "SC-2026-0002", name: "Maria Santos", birthMonth: 5, birthDay: 28,
    age: 69, barangay: "San Isidro", contact: "0918 234 5678", celebration: "Greeting Sent",
  },
  {
    id: 3, seniorId: "SC-2026-0003", name: "Pedro Reyes", birthMonth: 5, birthDay: 31,
    age: 75, barangay: "San Roque", contact: "0920 345 6789", celebration: "Pending",
  },
  {
    id: 4, seniorId: "SC-2026-0004", name: "Lucia Morales", birthMonth: 6, birthDay: 1,
    age: 70, barangay: "Poblacion", contact: "0916 456 7890", celebration: "Pending",
  },
  {
    id: 5, seniorId: "SC-2026-0005", name: "Ramon Garcia", birthMonth: 6, birthDay: 2,
    age: 65, barangay: "Mahayag", contact: "0915 567 8901", celebration: "Pending",
  },
  ...EXTRA_NAMES.map((name, i) => ({
    id: i + 6,
    seniorId: `SC-2026-${String(i + 6).padStart(4, "0")}`,
    name,
    birthMonth: ((i * 3 + 2) % 12) + 1,
    birthDay: ((i * 7 + 5) % 28) + 1,
    age: 60 + (i % 26),
    barangay: BARANGAYS[i % BARANGAYS.length],
    contact: generatePhone(i),
    celebration: i % 5 === 0 ? "Greeting Sent" : "Pending",
  })),
];

/* ---------------------------------------------------------------- */
/* Date helpers                                                      */
/* ---------------------------------------------------------------- */

function daysUntilBirthday(month, day) {
  let next = new Date(CURRENT_YEAR, month - 1, day);
  const todayMidnight = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
  if (next < todayMidnight) next = new Date(CURRENT_YEAR + 1, month - 1, day);
  return Math.round((next - todayMidnight) / 86400000);
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatShortDate(month, day) {
  return `${MONTH_NAMES[month - 1].slice(0, 3)} ${day}`;
}

function formatFullBirthday(month, day, birthYear) {
  return `${MONTH_NAMES[month - 1]} ${day}, ${birthYear}`;
}

function statusLabel(daysUntil) {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  if (daysUntil <= 7) return `In ${daysUntil} Days`;
  return null; // far away — caller falls back to a formatted date
}

function statusTone(daysUntil) {
  if (daysUntil === 0) return "tone-today";
  if (daysUntil === 1) return "tone-tomorrow";
  if (daysUntil <= 7) return "tone-soon";
  return "tone-later";
}

const CELEBRATION_TONE = {
  "Gift Distributed": "tone-green",
  "Greeting Sent": "tone-blue",
  Pending: "tone-amber",
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

function downloadCSV(filename, rows) {
  const header = [
    "Senior ID", "Full Name", "Birthday", "Age Turning", "Barangay", "Contact Number", "Celebration Status",
  ];
  const csvRows = rows.map((s) => [
   formatFullBirthday(s.birthMonth, s.birthDay, s.birthYear),
    s.age, s.barangay, s.contact, s.celebration,
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
/* Birthday calendar                                                 */
/* ---------------------------------------------------------------- */

function BirthdayCalendar({ seniors, selectedDate, onSelectDate }) {
  const [viewMonth, setViewMonth] = useState(CURRENT_MONTH);
  const [viewYear, setViewYear] = useState(CURRENT_YEAR);

  const birthdaySet = useMemo(() => {
    const set = new Set();
    seniors.forEach((s) => set.add(`${s.birthMonth}-${s.birthDay}`));
    return set;
  }, [seniors]);

  const grid = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth - 1, 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth - 1, 0).getDate();

    const cells = [];
    for (let i = startWeekday - 1; i >= 0; i--) {
      cells.push({ day: daysInPrevMonth - i, muted: true, month: viewMonth - 1 || 12 });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, muted: false, month: viewMonth });
    }
    while (cells.length % 7 !== 0 || cells.length < 42) {
      const nextDay = cells.length - (startWeekday + daysInMonth) + 1;
      cells.push({ day: nextDay, muted: true, month: (viewMonth % 12) + 1 });
      if (cells.length >= 42) break;
    }
    return cells;
  }, [viewMonth, viewYear]);

  const goPrev = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div className="calendar-card" id="birthday-calendar">
      <div className="calendar-header">
        <h3>
          <PiCakeDuotone className="panel-header-icon" /> Birthday Calendar
        </h3>
      </div>

      <div className="calendar-nav">
        <button type="button" className="cal-nav-btn" onClick={goPrev} aria-label="Previous month">
          <FiChevronLeft />
        </button>
        <span className="calendar-month-label">
          {MONTH_NAMES[viewMonth - 1]} {viewYear}
        </span>
        <button type="button" className="cal-nav-btn" onClick={goNext} aria-label="Next month">
          <FiChevronRight />
        </button>
      </div>

      <div className="calendar-grid calendar-weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {grid.map((cell, idx) => {
          const isToday =
            !cell.muted && viewMonth === CURRENT_MONTH && viewYear === CURRENT_YEAR && cell.day === TODAY.getDate();
          const hasBirthday = !cell.muted && birthdaySet.has(`${viewMonth}-${cell.day}`);
          const isSelected =
            selectedDate && !cell.muted && selectedDate.month === viewMonth && selectedDate.day === cell.day;

          return (
            <button
              type="button"
              key={idx}
              className={`calendar-cell${cell.muted ? " muted" : ""}${isToday ? " today" : ""}${
                isSelected ? " selected" : ""
              }`}
              disabled={cell.muted || !hasBirthday}
              onClick={() => onSelectDate(viewMonth, cell.day)}
            >
              {cell.day}
              {hasBirthday && <span className="cal-dot" />}
            </button>
          );
        })}
      </div>

      <div className="calendar-legend">
        <span className="cal-dot standalone" /> Has Birthday
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Greeting generator                                                 */
/* ---------------------------------------------------------------- */

function GreetingGenerator({ seniors }) {
  const [selectedId, setSelectedId] = useState("");
  const [greeting, setGreeting] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const senior = seniors.find((s) => String(s.id) === selectedId);
    if (!senior) return;
    const turningAge = ordinal(senior.age);
    setGreeting(
      `Happy ${turningAge} Birthday, ${senior.name}! 🎉 Wishing you continued good health, happiness, and many more blessings ahead. — Senior Citizen Management System`
    );
    setCopied(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(greeting);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — fail silently
    }
  };

  return (
    <div className="panel greeting-panel">
      <h3>
        <FiGift className="panel-header-icon" /> Birthday Greeting Generator
      </h3>
      <p className="greeting-sub">Select a senior and generate a birthday greeting.</p>

      <div className="greeting-controls">
        <select
          className="select-input"
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setGreeting("");
          }}
        >
          <option value="">Select Senior</option>
          {seniors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn-primary" onClick={generate} disabled={!selectedId}>
          <PiCakeDuotone /> Generate Greeting
        </button>
      </div>

      {greeting && (
        <div className="greeting-output">
          <p>{greeting}</p>
          <button type="button" className="btn-outline btn-sm" onClick={copy}>
            {copied ? <FiCheckCircle /> : <FiDownload />}
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Notification settings modal                                       */
/* ---------------------------------------------------------------- */

function NotificationModal({ settings, onSave, onClose }) {
  const [local, setLocal] = useState(settings);

  const toggle = (key) => setLocal((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Notification Settings</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="notif-options">
          <label className="checkbox-row">
            <input type="checkbox" checked={local.sevenDays} onChange={() => toggle("sevenDays")} />
            Notify 7 days before birthday
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={local.threeDays} onChange={() => toggle("threeDays")} />
            Notify 3 days before birthday
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={local.onDay} onChange={() => toggle("onDay")} />
            Notify on the birthday
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              onSave(local);
              onClose();
            }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Senior detail modal (row "view" action)                           */
/* ---------------------------------------------------------------- */

function SeniorDetailModal({ senior, onClose }) {
  if (!senior) return null;
  const daysUntil = daysUntilBirthday(senior.birthMonth, senior.birthDay);
  const label = statusLabel(daysUntil) || formatShortDate(senior.birthMonth, senior.birthDay);

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{senior.name}</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="details-rows">
          <div className="details-row">
            <span>Senior ID</span>
            <strong>{senior.seniorId}</strong>
          </div>
          <div className="details-row">
            <span>Birthday</span>
            <strong>{formatFullBirthday(senior.birthMonth,senior.birthDay,senior.birthYear)}</strong>
          </div>
          <div className="details-row">
            <span>Age Turning</span>
            <strong>{senior.age}</strong>
          </div>
          <div className="details-row">
            <span>Barangay</span>
            <strong>{senior.barangay}</strong>
          </div>
          <div className="details-row">
            <span>Contact Number</span>
            <strong>{senior.contact}</strong>
          </div>
          <div className="details-row">
            <span>Birthday Status</span>
            <span className={`badge ${statusTone(daysUntil)}`}>{label}</span>
          </div>
          <div className="details-row">
            <span>Celebration Status</span>
            <span className={`badge ${CELEBRATION_TONE[senior.celebration]}`}>{senior.celebration}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Main component                                                     */
/* ---------------------------------------------------------------- */

const PAGE_SIZE = 5;
const AGE_RANGES = [
  { label: "All Ages", min: 0, max: 200 },
  { label: "60-69", min: 60, max: 69 },
  { label: "70-79", min: 70, max: 79 },
  { label: "80+", min: 80, max: 200 },
];
const SORT_OPTIONS = ["Nearest Birthday", "Name (A-Z)", "Youngest First", "Oldest First"];

export default function BirthdayList() {
  const [seniors, setSeniors] = useState([]);

useEffect(() => {
  getSeniorCitizens()
    .then((data) => {
      const formattedSeniors = data
        .filter((r) => r.birth_date)
        .map((r) => {
          const birthDate = String(r.birth_date).slice(0, 10);
          const [birthYear, birthMonth, birthDay] = birthDate
            .split("-")
            .map(Number);

          return {
            id: r.id,
            seniorId: r.senior_id,
            name: r.name,
            birthYear,
            birthMonth,
            birthDay,
            age: r.age,
            barangay: r.purok,
            contact: r.contact || "",
            celebration: "Pending",
            daysUntil: daysUntilBirthday(birthMonth, birthDay),
          };
        });

      setSeniors(formattedSeniors);
    })
    .catch((error) => {
      console.error("Failed to load birthday list:", error);
    });
}, []);

  const [searchName, setSearchName] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("All Puroks");
  const [monthFilter, setMonthFilter] = useState("All Months");
  const [ageFilter, setAgeFilter] = useState("All Ages");
  const [sortBy, setSortBy] = useState("Nearest Birthday");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null); // { month, day }
  const [detailSenior, setDetailSenior] = useState(null);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [notifSettings, setNotifSettings] = useState({ sevenDays: true, threeDays: true, onDay: true });
  const [todayFilterOnly, setTodayFilterOnly] = useState(false);

  const barangayRef = useOutsideClose(() => setBarangayOpen(false));
  const [barangayOpen, setBarangayOpen] = useState(false);
  const monthRef = useOutsideClose(() => setMonthOpen(false));
  const [monthOpen, setMonthOpen] = useState(false);
  const ageRef = useOutsideClose(() => setAgeOpen(false));
  const [ageOpen, setAgeOpen] = useState(false);
  const sortRef = useOutsideClose(() => setSortOpen(false));
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, barangayFilter, monthFilter, ageFilter, sortBy, selectedDate, todayFilterOnly]);

  const todaysCelebrants = useMemo(() => seniors.filter((s) => s.daysUntil === 0), [seniors]);
  const upcoming = useMemo(
    () =>
      seniors
        .filter((s) => s.daysUntil > 0)
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, 4),
    [seniors]
  );

  const stats = useMemo(
    () => ({
      today: seniors.filter((s) => s.daysUntil === 0).length,
      thisWeek: seniors.filter((s) => s.daysUntil <= 6).length,
      thisMonth: seniors.filter((s) => s.birthMonth === CURRENT_MONTH).length,
      next7Days: seniors.filter((s) => s.daysUntil >= 1 && s.daysUntil <= 7).length,
    }),
    [seniors]
  );

  const filtered = useMemo(() => {
    let list = seniors;

    if (todayFilterOnly) list = list.filter((s) => s.daysUntil === 0);

    if (selectedDate) {
      list = list.filter((s) => s.birthMonth === selectedDate.month && s.birthDay === selectedDate.day);
    } else if (monthFilter !== "All Months") {
      const monthIndex = MONTH_NAMES.indexOf(monthFilter) + 1;
      list = list.filter((s) => s.birthMonth === monthIndex);
    }

    if (barangayFilter !== "All Puroks") {
      list = list.filter((s) => s.barangay === barangayFilter);
    }

    if (ageFilter !== "All Ages") {
      const range = AGE_RANGES.find((r) => r.label === ageFilter);
      list = list.filter((s) => s.age >= range.min && s.age <= range.max);
    }

    if (searchName.trim()) {
      const q = searchName.trim().toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "Name (A-Z)":
          return a.name.localeCompare(b.name);
        case "Youngest First":
          return a.age - b.age;
        case "Oldest First":
          return b.age - a.age;
        default:
          return a.daysUntil - b.daysUntil;
      }
    });

    return list;
  }, [seniors, searchName, barangayFilter, monthFilter, ageFilter, sortBy, selectedDate, todayFilterOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSelectDate = (month, day) => {
    setSelectedDate((prev) => (prev && prev.month === month && prev.day === day ? null : { month, day }));
    setMonthFilter("All Months");
  };

  const calendarRef = useRef(null);
  const scrollToCalendar = () => {
    calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const notifText = () => {
    const parts = [];
    if (notifSettings.sevenDays) parts.push("7 days before");
    if (notifSettings.threeDays) parts.push("3 days before");
    if (notifSettings.onDay) parts.push("on the birthday");
    if (parts.length === 0) return "Notifications are currently turned off.";
    return `You will be notified ${parts.join(", ")}.`;
  };

  return (
    <div className="birthday-list">
      {/* Heading */}
      <div className="bl-heading">
        <div className="bl-heading-left">
          <span className="bl-heading-icon">
            <PiCakeDuotone />
          </span>
          <div>
            <h1>Birthday List</h1>
            <p>View and manage birthdays of our beloved senior citizens.</p>
          </div>
        </div>

        <div className="bl-heading-controls">
          <button type="button" className="btn-outline" onClick={() => downloadCSV("birthday-list.csv", filtered)}>
            <FiDownload /> Export
          </button>
          <button type="button" className="btn-primary" onClick={() => window.print()}>
            <FiPrinter /> Print Birthday List
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="bl-stats">
        <div className="stat-card">
          <span className="stat-icon tone-green">
            <PiCakeDuotone />
          </span>
          <div className="stat-body">
            <span className="stat-label">Birthdays Today</span>
            <span className="stat-value">{stats.today}</span>
            <span className="stat-sublabel">Celebrants today</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon tone-amber">🎉</span>
          <div className="stat-body">
            <span className="stat-label">Birthdays This Week</span>
            <span className="stat-value">{stats.thisWeek}</span>
            <span className="stat-sublabel">Within 7 days</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon tone-green">
            <FiCalendar />
          </span>
          <div className="stat-body">
            <span className="stat-label">Birthdays This Month</span>
            <span className="stat-value">{stats.thisMonth}</span>
            <span className="stat-sublabel">This month</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon tone-green">
            <FiGift />
          </span>
          <div className="stat-body">
            <span className="stat-label">Upcoming (Next 7 Days)</span>
            <span className="stat-value">{stats.next7Days}</span>
            <span className="stat-sublabel">Next 7 days</span>
          </div>
        </div>
      </div>

      <div className="bl-body">
        <div className="bl-main">
          {/* Today's celebrants */}
          <section className="panel">
            <div className="panel-header">
              <h2>🎉 Today's Celebrants</h2>
              <button type="button" className="btn-outline btn-sm" onClick={() => setTodayFilterOnly((v) => !v)}>
                {todayFilterOnly ? "Show All" : `View All (${todaysCelebrants.length})`}
              </button>
            </div>

            <div className="celebrant-grid">
              {todaysCelebrants.map((s) => (
                <div className="celebrant-card" key={s.id}>
                  <span className="celebrant-avatar">{s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</span>
                  <div>
                    <span className="celebrant-name">{s.name}</span>
                    <span className="celebrant-age">{s.age} years old</span>
                    <span className="celebrant-barangay">{s.barangay}</span>
                    <span className="celebrant-tag">🎉 Happy Birthday!</span>
                  </div>
                </div>
              ))}
              {todaysCelebrants.length === 0 && (
                <div className="empty-state">No birthdays today.</div>
              )}
            </div>
          </section>

    

          {/* Table */}
         <section className="panel">
  <div className="birthday-list-toolbar">
    <div>
      <h2 className="filters-title">Birthday List</h2>
      <p className="birthday-list-subtitle">
        Browse and manage senior citizen birthdays.
      </p>
    </div>

    <div className="search-box birthday-search">
      <input
        type="text"
        placeholder="Search by name..."
        value={searchName}
        onChange={(e) => setSearchName(e.target.value)}
      />
      <FiSearch />
    </div>
  </div>
            <div className="table-scroll">
              <table className="bl-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Senior ID</th>
                    <th>Full Name</th>
                    <th>Birthday</th>
                    <th>Age Turning</th>
                    <th>Barangay</th>
                    <th>Contact Number</th>
                    <th>Birthday Status</th>
                    <th>Celebration Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s) => {
                    const label = statusLabel(s.daysUntil) || formatShortDate(s.birthMonth, s.birthDay);
                    return (
                      <tr key={s.id}>
                        <td>
                          <span className="row-avatar">
                            {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </span>
                        </td>
                        <td>{s.seniorId}</td>
                        <td className="row-name">{s.name}</td>
                        <td>{formatFullBirthday(s.birthMonth, s.birthDay, CURRENT_YEAR - s.age)}</td>
                        <td>{s.age}</td>
                        <td>{s.barangay}</td>
                        <td>{s.contact}</td>
                        <td>
                          <span className={`badge ${statusTone(s.daysUntil)}`}>{label}</span>
                        </td>
                        <td>
                          <span className={`badge ${CELEBRATION_TONE[s.celebration]}`}>{s.celebration}</span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-square"
                              title="View"
                              onClick={() => setDetailSenior(s)}
                            >
                              <FiEye />
                            </button>
                            <button
                              type="button"
                              className="icon-square"
                              title="Export this record"
                              onClick={() => downloadCSV(`${s.seniorId}.csv`, [s])}
                            >
                              <FiPrinter />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={10} className="empty-row">
                        No records match your search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bl-pagination">
              <span className="pagination-summary">
                Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to{" "}
                {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} records
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="page-btn"
                  disabled={page === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <FiChevronLeft />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
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
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </section>
            <div className="bl-side">
           <section className="panel">
            <div className="panel-header">
              <h2>
                <FiGift className="panel-header-icon" /> Upcoming Birthdays
              </h2>
              <button type="button" className="btn-outline btn-sm" onClick={scrollToCalendar}>
                View Calendar
              </button>
            </div>

            <div className="upcoming-list">
              {upcoming.map((s) => (
                <div className="upcoming-row" key={s.id}>
                  <span className="upcoming-dot" />
                  <span className="upcoming-icon">
                    <FiCalendar />
                  </span>
                  <span className="upcoming-label">
                    {s.daysUntil === 1 ? "Tomorrow" : s.daysUntil <= 7 ? `In ${s.daysUntil} Days` : "Next Week"}
                  </span>
                  <span className="upcoming-name">{s.name}</span>
                  <span className="upcoming-age">{s.age} years old</span>
                </div>
              ))}
            </div>
          </section>

       
          <GreetingGenerator seniors={seniors} />
        </div>
      </div>

      {detailSenior && <SeniorDetailModal senior={detailSenior} onClose={() => setDetailSenior(null)} />}
      {notifModalOpen && (
        <NotificationModal
          settings={notifSettings}
          onSave={setNotifSettings}
          onClose={() => setNotifModalOpen(false)}
        />
      )}
      
    </div>
       {/* Notification bar */}
          <section className="notification-bar">
            <FiBell />
            <span>{notifText()}</span>
            <button type="button" className="btn-outline btn-sm" onClick={() => setNotifModalOpen(true)}>
              Manage Notification Settings
            </button>
          </section>
        </div>
  );
}
