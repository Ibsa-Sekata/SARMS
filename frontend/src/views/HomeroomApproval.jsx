import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTeacherClass } from "../contexts/TeacherClassContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const HomeroomApproval = () => {
  const { user } = useAuth();
  const { selectedClass, homeroomToolsForSelection, loading: classLoading } =
    useTeacherClass();
  const navigate = useNavigate();
  const [marks, setMarks] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [yearSemester, setYearSemester] = useState({ year_id: 1, semester_id: 1 });

  const loadSubmittedMarks = useCallback(async () => {
    try {
      setLoading(true);
      const settingsResponse = await api.get("/settings");
      const currentYearId = settingsResponse.data.settings?.current_year_id || 1;
      const currentSemesterId = settingsResponse.data.settings?.current_semester_id || 1;
      setYearSemester({ year_id: currentYearId, semester_id: currentSemesterId });

      const response = await api.get(
        `/marks/homeroom/submitted?year_id=${currentYearId}&semester_id=${currentSemesterId}`
      );
      if (response.data.success) {
        setMarks(response.data.marks || []);
        setSummary(response.data.summary || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load submitted marks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "teacher" || !user.is_homeroom_teacher) {
      navigate("/dashboard", { replace: true });
      return;
    }
    if (classLoading) return;
    if (!homeroomToolsForSelection) {
      toast.error("Select your homeroom class in the sidebar to continue.");
      navigate("/dashboard", { replace: true });
      return;
    }
    void loadSubmittedMarks();
  }, [user, classLoading, homeroomToolsForSelection, navigate, loadSubmittedMarks]);

  const marksBySubject = marks.reduce((acc, mark) => {
    if (!acc[mark.subject_name]) acc[mark.subject_name] = [];
    acc[mark.subject_name].push(mark);
    return acc;
  }, {});

  const allSubjectsComplete =
    summary.length > 0 &&
    summary.every((item) => Number(item.submitted_count) === Number(item.total_students));
  const totalSubjects = summary.length;
  const completedSubjects = summary.filter(
    (item) => Number(item.submitted_count) === Number(item.total_students)
  ).length;
  const pendingSubjects = Math.max(totalSubjects - completedSubjects, 0);

  const handleApproveAll = async () => {
    if (!window.confirm("Confirm all subjects have marks for every student?")) return;
    try {
      setApproving(true);
      const response = await api.post("/marks/homeroom/approve-all", {
        year_id: yearSemester.year_id,
        semester_id: yearSemester.semester_id,
      });
      if (response.data.success) {
        toast.success(response.data.message || "All marks approved.");
      }
      await loadSubmittedMarks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve marks");
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="approval-page">
      <div className="approval-header">
        <h1 className="approval-header__title">Approve Submitted Marks</h1>
        {selectedClass && (
          <p className="approval-header__meta">
            Grade {selectedClass.grade}
            {selectedClass.section} (homeroom) · Year {yearSemester.year_id} · Semester{" "}
            {yearSemester.semester_id}
          </p>
        )}
      </div>

      {loading ? (
        <div className="approval-card approval-loading">Loading...</div>
      ) : (
        <>
          <div className="approval-stats-grid">
            <div className="approval-stat-card">
              <div className="approval-stat-card__label">Subjects assigned</div>
              <div className="approval-stat-card__value">{totalSubjects}</div>
            </div>
            <div className="approval-stat-card approval-stat-card--good">
              <div className="approval-stat-card__label">Completed subjects</div>
              <div className="approval-stat-card__value">{completedSubjects}</div>
            </div>
            <div className="approval-stat-card approval-stat-card--warn">
              <div className="approval-stat-card__label">Pending subjects</div>
              <div className="approval-stat-card__value">{pendingSubjects}</div>
            </div>
            <div className="approval-stat-card">
              <div className="approval-stat-card__label">Submitted marks</div>
              <div className="approval-stat-card__value">{marks.length}</div>
            </div>
          </div>

          <div className="approval-card approval-section">
            <h2 className="approval-section__title">Subject progress</h2>
            {summary.length === 0 ? (
              <p className="approval-empty-text">No marks found for this class and term.</p>
            ) : (
              <div className="approval-progress-grid">
                {summary.map((item, i) => {
                  const complete = Number(item.submitted_count) === Number(item.total_students);
                  const percent =
                    Number(item.total_students) > 0
                      ? Math.round((Number(item.submitted_count) / Number(item.total_students)) * 100)
                      : 0;
                  return (
                    <div key={`${item.subject_id}-${i}`} className="approval-progress-card">
                      <div className="approval-progress-card__head">
                        <div className="approval-progress-card__subject">{item.subject_name}</div>
                        <span className={`approval-badge ${complete ? "is-complete" : "is-pending"}`}>
                          {complete ? "Complete" : "Pending"}
                        </span>
                      </div>
                      <div className="approval-progress-card__teacher">{item.teacher_name || "-"}</div>
                      <div className="approval-progress">
                        <div
                          className={`approval-progress__fill ${complete ? "is-complete" : "is-pending"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className={`approval-progress-card__meta ${complete ? "is-complete" : "is-pending"}`}>
                        {item.submitted_count}/{item.total_students} ({percent}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {Object.keys(marksBySubject).length > 0 && (
            <div className="approval-card approval-section">
              <h2 className="approval-section__title">Detailed marks</h2>
              {Object.keys(marksBySubject).map((subject) => (
                <div key={subject} className="approval-subject-block">
                  <h3 className="approval-subject-block__title">{subject}</h3>
                  <div className="approval-table-wrap">
                    <table className="approval-table">
                      <thead>
                        <tr>
                          <th>Student Code</th>
                          <th>Student Name</th>
                          <th className="approval-table__center">Mark</th>
                          <th>Teacher</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marksBySubject[subject].map((m) => (
                          <tr key={m.mark_id}>
                            <td>{m.student_code}</td>
                            <td>{m.student_name}</td>
                            <td className="approval-table__center">{m.mark}</td>
                            <td>{m.teacher_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="approval-card approval-actions">
            <button type="button" onClick={loadSubmittedMarks} className="approval-btn approval-btn--refresh">
              Refresh
            </button>
            <button type="button" onClick={() => navigate("/dashboard")} className="approval-btn approval-btn--back">
              Back
            </button>
            <button
              type="button"
              onClick={handleApproveAll}
              disabled={!allSubjectsComplete || approving}
              className="approval-btn approval-btn--approve"
            >
              {approving ? "Approving..." : "Approve all marks"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HomeroomApproval;
