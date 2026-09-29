const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

function authHeaders() {
  const token =
    localStorage.getItem("scms_token") ||
    sessionStorage.getItem("scms_token");

  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// SENIOR CITIZENS

export async function getSeniorCitizens() {
  const response = await fetch(`${API_URL}/senior-citizens`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load senior citizens");
  }

  return response.json();
}

export async function createSeniorCitizen(data) {
  const response = await fetch(`${API_URL}/senior-citizens`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Laravel validation error:", errorData);
    throw new Error("Failed to create senior citizen");
  }

  return response.json();
}

export async function deleteSeniorCitizen(id) {
  const response = await fetch(`${API_URL}/senior-citizens/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete senior citizen");
  }

  return response.json();
}

export async function updateSeniorCitizen(id, data) {
  const response = await fetch(`${API_URL}/senior-citizens/${id}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Laravel update error:", errorData);
    throw new Error("Failed to update senior citizen");
  }

  return response.json();
}

// ANNOUNCEMENTS

export async function getAnnouncements() {
  const response = await fetch(`${API_URL}/announcements`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load announcements");
  }

  return response.json();
}

export async function createAnnouncement(data) {
  const response = await fetch(`${API_URL}/announcements`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Laravel announcement error:", errorData);
    throw new Error("Failed to create announcement");
  }

  return response.json();
}

export async function updateAnnouncement(id, data) {
  const response = await fetch(`${API_URL}/announcements/${id}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Laravel announcement update error:", errorData);
    throw new Error("Failed to update announcement");
  }

  return response.json();
}

export async function deleteAnnouncement(id) {
  const response = await fetch(`${API_URL}/announcements/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete announcement");
  }

  return response.json();
}

// APPLICATIONS

export async function getApplications() {
  const response = await fetch(`${API_URL}/applications`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load applications");
  }

  return response.json();
}

export async function updateApplication(id, data) {
  const response = await fetch(`${API_URL}/applications/${id}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Laravel application update error:", errorData);
    throw new Error("Failed to update application");
  }

  return response.json();
}

export async function deleteApplication(id) {
  const response = await fetch(`${API_URL}/applications/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete application");
  }

  return response.json();
}

// LOGIN AND LOGOUT

export async function loginUser(username, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

export async function logoutUser() {
  const token =
    localStorage.getItem("scms_token") ||
    sessionStorage.getItem("scms_token");

  if (!token) return;

  const response = await fetch(`${API_URL}/logout`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }

  return response.json();
}

// PASSWORD RECOVERY

export async function resetPassword({
  token,
  email,
  password,
  password_confirmation,
}) {
  const response = await fetch(`${API_URL}/reset-password`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      email,
      password,
      password_confirmation,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const validationMessage = Object.values(data.errors || {})
      .flat()
      .find(Boolean);

    throw new Error(
      validationMessage || data.message || "Unable to reset your password."
    );
  }

  return data;
}

export async function sendPasswordResetLink(email) {
  const response = await fetch(`${API_URL}/forgot-password`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    const validationMessage = Object.values(data.errors || {})
      .flat()
      .find(Boolean);

    throw new Error(
      validationMessage ||
        data.message ||
        "Unable to send the reset link. Please try again."
    );
  }

  return data;
}

// PENSION RELEASES

export async function getPensionReleases() {
  const response = await fetch(`${API_URL}/pension-releases`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load pension releases");
  }

  return response.json();
}

export async function createPensionRelease(data) {
  const response = await fetch(`${API_URL}/pension-releases`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("Laravel pension release error:", result);
    throw new Error(result.message || "Failed to create pension release");
  }

  return result;
}

// USER MANAGEMENT
//
// These routes are assumed; confirm them in your backend routes/api.php:
// GET   /api/users
// POST  /api/users
// PATCH /api/users/{id}
// POST  /api/users/{id}/reset-password

async function userManagementRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
    },
  });

  const text = await response.text();
  let result = null;

  if (text.trim()) {
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(
        `User Management received a non-JSON response (HTTP ${response.status}). Check the backend API route.`
      );
    }
  }

  if (!response.ok) {
    const validationMessage = Object.values(result?.errors || {})
      .flat()
      .find(Boolean);

    throw new Error(
      validationMessage ||
        result?.message ||
        `User Management request failed (HTTP ${response.status}).`
    );
  }

  return result;
}

function savedUserFromResponse(result) {
  const user = result?.user ?? result?.data ?? result;

  if (!user || typeof user !== "object" || user.id == null) {
    throw new Error(
      "The request succeeded, but the API did not return the saved user record. Refresh the page to check the result."
    );
  }

  return user;
}

