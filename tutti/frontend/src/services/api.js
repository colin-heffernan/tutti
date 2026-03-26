// this will talk to the database


import CONFIG from "../config";

const api = {
  // database request wrapper ---

  // Returns the CSRF token
  // Can throw an error (if the backend is unreachable)
  async getCsrfToken() {
    const response = await fetch(`${CONFIG.API_BASE}/csrf/`, {
      credentials: 'include',
    });
    const data = await response.json();
    return data.csrfToken;
  },

  // Generic request function
  // Includes CSRF token on POST requests
  async request(endpoint, options = {}) {
    const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.method === "POST" && { "X-CSRFToken": await this.getCsrfToken() }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed: ${response.status}`);
    }

    return response.json();
  },

  // Returns true if user is authenticated
  // Returns false or throws error otherwise
  async checkSession() {
      const response = await api.request("/auth/session/");
      return response.isAuthenticated;
  },

  // Sends a request to register a user with the given data
  async register(userData) {
    return await api.request("/auth/register/", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Sends a request to log in a user with the given creds
  async login(credentials) {
    return await api.request("/auth/login/", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  // Sends a request to log out the current user
  async logout() {
    await api.request("/auth/logout/");
  },

  // Sends a request to list the current user's scrobbles
  async getScrobbles() {
    return await api.request("/user/scrobbles/");
  },

  // Sends a request to create a scrobble for the current user with the given data
  async createScrobble(scrobbleData) {
    return await api.request("/user/createscrobble/", {
      method: "POST",
      body: JSON.stringify(scrobbleData),
    });
  },

  // Sends a request to get a scrobble's data
  async getScrobbleData(recording_mbid, release_mbid, scrobble_id) {
    return await api.request("/scrobble/data/", {
      method: "POST",
      body: JSON.stringify({
        "recording_mbid": recording_mbid,
        "release_mbid": release_mbid,
        "scrobble_id": scrobble_id,
      }),
    });
  },

  // Sends a request to get a scrobble's cover
  async getScrobbleCover(release_mbid) {
    return await api.request("/scrobble/cover/", {
      method: "POST",
      body: JSON.stringify({
        "release_mbid": release_mbid,
      }),
    });
  },

  // Sends a request to get the current user's profile
  async getProfile() {
    const request = await api.request("/user/profile/");
    return request.profile;
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
