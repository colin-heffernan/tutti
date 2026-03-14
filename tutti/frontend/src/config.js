//file to config important api keys / urls
//change to env eventually

const CONFIG = {
  // Django backend URL (change this to actually work when you make the db L)
  API_BASE: "http://127.0.0.1:8000/api",

  // Google OAuth 
  GOOGLE_CLIENT_ID: "495959917454-8oe59cehmvfbk69udbuj4v88n8p61rb1.apps.googleusercontent.com",
  GOOGLE_REDIRECT_URI: "http://127.0.0.1:3000/auth/google/callback",
  GOOGLE_SCOPES: "openid email profile",

  
  MUSICBRAINZ_API: "https://musicbrainz.org/ws/2",

  //change to a different email at somepoint
  MUSICBRAINZ_USER_AGENT: "Tutti/0.1.0 (danielmiller1@ufl.edu)",

  //delay for MusicBrainz search
  SEARCH_DEBOUNCE_MS: 500,

  // Minimum songs to select
  MIN_SONGS_FOR_PROFILE: 4,
};

export default CONFIG;