export async function getUsers() {
  const result = await userManagementRequest("/users");

  const users = Array.isArray(result)
    ? result
    : result?.data ?? result?.users;

  if (!Array.isArray(users)) {
    throw new Error("The API did not return a valid list of users.");
  }

  return users;
}

export async function createUser(data) {
  const result = await userManagementRequest("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return savedUserFromResponse(result);
}

export async function updateUser(id, data) {
  const result = await userManagementRequest(
    `/users/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

  return savedUserFromResponse(result);
}

export async function resetUserPassword(id, password, confirmation) {
  return userManagementRequest(
    `/users/${encodeURIComponent(id)}/reset-password`,
    {
      method: "POST",
      body: JSON.stringify({
        password,
        password_confirmation: confirmation,
      }),
    }
  );
}

function mapMedicalRequest(row) {
  return {
    id: row.id,
    reference: row.reference || "",
    seniorName: row.senior_name || "",
    seniorId: row.senior_id || "",
    deathDate: row.death_date
  ? String(row.death_date).slice(0, 10)
  : "",
    purok: row.purok || "",
    contact: row.contact || "",
    funeralHome: row.funeral_home || "",
    assistanceType: row.assistance_type || "Medicine",
    requestDate: row.request_date
      ? String(row.request_date).slice(0, 10)
      : "",
    facility: row.facility || "",
    status: row.status || "Pending",
    completedDate: row.completed_date
      ? String(row.completed_date).slice(0, 10)
      : "",
    receivedBy: row.received_by || "",
    remarks: row.remarks || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function medicalRequestPayload(data) {
  return {
    reference: data.reference || null,
    senior_name: data.seniorName,
    senior_id: data.seniorId,
    purok: data.purok || null,
    contact: data.contact || null,
    assistance_type: data.assistanceType,
    request_date: data.requestDate,
    facility: data.facility || null,
    status: data.status,
    completed_date: data.completedDate || null,
    received_by: data.receivedBy || null,
    remarks: data.remarks || null,
  };
}

export async function getMedicalRequests() {
  const response = await fetch(`${API_URL}/medical-requests`, {
    headers: authHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load medical requests");
  }

  return data.map(mapMedicalRequest);
}

export async function createMedicalRequest(request) {
  const response = await fetch(`${API_URL}/medical-requests`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(medicalRequestPayload(request)),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Laravel medical request error:", data);
    throw new Error(data.message || "Failed to create medical request");
  }

  return mapMedicalRequest(data);
}

export async function updateMedicalRequest(id, request) {
  const response = await fetch(`${API_URL}/medical-requests/${id}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(medicalRequestPayload(request)),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update medical request");
  }

  return mapMedicalRequest(data);
}

export async function deleteMedicalRequest(id) {
  const response = await fetch(`${API_URL}/medical-requests/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete medical request");
  }

  return data;
}

function mapBurialRequest(row) {
  return {
    id: row.id,
    reference: row.reference || "",
    seniorName: row.senior_name || "",
    claimantName: row.claimant_name || "",
    seniorId: row.senior_id || "",
    purok: row.purok || "",
    contact: row.contact || "",
    requestDate: row.request_date
      ? String(row.request_date).slice(0, 10)
      : "",
    status: row.status || "Pending",
    relationship: row.relationship || "",
    releaseDate: row.release_date
      ? String(row.release_date).slice(0, 10)
      : "",
    receivedBy: row.received_by || "",
    remarks: row.remarks || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

function burialRequestPayload(data) {
  return {
    reference: data.reference || null,
    senior_name: data.seniorName,
    claimant_name: data.claimantName,
    senior_id: data.seniorId || null,
    death_date: data.deathDate || null,
    purok: data.purok || null,
    contact: data.contact || null,
    funeral_home: data.funeralHome || null,
    request_date: data.requestDate,
    status: data.status,
    relationship: data.relationship,
    release_date: data.releaseDate || null,
    received_by: data.receivedBy || null,
    remarks: data.remarks || null,
  };
}

export async function getBurialRequests() {
  const response = await fetch(`${API_URL}/burial-requests`, {
    headers: authHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load burial requests");
  }

  return data.map(mapBurialRequest);
}

export async function createBurialRequest(request) {
  const response = await fetch(`${API_URL}/burial-requests`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(burialRequestPayload(request)),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Laravel burial request error:", data);
    throw new Error(data.message || "Failed to create burial request");
  }

  return mapBurialRequest(data);
}

export async function updateBurialRequest(id, request) {
  const response = await fetch(`${API_URL}/burial-requests/${id}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(burialRequestPayload(request)),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update burial request");
  }

  return mapBurialRequest(data);
}

export async function deleteBurialRequest(id) {
  const response = await fetch(`${API_URL}/burial-requests/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete burial request");
  }

  return data;
}