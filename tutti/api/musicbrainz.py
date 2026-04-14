from django.core.cache import cache
from django.utils import timezone
from .models import CachedQuery
import requests
import json
import hashlib
import datetime

MUSICBRAINZ_API_ROOT_URL = "https://musicbrainz.org/ws/2"
MUSICBRAINZ_REQUEST_DEBOUNCE_MS = 500

COVER_ART_ARCHIVE_API_ROOT_URL = "https://coverartarchive.org"

HEADERS = {
    "User-Agent": "Tutti/0.1.0 ( colinpheffernan@gmail.com )",
    "Accept": "application/json",
}

# Try an arbitrary URL
def tryUrl(url):
    try:
        return requests.get(url, headers=HEADERS)
    except requests.exceptions.RequestException as e:
        # print(f"=== BEGIN REQUEST EXCEPTION ===\n\n{e}\n\n=== END REQUEST EXCEPTION ===") # FIXME: Debug print the exception.
        raise Exception("Could not reach external URL")

# For searches (exact ID unknown)
def searchMusicBrainz(type, query, limit):
    return tryUrl(f"{MUSICBRAINZ_API_ROOT_URL}/{type}?query={query}&limit={limit}&fmt=json").json()

# For fetches (exact ID known)
def fetchMusicBrainz(type, mbid, inc=None):
    return tryUrl(f"{MUSICBRAINZ_API_ROOT_URL}/{type}/{mbid}?fmt=json{f"&inc={inc}" if inc else ""}").json()

def fetchCoverArtArchive(release_mbid):
    url = f"{COVER_ART_ARCHIVE_API_ROOT_URL}/release/{release_mbid}/front-250"
    response = tryUrl(url)
    if response.status_code != 200:
        release_group_mbid = fetchMetadata("release", release_mbid, inc="release-groups")["release-group"]["id"]
        url = f"{COVER_ART_ARCHIVE_API_ROOT_URL}/release-group/{release_group_mbid}/front-250"
    return url

# For caching
def checkCache(func, *args):
    # Check the cache
    deps = {
        "func": func.__name__,
        "args": args
    }
    key = hashlib.sha256(json.dumps(deps).encode()).hexdigest()

    # Check if there's a value in the memcache
    cached_val = cache.get(key)
    if cached_val:
        return cached_val

    # Check if there's a (recent enough) value in the DB cache
    db_query = CachedQuery.objects.filter(key=key)
    if db_query.filter(time_updated__gte=(timezone.now() - datetime.timedelta(90))).count() > 0:
        db_entry = db_query[0]
        cache.set(key, json.loads(db_entry.data), 60 * 15)
        return json.loads(db_entry.data)

    # Calculate the value
    try:
        val = func(*args)
    except Exception:
        raise Exception("Couldn't fetch the metadata.")

    # Cache the value
    if db_query.count() > 0:
        db_entry = db_query[0]
        db_entry.data = json.dumps(val)
        db_entry.time_updated = timezone.now()
        db_entry.save()
    else:
        db_entry = CachedQuery(key=key, data=json.dumps(val))
        db_entry.save()
    cache.set(key, val, 60 * 15)
    return val

def searchMetadata(type, query, limit, inc=None):
    response = checkCache(searchMusicBrainz, type, query, limit)
    mbid = response[f"{type}{"s" if type != "series" else ""}"][0]["id"]
    return fetchMetadata(type, mbid, inc)

def fetchMetadata(type, mbid, inc=None):
    return checkCache(fetchMusicBrainz, type, mbid, inc)

def fetchCover(release_mbid):
    return checkCache(fetchCoverArtArchive, release_mbid)
