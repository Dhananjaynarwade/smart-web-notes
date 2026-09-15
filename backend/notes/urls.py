from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import NoteViewSet, NoteImageViewSet


router = DefaultRouter()

router.register(
    r'notes',
    NoteViewSet,
    basename='note'
)

router.register(
    r'images',
    NoteImageViewSet,
    basename='image'
)


urlpatterns = [
    path('', include(router.urls)),
]