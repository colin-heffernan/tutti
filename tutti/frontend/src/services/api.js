// this will talk to the database

import CONFIG from "../config";
import Cookies from "js-cookie";

const api = {
  // database request wrapper ---

  // Returns the CSRF token
  async getCsrfToken() {
    /* const response = await fetch(`${CONFIG.API_BASE}/csrf/`, {
      credentials: 'include',
    });
    const data = await response.json();
    return data.csrfToken; */
    return Cookies.get("csrftoken");
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
      if (errorData.detail) throw new Error(errorData.detail);
      if (errorData.non_field_errors) throw new Error(errorData.non_field_errors[0]);
      const firstFieldError = Object.values(errorData).flat()[0];
      if (firstFieldError) throw new Error(String(firstFieldError));
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  },

  // Returns the current user's ID, if authenticated
  async checkSession() {
      return await api.request("/auth/session/");
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
  async getScrobbles(userId) {
    return await api.request(`/user/${userId}/scrobbles/`);
  },

  // Sends a request to create a scrobble for the current user with the given data
  async createScrobble(userId, scrobbleData) {
    return await api.request(`/user/${userId}/scrobbles/`, {
      method: "POST",
      body: JSON.stringify(scrobbleData),
    });
  },

  // Sends a request to get the current user's profile
  async getProfile(userId) {
    return await api.request(`/user/${userId}/profile/`);
  },

  // Sends a request to get the current user's recommendations
  async getRecommendations(userId) {
    return await api.request(`/user/${userId}/recommendations/`);
  },

  // Returns the current user's account info (username, display_name, email, date_joined)
  async getAbout(userId) {
    return await api.request(`/user/${userId}/about/`);
  },

  // Rends a request to set the current user's location
  async updateLocation(userId, city, country) {
    return api.request(`/user/${userId}/about/`, {
      method: "POST",
      body: JSON.stringify({ "action": "location", city, country }),
    });
  },

  // Sends a request to get a song's data
  async getSongData(songId) {
    return await api.request(`/song/${songId}/metadata/`);
  },

  // Sends a request to get a song's cover
  async getSongCover(songId) {
    return await api.request(`/song/${songId}/cover/`);
  },

  async saveMusicProfile(songIds) {
    return api.request("/auth/me/music-profile", {
      method: "POST",
      body: JSON.stringify({ recording_ids: songIds }),
    });
  },

   async rateScrobble(scrobble_id, like) {
      return await api.request(`/scrobble/${scrobble_id}/`, {
        method: "POST",
        body: JSON.stringify({ like }),
      });
    },

    async getFriends(userId) {
        return await api.request(`/user/${userId}/friends/`);
    },

    async getInboundFriendRequests(userId) {
        return await api.request(`/user/${userId}/friend-requests/inbound/`);
    },
};

export default api;
