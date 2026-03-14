from django.urls import path
from .views import UserView, CreateUserView

urlpatterns = [
    path('users', UserView.as_view()),
    path('auth/register', CreateUserView.as_view()),
]