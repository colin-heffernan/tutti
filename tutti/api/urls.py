from django.contrib.auth import views as auth_views
from django.urls import path
from .views import (
    # CsrfView,
    # Auth views
    TuttiUserRegisterView, TuttiUserLoginView, TuttiUserLogoutView, TuttiUserSessionView, TuttiUserDeleteView,
    # User content views
    TuttiUserScrobblesView, TuttiUserProfileView, TuttiUserRecommendationsView, TuttiUserAboutView,
    # Scrobble views
    ScrobbleView,
    # Song views
    SongMetadataView, SongCoverView, SongRecommendationsView,
)

urlpatterns = [
    # path('csrf/', CsrfView.as_view()),
    path('auth/register/', TuttiUserRegisterView.as_view()),
    path('auth/login/', TuttiUserLoginView.as_view()),
    path('auth/logout/', TuttiUserLogoutView.as_view()),
    path('auth/session/', TuttiUserSessionView.as_view()),
    path('auth/delete/', TuttiUserDeleteView.as_view()),
    path('user/<int:user_id>/scrobbles/', TuttiUserScrobblesView.as_view()), # GET for list, POST for create
    path('user/<int:user_id>/profile/', TuttiUserProfileView.as_view()),
    path('user/<int:user_id>/recommendations/', TuttiUserRecommendationsView.as_view()),
    path('user/<int:user_id>/about/', TuttiUserAboutView.as_view()), # GET for retrieval, POST + command for update
    path('scrobble/<int:scrobble_id>/', ScrobbleView.as_view()),
    path('song/<int:song_id>/metadata/', SongMetadataView.as_view()),
    path('song/<int:song_id>/cover/', SongCoverView.as_view()),
    path('song/<int:song_id>/recommendations/', SongRecommendationsView.as_view()), # GET for list, POST for create
]
