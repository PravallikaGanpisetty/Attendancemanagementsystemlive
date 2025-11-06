import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentAttendance, getStudentStats, getStudentClasses, getStudentAttendanceByRange } from "../api/attendance";
import "../styles/Dashboard.css";

export default function StudentDashboard() {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [useDateRange, setUseDateRange] = useState(false);
  const [previousClassCount, setPreviousClassCount] = useState(0);
  const [newClassNotification, setNewClassNotification] = useState(false);
  const [classChangeType, setClassChangeType] = useState('added'); // 'added' or 'removed'
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
      navigate("/login");
      return;
    }
    loadData();
    // Auto-refresh every 5 seconds to catch new class additions and attendance faster
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]); // loadData is stable, dependencies handled internally

  async function loadData(silent = false) {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.id) {
        navigate("/login");
        return;
      }
      
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError("");
      
      // Load data separately to handle errors gracefully
      let attendanceData = [];
      let statsData = null;
      let classesData = [];
      
      try {
        if (useDateRange && startDate && endDate) {
          attendanceData = await getStudentAttendanceByRange(
            user.id,
            startDate,
            endDate,
            filterClass !== "all" ? filterClass : undefined
          );
        } else {
          attendanceData = await getStudentAttendance(user.id);
        }
        // Ensure we got an array
        if (!Array.isArray(attendanceData)) {
          console.warn("Attendance data is not an array:", attendanceData);
          attendanceData = [];
        }
      } catch (err) {
        console.error("Error loading attendance:", err);
        // Don't set error for attendance, just use empty array
        attendanceData = [];
      }
      
      try {
        statsData = await getStudentStats(user.id);
      } catch (err) {
        console.error("Error loading stats:", err);
        // Don't set error for stats
      }
      
      try {
        classesData = await getStudentClasses(user.id);
        if (!Array.isArray(classesData)) {
          console.warn("Classes data is not an array:", classesData);
          classesData = [];
        }
      } catch (err) {
        console.error("Error loading classes:", err);
        // Only show error if it's a real error, not just empty result
        if (err.message && !err.message.includes("403")) {
          setError("Failed to load classes: " + (err.message || "Unknown error"));
        }
        classesData = [];
      }
      
      setAttendance(attendanceData || []);
      setStats(statsData);
      const newClasses = classesData || [];
      const currentClassCount = newClasses.length;
      
      // Check if classes changed (added or removed) - compare before updating state
      if (previousClassCount > 0) {
        if (currentClassCount > previousClassCount) {
          // New class added
          setClassChangeType('added');
          setNewClassNotification(true);
          setTimeout(() => setNewClassNotification(false), 5000);
        } else if (currentClassCount < previousClassCount) {
          // Class removed
          setClassChangeType('removed');
          setNewClassNotification(true);
          setTimeout(() => setNewClassNotification(false), 5000);
        }
      }
      
      // Update previous count for next comparison
      setPreviousClassCount(currentClassCount);
      setClasses(newClasses);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error in loadData:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (useDateRange && (startDate || endDate)) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, useDateRange]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getStatusBadge(status) {
    const badges = {
      present: { class: "badge-present", text: "Present" },
      absent: { class: "badge-absent", text: "Absent" },
      late: { class: "badge-late", text: "Late" },
    };
    const badge = badges[status] || badges.absent;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  }

  function exportToCSV() {
    const filtered = getFilteredAttendance();
    const headers = ["Date", "Class", "Code", "Status", "Remarks"];
    const rows = filtered.map(record => [
      formatDate(record.date),
      record.classId?.name || "N/A",
      record.classId?.code || "N/A",
      record.status,
      record.remarks || ""
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function getFilteredAttendance() {
    if (!Array.isArray(attendance)) return [];
    return attendance.filter(record => {
      if (!record) return false;
      if (filterClass !== "all" && record.classId?._id !== filterClass && record.classId?._id?.toString() !== filterClass) return false;
      if (filterStatus !== "all" && record.status !== filterStatus) return false;
      if (searchTerm && record.classId) {
        const nameMatch = record.classId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const codeMatch = record.classId?.code?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!nameMatch && !codeMatch) return false;
      }
      return true;
    });
  }

  function getClassAttendanceCount(classId) {
    return attendance.filter(record => 
      record.classId?._id === classId || record.classId?._id?.toString() === classId?.toString()
    ).length;
  }

  function getClassAttendanceStats(classId) {
    if (!Array.isArray(attendance) || !classId) {
      return { total: 0, present: 0, absent: 0, late: 0, percentage: 0 };
    }
    const classAttendance = attendance.filter(record => 
      record && record.classId && (
        record.classId._id === classId || 
        record.classId._id?.toString() === classId?.toString() ||
        (typeof record.classId === 'string' && record.classId === classId)
      )
    );
    const total = classAttendance.length;
    const present = classAttendance.filter(a => a && a.status === 'present').length;
    const absent = classAttendance.filter(a => a && a.status === 'absent').length;
    const late = classAttendance.filter(a => a && a.status === 'late').length;
    const percentage = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0;
    return { total, present, absent, late, percentage };
  }

  function formatTime(date) {
    if (!date) return "";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
          <div>
            <h1>Student Dashboard</h1>
            {lastUpdated && (
              <p className="last-updated">
                Last updated: {formatTime(lastUpdated)}
                {refreshing && <span className="refreshing-indicator"> (Refreshing...)</span>}
              </p>
            )}
          </div>
          <div className="user-info">
            <span>Welcome, {JSON.parse(localStorage.getItem("user") || "{}").name || "Student"}</span>
            <button 
              onClick={() => {
                loadData();
              }} 
              className="btn-secondary" 
              disabled={refreshing}
              title="Click to manually refresh and see newly added classes"
            >
              {refreshing ? "🔄 Refreshing..." : "🔄 Refresh Now"}
            </button>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}
        {newClassNotification && (
          <div className="success-message" style={{ 
            backgroundColor: classChangeType === 'added' ? '#28a745' : '#ffc107', 
            color: 'white', 
            padding: '12px', 
            borderRadius: '4px', 
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>
              {classChangeType === 'added' 
                ? '🎉 New class added! Your classes have been updated.' 
                : '📝 Class removed. Your classes have been updated.'}
            </span>
            <button 
              onClick={() => setNewClassNotification(false)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'white', 
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ×
            </button>
          </div>
        )}

        {stats && (
          <div className="stats-grid">
            <div className="stat-card stat-primary">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>{stats.percentage}%</h3>
                <p>Attendance Rate</p>
              </div>
            </div>
            <div className="stat-card stat-success">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{stats.present}</h3>
                <p>Present</p>
              </div>
            </div>
            <div className="stat-card stat-warning">
              <div className="stat-icon">⏰</div>
              <div className="stat-info">
                <h3>{stats.late}</h3>
                <p>Late</p>
              </div>
            </div>
            <div className="stat-card stat-danger">
              <div className="stat-icon">❌</div>
              <div className="stat-info">
                <h3>{stats.absent}</h3>
                <p>Absent</p>
              </div>
            </div>
            <div className="stat-card stat-info">
              <div className="stat-icon">📝</div>
              <div className="stat-info">
                <h3>{stats.total}</h3>
                <p>Total Records</p>
              </div>
            </div>
          </div>
        )}

        {classes.length > 0 && (
          <div className="section">
            <div className="section-header">
              <h2>My Classes ({classes.length})</h2>
            </div>
            <div className="classes-grid">
              {classes.map((cls, index) => {
                if (!cls || !cls._id) return null;
                const classStats = getClassAttendanceStats(cls._id);
                return (
                  <div key={cls._id || `class-${index}`} className="class-card">
                    <div className="class-header">
                      <h3>{cls.name || "Unnamed Class"}</h3>
                      <span className="class-code-badge">{cls.code || "N/A"}</span>
                    </div>
                    <p className="class-faculty">Faculty: {cls.facultyId?.name || "N/A"}</p>
                    {classStats.total > 0 ? (
                      <div className="class-stats">
                        <div className="class-stat-item">
                          <span className="stat-label">Attendance:</span>
                          <span className="stat-value">{classStats.percentage}%</span>
                        </div>
                        <div className="class-stat-details">
                          <span className="stat-detail present">{classStats.present} Present</span>
                          <span className="stat-detail absent">{classStats.absent} Absent</span>
                          {classStats.late > 0 && (
                            <span className="stat-detail late">{classStats.late} Late</span>
                          )}
                        </div>
                        <div className="class-stat-total">
                          Total Records: {classStats.total}
                        </div>
                      </div>
                    ) : (
                      <div className="class-no-attendance">
                        <p>No attendance records yet</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {classes.length === 0 && (
          <div className="section">
            <div className="empty-state">
              <p>You are not enrolled in any classes yet. Contact your faculty to be added to a class.</p>
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                💡 Tip: Click "Refresh Now" button above if you were just added to a class. Classes update every 5 seconds automatically.
              </p>
            </div>
          </div>
        )}

        <div className="section">
          <div className="section-header">
            <h2>Attendance History ({attendance.length} records)</h2>
            <div className="header-actions">
              {attendance.length > 0 && (
                <button onClick={exportToCSV} className="btn-secondary">
                  📥 Export CSV
                </button>
              )}
            </div>
          </div>

          {attendance.length === 0 ? (
            <div className="empty-state">
              <p>No attendance records found. Your attendance will appear here once your faculty marks it.</p>
            </div>
          ) : (
            <>
              <div className="filters-section">
                <div className="filter-group">
                  <label>Filter by Class:</label>
                  <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                    <option value="all">All Classes</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} ({cls.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Filter by Status:</label>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Search:</label>
                  <input
                    type="text"
                    placeholder="Search by class name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="filter-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={useDateRange}
                      onChange={(e) => {
                        setUseDateRange(e.target.checked);
                        if (!e.target.checked) {
                          setStartDate("");
                          setEndDate("");
                        }
                      }}
                      style={{ marginRight: '5px' }}
                    />
                    Use Date Range
                  </label>
                  {useDateRange && (
                    <>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="Start Date"
                        style={{ marginTop: '8px' }}
                      />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="End Date"
                        style={{ marginTop: '8px' }}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Class</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredAttendance().map((record, index) => (
                      <tr key={record._id || record.id || `record-${index}`}>
                        <td>{record.date ? formatDate(record.date) : "N/A"}</td>
                        <td>
                          <strong>{record.classId?.name || "N/A"}</strong>
                          <br />
                          <small className="text-muted">{record.classId?.code || "N/A"}</small>
                        </td>
                        <td>{getStatusBadge(record.status || "absent")}</td>
                        <td>{record.remarks || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {getFilteredAttendance().length === 0 && (
                  <div className="empty-state">
                    <p>No records match your filters.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

