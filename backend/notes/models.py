import uuid

from django.db import models
from django.utils.text import slugify


class Note(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    slug = models.SlugField(
        max_length=300,
        unique=True,
        blank=True,
        null=True
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


    # ==========================================
    # CREATE UNIQUE SLUG FROM NOTE TITLE
    # ==========================================

    def save(self, *args, **kwargs):

        if not self.slug:

            base_slug = slugify(
                self.title
            ) or 'untitled'

            new_slug = base_slug
            counter = 2


            while Note.objects.filter(
                slug=new_slug
            ).exclude(
                pk=self.pk
            ).exists():

                new_slug = (
                    f'{base_slug}-{counter}'
                )

                counter += 1


            self.slug = new_slug


        super().save(
            *args,
            **kwargs
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