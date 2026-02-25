from django.db import models
import string
import random

# Create your models here.
class User(models.Model):
    username = models.CharField(max_length=32, unique=True, null=False)
    password = models.CharField(max_length=32, null=False)
    date_joined = models.DateTimeField(auto_now_add=True)

# inbox = XREF
# outbox = XREF
# following = XREF
# followers = XREF
# liked = XREF

class Scrobble(models.Model):
    title = models.CharField(max_length=128, null=False)
    musicbrainz_id = models.CharField(max_length=36)
    user_id = models.IntegerField(null=False)
    time = models.DateTimeField(auto_now_add=True)
