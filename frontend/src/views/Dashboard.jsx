import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTeacherClass } from "../contexts/TeacherClassContext";
import api from "../services/api";
import toast from "react-hot-toast";

const StatCard = ({ icon, title, value, accent }) => (
  <div className="dash-stat-card">
    <div className="dash-stat-card__icon" style={{ "--accent": accent }}>
      {icon}
    </div>
    <div>
      <div className="dash-stat-card__label">{title}</div>
      <div className="dash-stat-card__value">{value}</div>
    </div>
  </div>
);

const DashSection = ({ title, children }) => (
  <section className="dash-section">
    {title && <h2 className="dash-section__title">{title}</h2>}
    {children}
  </section>
);

const Dashboard = () => {
  const { user } = useAuth();
  const {
    assignments,
    loading: teacherClassesLoading,
  } = useTeacherClass();
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    classes: 0,
    departments: 0,
    teacher_assignments: 0,
    marks_total: 0,
    marks_draft: 0,
    marks_submitted: 0,
    marks_approved: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        fetchStats();
      }
    }
  }, [user]);

  const fetchStatsFromLists = async () => {
    const [teachersRes, studentsRes, classesRes, departmentsRes] =
      await Promise.all([
        api.get("/teachers"),
        api.get("/students"),
        api.get("/classes"),
        api.get("/departments"),
      ]);
    setStats((prev) => ({
      ...prev,
      teachers: teachersRes.data.teachers?.length ?? 0,
      students: studentsRes.data.students?.length ?? 0,
      classes: classesRes.data.classes?.length ?? 0,
      departments: departmentsRes.data.departments?.length ?? 0,
    }));
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get("/stats/overview");
      if (res.data.success && res.data.overview) {
        setStats(res.data.overview);
        return;
      }
      await fetchStatsFromLists();
    } catch (error) {
      console.error("Error fetching stats overview:", error);
      try {
        await fetchStatsFromLists();
        console.warn(
          "Dashboard: stats overview unavailable; used directory list counts.",
        );
      } catch (fallbackErr) {
        console.error("Fallback stats failed:", fallbackErr);
        toast.error("Could not load dashboard statistics.");
      }
    } finally {
      setStatsLoading(false);
    }
  };

  if (!user) {
    return <div className="dash-loading">Loading…</div>;
  }

  return (
    <div className="dashboard-page">
      {user.role === "admin" && (
        <>
          <DashSection title="System overview">
            {statsLoading && (
              <p className="dash-hint" style={{ marginBottom: "1rem" }}>
                Loading statistics…
              </p>
            )}
            <div className="dash-stat-grid">
              <StatCard
                title="Teachers"
                value={statsLoading ? "…" : stats.teachers}
                accent="var(--color-accent-teal)"
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
              />
              <StatCard
                title="Students"
                value={statsLoading ? "…" : stats.students}
                accent="var(--color-accent-amber)"
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M18 7a4 4 0 0 0 0 7.75" />
                  </svg>
                }
              />
              <StatCard
                title="Classes"
                value={statsLoading ? "…" : stats.classes}
                accent="var(--color-accent-green)"
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                }
              />
              <StatCard
                title="Departments"
                value={statsLoading ? "…" : stats.departments}
                accent="var(--color-accent-rose)"
                icon={
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                    <path d="M6 12h12" />
                  </svg>
                }
              />
            </div>
          </DashSection>

          <DashSection title="Marks">
            <p className="dash-hint">
              The database stores one mark per student, subject, year, and
              semester (no separate draft/approval columns).
            </p>
            <div className="dash-pipeline">
              <div className="dash-pipeline__item dash-pipeline__item--approved">
                <span className="dash-pipeline__label">Mark records</span>
                <span className="dash-pipeline__num">
                  {statsLoading ? "…" : stats.marks_total}
                </span>
              </div>
            </div>
            <div className="dash-meta">
              <span>
                Teaching assignments:{" "}
                {statsLoading ? "…" : stats.teacher_assignments}
              </span>
            </div>
          </DashSection>
        </>
      )}

      {user.role !== "admin" && (
        <DashSection title="My classes">
          <p className="dash-hint">
            Use <strong>Select class</strong> at the top of the sidebar (above
            Dashboard). Marks and Students always use that choice, and classes
            listed here are for reference only.
          </p>
          {teacherClassesLoading ? (
            <p className="dash-empty">Loading classes…</p>
          ) : assignments.length === 0 ? (
            <div className="dash-empty-card">
              <p>No classes assigned yet. Contact your administrator.</p>
            </div>
          ) : (
            <div className="dash-class-grid">
              {assignments.map((assignment, index) => (
                <div
                  key={`${assignment.class_id}-${assignment.subject_id}-${index}`}
                  className="dash-class-card"
                >
                  <span className="dash-class-card__badge">
                    Grade {assignment.grade_number}
                    {assignment.section_name}
                  </span>
                  <span className="dash-class-card__subject">
                    {assignment.subject_name}
                  </span>
                  {assignment.year_name && (
                    <span className="dash-class-card__year">
                      {assignment.year_name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </DashSection>
      )}

    </div>
  );
};

export default Dashboard;
