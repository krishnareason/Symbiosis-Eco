import os
from ninja import Router, File, Form
from ninja.files import UploadedFile
from django.conf import settings
from typing import List
from ..models import Threat
from ..schemas import ThreatOut, UploadResponse
from ..tasks import analyze_threat_image

router = Router()

@router.post("/upload", response=UploadResponse)
def upload_threat(request, lat: float = Form(...), lon: float = Form(...), file: UploadedFile = File(...)):
    # Save the file temporarily
    filename = file.name
    temp_path = os.path.join(settings.MEDIA_ROOT, filename)
    
    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
    with open(temp_path, 'wb+') as destination:
        for chunk in file.chunks():
            destination.write(chunk)

    # Create the Threat model with pending status
    threat = Threat.objects.create(
        lat=lat,
        lng=lon,
        status='pending'
    )

    # Dispatch to Celery
    analyze_threat_image.delay(threat.id, temp_path)

    return {
        "status": "processing",
        "message": "Image uploaded successfully. Analysis in progress.",
        "data": {"threat_id": threat.id}
    }

@router.get("/radar", response=List[ThreatOut])
def get_radar_threats(request):
    # Only return verified threats for the map
    threats = Threat.objects.filter(status='verified')
    return threats

from django.shortcuts import get_object_or_404

@router.get("/{threat_id}", response=ThreatOut)
def get_threat(request, threat_id: int):
    threat = get_object_or_404(Threat, id=threat_id)
    return threat

@router.get("/all", response=List[ThreatOut])
def get_all_threats(request):
    # For a hypothetical admin dashboard
    threats = Threat.objects.all()
    return threats
