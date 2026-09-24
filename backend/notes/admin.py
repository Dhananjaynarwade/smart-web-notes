from django.contrib import admin

from .models import (
    Note,
    NoteImage,
    Folder
)


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):

    list_display = (
        'title',
        'folder',
        'updated_at',
        'created_at',
    )

    search_fields = (
        'title',
        'content',
        'folder',
        'slug',
    )

    ordering = (
        '-updated_at',
    )


@admin.register(NoteImage)
class NoteImageAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'uploaded_at',
    )

    ordering = (
        '-uploaded_at',
    )


@admin.register(Folder)
class FolderAdmin(admin.ModelAdmin):

    list_display = (
        'name',
        'created_at',
    )

    search_fields = (
        'name',
    )

    ordering = (
        'name',
    )