import { useState, useEffect, useRef } from "react";
import THEME from "../theme";
import CONFIG from "../config";
import useDebounce from "../hooks/useDebounce";
import musicBrainzApi from "../services/musicbrainz";
import { SearchIcon, XIcon } from "./Icons";

//search elements
function SongSearch({ selectedSongs, onSongSelect, onSongRemove }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const debouncedQuery = useDebounce(query, CONFIG.SEARCH_DEBOUNCE_MS);

  // Search MusicBrainz when debounced
  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return; }
    let cancelled = false;
    setSearching(true);
    musicBrainzApi.searchSongs(debouncedQuery).then((songs) => {
      if (!cancelled) {
        const selectedIds = new Set(selectedSongs.map((s) => s.mbid));
        setResults(songs.filter((s) => !selectedIds.has(s.mbid)));
        setSearching(false);
        setShowDropdown(true);
      }
    });
    return () => { cancelled = true; };
  }, [debouncedQuery, selectedSongs]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const formatDuration = (ms) => {
    if (!ms) return "";
    return `${Math.floor(ms / 60000)}:${Math.floor((ms % 60000) / 1000).toString().padStart(2, "0")}`;
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {selectedSongs.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {selectedSongs.map((song) => (
            <div key={song.mbid} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 12px", borderRadius: THEME.radius.pill,
              background: THEME.accentMuted, border: `1px solid ${THEME.accent}40`,
              color: THEME.textPrimary, fontSize: 13, fontFamily: THEME.fontBody,
            }}>
              <span style={{ fontWeight: 600 }}>{song.title}</span>
              <span style={{ color: THEME.textSecondary }}>— {song.artist}</span>
              <button onClick={() => onSongRemove(song.mbid)}
                style={{ background: "none", border: "none", cursor: "pointer", color: THEME.textSecondary, padding: 2, display: "flex" }}>
                <XIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: THEME.textPlaceholder }}>
          <SearchIcon />
        </div>
        <input type="text" value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Search for songs you enjoy..."
          style={{
            width: "100%", padding: "14px 16px 14px 44px", borderRadius: THEME.radius.md,
            border: `2px solid ${THEME.border}`, background: THEME.bgElevated,
            color: THEME.textPrimary, fontSize: 15, fontFamily: THEME.fontBody,
            outline: "none", transition: THEME.transition, boxSizing: "border-box",
          }}
        />
        {searching && (
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: THEME.textSecondary, fontSize: 13 }}>
            Searching...
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4,
          borderRadius: THEME.radius.md, border: `1px solid ${THEME.border}`,
          background: THEME.bgElevated, boxShadow: THEME.shadow.lg,
          maxHeight: 320, overflowY: "auto", zIndex: 50,
        }}>
          {results.map((song, i) => (
            <button key={song.mbid}
              onClick={() => { onSongSelect(song); setQuery(""); setResults([]); setShowDropdown(false); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "12px 16px", border: "none",
                borderBottom: i < results.length - 1 ? `1px solid ${THEME.border}` : "none",
                background: "transparent", color: THEME.textPrimary, cursor: "pointer",
                fontFamily: THEME.fontBody, textAlign: "left", transition: THEME.transition,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = THEME.bgHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{song.title}</div>
                <div style={{ fontSize: 12, color: THEME.textSecondary, marginTop: 2 }}>
                  {song.artist}{song.album && ` · ${song.album}`}{song.year && ` (${song.year})`}
                </div>
              </div>
              <span style={{ fontSize: 12, color: THEME.textPlaceholder, whiteSpace: "nowrap", marginLeft: 12 }}>
                {formatDuration(song.durationMs)}
              </span>
            </button>
          ))}
        </div>
      )}

      <p style={{ marginTop: 8, fontSize: 12, color: THEME.textSecondary, fontFamily: THEME.fontBody }}>
        {selectedSongs.length} / {CONFIG.MIN_SONGS_FOR_PROFILE} songs selected
        {selectedSongs.length < CONFIG.MIN_SONGS_FOR_PROFILE && " (minimum)"}
      </p>
    </div>
  );
}

export default SongSearch;