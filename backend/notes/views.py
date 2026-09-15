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


        # Move notes back to All Notes
        Note.objects.filter(
            folder=old_name
        ).update(
            folder='All Notes'
        )


        instance.delete()