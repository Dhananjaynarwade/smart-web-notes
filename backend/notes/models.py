import uuid

from django.db import models
from django.utils.text import slugify


# ==========================================
# NOTE
# ==========================================

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


    # ======================================
    # CREATE UNIQUE SLUG
    # ======================================

    def save(self, *args, **kwargs):

        if not self.slug:

            base_slug = slugify(
                self.title or 'untitled-note'
            )

            if not base_slug:
                base_slug = 'untitled-note'

            # Keep slug safely below max_length=300
            base_slug = base_slug[:250]

            # UUID guarantees uniqueness
            self.slug = (
                f'{base_slug}-{self.id}'
            )

        super().save(
            *args,
            **kwargs
        )


    def __str__(self):

        return (
            self.title
            or 'Untitled Note'
        )


# ==========================================
# NOTE IMAGE
# ==========================================

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


# ==========================================
# FOLDER
# ==========================================

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