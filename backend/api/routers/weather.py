import os
import requests
from ninja import Router
from django.http import JsonResponse

router = Router()

@router.get("")
def get_weather(request, lat: float, lon: float):
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return JsonResponse({"error": "OPENWEATHER_API_KEY not found in environment variables."}, status=500)

    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": f"Failed to fetch weather data: {str(e)}"}, status=500)
