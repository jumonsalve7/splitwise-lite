const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001/api"
).replace(/\/+$/, "");

async function request(path, { method = "GET", body, token } = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${normalizedPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed with status ${response.status}`,
    );
  }

  return data;
}

export const authApi = {
  signup: (payload) =>
    request("/auth/signup", {
      method: "POST",
      body: payload,
    }),

  signin: (payload) =>
    request("/auth/signin", {
      method: "POST",
      body: payload,
    }),

  demoLogin: () =>
    request("/auth/demo", {
      method: "POST",
    }),
};

export const groupsApi = {
  getAll: (token) =>
    request("/groups", {
      token,
    }),

  create: (payload, token) =>
    request("/groups", {
      method: "POST",
      body: payload,
      token,
    }),

  getById: (id, token) =>
    request(`/groups/${id}`, {
      token,
    }),

  update: (id, payload, token) =>
    request(`/groups/${id}`, {
      method: "PATCH",
      body: payload,
      token,
    }),

  remove: (id, token) =>
    request(`/groups/${id}`, {
      method: "DELETE",
      token,
    }),

  addExpense: (id, payload, token) =>
    request(`/groups/${id}/expenses`, {
      method: "POST",
      body: payload,
      token,
    }),

  updateMembers: (id, members, token) =>
    request(`/groups/${id}/members`, {
      method: "PATCH",
      body: { members },
      token,
    }),
};