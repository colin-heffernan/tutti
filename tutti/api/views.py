from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.contrib.auth import get_user_model, authenticate, login, logout
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.generics import ListAPIView, CreateAPIView, ListCreateAPIView
from rest_framework.mixins import UpdateModelMixin
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.authentication import SessionAuthentication
from .serializers import TuttiUserSerializer, ScrobbleSerializer, SongSerializer, RecommendationSerializer
from .musicbrainz import getMetadata, getCover
from .models import Scrobble, Song, Recommendation, FriendRequest
import json
import datetime
import math

# Create your views here.
# Generally, follow [Object][Verb]View (e.g. [TuttiUser][Register]View)
TuttiUser = get_user_model()

# Get CSRF token
# class CsrfView(APIView):
#     def get(self, request):
#         return Response({"csrfToken": get_token(request)})

# Register user
class TuttiUserRegisterView(CreateAPIView):
    model = TuttiUser
    permission_classes = [AllowAny]
    serializer_class = TuttiUserSerializer

# Login user
class TuttiUserLoginView(APIView):
    def post(self, request):
        user = authenticate(
            request,
            username=request.data.get("username"),
            password=request.data.get("password"),
        )
        if user:
            login(request, user)
            return Response({"user_id": user.id})
        return Response({"status": "Invalid credentials"}, status=403)

# Logout user
class TuttiUserLogoutView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    def get(self, request):
        logout(request)
        return Response({"status": "Logged out"})

# User session status
class TuttiUserSessionView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response({"user_id": request.user.id})

# Delete user
class TuttiUserDeleteView(APIView):
    def post(self, request):
        user = authenticate(
            request,
            username=request.user.username,
            password=request.data.get("password"),
        )
        if user:
            logout(request)
            user.delete()
            return Response({"status": "Account deleted"})
        return Response({"status": "Invalid credentials"}, status=403)

# User scrobbles
class TuttiUserScrobblesView(ListCreateAPIView):
    model = Scrobble
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = ScrobbleSerializer

    # Define the queryset for the list
    def get_queryset(self):
        try:
            user = TuttiUser.objects.get(id=self.kwargs["user_id"])
        except TuttiUser.DoesNotExist:
            return []
        if user != self.request.user and user.private:
            return []
        return user.scrobbles

    # Create a scrobble
    def perform_create(self, serializer):
        try:
            user = TuttiUser.objects.get(id=self.kwargs["user_id"])
        except TuttiUser.DoesNotExist:
            return Response({"status": "User does not exist."}, status=404)
        if user != self.request.user:
            return Response({"status": "User does not exist."}, status=404)
        serializer.save(user=user)

# User listening profile
class TuttiUserProfileView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]
    def get(self, request, user_id):
        try:
            user = TuttiUser.objects.get(id=user_id)
        except TuttiUser.DoesNotExist:
            return Response({"status": "User does not exist."}, status=404)
        if user != request.user and user.private:
            return Response({"status": "User does not exist."}, status=404)
        scrobbles = Scrobble.objects.filter(tuttiuser=user_id, time_created__gte=(timezone.now() - datetime.timedelta(180)))
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

# User recommendations
class TuttiUserRecommendationsView(ListAPIView):
    model = Recommendation
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = RecommendationSerializer

    # Define the queryset for the list
    def get_queryset(self):
        try:
            user = TuttiUser.objects.get(id=self.kwargs["user_id"])
        except TuttiUser.DoesNotExist:
            return []
        if user != self.request.user and user.private:
            return []
        return Recommendation.objects.filter(base_song__scrobbles__tuttiuser=user).distinct()

# User about
class TuttiUserAboutView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    # Get user data
    def get(self, request, user_id):
        try:
            user = TuttiUser.objects.get(id=user_id)
        except TuttiUser.DoesNotExist:
            return Response({"status": "User does not exist."}, status=404)
        if user != request.user and user.private:
            return Response({"status": "User does not exist."}, status=404)
        return Response({
            "username": user.username,
            "display_name": user.display_name,
            "email": user.email,
            "date_joined": user.date_joined,
            "city": user.city,
            "country": user.country,
            "private": user.private,
        })

    # Update user data
    def post(self, request, user_id):
        try:
            user = TuttiUser.objects.get(id=user_id)
        except TuttiUser.DoesNotExist:
            return Response({"status": "User does not exist."}, status=404)
        if user_id != request.user.id:
            return Response({"status": "User does not exist."}, status=404)
        action = request.data["action"]
        match action:
            case "location":
                user.city = request.data["city"]
                user.country = request.data["country"]
                user.save()
                serializer = TuttiUserSerializer(user)
                return Response({"about": serializer.data})

