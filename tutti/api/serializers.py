from rest_framework import serializers
from django.contrib.auth import get_user_model

TuttiUser = get_user_model()

class TuttiUserSerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        user = TuttiUser.objects.create_user(
            username=validated_data["username"],
            display_name=validated_data["display_name"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        return user

    class Meta:
        model = TuttiUser
        fields = ('id', 'username', 'display_name', 'email', 'password', 'date_joined')
