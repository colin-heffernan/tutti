from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.contrib.auth import get_user_model, authenticate, login, logout
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.generics import CreateAPIView, ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import SessionAuthentication
from .serializers import TuttiUserSerializer, ScrobbleSerializer, RecommendationSerializer
from .musicbrainz import getMetadata, getCover
from .models import Scrobble, Recommendation, Song
import json
import datetime
import math

# Create your views here.
TuttiUser = get_user_model()

class TuttiUserView(ListAPIView):
    queryset = TuttiUser.objects.all()
    serializer_class = TuttiUserSerializer

class CreateTuttiUserView(CreateAPIView):
    model = TuttiUser
    permission_classes = [AllowAny]
    serializer_class = TuttiUserSerializer

class LoginTuttiUserView(APIView):
    def post(self, request):
        user = authenticate(
            request,
            username=request.data.get("username"),
            password=request.data.get("password"),
        )
        if user:
            login(request, user)
            return Response({"status": "Logged in"})
        return Response({"status": "Invalid credentials"}, status=403)

class LogoutTuttiUserView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        logout(request)
        return Response({"status": "Logged out"})

class CsrfView(APIView):
    def get(self, request):
        return Response({"csrfToken": get_token(request)})

class TuttiUserSessionView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response({"isAuthenticated": True})

class TuttiUserMeView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        return Response({
            "username": user.username,
            "display_name": user.display_name,
            "email": user.email,
            "date_joined": user.date_joined,
        })

class ListScrobblesView(ListAPIView):
    queryset = Scrobble.objects.all()
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = ScrobbleSerializer
    def list(self, request):
        queryset = Scrobble.objects.filter(tuttiuser=self.request.user.id)
        serializer = ScrobbleSerializer(queryset, many=True)
        return Response(serializer.data)

class TuttiUserProfileView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    def get(self, request):
        scrobbles = Scrobble.objects.filter(tuttiuser=self.request.user.id, time_created__gte=(timezone.now() - datetime.timedelta(180)))
        tags = {}
        tag_overlaps = {}
        for scrobble in scrobbles:
            try:
                date = scrobble.time_created.date()
                age = timezone.now().date() - date
                rating = scrobble.rating
                weight = 180 - (3 - rating) if rating > 0 else 0
                recording = getMetadata("recording", f"rid:\"{scrobble.song.recording_mbid}\"", 1)
                recording_tags = recording["recordings"][0]["tags"]
                song_tags = []
                for recording_tag in sorted(recording_tags, key=lambda x: x["name"]):
                    tag_name = recording_tag["name"]
                    for song_tag in song_tags:
                        if tag_name in tag_overlaps[song_tag]:
                            tag_overlaps[song_tag][tag_name] += 1
                        else:
                            tag_overlaps[song_tag][tag_name] = 1
                    song_tags.append(tag_name)
                    if tag_name not in tag_overlaps:
                        tag_overlaps[tag_name] = {}
                    if tag_name in tags:
                        tags[tag_name] += weight
                    else:
                        tags[tag_name] = weight
            except Exception as e:
                print(f"fail: {e}")
        sum_scores = sum(tags.values())
        for tag in tags:
            tags[tag] = (tags[tag] * 100) / sum_scores
        overlaps = dict(filter(lambda x: x[1] != {}, tag_overlaps.items()))
        for overlap_tag in overlaps:
            overlaps[overlap_tag] = dict(filter(lambda x: x[1] != {}, overlaps[overlap_tag].items()))
        return Response({"profile": tags, "overlaps": overlaps})

class CreateScrobbleView(CreateAPIView):
    model = Scrobble
    serializer_class = ScrobbleSerializer
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SongMetadataView(APIView):
    @method_decorator(cache_page(60 * 15))
    def get(self, _request, id):
        song_query = Song.objects.filter(id=id)
        if song_query.count() < 1:
            return Response({"error": "Song does not exist."}, status=404)
        song = song_query[0]
        try:
            release = getMetadata("release", f"reid:\"{song.release_mbid}\"", 1)
            recording = getMetadata("recording", f"rid:\"{song.recording_mbid}\"", 1)
            return Response({
                "album": release["releases"][0]["title"],
                "artist": recording["recordings"][0]["artist-credit"][0]["name"],
                "title": recording["recordings"][0]["title"],
            })
        except Exception:
            return Response({"error": "Could not fetch song metadata."}, status=503)

class SongCoverView(APIView):
    @method_decorator(cache_page(60 * 15))
    def get(self, _, id):
        song_query = Song.objects.filter(id=id)
        if song_query.count() < 1:
            return Response({"error": "Song does not exist."}, status=404)
        song = song_query[0]
        try:
            cover = getCover(song.release_mbid)
            return Response({
                "cover": cover,
            })
        except Exception:
            return Response({"error": "Could not fetch song cover."}, status=503)

class ScrobbleLikeView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    def post(self, request):
        scrobble_id = request.data.get("scrobble_id")
        scrobble_query = Scrobble.objects.filter(id=scrobble_id)
        if scrobble_query.count() < 1:
            return Response({"error": "Could not edit scrobble"}, status_code=404)
        scrobble = scrobble_query[0]
        if scrobble.tuttiuser != request.user:
            return Response({"error": "Could not edit scrobble"}, status_code=404)
        scrobble.rating = 1 if scrobble.rating == 2 else 2
        scrobble.save()
        serializer = ScrobbleSerializer(scrobble)
        return Response({"scrobble": serializer.data})

class ScrobbleDislikeView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    def post(self, request):
        scrobble_id = request.data.get("scrobble_id")
        scrobble_query = Scrobble.objects.filter(id=scrobble_id)
        if scrobble_query.count() < 1:
            return Response({"error": "Could not edit scrobble"}, status_code=404)
        scrobble = scrobble_query[0]
        if scrobble.tuttiuser != request.user:
            return Response({"error": "Could not edit scrobble"}, status_code=404)
        scrobble.rating = 1 if scrobble.rating == 0 else 0
        scrobble.save()
        serializer = ScrobbleSerializer(scrobble)
        return Response({"scrobble": serializer.data})

class SongMakeRecommendationView(CreateAPIView):
    model = Recommendation
    serializer_class = RecommendationSerializer
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    def perform_create(self, serializer):
        base_song_query = Song.objects.filter(id=self.kwargs["id"])
        if base_song_query.count() < 1:
            return Response({"error": "Base song does not exist."}, status=404)
        base_song = base_song_query[0]
        serializer.save(user=self.request.user, base_song=base_song)

class SongRecommendationsView(ListAPIView):
    queryset = Recommendation.objects.all()
    serializer_class = RecommendationSerializer
    def list(self, _, id):
        song_query = Song.objects.filter(id=id)
        if song_query.count() < 1:
            return Response({"error": "Song does not exist."}, status=404)
        song = song_query[0]
        queryset = Recommendation.objects.filter(base_song=song)
        serializer = RecommendationSerializer(queryset, many=True)
        return Response(serializer.data)
