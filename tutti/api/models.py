from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, UserManager

# Create your models here.
class CachedQuery(models.Model):
    key = models.CharField(max_length=64, unique=True, null=False)
    data = models.CharField(null=False)
    time_updated = models.DateTimeField(auto_now_add=True)

class TuttiUser(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=32, unique=True, null=False)
    display_name = models.CharField(max_length=64, unique=True, null=True)
    email = models.CharField(unique=True, null=False)
    password = models.CharField(null=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now_add=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    city = models.CharField(max_length=64, null=True)
    country = models.CharField(max_length=64, null=True)
    private = models.BooleanField(default=True)
    friends = models.ManyToManyField("self")
    REQUIRED_FIELDS = ["password"]
    USERNAME_FIELD = "username"
    EMAIL_FIELD = "email"
    objects = UserManager()

class FriendRequest(models.Model):
    sent_from = models.ForeignKey(TuttiUser, on_delete=models.CASCADE, related_name="requests_sent")
    sent_to = models.ForeignKey(TuttiUser, on_delete=models.CASCADE, related_name="requests_received")
    sent_on = models.DateTimeField(auto_now_add=True)

# inbox = XREF
# outbox = XREF
# following = XREF
# followers = XREF
# liked = XREF

class Song(models.Model):
    release_mbid = models.CharField(max_length=36, null=False)
    recording_mbid = models.CharField(max_length=36, null=False)
    # recommendations = models.ManyToManyField("self", symmetrical=False, related_name="recommended_by")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['release_mbid', 'recording_mbid'], 
                name='unique_release_recording'
            )
        ]

class Scrobble(models.Model):
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name="scrobbles")
    tuttiuser = models.ForeignKey(TuttiUser, on_delete=models.CASCADE, related_name="scrobbles")
    raw_data = models.CharField(max_length=128, null=False)
    rating = models.IntegerField(null=False, default=1)
    time_created = models.DateTimeField(auto_now_add=True)
    time_updated = models.DateTimeField(auto_now_add=True)

# TODO: Implement further.
class Recommendation(models.Model):
    base_song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name="recommendations")
    recommended_song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name="recommended_by")
    tuttiuser = models.ForeignKey(TuttiUser, on_delete=models.CASCADE)
    time_created = models.DateTimeField(auto_now_add=True)

# TODO: Implement further.
# class RecommendationReaction(models.Model):
#     rating = models.IntegerField(null=False, default=1)
#     recommendation = models.ForeignKey(Recommendation, on_delete=models.CASCADE, related_name="reactions")
#     tuttiuser = models.ForeignKey(TuttiUser, on_delete=models.CASCADE, unique=True, related_name="+")
