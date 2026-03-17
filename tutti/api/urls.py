from django.contrib.auth import views as auth_views
from django.urls import path
from .views import TuttiUserView, CreateTuttiUserView, LoginTuttiUserView, LogoutTuttiUserView, CsrfView, TuttiUserSessionView

urlpatterns = [
    path('users/', TuttiUserView.as_view()),
    path('csrf/', CsrfView.as_view()),
    path('auth/register/', CreateTuttiUserView.as_view()),
    path('auth/login/', LoginTuttiUserView.as_view()),
    path('auth/logout/', LogoutTuttiUserView.as_view()),
    path('auth/session/', TuttiUserSessionView.as_view())
]
