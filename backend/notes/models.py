import uuid

from django.db import models


class Note(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    title = models.CharField(
        max_length=255,
        blank=True
    )

    content = models.TextField(
        blank=True
    )

    folder = models.CharField(
        max_length=100,
        default='All Notes'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.title or 'Untitled Note'


class NoteImage(models.Model):

    image = models.ImageField(
        upload_to='note-images/'
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return str(self.image)


class Folder(models.Model):

    name = models.CharField(
        max_length=100,
        unique=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.name