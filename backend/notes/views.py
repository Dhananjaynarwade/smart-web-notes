import uuid

from django.http import Http404
from django.shortcuts import get_object_or_404

from rest_framework import viewsets

from .models import (
    Note,
    NoteImage,
    Folder
)

from .serializers import (
    NoteSerializer,
    NoteImageSerializer,
    FolderSerializer
)


class NoteViewSet(
    viewsets.ModelViewSet
):

    queryset = (
        Note.objects
        .all()
        .order_by('-updated_at')
    )

    serializer_class = (
        NoteSerializer
    )

    # New readable URL lookup
    lookup_field = 'slug'


    def get_object(self):

        queryset = self.filter_queryset(
            self.get_queryset()
        )

        lookup_value = self.kwargs.get(
            self.lookup_field
        )


        if not lookup_value:
            raise Http404


        # ==========================================
        # FIRST TRY SLUG
        # ==========================================

        note = queryset.filter(
            slug=lookup_value
        ).first()


        if note is not None:

            self.check_object_permissions(
                self.request,
                note
            )

            return note


        # ==========================================
        # FALLBACK TO OLD UUID
        # ==========================================

        try:

            uuid.UUID(
                str(lookup_value)
            )

        except (
            ValueError,
            TypeError
        ):

            raise Http404


        note = get_object_or_404(
            queryset,
            pk=lookup_value
        )


        self.check_object_permissions(
            self.request,
            note
        )


        return note


class NoteImageViewSet(
    viewsets.ModelViewSet
):

    queryset = (
        NoteImage.objects
        .all()
        .order_by('-uploaded_at')
    )

    serializer_class = (
        NoteImageSerializer
    )


class FolderViewSet(
    viewsets.ModelViewSet
):

    queryset = (
        Folder.objects
        .all()
        .order_by('name')
    )

    serializer_class = (
        FolderSerializer
    )


    # ==========================================
    # RENAME FOLDER
    # ==========================================

    def perform_update(
        self,
        serializer
    ):

        old_name = (
            serializer.instance.name
        )


        folder = (
            serializer.save()
        )


        Note.objects.filter(
            folder=old_name
        ).update(
            folder=folder.name
        )


    # ==========================================
    # DELETE FOLDER
    # ==========================================

    def perform_destroy(
        self,
        instance
    ):

        old_name = (
            instance.name
        )


        Note.objects.filter(
            folder=old_name
        ).update(
            folder='All Notes'
        )


        instance.delete()