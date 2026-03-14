from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import UserSerializer, CreateUserSerializer
from .models import User

# Create your views here.
class UserView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class CreateUserView(APIView):
    serializer_class = CreateUserSerializer

    def post(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()
        
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            username = serializer.data.get("username")
            display_name = serializer.data.get("display_name")
            email = serializer.data.get("email")
            password = serializer.data.get("password")
            queryset = User.objects.filter(username=username)
            if queryset.exists():
                pass
            else:
                user = User(username=username, display_name=display_name, email=email, password=password)
                user.save()
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
