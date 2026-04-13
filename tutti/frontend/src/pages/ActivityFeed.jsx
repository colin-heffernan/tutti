import { useState, useEffect } from "react";
import THEME from "../theme";
import api from "../services/api";
import Scrobble from "../components/Scrobble";
import GenreForceMap from "../components/GenreForceMap";

function ActivityFeed({ onNavigate, onLogout, isLoggedIn }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrobbles, setScrobbles] = useState([]);
  const [profile, setProfile] = useState([]);
  const [overlaps, setOverlaps] = useState({});

  // Fetch user scrobbles and genre profile in parallel
  const fetchScrobbles = async () => {
    try {
      const [userScrobbles, profileData] = await Promise.all([
        api.getScrobbles(),
        api.getProfile(),
      ]);
      setScrobbles(userScrobbles);
      // Sort genres descending by score so slice(0, 25) gives top 25
      const sortedProfile = Object.entries(profileData.profile).sort((a, b) => b[1] - a[1]);
      setProfile(sortedProfile);
      setOverlaps(profileData.overlaps);
      setError(null);
    } catch(err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const profileData = await api.getProfile();
      const sortedProfile = Object.entries(profileData.profile).sort((a, b) => b[1] - a[1]);
      setProfile(sortedProfile);
      setOverlaps(profileData.overlaps);
    } catch(err) {
      // non-critical, don't surface to user
    }
  };

  // Fetch the scrobbles from the REST API
  useEffect(() => {
    if(isLoggedIn) {
      fetchScrobbles();
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      onLogout();
      onNavigate("login");
    } catch (err) {
      setError(err.message + "\nLogout failed.");
    } finally {
      setLoading(false);
    }
  };


  const makeScrobble = async (/* scrobbleData */) => {
    if(!isLoggedIn) {
      return;
    }
    try {
      // NOTE: These are just songs I like. They're here for testing purposes.
      const testScrobbles = [
        {
          "artist": "Radiohead",
          "album": "OK Computer",
          "title": "No Surprises",
          "date": "1997-05-21",
          "track": 10,
          "num_tracks": 12,
        },
        {
          "artist": "Slowdive",
          "album": "Souvlaki",
          "title": "Alison",
          "date": "1993-06-01",
          "track": 1,
          "num_tracks": 10,
        },
        {
          "artist": "Cocteau Twins",
          "album": "Heaven or Las Vegas",
          "title": "Heaven or Las Vegas",
          "date": "1990-09-17",
          "track": 5,
          "num_tracks": 10,
        },
        {
          "artist": "Pink Floyd",
          "album": "The Dark Side of the Moon",
          "title": "Time",
          "date": "1973-03-01",
          "track": 4,
          "num_tracks": 10,
        },
        {
          "artist": "Massive Attack",
          "album": "Mezzanine",
          "title": "Teardrop",
          "date": "1998-04-20",
          "track": 3,
          "num_tracks": 11,
        },
        {
          "artist": "Kendrick Lamar",
          "album": "good kid, m.A.A.d city",
          "title": "Sing About Me / I'm Dying of Thirst",
          "date": "2012-10-22",
          "track": 10,
          "num_tracks": 12,
        },
        {
          "artist": "The Strokes",
          "album": "The New Abnormal",
          "title": "At the Door",
          "date": "2020-04-10",
          "track": 6,
          "num_tracks": 9,
        },
        {
          "artist": "My Bloody Valentine",
          "album": "loveless",
          "title": "soon",
          "date": "1991-11-04",
          "track": 11,
          "num_tracks": 11,
        },
        {
          "artist": "Beach House",
          "album": "Teen Dream",
          "title": "10 Mile Stereo",
          "date": "2010-01-26",
          "track": 8,
          "num_tracks": 10,
        },
        {
          "artist": "Oasis",
          "album": "(What's the Story) Morning Glory?",
          "title": "Champagne Supernova",
          "date": "1995-10-02",
          "track": 12,
          "num_tracks": 12,
        },
      ];

      // TODO: Set this based on passed-in args
      let scrobbleData = testScrobbles[Math.floor(Math.random() * testScrobbles.length)];
      console.log(scrobbleData)
      let scrobble = await api.createScrobble(scrobbleData);
      console.log(scrobble);
      setScrobbles([...scrobbles, scrobble]);
      setError(null);
    } catch(err) {
      setError(err.message);
    }
  };

  //styling
  return (
    <div style={{ /*margin: "80px auto",*/ textAlign: "center", padding: "40px" }}>
      {!isLoggedIn && (<>
        <h1 style={{ fontFamily: THEME.fontDisplay, fontSize: 32, fontWeight: 700, color: THEME.textPrimary, marginBottom: 12 }}>
          Your Feed
        </h1>
        <p style={{ fontFamily: THEME.fontBody, fontSize: 16, color: THEME.textSecondary, lineHeight: 1.6 }}>
          Make an account to track your listens!
        </p>
      </>)}
      {isLoggedIn && (<>
        {loading && (
          <h1>Loading feed...</h1>
        )}
        {!loading && (<>
          {error && (<>
            <h1>Uh oh!</h1>
            <p>Tutti hit an error.</p>
            <p>{error.message}</p>
          </>)}
          {!error && (<>
            {profile.length > 0 && (
              <GenreForceMap profile={profile} overlaps={overlaps} />
            )}
            {(!scrobbles || scrobbles.length == 0) && (<>
              <h1 style={{ fontFamily: THEME.fontDisplay, fontSize: 32, fontWeight: 700, color: THEME.textPrimary, marginBottom: 12 }}>
                Your Feed
              </h1>
              <p style={{ fontFamily: THEME.fontBody, fontSize: 16, color: THEME.textSecondary, lineHeight: 1.6 }}>
                Listening activity and friends' updates will appear here.
              </p>
            </>)}
            {scrobbles && (<ul style={{"listStyleType": "none"}}>
              {scrobbles.map((scrobble) => (<li key={scrobble.id}>
                <Scrobble song_id={scrobble.song_id} scrobble_id={scrobble.id} initialRating={scrobble.rating} onRatingChange={refreshProfile} />
              </li>))}
            </ul>)}
            <button onClick={makeScrobble /* TODO: Pass in data from a form */}>Add a scrobble of Radiohead - "No Surprises" from <i>OK Computer</i> (1997)</button>
          </>)}
        </>)}
      </>)}
    </div>
  );
}

export default ActivityFeed;
