from django.urls import path

from .views import match_cv


urlpatterns = [
    path("match", match_cv, name="match_cv"),
]
