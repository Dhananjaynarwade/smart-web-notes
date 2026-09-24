from rest_framework import serializers

from .models import (
    Note,
    NoteImage,
    Folder
)


class NoteSerializer(
    serializers.ModelSerializer
):

    id = serializers.UUIDField(
        required=False
    )

    class Meta:

        model = Note

        fields = [
            'id',
            'title',
            'slug',
            'content',
            'folder',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'slug',
            'created_at',
            'updated_at',
        ]


class NoteImageSerializer(
    serializers.ModelSerializer
):

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


class FolderSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = Folder

        fields = [
            'id',
            'name',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'created_at',
        ]