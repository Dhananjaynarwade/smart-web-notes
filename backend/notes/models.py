import uuid

from django.db import models
from django.db import IntegrityError, transaction
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


    def save(
        self,
        *args,
        **kwargs
    ):

        # Existing note already has slug
        if self.slug:

            return super().save(
                *args,
                **kwargs
            )


        base_slug = slugify(
            self.title or 'untitled-note'
        )


        if not base_slug:

            base_slug = 'untitled-note'


        base_slug = base_slug[:280]

        number = 1


        while True:

            if number == 1:

                self.slug = base_slug

            else:

                self.slug = (
                    f'{base_slug}-{number}'
                )


            try:

                with transaction.atomic():

                    return super().save(
                        *args,
                        **kwargs
                    )


            except IntegrityError:

                number += 1


    def __str__(self):

        return (
            self.title or
            'Untitled Note'
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