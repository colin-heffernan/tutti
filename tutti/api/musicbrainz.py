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

def searchMusicBrainz(type, query, limit):
    url = f"{MUSICBRAINZ_API_ROOT_URL}/{type}?query={query}&limit={limit}&fmt=json"
    headers = {
        "User-Agent": "Tutti/0.1.0 ( colinpheffernan@gmail.com )",
        "Accept": "application/json",
    }
    try:
        response = requests.get(url, headers=headers)
        return response.json()
    except requests.exceptions.RequestException as e:
        # print(f"=== BEGIN REQUEST EXCEPTION ===\n\n{e}\n\n=== END REQUEST EXCEPTION ===") # FIXME: Debug print the exception.
        raise Exception("Can't reach MusicBrainz.")

def searchCoverArtArchive(release_mbid):
    url = f"{COVER_ART_ARCHIVE_API_ROOT_URL}/release/{release_mbid}/front-250"
    headers = {
        "User-Agent": "Tutti/0.1.0 ( colinpheffernan@gmail.com )",
    }
    try:
        response = requests.get(url, headers=headers)
        if not response.status_code == 200:
            release_group_mbid = getMetadata("release", f"reid:\"{release_mbid}\"", 1)["releases"][0]["release-group"]["id"]
            url = f"{COVER_ART_ARCHIVE_API_ROOT_URL}/release-group/{release_group_mbid}/front-250"
        return url
    except requests.exceptions.RequestException as e:
        # print(f"=== BEGIN REQUEST EXCEPTION ===\n\n{e}\n\n=== END REQUEST EXCEPTION ===") # FIXME: Debug print the exception.
        raise Exception("Can't reach Cover Art Archive.")

def makeCacheKey(deps):
    return hashlib.sha256(json.dumps(deps).encode()).hexdigest()

def getMetadata(type, query, limit):
    # Make a key by hashing inputs
    deps = {
        "func": "searchMusicBrainz",
        "type": type,
        "query": query,
        "limit": limit,
    }
    key = makeCacheKey(deps)

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

    # Calculate the value and cache it
    try:
        val = searchMusicBrainz(type, query, limit)
    except Exception:
        raise Exception("Couldn't fetch the metadata.")
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

def cacheMetadata(type, query, value):
    # Make a key by hashing inputs
    deps = {
        "func": "searchMusicBrainz",
        "type": type,
        "query": query,
        "limit": 1,
    }
    key = makeCacheKey(deps)

    # Cache the value
    db_query = CachedQuery.objects.filter(key=key)
    if db_query.count() > 0 and db_query.filter(time_updated__gte=(timezone.now() - datetime.timedelta(90))).count() > 0:
        db_entry = db_query[0]
        db_entry.data = json.dumps(value)
        db_entry.time_updated = timezone.now()
        db_entry.save()
    else:
        db_entry = CachedQuery(key=key, data=json.dumps(value))
        db_entry.save()
    cache.set(key, value, 60 * 15)

def getCover(release_mbid):
    # Make a key by hashing inputs
    deps = {
        "func": "searchCoverArtArchive",
        "release_mbid": release_mbid,
    }
    key = makeCacheKey(deps)

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

    # Calculate the value and cache it
    try:
        val = searchCoverArtArchive(release_mbid)
    except Exception:
        raise Exception("Couldn't fetch the cover.")
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
