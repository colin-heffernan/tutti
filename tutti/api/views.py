from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.contrib.auth import get_user_model, authenticate, login, logout
from rest_framework import generics, status
from rest_framework.generics import CreateAPIView, ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import SessionAuthentication
from .serializers import TuttiUserSerializer

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

# def csrf(request):
#     return JsonResponse({"csrfToken": get_token(request)})
