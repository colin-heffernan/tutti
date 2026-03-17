// this will talk to the database


import CONFIG from "../config";

const api = {
  // database request wrapper ---
  async getCsrfToken() {
    const response = await fetch(`${CONFIG.API_BASE}/csrf/`, {
      credentials: 'include',
    });
    const data = await response.json();
    return data.csrfToken;
  },

  async request(endpoint, options = {}) {
    // const token = localStorage.getItem("tutti_access_token");

    const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
      ...options,
      /*headers: {
        "Content-Type": "application/json",
        // ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },*/
      headers: (
        options.method === "POST"
          ? {
              "X-CSRFToken": await this.getCsrfToken(),
              "Content-Type": "application/json",
              ...options.headers,
            }
          : {
              "Content-Type": "application/json",
              ...options.headers,
          }
      ),
    });

    // refresing tokens
    if (response.status === 401) {
      const refreshed = await api.refreshToken();
      if (refreshed) return api.request(endpoint, options);
      localStorage.removeItem("tutti_access_token");
      localStorage.removeItem("tutti_refresh_token");
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed: ${response.status}`);
    }

    return response.json();
  },

  /*async refreshToken() {
    const refreshToken = localStorage.getItem("tutti_refresh_token");
    if (!refreshToken) return false;
    try {
      const response = await fetch(`${CONFIG.API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("tutti_access_token", data.access);
        return true;
      }
    } catch {}
    return false;
  },*/

  // standard auth not gogle
  async register(userData) {
    const data = await api.request("/auth/register/", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    // localStorage.setItem("tutti_access_token", data.access);
    // localStorage.setItem("tutti_refresh_token", data.refresh);
    return data;
  },

  async login(credentials) {
    const data = await api.request("/auth/login/", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    // localStorage.setItem("tutti_access_token", data.access);
    // localStorage.setItem("tutti_refresh_token", data.refresh);
    return data;
  },

  async logout() {
    try {
      await api.request("/auth/logout/", {
        // method: "POST",
        // body: JSON.stringify({
        //   refresh: localStorage.getItem("tutti_refresh_token"),
        // }),
      });
    } finally {
      // localStorage.removeItem("tutti_access_token");
      // localStorage.removeItem("tutti_refresh_token");
    }
  },


  // Sends the authorization code from Google's redirect to Django then Django exchanges it for user info using the Client Secret.
  /* async googleAuth(code) {
    const data = await api.request("/auth/google/", {
      method: "POST",
      body: JSON.stringify({ code, redirect_uri: CONFIG.GOOGLE_REDIRECT_URI }),
    });
    localStorage.setItem("tutti_access_token", data.access);
    localStorage.setItem("tutti_refresh_token", data.refresh);
    return data;
  }, */

  // user profile
  async getProfile() {
    return api.request("/auth/me");
  },

  async updateLocation(lat, lng, city, country) {
    return api.request("/auth/me", {
      method: "PUT",
      body: JSON.stringify({ latitude: lat, longitude: lng, city, country }),
    });
  },

  async saveMusicProfile(songIds) {
    return api.request("/auth/me/music-profile", {
      method: "POST",
      body: JSON.stringify({ recording_ids: songIds }),
    });
  },
};

export default api;
