  import { useState, useEffect } from "react";
  import THEME from "../theme";
  import api from "../services/api";
  import { ThumbsUpIcon, ThumbsDownIcon } from "./Icons";

  function SpotifyLink({ query, children }) {
    const [hovered, setHovered] = useState(false);
    return (
      <a
        href={`https://open.spotify.com/search/${encodeURIComponent(query)}`}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          color: THEME.textPrimary,
          textDecoration: hovered ? "underline" : "none",
          transition: THEME.transition,
        }}
      >
        {children}
      </a>
    );
  }

  function Scrobble({ song_id, scrobble_id, initialRating = 1, onRatingChange }) {
    const [dataLoading, setDataLoading] = useState(true);
    const [coverLoading, setCoverLoading] = useState(true);
    const [dataError, setDataError] = useState(null);
    const [coverError, setCoverError] = useState(null);
    const [data, setData] = useState({});
    const [cover, setCover] = useState("");
    const [rating, setRating] = useState(initialRating);
    const [ratingPending, setRatingPending] = useState(false);

    const getScrobbleData = async (song_id) => {
      try {
        let scrobbleData = await api.getSongData(song_id);
        setData(scrobbleData);
      } catch(err) {
        setDataError(err);
      } finally {
        setDataLoading(false);
      }
    };

    const getScrobbleCover = async (song_id) => {
      try {
        let scrobbleCover = await api.getSongCover(song_id);
        setCover(scrobbleCover.cover);
      } catch(err) {
        setCoverError(err);
      } finally {
        setCoverLoading(false);
      }
    };

    useEffect(() => {
      getScrobbleData(song_id);
      getScrobbleCover(song_id);
    }, []);

    const handleRating = async (like) => {
      if (ratingPending) return;
      setRatingPending(true);
      try {
        const result = await api.rateScrobble(scrobble_id, like);
        setRating(result.scrobble.rating);
        onRatingChange?.();
      } catch(err) {
        // silently revert — no UI disruption for a rating failure
      } finally {
        setRatingPending(false);
      }
    };

    const handleLike = async () => handleRating(true);
    const handleDislike = async () => handleRating(false);

    const liked = rating === 2;
    const disliked = rating === 0;

    const thumbButtonBase = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 40,
      height: 40,
      borderRadius: THEME.radius.pill,
      border: "none",
      cursor: ratingPending ? "default" : "pointer",
      transition: THEME.transition,
      background: "transparent",
      opacity: ratingPending ? 0.5 : 1,
    };

    const activeGlow = {
      background: THEME.accentMuted,
      boxShadow: `0 0 14px rgba(124, 111, 247, 0.45)`,
    };

    return (
      <div style={{
        padding: "14px 20px", marginBottom: "10px",
        borderRadius: THEME.radius.md, background: THEME.bgCard,
        display: "flex", flexDirection: "row", alignItems: "center",
      }}>
        <div style={{ width: "56px", height: "56px", background: THEME.bgElevated, marginRight: "16px", flexShrink: 0, borderRadius: THEME.radius.sm, overflow: "hidden" }}>
          {!coverLoading && (<img src={cover} alt={`${data.album} front cover`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 2px", fontFamily: THEME.fontBody, fontSize: 15, fontWeight: 700, color: THEME.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <SpotifyLink query={`${data.artist} ${data.title}`}>
              {data.artist} — "{data.title}"
            </SpotifyLink>
          </p>
          <p style={{ margin: 0, fontFamily: THEME.fontBody, fontSize: 13, color: THEME.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <i>{data.album}</i>
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginLeft: "12px", flexShrink: 0 }}>
          <button
            onClick={handleLike}
            style={{ ...thumbButtonBase, width: 34, height: 34, ...(liked ? activeGlow : {}) }}
            title="Like"
          >
            <ThumbsUpIcon size={16} color={liked ? THEME.accent : THEME.textSecondary} strokeWidth={liked ? 2.5 : 1.8} />
          </button>
          <button
            onClick={handleDislike}
            style={{ ...thumbButtonBase, width: 34, height: 34, ...(disliked ? activeGlow : {}) }}
            title="Dislike"
          >
            <ThumbsDownIcon size={16} color={disliked ? THEME.accent : THEME.textSecondary} strokeWidth={disliked ? 2.5 : 1.8} />
          </button>
        </div>
      </div>
    );
  }

 export default Scrobble;
