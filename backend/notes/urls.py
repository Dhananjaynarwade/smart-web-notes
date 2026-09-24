from rest_framework.routers import DefaultRouter

from .views import (
    NoteViewSet,
    NoteImageViewSet,
    FolderViewSet
)


router = DefaultRouter()


router.register(
    'notes',
    NoteViewSet,
    basename='notes'
)


router.register(
    'images',
    NoteImageViewSet,
    basename='images'
)


router.register(
    'folders',
    FolderViewSet,
    basename='folders'
)


urlpatterns = router.urls