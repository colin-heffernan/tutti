from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.cache import cache
from .musicbrainz import getMetadata, cacheMetadata
from .models import Scrobble
import json
import re

TuttiUser = get_user_model()

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

class ScrobbleSerializer(serializers.ModelSerializer):
    artist = serializers.CharField(write_only=True)
    album = serializers.CharField(write_only=True)
    title = serializers.CharField(write_only=True)
    date = serializers.CharField(write_only=True)
    track = serializers.IntegerField(write_only=True)
    num_tracks = serializers.IntegerField(write_only=True)
    release_mbid = serializers.CharField(read_only=True)
    recording_mbid = serializers.CharField(read_only=True)
    tuttiuser = serializers.PrimaryKeyRelatedField(read_only=True)
    raw_data = serializers.CharField(read_only=True)
    def create(self, validated_data):
        release_query = f"\"{validated_data["album"]}\" AND date:\"{validated_data["date"]}\" AND tracks:\"{validated_data["num_tracks"]}\""
        release_mbid = None
        recording_mbid = None
        release = getMetadata("release", release_query, 1)
        release_mbid = release["releases"][0]["id"]
        recording_query = f"\"{validated_data["title"]}\" AND artist:\"{validated_data["artist"]}\" AND tnum:\"{validated_data["track"]}\" AND reid:\"{release_mbid}\""
        recording = getMetadata("recording", recording_query, 1)
        recording_mbid = recording["recordings"][0]["id"]
        cacheMetadata("release", f"reid:\"{release_mbid}\"", release)
        cacheMetadata("recording", f"rid:\"{recording_mbid}\"", recording)
        raw_data = {
            "album": validated_data["album"],
            "date": validated_data["date"],
            "num_tracks": validated_data["num_tracks"],
            "title": validated_data["title"],
            "artist": validated_data["artist"],
            "track": validated_data["track"],
        }
        return Scrobble.objects.create(
            release_mbid=release_mbid,
            recording_mbid=recording_mbid,
            tuttiuser=validated_data["user"],
            raw_data=json.dumps(raw_data)
        )

    class Meta:
        model = Scrobble
        fields = ['id', 'release_mbid', 'recording_mbid', 'tuttiuser', 'raw_data', 'time_created', 'time_updated', 'artist', 'album', 'title', 'date', 'track', 'num_tracks']