# User friends
class TuttiUserFriendsView(ListAPIView):
    model = TuttiUser
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = TuttiUserSerializer

    # Define the queryset for the list
    def get_queryset(self):
        try:
            user = TuttiUser.objects.get(id=self.kwargs["user_id"])
        except TuttiUser.DoesNotExist:
            return []
        if user != self.request.user and user.private:
            return []
        return user.friends

class TuttiUserAddView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        # Check if the user exists
        try:
            user = TuttiUser.objects.get(id=user_id)
        except TuttiUser.DoesNotExist:
            return Response({"status": "User does not exist."}, status=404)

        # Use a nice try-catch to figure out if the request already exists
        try:
            friend_request = request.user.requests_received.get(sent_from=user)
            request.user.friends.add(user)
            user.friends.add(request.user)
            friend_request.delete()
            return Response({"status": f"Friend request from user {user.id} accepted"})
        except FriendRequest.DoesNotExist:
            friend_request = FriendRequest(sent_from=request.user, sent_to=user)
            friend_request.save()
            return Response({"status": f"Friend request sent to user {user.id}"})

class SongMetadataView(APIView):
    @method_decorator(cache_page(60 * 15))
    def get(self, _request, song_id):
        try:
            song = Song.objects.get(id=song_id)
            release = getMetadata("release", f"reid:\"{song.release_mbid}\"", 1)
            recording = getMetadata("recording", f"rid:\"{song.recording_mbid}\"", 1)
            return Response({
                "album": release["releases"][0]["title"],
                "artist": recording["recordings"][0]["artist-credit"][0]["name"],
                "title": recording["recordings"][0]["title"],
            })
        except Song.DoesNotExist:
            return Response({"error": "Song does not exist."}, status=404)
        except Exception:
            return Response({"error": "Could not fetch song metadata."}, status=503)

class SongCoverView(APIView):
    @method_decorator(cache_page(60 * 15))
    def get(self, _, song_id):
        try:
            song = Song.objects.get(id=song_id)
            cover = getCover(song.release_mbid)
            return Response({
                "cover": cover,
            })
        except Song.DoesNotExist:
            return Response({"error": "Song does not exist."}, status=404)
        except Exception:
            return Response({"error": "Could not fetch song cover."}, status=503)

class ScrobbleView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    def post(self, request, scrobble_id):
        # Check if scrobble exists
        try:
            scrobble = Scrobble.objects.get(id=scrobble_id)
        except Scrobble.DoesNotExist:
            return Response({"error": "Scrobble does not exist."}, status_code=404)

        # Check if request is from correct user
        if scrobble.tuttiuser != request.user:
            return Response({"error": "Could not edit scrobble"}, status_code=404)

        # Like if liked, dislike if disliked
        if request.data["like"] == True:
            scrobble.rating = 1 if scrobble.rating == 2 else 2
        elif request.data["like"] == False:
            scrobble.rating = 1 if scrobble.rating == 0 else 0
        scrobble.save()
        serializer = ScrobbleSerializer(scrobble)
        return Response({"scrobble": serializer.data})

class SongRecommendationsView(ListCreateAPIView):
    model = Recommendation
    serializer_class = RecommendationSerializer
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]

    # Define the queryset for the list
    def get_queryset(self):
        try:
            song = Song.objects.get(id=self.kwargs["song_id"])
        except Song.DoesNotExist:
            return []
        return Recommendation.objects.filter(base_song=song)

    # Create a recommendation
    def perform_create(self, serializer):
        try:
            base_song = Song.objects.get(id=self.kwargs["song_id"])
            recommended_song = Song.objects.get(id=self.request.data["rec_id"])
        except Song.DoesNotExist:
            return Response({"error": "Song does not exist."}, status=404)
        serializer.save(base_song=base_song, recommended_song=recommended_song, tuttiuser=self.request.user)
