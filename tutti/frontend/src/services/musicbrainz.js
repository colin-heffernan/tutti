//deals with musicBrainz for searching

import CONFIG from "../config";

const musicBrainzApi = {
  async searchSongs(query) {
    if (!query || query.length < 2) return [];

    try {
      const url =
        `${CONFIG.MUSICBRAINZ_API}/recording/?query=${encodeURIComponent(query)}` +
        `&fmt=json&limit=10`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": CONFIG.MUSICBRAINZ_USER_AGENT,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("MusicBrainz search failed");
      const data = await response.json();

      //making the MusicBrainz response into cleaner object formats
      return (data.recordings || []).map((rec) => ({
        mbid: rec.id,
        title: rec.title,
        artist: (rec["artist-credit"] || []).map((ac) => ac.name).join(", "),
        album: rec.releases?.[0]?.title || "Unknown Album",
        year: rec.releases?.[0]?.date?.substring(0, 4) || "",
        durationMs: rec.length || 0,
      }));
    } catch (err) {
      console.error("MusicBrainz search error:", err);
      return [];
    }
  },
};

export default musicBrainzApi;