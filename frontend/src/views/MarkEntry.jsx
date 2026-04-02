import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTeacherClass } from "../contexts/TeacherClassContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const MarkEntry = () => {
  const { user } = useAuth();
  const { selectedClass } = useTeacherClass();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [existingMarks, setExistingMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadExistingMarks = useCallback(async (classId, subjectId) => {
    if (!classId || !subjectId) return;
    try {
      const settingsResponse = await api.get("/settings");
      const currentYearId =
        settingsResponse.data.settings?.current_year_id || 1;
      const currentSemesterId =
        settingsResponse.data.settings?.current_semester_id || 1;

      const response = await api.get(
        `/marks?class_id=${classId}&subject_id=${subjectId}&year_id=${currentYearId}&semester_id=${currentSemesterId}`,
      );

      if (response.data.success) {
        const marksMap = {};
        response.data.marks.forEach((mark) => {
          marksMap[mark.student_id] = {
            mark: mark.mark,
            mark_id: mark.mark_id,
          };
        });
        setExistingMarks(marksMap);

        const marksInput = {};
        Object.keys(marksMap).forEach((studentId) => {
          marksInput[studentId] = marksMap[studentId].mark;
        });
        setMarks(marksInput);
      }
    } catch (error) {
      console.error("Error loading existing marks:", error);
    }
  }, []);

  const loadStudents = useCallback(
    async (classId, subjectId) => {
      if (!classId) return;
      try {
        setLoading(true);
        const response = await api.get(`/students/class/${classId}`);
        if (response.data.success) {
          setStudents(response.data.students);
          await loadExistingMarks(classId, subjectId);
        }
      } catch (error) {
        console.error("Error loading students:", error);
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    },
    [loadExistingMarks],
  );

  useEffect(() => {
    if (!selectedClass?.class_id || !selectedClass?.subject_id) {
      setStudents([]);
      setMarks({});
      setExistingMarks({});
      return;
    }
    loadStudents(selectedClass.class_id, selectedClass.subject_id);
  }, [selectedClass?.class_id, selectedClass?.subject_id, loadStudents]);

  const handleMarkChange = (studentId, mark) => {
    setMarks({
      ...marks,
      [studentId]: mark,
    });
  };

  const submitMarks = async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);

      const settingsResponse = await api.get("/settings");
      const currentYearId =
        settingsResponse.data.settings?.current_year_id || 1;
      const currentSemesterId =
        settingsResponse.data.settings?.current_semester_id || 1;

      const marksArray = Object.entries(marks)
        .filter(
          ([, mark]) =>
            mark !== "" && mark != null && !Number.isNaN(parseFloat(mark)),
        )
        .map(([studentId, mark]) => ({
          student_id: parseInt(studentId, 10),
          subject_id: selectedClass.subject_id,
          teacher_id: user.teacher_id,
          semester_id: currentSemesterId,
          year_id: currentYearId,
          mark: parseFloat(mark),
        }));

      if (marksArray.length === 0) {
        toast.error("Enter at least one numeric mark before saving.");
        return;
      }

      const response = await api.post("/marks/batch", { marks: marksArray });

      if (response.data.success) {
        toast.success("Marks saved!");
        const updatedExistingMarks = { ...existingMarks };
        marksArray.forEach((mark) => {
          updatedExistingMarks[mark.student_id] = {
            mark: mark.mark,
            mark_id: updatedExistingMarks[mark.student_id]?.mark_id,
          };
        });
        setExistingMarks(updatedExistingMarks);
      }
    } catch (error) {
      console.error("Error submitting marks:", error);
      toast.error(error.response?.data?.message || "Failed to save marks");
    } finally {
      setLoading(false);
    }
  };

  const submitToHomeroom = async () => {
    if (!selectedClass) return;
    if (
      !window.confirm(
        "Are you sure you want to submit these marks to the homeroom teacher? You can still edit them later.",
      )
    ) {
      return;
    }

    try {
      setSubmitting(true);

      const settingsResponse = await api.get("/settings");
      const currentYearId =
        settingsResponse.data.settings?.current_year_id || 1;
      const currentSemesterId =
        settingsResponse.data.settings?.current_semester_id || 1;

      const response = await api.post("/marks/submit-to-homeroom", {
        class_id: parseInt(selectedClass.class_id, 10),
        subject_id: selectedClass.subject_id,
        year_id: currentYearId,
        semester_id: currentSemesterId,
      });

      if (response.data.success) {
        toast.success(
          response.data.message ||
            `${response.data.submitted_count} marks recorded for homeroom review.`,
        );
      }
    } catch (error) {
      console.error("Error submitting to homeroom:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit to homeroom teacher",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user?.teacher_id) {
    return (
      <div className="mark-entry-page">
        <div className="mark-entry-empty">
          <p className="teacher-students__muted">
            Marks entry is only available for teacher accounts.
          </p>
        </div>
      </div>
    );
  }

  const titleClass = selectedClass
    ? `Grade ${selectedClass.grade}${selectedClass.section} (${selectedClass.subject_name})`
    : null;

  const btnBase = {
    padding: "0.45rem 0.85rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  };

  return (
    <div className="mark-entry-page">
      <div className="mark-entry-page__inner">
        {!selectedClass && (
          <div className="mark-entry-empty">
            <div className="mark-entry-empty__card">
              <p>
                Choose your class with <strong>Select class</strong> in the
                sidebar (above Dashboard), or on the Dashboard page. Marks does
                not ask for the class again.
              </p>
              <button
                type="button"
                className="sarms-toolbar__btn sarms-toolbar__btn--primary"
                onClick={() => navigate("/dashboard")}
              >
                Open Dashboard
              </button>
            </div>
          </div>
        )}

        {loading && selectedClass && students.length === 0 && (
          <div className="mark-entry-loading">Loading students…</div>
        )}

        {!loading && selectedClass && students.length === 0 && (
          <div className="mark-entry-empty">
            <div className="mark-entry-empty__card">
              <p style={{ margin: 0 }}>No students found in this class.</p>
            </div>
          </div>
        )}

        {students.length > 0 && selectedClass && (
          <div className="mark-entry-panel">
            <div className="mark-entry-panel__head">
              <h2>Student marks — {titleClass}</h2>
            </div>
            <div className="mark-entry-panel__scroll">
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: "0 4px",
                }}
              >
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    <th
                      style={{
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#333",
                      }}
                    >
                      Student
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#333",
                      }}
                    >
                      Code
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        fontWeight: 600,
                        color: "#333",
                      }}
                    >
                      Mark
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        fontWeight: 600,
                        color: "#333",
                      }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const saved = existingMarks[student.student_id] != null;
                    return (
                      <tr key={student.student_id}>
                        <td style={{ fontWeight: 500 }}>
                          {student.student_name}
                        </td>
                        <td style={{ color: "#64748b" }}>
                          {student.student_code}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={marks[student.student_id] || ""}
                            onChange={(e) =>
                              handleMarkChange(
                                student.student_id,
                                e.target.value,
                              )
                            }
                            placeholder="0"
                            style={{
                              width: "68px",
                              padding: "0.35rem 0.4rem",
                              border: "1px solid #e2e8f0",
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              textAlign: "center",
                              backgroundColor: "white",
                            }}
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {saved ? (
                            <span
                              style={{
                                padding: "0.2rem 0.45rem",
                                background: "#e0f2fe",
                                color: "#0369a1",
                                borderRadius: "4px",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                              }}
                            >
                              Saved
                            </span>
                          ) : (
                            <span
                              style={{ color: "#94a3b8", fontSize: "0.8rem" }}
                            >
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mark-entry-panel__footer">
              <button
                type="button"
                onClick={submitMarks}
                disabled={loading || Object.keys(marks).length === 0}
                style={{
                  ...btnBase,
                  background: loading ? "#cbd5e1" : "#3b82f6",
                  color: "white",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Saving…" : "Save marks"}
              </button>
              <button
                type="button"
                onClick={submitToHomeroom}
                disabled={submitting || Object.keys(existingMarks).length === 0}
                style={{
                  ...btnBase,
                  background: submitting ? "#cbd5e1" : "#10b981",
                  color: "white",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Submitting…" : "Submit to homeroom"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                style={{ ...btnBase, background: "#64748b", color: "white" }}
              >
                Back
              </button>
            </div>
            <p className="mark-entry-panel__tip">
              Save marks to the database first, then notify the homeroom
              teacher. You can change marks anytime.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkEntry;
