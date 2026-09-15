from rest_framework import serializers

from .models import Note
from .models import Note, NoteImage


class NoteSerializer(serializers.ModelSerializer):

    # Allow Angular's UUID to be saved in Django
    id = serializers.UUIDField(required=False)

    class Meta:
        model = Note

        fields = [
            'id',
            'title',
            'content',
            'folder',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'created_at',
            'updated_at',
        ]


class NoteImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = NoteImage

        fields = [
            'id',
            'image',
            'uploaded_at',
        ]

        read_only_fields = [
            'id',
            'uploaded_at',
        ]