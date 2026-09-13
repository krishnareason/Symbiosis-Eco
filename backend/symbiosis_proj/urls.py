from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI

from api.routers.threats import router as threats_router
from api.routers.weather import router as weather_router
from api.routers.predictions import router as predictions_router
from api.routers.analysis import router as analysis_router

api = NinjaAPI(title="Symbiosis MVP API")

api.add_router("/threats", threats_router, tags=["threats"])
api.add_router("/weather", weather_router, tags=["weather"])
api.add_router("/predictions", predictions_router, tags=["predictions"])
api.add_router("/analysis", analysis_router, tags=["analysis"])

@api.get("/eco-uploads")
def get_eco_uploads(request):
    return []

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
]
