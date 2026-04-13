from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.cache import cache
from .musicbrainz import getMetadata, cacheMetadata
from .models import Scrobble, Song, Recommendation
import json
import re

TuttiUser = get_user_model()

def find_or_create_song(album, date, num_tracks, title, artist, track):
    release_query = f"\"{album}\" AND date:\"{date}\" AND tracks:\"{num_tracks}\""
    release_mbid = None
    recording_mbid = None
    release = getMetadata("release", release_query, 1)
    release_mbid = release["releases"][0]["id"]
    recording_query = f"\"{title}\" AND artist:\"{artist}\" AND tnum:\"{track}\" AND reid:\"{release_mbid}\""
    recording = getMetadata("recording", recording_query, 1)
    recording_mbid = recording["recordings"][0]["id"]
    cacheMetadata("release", f"reid:\"{release_mbid}\"", release)
    cacheMetadata("recording", f"rid:\"{recording_mbid}\"", recording)
    song_query = Song.objects.filter(
        release_mbid=release_mbid,
        recording_mbid=recording_mbid,
    )
    return song_query[0] if song_query.count() > 0 else Song.objects.create(
        release_mbid=release_mbid,
        recording_mbid=recording_mbid,
    )

class TuttiUserSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(allow_blank=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        # Match username against a basic regex
        if not re.fullmatch(r"^[a-zA-Z0-9_]+$", data["username"]):
            raise serializers.ValidationError("username is invalid.")

        # Match email against a basic regex
        # TODO: Check more rigorously (send verification?)
        if not re.fullmatch(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", data["email"]):
            raise serializers.ValidationError("email is invalid.")

        # Ensure password is long enough
        if len(data["password"]) < 8:
            raise serializers.ValidationError("password is too short.")

        # Ensure passwords match
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError("passwords do not match.")

        # Return valid data
        return data

    def create(self, validated_data):
        display_name = validated_data["display_name"] if validated_data["display_name"] != "" else None
        user = TuttiUser.objects.create_user(
            username=validated_data["username"],
            display_name=display_name,
            email=validated_data["email"],
            password=validated_data["password"],
        )
        return user

    class Meta:
        model = TuttiUser
        fields = ['id', 'username', 'display_name', 'email', 'password', 'date_joined', 'confirm_password']

class SongSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ['release_mbid', 'recording_mbid']

class ScrobbleSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    song_id = serializers.PrimaryKeyRelatedField(read_only=True)
    tuttiuser = serializers.PrimaryKeyRelatedField(read_only=True)
    time_created = serializers.DateTimeField(read_only=True)
    time_updated = serializers.DateTimeField(read_only=True)
    rating = serializers.IntegerField(read_only=True)
    artist = serializers.CharField(write_only=True)
    album = serializers.CharField(write_only=True)
    title = serializers.CharField(write_only=True)
    date = serializers.CharField(write_only=True)
    track = serializers.IntegerField(write_only=True)
    num_tracks = serializers.IntegerField(write_only=True)
    def create(self, validated_data):
        song = find_or_create_song(validated_data["album"], validated_data["date"], validated_data["num_tracks"], validated_data["title"], validated_data["artist"], validated_data["track"])
        raw_data = {
            "album": validated_data["album"],
            "date": validated_data["date"],
            "num_tracks": validated_data["num_tracks"],
            "title": validated_data["title"],
            "artist": validated_data["artist"],
            "track": validated_data["track"],
        }
        return Scrobble.objects.create(
            song=song,
            tuttiuser=validated_data["user"],
            raw_data=json.dumps(raw_data)
        )

    class Meta:
        model = Scrobble
        fields = ['id', 'song_id', 'tuttiuser', 'time_created', 'time_updated', 'rating', 'artist', 'album', 'title', 'date', 'track', 'num_tracks']

class RecommendationSerializer(serializers.ModelSerializer):
    base_song = serializers.PrimaryKeyRelatedField(read_only=True)
    recommended_song = serializers.PrimaryKeyRelatedField(read_only=True)
    tuttiuser = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Recommendation
        fields = ['id', 'base_song', 'recommended_song', 'tuttiuser', 'time_created']
