const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

class APIService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
      }

      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Problems
  async getProblems() {
    return this.request("/problems");
  }

  async getProblem(id) {
    return this.request(`/problems/${id}`);
  }

  // Submissions
  async submitCode(data) {
    return this.request("/submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSubmission(id) {
    return this.request(`/submission/${id}`);
  }

  async getUserSubmissions(userId, options = {}) {
    const params = new URLSearchParams({
      userId,
      ...options,
    });
    return this.request(`/submissions?${params}`);
  }

  // Users & Leaderboard
  async getLeaderboard(limit = 100) {
    return this.request(`/leaderboard?limit=${limit}`);
  }

  async getUser(userId) {
    return this.request(`/user/${userId}`);
  }

  // Health & Metrics
  async getHealth() {
    return this.request("/health");
  }

  async getMetrics() {
    return this.request("/metrics");
  }
}

export default new APIService();
