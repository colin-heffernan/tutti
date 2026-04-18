  import { useState, useEffect } from "react";
  import THEME from "../theme";
  import api from "../services/api";

  function Recommendation({ base_song, recommended_song }) {
    const [baseDataLoading, setBaseDataLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(true);
    const [coverLoading, setCoverLoading] = useState(true);
    const [baseDataError, setBaseDataError] = useState(null);
    const [dataError, setDataError] = useState(null);
    const [coverError, setCoverError] = useState(null);
    const [baseData, setBaseData] = useState({});
    const [data, setData] = useState({});
    const [cover, setCover] = useState("");

    const getBaseSongData = async (base_song) => {
      api.getSongData(base_song)
        .then(setBaseData)
        .catch(setBaseDataError);
      setBaseDataLoading(false);
    };

    const getSongData = async (recommended_song) => {
      api.getSongData(recommended_song)
        .then(setData)
        .catch(setDataError);
      setDataLoading(false);
    };

    const getSongCover = async (recommended_song) => {
      api.getSongCover(recommended_song)
        .then((response) => setCover(response.cover))
        .catch(setCoverError);
      setCoverLoading(false);
    };

    useEffect(() => {
      getBaseSongData(base_song);
      getSongData(recommended_song);
      getSongCover(recommended_song);
    }, []);

    return (
      <>
        <i>Because you liked {baseData.artist} - "{baseData.title}"...</i>
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
            {data.artist} — "{data.title}"
            </p>
            <p style={{ margin: 0, fontFamily: THEME.fontBody, fontSize: 13, color: THEME.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <i>{data.album}</i>
            </p>
          </div>
        </div>
      </>
    );
  }

 export default Recommendation;
