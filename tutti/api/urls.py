from django.contrib.auth import views as auth_views
from django.urls import path
from .views import (
    CsrfView,
    CreateTuttiUserView, LoginTuttiUserView, LogoutTuttiUserView, TuttiUserSessionView,
    CreateScrobbleView,
    TuttiUserScrobbleView, TuttiUserProfileView,
    ScrobbleMetadataView, ScrobbleCoverView,
    ScrobbleLikeView, ScrobbleDislikeView,
)

urlpatterns = [
    path('csrf/', CsrfView.as_view()),
    path('auth/register/', CreateTuttiUserView.as_view()),
    path('auth/login/', LoginTuttiUserView.as_view()),
    path('auth/logout/', LogoutTuttiUserView.as_view()),
    path('auth/session/', TuttiUserSessionView.as_view()),
    path('user/createscrobble/', CreateScrobbleView.as_view()),
    path('user/scrobbles/', TuttiUserScrobbleView.as_view()),
    path('user/profile/', TuttiUserProfileView.as_view()),
    path('scrobble/data/', ScrobbleMetadataView.as_view()),
    path('scrobble/cover/', ScrobbleCoverView.as_view()),
    path('scrobble/like/', ScrobbleLikeView.as_view()),
    path('scrobble/dislike/', ScrobbleDislikeView.as_view()),
]
