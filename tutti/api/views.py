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
from .serializers import TuttiUserSerializer, ScrobbleSerializer
from .musicbrainz import getMetadata, getCover
from .models import Scrobble
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

class TuttiUserScrobbleView(ListAPIView):
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
        for scrobble in scrobbles:
            try:
                date = scrobble.time_created.date()
                age = timezone.now().date() - date
                rating = scrobble.rating
                weight = 180 - (3 - rating) if rating > 0 else 0
                recording = getMetadata("recording", f"rid:\"{scrobble.recording_mbid}\"", 1)
                recording_tags = recording["recordings"][0]["tags"]
                for recording_tag in recording_tags:
                    tag_name = recording_tag["name"]
                    if tag_name in tags:
                        tags[tag_name] += weight
                    else:
                        tags[tag_name] = weight
            except Exception as e:
                print(f"fail: {e}")
        sum_scores = sum(tags.values())
        for tag in tags:
            tags[tag] = (tags[tag] * 100) / sum_scores
        profile = [(tag, score) for tag, score in tags.items()]
        profile.sort(reverse=True, key=lambda x: x[1])
        return Response({"profile": profile})

class CreateScrobbleView(CreateAPIView):
    model = Scrobble
    serializer_class = ScrobbleSerializer
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ScrobbleMetadataView(APIView):
    @method_decorator(cache_page(60 * 15))
    def post(self, request):
        release = None
        recording = None
        scrobble = Scrobble.objects.get(id=request.data["scrobble_id"])
        raw_data = json.loads(scrobble.raw_data)
        try:
            release = getMetadata("release", f"reid:\"{request.data["release_mbid"]}\"", 1)
        except Exception:
            release = {
                "releases": [
                    {
                        "title": raw_data["album"],
                    },
                ],
            }
        try:
            recording = getMetadata("recording", f"rid:\"{request.data["recording_mbid"]}\"", 1)
        except Exception:
            recording = {
                "recordings": [
                    {
                        "title": raw_data["title"],
                        "artist-credit": [
                            {
                                "name": raw_data["artist"],
                            },
                        ],
                    },
                ],
            }
        return Response({
            "album": release["releases"][0]["title"],
            "artist": recording["recordings"][0]["artist-credit"][0]["name"],
            "title": recording["recordings"][0]["title"],
        })

class ScrobbleCoverView(APIView):
    @method_decorator(cache_page(60 * 15))
    def post(self, request):
        cover = getCover(request.data["release_mbid"])
        return Response({
            "cover": cover,
        })
