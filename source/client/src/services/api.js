const API_URL = "/api";

class ApiService {
  // Helper method to get auth headers
  getHeaders(token) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  // Auth APIs
  async login(username, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    return data;
  }

  async register({ username, email, password }) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Registration failed");
    }

    return res.json();
  }

  async logout(token) {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: this.getHeaders(token),
    });

    return response.json();
  }

  async verifyToken(token) {
    const response = await fetch(`${API_URL}/auth/verify`, {
      headers: this.getHeaders(token),
    });

    if (!response.ok) {
      return { valid: false };
    }

    return response.json();
  }

  // Problem APIs
  async getProblems() {
    const response = await fetch(`${API_URL}/problems`);
    return response.json();
  }

  async getProblem(id) {
    const response = await fetch(`${API_URL}/problems/${id}`);
    return response.json();
  }

  // Submission APIs
  async submitCode(data, token) {
    const res = await fetch(`${API_URL}/submit`, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw json;
    return json; // returns submissionId etc
  }

  async getSubmission(id, token) {
    const res = await fetch(`${API_URL}/submission/${id}`, {
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw json;
    return json;
  }

  async getSubmissions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_URL}/submissions${queryString ? `?${queryString}` : ""}`
    );
    return response.json();
  }

  // User APIs
  async getUser(id, token) {
    const res = await fetch(`${API_URL}/user/${id}`, {
      headers: this.getHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw json;
    return json;
  }

  async getLeaderboard(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${API_URL}/leaderboard${queryString ? `?${queryString}` : ""}`
    );
    return response.json();
  }
}

const apiService = new ApiService();
export default apiService;
