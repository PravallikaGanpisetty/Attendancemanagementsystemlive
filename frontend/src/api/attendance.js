const API_BASE = import.meta.env.VITE_API_BASE || "/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getClasses() {
  const res = await fetch(`${API_BASE}/attendance/classes`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch classes" }));
    throw new Error(error.message || "Failed to fetch classes");
  }
  return res.json();
}

export async function createClass(classData) {
  const res = await fetch(`${API_BASE}/attendance/classes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(classData),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to create class" }));
    throw new Error(error.message || "Failed to create class");
  }
  return res.json();
}

export async function getStudents() {
  const res = await fetch(`${API_BASE}/attendance/students`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch students" }));
    throw new Error(error.message || "Failed to fetch students");
  }
  return res.json();
}

export async function addStudentToClass(classId, studentId) {
  const res = await fetch(`${API_BASE}/attendance/classes/${classId}/students`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ studentId }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to add student" }));
    throw new Error(error.message || "Failed to add student");
  }
  return res.json();
}

export async function getClassStudents(classId) {
  const res = await fetch(`${API_BASE}/attendance/classes/${classId}/students`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch students" }));
    throw new Error(error.message || "Failed to fetch students");
  }
  return res.json();
}

export async function markAttendance(classId, date, attendance) {
  const res = await fetch(`${API_BASE}/attendance/mark`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ classId, date, attendance }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to mark attendance" }));
    throw new Error(error.message || "Failed to mark attendance");
  }
  return res.json();
}

export async function getAttendanceByClassAndDate(classId, date) {
  const res = await fetch(`${API_BASE}/attendance/class/${classId}/date/${date}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch attendance" }));
    throw new Error(error.message || "Failed to fetch attendance");
  }
  return res.json();
}

export async function getStudentAttendance(studentId) {
  const res = await fetch(`${API_BASE}/attendance/student/${studentId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch attendance" }));
    throw new Error(error.message || "Failed to fetch attendance");
  }
  return res.json();
}

export async function getStudentStats(studentId) {
  const res = await fetch(`${API_BASE}/attendance/student/${studentId}/stats`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch stats" }));
    throw new Error(error.message || "Failed to fetch stats");
  }
  return res.json();
}

export async function getStudentClasses(studentId) {
  const res = await fetch(`${API_BASE}/attendance/student/${studentId}/classes`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch classes" }));
    throw new Error(error.message || "Failed to fetch classes");
  }
  return res.json();
}

export async function removeStudentFromClass(classId, studentId) {
  const res = await fetch(`${API_BASE}/attendance/classes/${classId}/students/${studentId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to remove student" }));
    throw new Error(error.message || "Failed to remove student");
  }
  return res.json();
}

export async function deleteClass(classId) {
  const res = await fetch(`${API_BASE}/attendance/classes/${classId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to delete class" }));
    throw new Error(error.message || "Failed to delete class");
  }
  return res.json();
}

export async function updateAttendance(attendanceId, status, remarks) {
  const res = await fetch(`${API_BASE}/attendance/attendance/${attendanceId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, remarks }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to update attendance" }));
    throw new Error(error.message || "Failed to update attendance");
  }
  return res.json();
}

export async function deleteAttendance(attendanceId) {
  const res = await fetch(`${API_BASE}/attendance/attendance/${attendanceId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to delete attendance" }));
    throw new Error(error.message || "Failed to delete attendance");
  }
  return res.json();
}

export async function getClassSummary(classId, startDate, endDate) {
  let url = `${API_BASE}/attendance/classes/${classId}/summary`;
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (params.toString()) url += '?' + params.toString();
  
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch summary" }));
    throw new Error(error.message || "Failed to fetch summary");
  }
  return res.json();
}

export async function getStudentAttendanceByRange(studentId, startDate, endDate, classId) {
  let url = `${API_BASE}/attendance/student/${studentId}/range`;
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (classId) params.append('classId', classId);
  if (params.toString()) url += '?' + params.toString();
  
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch attendance" }));
    throw new Error(error.message || "Failed to fetch attendance");
  }
  return res.json();
}

