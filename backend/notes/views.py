from rest_framework import viewsets

from .models import Note, NoteImage

from .serializers import (
    NoteSerializer,
    NoteImageSerializer
)


class NoteViewSet(viewsets.ModelViewSet):

    queryset =Note.objects.all().order_by('-updated_at')

    serializer_class =NoteSerializer


class NoteImageViewSet(viewsets.ModelViewSet):

    queryset =  NoteImage.objects.all().order_by('-uploaded_at')

    serializer_class =NoteImageSerializer