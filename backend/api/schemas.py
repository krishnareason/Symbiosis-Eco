from ninja import Schema
from typing import List, Optional
from pydantic import Field

class ThreatOut(Schema):
    id: int
    lat: float
    lng: float
    image_url: Optional[str] = None
    type: str
    title: str
    status: str

class UploadResponse(Schema):
    status: str
    message: str
    data: dict

class WeatherResponse(Schema):
    # Just returning raw dict since weather API response is complex
    pass

class PredictionOut(Schema):
    id: str
    lat: float
    lng: float
    type: str
    title: str
