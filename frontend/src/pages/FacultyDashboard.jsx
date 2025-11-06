import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getClasses,
  createClass,
  getStudents,
  addStudentToClass,
  getClassStudents,
  markAttendance,
  getAttendanceByClassAndDate,
  removeStudentFromClass,
  deleteClass,
  updateAttendance,
  deleteAttendance,
  getClassSummary,
} from "../api/attendance";
import "../styles/Dashboard.css";

export default function FacultyDashboard() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClass, setNewClass] = useState({ name: "", code: "" });
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryStartDate, setSummaryStartDate] = useState("");
  const [summaryEndDate, setSummaryEndDate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id || user.role !== "faculty") {
      navigate("/login");
      return;
    }
    loadData();
  }, [navigate]);

  useEffect(() => {
    if (selectedClass) {
      loadClassStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && classStudents.length > 0) {
      loadAttendanceForDate(classStudents);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceDate, selectedClass, classStudents.length]);

  async function loadData() {
    try {
      setLoading(true);
      const [classesData, studentsData] = await Promise.all([
        getClasses(),
        getStudents(),
      ]);
      setClasses(classesData);
      setStudents(studentsData);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function loadClassStudents() {
    if (!selectedClass) return;
    try {
      const data = await getClassStudents(selectedClass._id);
      setClassStudents(data);
      // Load existing attendance for the date
      await loadAttendanceForDate(data);
    } catch (err) {
      setError(err.message || "Failed to load students");
    }
  }

  async function loadAttendanceForDate(students = classStudents) {
    if (!selectedClass || !attendanceDate) {
      // Initialize with default values if no students yet
      if (students.length > 0) {
        const records = {};
        students.forEach((student) => {
          records[student._id] = { status: "present", remarks: "", attendanceId: null };
        });
        setAttendanceRecords(records);
      }
      return;
    }
    
    if (students.length === 0) {
      setAttendanceRecords({});
      return;
    }
    
    try {
      const existing = await getAttendanceByClassAndDate(
        selectedClass._id,
        attendanceDate
      );
      const records = {};
      students.forEach((student) => {
        const existingRecord = existing.find(
          (a) => (a.studentId?._id || a.studentId)?.toString() === student._id?.toString()
        );
        records[student._id] = {
          status: existingRecord?.status || "present",
          remarks: existingRecord?.remarks || "",
          attendanceId: existingRecord?._id || null
        };
      });
      setAttendanceRecords(records);
    } catch (err) {
      console.error("Failed to load existing attendance:", err);
      // Initialize with default values on error
      const records = {};
      students.forEach((student) => {
        records[student._id] = { status: "present", remarks: "", attendanceId: null };
      });
      setAttendanceRecords(records);
    }
  }

  async function handleCreateClass(e) {
    e?.preventDefault();
    if (!newClass.name || !newClass.code) {
      setError("Please fill in both class name and code");
      return;
    }
    if (newClass.name.trim() === "" || newClass.code.trim() === "") {
      setError("Class name and code cannot be empty");
      return;
    }
    try {
      setError("");
      const created = await createClass({
        name: newClass.name.trim(),
        code: newClass.code.trim().toUpperCase()
      });
      // Reload classes to get the full populated data
      await loadData();
      setShowCreateClass(false);
      setNewClass({ name: "", code: "" });
    } catch (err) {
      setError(err.message || "Failed to create class");
    }
  }

  async function handleAddStudent(studentId) {
    if (!selectedClass) return;
    try {
      setError("");
      await addStudentToClass(selectedClass._id, studentId);
      // Reload class students to show updated list
      await loadClassStudents();
      // Also reload classes list to update student count
      await loadData();
      setShowAddStudent(false);
      alert("Student added successfully! The student will see this class in their dashboard.");
    } catch (err) {
      setError(err.message || "Failed to add student");
    }
  }

  async function handleMarkAttendance() {
    if (!selectedClass) return;
    try {
      setError("");
      const attendance = Object.entries(attendanceRecords).map(
        ([studentId, data]) => ({
          studentId,
          status: data.status,
          remarks: data.remarks || "",
        })
      );
      
      if (attendance.length === 0) {
        setError("No students to mark attendance for");
        return;
      }
      
      await markAttendance(selectedClass._id, attendanceDate, attendance);
      // Reload attendance to show updated data
      await loadAttendanceForDate(classStudents);
      alert("Attendance marked successfully! Students can now see their attendance.");
    } catch (err) {
      setError(err.message || "Failed to mark attendance");
    }
  }

  function markAllAs(status) {
    const records = { ...attendanceRecords };
    Object.keys(records).forEach(studentId => {
      records[studentId] = { ...records[studentId], status };
    });
    setAttendanceRecords(records);
  }

  async function handleRemoveStudent(studentId) {
    if (!selectedClass) return;
    if (!window.confirm("Are you sure you want to remove this student from the class?")) return;
    try {
      await removeStudentFromClass(selectedClass._id, studentId);
      await loadClassStudents();
      setError("");
    } catch (err) {
      setError(err.message || "Failed to remove student");
    }
  }

  async function handleDeleteClass(classId) {
    if (!window.confirm("Are you sure you want to delete this class? All attendance records will be deleted.")) return;
    try {
      await deleteClass(classId);
      await loadData();
      setSelectedClass(null);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to delete class");
    }
  }

  async function handleLoadSummary() {
    if (!selectedClass) return;
    try {
      const data = await getClassSummary(
        selectedClass._id,
        summaryStartDate || undefined,
        summaryEndDate || undefined
      );
      setSummaryData(data);
      setShowSummary(true);
    } catch (err) {
      setError(err.message || "Failed to load summary");
    }
  }

  async function handleDeleteAttendanceForStudent(studentId) {
    if (!window.confirm("Are you sure you want to delete this attendance record?")) return;
    try {
      const record = attendanceRecords[studentId];
      if (record?.attendanceId) {
        await deleteAttendance(record.attendanceId);
        // Reset to default
        updateAttendanceRecord(studentId, "status", "present");
        updateAttendanceRecord(studentId, "remarks", "");
        updateAttendanceRecord(studentId, "attendanceId", null);
        await loadAttendanceForDate(classStudents);
        setError("");
      }
    } catch (err) {
      setError(err.message || "Failed to delete attendance");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  function updateAttendanceRecord(studentId, field, value) {
    setAttendanceRecords({
      ...attendanceRecords,
      [studentId]: {
        ...attendanceRecords[studentId],
        [field]: value,
      },
    });
  }

  function hasExistingAttendance(studentId) {
    return attendanceRecords[studentId]?.attendanceId !== null && 
           attendanceRecords[studentId]?.attendanceId !== undefined;
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Faculty Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {JSON.parse(localStorage.getItem("user") || "{}").name || "Faculty"}</span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        <div className="section">
          <div className="section-header">
            <h2>My Classes</h2>
            <button
              onClick={() => setShowCreateClass(true)}
              className="btn-primary"
            >
              + Create Class
            </button>
          </div>

          {showCreateClass && (
            <div className="modal-overlay" onClick={() => {
              setShowCreateClass(false);
              setNewClass({ name: "", code: "" });
              setError("");
            }}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Create New Class</h3>
                <form onSubmit={handleCreateClass}>
                  <div className="form-group">
                    <label>Class Name *</label>
                    <input
                      type="text"
                      value={newClass.name}
                      onChange={(e) =>
                        setNewClass({ ...newClass, name: e.target.value })
                      }
                      placeholder="e.g., Mathematics 101"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label>Class Code *</label>
                    <input
                      type="text"
                      value={newClass.code}
                      onChange={(e) =>
                        setNewClass({ ...newClass, code: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g., MATH101"
                      required
                      style={{ textTransform: 'uppercase' }}
                    />
                    <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      Class code must be unique
                    </small>
                  </div>
                  {error && error.includes('class') && (
                    <div className="error-message" style={{ marginBottom: '15px' }}>
                      {error}
                    </div>
                  )}
                  <div className="modal-actions">
                    <button type="submit" className="btn-primary">
                      Create Class
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateClass(false);
                        setNewClass({ name: "", code: "" });
                        setError("");
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {classes.length === 0 ? (
            <div className="empty-state">
              <p>No classes found. Create your first class!</p>
            </div>
          ) : (
            <div className="classes-grid">
              {classes.map((cls, index) => {
                if (!cls || !cls._id) return null;
                return (
                <div
                  key={cls._id || `class-${index}`}
                  className={`class-card ${
                    selectedClass?._id === cls._id ? "active" : ""
                  }`}
                >
                  <div onClick={() => setSelectedClass(cls)} style={{ cursor: 'pointer', flex: 1 }}>
                    <h3>{cls.name || "Unnamed Class"}</h3>
                    <p className="class-code">{cls.code || "N/A"}</p>
                    <p className="class-students">
                      {cls.students?.length || 0} students
                    </p>
                  </div>
                  <div className="class-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(cls._id);
                      }}
                      className="btn-delete-small"
                      title="Delete class"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedClass && (
          <div className="section">
            <div className="section-header">
              <h2>
                Mark Attendance - {selectedClass.name} ({selectedClass.code})
              </h2>
              <div className="header-actions">
                <button
                  onClick={handleLoadSummary}
                  className="btn-secondary"
                >
                  📊 View Summary
                </button>
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="btn-secondary"
                >
                  + Add Student
                </button>
              </div>
            </div>

            {showSummary && summaryData && (
              <div className="modal-overlay" onClick={() => setShowSummary(false)}>
                <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                  <h3>Class Attendance Summary - {summaryData.class.name}</h3>
                  <div className="form-group">
                    <label>Start Date (optional)</label>
                    <input
                      type="date"
                      value={summaryStartDate}
                      onChange={(e) => setSummaryStartDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date (optional)</label>
                    <input
                      type="date"
                      value={summaryEndDate}
                      onChange={(e) => setSummaryEndDate(e.target.value)}
                    />
                  </div>
                  <button onClick={handleLoadSummary} className="btn-primary" style={{ marginBottom: '20px' }}>
                    Apply Filters
                  </button>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Email</th>
                          <th>Total</th>
                          <th>Present</th>
                          <th>Absent</th>
                          <th>Late</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryData.summary.map((stat, idx) => {
                          if (!stat || !stat.student) return null;
                          return (
                          <tr key={idx}>
                            <td>{stat.student.name || "N/A"}</td>
                            <td>{stat.student.email}</td>
                            <td>{stat.total}</td>
                            <td className="stat-present">{stat.present}</td>
                            <td className="stat-absent">{stat.absent}</td>
                            <td className="stat-late">{stat.late}</td>
                            <td><strong>{stat.percentage}%</strong></td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={() => {
                      setShowSummary(false);
                      setSummaryStartDate("");
                      setSummaryEndDate("");
                    }}
                    className="btn-secondary"
                    style={{ marginTop: '20px' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {showAddStudent && (
              <div className="modal-overlay" onClick={() => setShowAddStudent(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <h3>Add Student to Class</h3>
                  <div className="students-list">
                    {students
                      .filter(
                        (s) => s && s._id && !classStudents.some((cs) => cs && cs._id === s._id)
                      )
                      .map((student, index) => {
                        if (!student || !student._id) return null;
                        return (
                        <div
                          key={student._id || `student-${index}`}
                          className="student-item"
                          onClick={() => handleAddStudent(student._id)}
                        >
                          {student.name || "N/A"} ({student.email || "N/A"})
                        </div>
                        );
                      })}
                  </div>
                  <button
                    onClick={() => setShowAddStudent(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            <div className="attendance-controls">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
                {Object.values(attendanceRecords).some(r => r?.attendanceId) && (
                  <small style={{ color: '#28a745', display: 'block', marginTop: '5px' }}>
                    ✓ Existing attendance loaded for this date
                  </small>
                )}
              </div>
              <div className="bulk-actions">
                <button onClick={() => markAllAs("present")} className="btn-bulk btn-success">
                  Mark All Present
                </button>
                <button onClick={() => markAllAs("absent")} className="btn-bulk btn-danger">
                  Mark All Absent
                </button>
                <button onClick={() => markAllAs("late")} className="btn-bulk btn-warning">
                  Mark All Late
                </button>
              </div>
            </div>

            {classStudents.length === 0 ? (
              <div className="empty-state">
                <p>No students in this class. Add students to mark attendance.</p>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Remarks</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classStudents.map((student, index) => {
                        if (!student || !student._id) return null;
                        return (
                        <tr key={student._id || `student-${index}`}>
                          <td>{student.name || "N/A"}</td>
                          <td>{student.email || "N/A"}</td>
                          <td>
                            <select
                              value={attendanceRecords[student._id]?.status || "present"}
                              onChange={(e) =>
                                updateAttendanceRecord(
                                  student._id,
                                  "status",
                                  e.target.value
                                )
                              }
                              className="status-select"
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="late">Late</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={attendanceRecords[student._id]?.remarks || ""}
                              onChange={(e) =>
                                updateAttendanceRecord(
                                  student._id,
                                  "remarks",
                                  e.target.value
                                )
                              }
                              placeholder="Optional remarks"
                              className="remarks-input"
                            />
                          </td>
                            <td>
                              <div className="action-buttons-small">
                                {hasExistingAttendance(student._id) && (
                                  <button
                                    onClick={() => handleDeleteAttendanceForStudent(student._id)}
                                    className="btn-delete-small"
                                    title="Delete attendance record"
                                  >
                                    🗑️
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveStudent(student._id)}
                                  className="btn-delete-small"
                                  title="Remove from class"
                                  style={{ marginLeft: '5px' }}
                                >
                                  👤➖
                                </button>
                              </div>
                            </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="action-buttons">
                  <button
                    onClick={handleMarkAttendance}
                    className="btn-primary btn-large"
                  >
                    Save Attendance
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

