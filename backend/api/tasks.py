import os
import json
import requests
from celery import shared_task
import google.generativeai as genai
from .models import Threat
from django.conf import settings

@shared_task
def analyze_threat_image(threat_id, image_path):
    try:
        threat = Threat.objects.get(id=threat_id)
    except Threat.DoesNotExist:
        print(f"Task failed: Threat {threat_id} does not exist.")
        return

    # 1. Cloudinary Integration
    try:
        CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "dx87689cu")
        CLOUDINARY_URL = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/image/upload"
        CLOUDINARY_UPLOAD_PRESET = os.getenv("CLOUDINARY_UPLOAD_PRESET", "dljw0jaf")
        
        with open(image_path, "rb") as file:
            file_bytes = file.read()
            files = {"file": (os.path.basename(image_path), file_bytes, "image/jpeg")}
            data = {"upload_preset": CLOUDINARY_UPLOAD_PRESET}
            
            response = requests.post(CLOUDINARY_URL, files=files, data=data)
            response.raise_for_status()
            cloudinary_data = response.json()
            image_url = cloudinary_data.get("secure_url")
            
            # Save the url immediately
            threat.image_url = image_url
            threat.save()
            
    except Exception as e:
        print(f"Cloudinary upload failed: {str(e)}")
        threat.status = 'rejected'
        threat.save()
        return

    # 2. Gemini Integration
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
        model = genai.GenerativeModel('gemini-3.6-flash')
        
        prompt = "Analyze this image for environmental issues or threats. For testing purposes, be very lenient. If you see ANY trash, unnatural objects, human interference, or anything remotely related to plastic, deforestation, or coral bleaching, return true. Return a JSON object exactly like this: {\"is_threat\": true/false, \"threat_type\": \"plastic\"/\"deforestation\"/\"coral\"/\"none\"}."
        
        image_parts = [
            {
                "mime_type": "image/jpeg",
                "data": file_bytes
            }
        ]
        
        gemini_response = model.generate_content([prompt, image_parts[0]])
        
        response_text = gemini_response.text.strip()
        print(f"Gemini Raw Response: {response_text}")
        
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]
            
        validation = json.loads(response_text)
        print(f"Parsed Validation: {validation}")
        
    except Exception as e:
        print(f"Gemini analysis failed: {str(e)}")
        threat.status = 'rejected'
        threat.save()
        return

    # 3. Update Threat Model
    if validation.get("is_threat"):
        threat.status = 'verified'
        threat.type = validation.get("threat_type", "unknown")
        threat.title = f"Verified {threat.type.capitalize()} Threat"
    else:
        threat.status = 'rejected'
        
    threat.save()

    # Clean up the local temporary file
    try:
        if os.path.exists(image_path):
            os.remove(image_path)
    except Exception:
        pass
        
    return f"Threat {threat_id} processed: {threat.status}"
