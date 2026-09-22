import uuid

from django.db import models
from django.utils.text import slugify


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

    # Readable URL name
    # Example:
    # DevOps Interview Notes
    # -> devops-interview-notes
    slug = models.SlugField(
        max_length=300,
        unique=True,
        blank=True,
        null=True
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

    def save(self, *args, **kwargs):

        # Create slug only once
        if not self.slug:

            base_slug = slugify(
                self.title or 'untitled-note'
            )

            slug = base_slug
            number = 2

            # Handle duplicate note titles
            while Note.objects.filter(
                slug=slug
            ).exclude(
                pk=self.pk
            ).exists():

                slug = (
                    f'{base_slug}-{number}'
                )

                number += 1

            self.slug = slug

        super().save(
            *args,
            **kwargs
        )

    def __str__(self):
        return (
            self.title
            or 'Untitled Note'
        )


class NoteImage(models.Model):

    image = models.ImageField(
        upload_to='note-images/'
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return str(
            self.image
        )


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