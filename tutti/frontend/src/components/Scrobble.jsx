import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import THEME from "../theme";
import api from "../services/api";

function Scrobble({ release_mbid, recording_mbid, scrobble_id }) {
  const [dataLoading, setDataLoading] = useState(true);
  const [coverLoading, setCoverLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [coverError, setCoverError] = useState(null);
  const [data, setData] = useState({});
  const [cover, setCover] = useState("");
  // const [scrobble, setScrobble] = useState({});
  // const [scrobbleLoading, setScrobbleLoading] = useState(true);
  // const [scrobbleError, setScrobbleError] = useState(null);

  // const getScrobble = async (id) => {
  //   try {
  //     let scrobble = await api.getScrobble(id);
  //     setScrobble(scrobble);
  //   } catch(err) {
  //     setScrobbleError(err);
  //   } finally {
  //     setScrobbleLoading(false);
  //   }
  // };

  const getScrobbleData = async (recording_mbid, release_mbid, scrobble_id) => {
    try {
      let scrobbleData = await api.getScrobbleData(recording_mbid, release_mbid, scrobble_id);
      setData(scrobbleData);
    } catch(err) {
      setDataError(err);
    } finally {
      setDataLoading(false);
    }
  };

  const getScrobbleCover = async (release_mbid) => {
    try {
      let scrobbleCover = await api.getScrobbleCover(release_mbid);
      setCover(scrobbleCover.cover);
    } catch(err) {
      setCoverError(err);
    } finally {
      setCoverLoading(false);
    }
  };

  // Fetch the scrobbles from the REST API
  useEffect(() => {
    getScrobbleData(recording_mbid, release_mbid, scrobble_id);
    getScrobbleCover(release_mbid);
  }, []);

  //styling
  return (
    <div style={{
      padding: "40px", marginBottom: "40px",
      borderRadius: THEME.radius.md, background: THEME.bgCard,
      display: "flex", flexDirection: "row", alignItems: "flex-start",
    }}>
      <div style={{width: "250px", height: "250px", background: THEME.bgElevated, marginRight: "40px"}}>
        {!coverLoading && (<img src={cover} alt={`${data.album} front cover`} />)}
      </div>
      <div style={{
        /*width: "100%", height: "100%"*/
      }}>
        <h1>{data.artist} - "{data.title}"</h1>
        <h3>From <i>{data.album}</i></h3>
      </div>
    </div>
  );
}

export default Scrobble;
