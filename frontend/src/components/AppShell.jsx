import { useState, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTeacherClass } from "../contexts/TeacherClassContext";

const APP_SHORT = "SARMS";
const SCHOOL_NAME = "SARMS";

function NavIcon({ name }) {
  const icons = {
    dashboard: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    building: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12h12" />
        <path d="M6 16h12" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
      </svg>
    ),
    users: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    book: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    clipboard: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
    check: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    chart: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    settings: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  };
  return icons[name] || icons.dashboard;
}

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const {
    assignments,
    selectedClass,
    setSelectedClass,
    loading: classLoading,
    homeroomToolsForSelection,
  } = useTeacherClass();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navGroups = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") {
      return [
        {
          title: "Overview",
          items: [{ to: "/dashboard", label: "Dashboard", icon: "dashboard" }],
        },
        {
          title: "Directory",
          items: [
            {
              to: "/admin/departments",
              label: "Departments",
              icon: "building",
            },
            { to: "/admin/teachers", label: "Teachers", icon: "users" },
            { to: "/admin/students", label: "Students", icon: "users" },
            { to: "/admin/classes", label: "Classes", icon: "book" },
          ],
        },
        {
          title: "System",
          items: [
            {
              to: "/admin/settings",
              label: "Academic settings",
              icon: "settings",
            },
          ],
        },
      ];
    }

    const base = [
      { key: "dash", to: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { key: "marks", to: "/marks", label: "Marks", icon: "clipboard" },
      { key: "students", to: "/students", label: "Students", icon: "users" },
    ];

    if (homeroomToolsForSelection) {
      base.push(
        {
          key: "approval",
          to: "/homeroom/approval",
          label: "Approve marks",
          icon: "check",
        },
        {
          key: "roster",
          to: "/roster",
          label: "Roster & reports",
          icon: "chart",
        },
      );
    }

    return [{ title: "Teaching", items: base }];
  }, [user, homeroomToolsForSelection]);

  const handleLogout = () => {
    const role = String(user?.role ?? "").toLowerCase();
    logout();
    navigate(role === "admin" ? "/login/admin" : "/login/teacher");
  };

  const closeMobile = () => setMobileNavOpen(false);

  return (
    <div
      className={`app-shell${collapsed ? " app-shell--collapsed" : ""}${
        mobileNavOpen ? " app-shell--nav-open" : ""
      }`}
    >
      <div
        className={`app-shell__backdrop ${mobileNavOpen ? "is-visible" : ""}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      <aside className="app-sidebar" aria-label="Main navigation">
        <div className="app-sidebar__brand">
          <div className="app-sidebar__logo" aria-hidden>
            <span>S</span>
          </div>
          {!collapsed && (
            <div className="app-sidebar__titles">
              <span className="app-sidebar__app">{APP_SHORT}</span>
              <span className="app-sidebar__school">{SCHOOL_NAME}</span>
            </div>
          )}
          <button
            type="button"
            className="app-sidebar__collapse"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand menu" : "Collapse menu"}
            aria-expanded={!collapsed}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {collapsed ? (
                <polyline points="9 18 15 12 9 6" />
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
          </button>
        </div>

        <nav className="app-sidebar__nav">
          {user?.role === "teacher" && (
            <div className="app-sidebar__class-picker">
              {!collapsed && (
                <label
                  className="app-sidebar__class-picker-label"
                  htmlFor="sarms-sidebar-class"
                >
                  Select class
                </label>
              )}
              <select
                id="sarms-sidebar-class"
                className="app-sidebar__class-picker-select"
                value={
                  selectedClass
                    ? `${selectedClass.class_id}:${selectedClass.subject_id}`
                    : ""
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) {
                    setSelectedClass(null);
                    return;
                  }
                  const [cid, sid] = v.split(":");
                  const row = assignments.find(
                    (a) =>
                      String(a.class_id) === String(cid) &&
                      String(a.subject_id) === String(sid),
                  );
                  if (row) setSelectedClass(row);
                }}
                disabled={classLoading || assignments.length === 0}
                title={collapsed ? "Select class" : undefined}
                aria-label="Select class"
              >
                <option value="">
                  {classLoading ? "Loading…" : "Select a class…"}
                </option>
                {assignments.map((a) => (
                  <option
                    key={`${a.class_id}-${a.subject_id}`}
                    value={`${a.class_id}:${a.subject_id}`}
                  >
                    Grade {a.grade_number}
                    {a.section_name} · {a.subject_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {navGroups.map((group) => (
            <div key={group.title} className="app-sidebar__group">
              {!collapsed && (
                <div className="app-sidebar__group-title">{group.title}</div>
              )}
              <ul className="app-sidebar__list">
                {group.items.map((item) => (
                  <li key={item.key || item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `app-nav-link${isActive ? " app-nav-link--active" : ""}`
                      }
                      onClick={closeMobile}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="app-nav-link__icon">
                        <NavIcon name={item.icon} />
                      </span>
                      {!collapsed && (
                        <span className="app-nav-link__label">
                          {item.label}
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="app-sidebar__footer">
          <button
            type="button"
            className="app-sidebar__logout"
            onClick={handleLogout}
          >
            <span className="app-nav-link__icon" aria-hidden>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button
            type="button"
            className="app-topbar__menu"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="app-topbar__center">
            <h1 className="app-topbar__page">{SCHOOL_NAME}</h1>
            <p className="app-topbar__sub">Student record management</p>
          </div>

          <div className="app-topbar__user">
            <div className="app-topbar__avatar" aria-hidden>
              {user?.role === "admin"
                ? "A"
                : (user?.teacher_name || user?.username || "?")
                    .charAt(0)
                    .toUpperCase()}
            </div>
            <div className="app-topbar__meta">
              <span className="app-topbar__name">
                {user?.teacher_name || user?.username}
              </span>
              <span className="app-topbar__role">
                {user?.role === "admin"
                  ? "Administrator"
                  : homeroomToolsForSelection
                    ? `Homeroom · Grade ${user?.grade ?? ""}${user?.section ?? ""}`
                    : selectedClass
                      ? `Grade ${selectedClass.grade ?? ""}${selectedClass.section ?? ""} · ${selectedClass.subject_name ?? ""}`
                      : user?.department_name || "Teacher"}
              </span>
            </div>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
