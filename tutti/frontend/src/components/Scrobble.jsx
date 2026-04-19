  import { useState, useEffect, useRef } from "react";
  import THEME from "../theme";
  import api from "../services/api";
  import { ThumbsUpIcon, ThumbsDownIcon, MusicIcon, ChevronDownIcon } from "./Icons";

  const STREAMING_SERVICES = {
    "spotify": {
      label: "Spotify",
      color: "#1DB954",
      // getUrl: (artist, title) =>
      //   `https://open.spotify.com/search/${encodeURIComponent(`${artist} ${title}`)}`,
    },
    "appleMusic": {
      label: "Apple Music",
      color: "#FC3C44",
      // getUrl: (artist, title) =>
      //   `https://music.apple.com/search?term=${encodeURIComponent(`${artist} ${title}`)}`,
    },
    "youtube": {
      label: "YouTube",
      color: "#FF0000",
      // getUrl: (artist, title) =>
      //   `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${title}`)}`,
    },
  };

  // streamingLinks prop accepts { spotify, applemusic, youtube } explicit URLs.
  // If a key is absent, a search URL is generated. If a key is an empty string, that service is hidden.
  function StreamingDropdown({ artist, title, streamingLinks = [] }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
      if (!open) return;
      const handler = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // const links = STREAMING_SERVICES.map((svc) => {
    //   const explicitUrl = streamingLinks[svc.label.toLowerCase().replace(" ", "")];
    //   // explicit empty string → hide; explicit URL → use it; absent → generate search URL
    //   const url =
    //     explicitUrl === ""
    //       ? ""
    //       : explicitUrl || (artist && title ? svc.getUrl(artist, title) : "");
    //   return { ...svc, url };
    // }).filter((l) => l.url);
    const links = streamingLinks.map((linkItem) => {
      const service = STREAMING_SERVICES[linkItem[1]];
      return { ...service, "url": linkItem[0] };
    });

    if (!links.length) return null;

    return (
      <div ref={containerRef} style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "5px 10px", borderRadius: THEME.radius.pill,
            border: `1px solid ${open ? THEME.accent : THEME.border}`,
            background: open ? THEME.accentMuted : "transparent",
            color: open ? THEME.accent : THEME.textSecondary,
            fontFamily: THEME.fontBody, fontSize: 12, fontWeight: 600,
            cursor: "pointer", transition: THEME.transition,
          }}
        >
          <MusicIcon size={12} />
          Listen
          <ChevronDownIcon
            size={12}
            style={{ transform: open ? "rotate(180deg)" : "none", transition: THEME.transition }}
          />
        </button>

        {open && (
          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 6px)",
            background: THEME.bgCard, border: `1px solid ${THEME.border}`,
            borderRadius: THEME.radius.md, boxShadow: THEME.shadow.md,
            overflow: "hidden", zIndex: 200, minWidth: 148,
          }}>
            {links.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px",
                  fontFamily: THEME.fontBody, fontSize: 13, color: THEME.textPrimary,
                  textDecoration: "none", transition: THEME.transition,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = THEME.bgElevated; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: link.color, flexShrink: 0,
                }} />
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
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
      api.getSongData(song_id)
        .then(setData)
        .catch(setDataError);
      setDataLoading(false);
    };

    const getScrobbleCover = async (song_id) => {
      api.getSongCover(song_id)
        .then((response) => setCover(response.cover))
        .catch(setCoverError);
      setCoverLoading(false);
    };

    useEffect(() => {
      getScrobbleData(song_id);
      getScrobbleCover(song_id);
    }, []);

    const handleRating = async (like) => {
      if (ratingPending) return;
      setRatingPending(true);
      api.rateScrobble(scrobble_id, like)
        .then((result) => {
          setRating(result.scrobble.rating);
          onRatingChange?.();
        })
        .catch(() => {});
      setRatingPending(false);
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
        display: "flex", flexDirection: "row", alignItems: "center", gap: 12,
      }}>
        <div style={{ width: "56px", height: "56px", background: THEME.bgElevated, flexShrink: 0, borderRadius: THEME.radius.sm, overflow: "hidden" }}>
          {!coverLoading && (<img src={cover ? cover : null} alt={`${data.album} front cover`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 2px", fontFamily: THEME.fontBody, fontSize: 15, fontWeight: 700, color: THEME.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data.artist} — "{data.title}"
          </p>
          <p style={{ margin: 0, fontFamily: THEME.fontBody, fontSize: 13, color: THEME.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <i>{data.album}</i>
          </p>
        </div>
        {!dataLoading && (
          <StreamingDropdown artist={data.artist} title={data.title} streamingLinks={data.links} />
        )}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
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
