import os
import requests
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from supabase import create_client, Client
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "dx87689cu")
CLOUDINARY_URL = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/image/upload"
CLOUDINARY_UPLOAD_PRESET = os.getenv("CLOUDINARY_UPLOAD_PRESET", "dljw0jaf")

@router.post("/upload")
async def upload_threat(
    file: UploadFile = File(...),
    lat: float = Form(...),
    lon: float = Form(...)
):
    # 1. Cloudinary Integration
    try:
        file_bytes = await file.read()
        
        files = {"file": (file.filename, file_bytes, file.content_type)}
        data = {"upload_preset": CLOUDINARY_UPLOAD_PRESET}
        
        response = requests.post(CLOUDINARY_URL, files=files, data=data)
        response.raise_for_status()
        cloudinary_data = response.json()
        image_url = cloudinary_data.get("secure_url")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")

    # 2. Gemini Integration
    try:
        model = genai.GenerativeModel('gemini-3.6-flash')
        
        prompt = "Analyze this image for environmental issues or threats. For testing purposes, be very lenient. If you see ANY trash, unnatural objects, human interference, or anything remotely related to plastic, deforestation, or coral bleaching, return true. Return a JSON object exactly like this: {\"is_threat\": true/false, \"threat_type\": \"plastic\"/\"deforestation\"/\"coral\"/\"none\"}."
        
        image_parts = [
            {
                "mime_type": file.content_type,
                "data": file_bytes
            }
        ]
        
        gemini_response = model.generate_content([prompt, image_parts[0]])
        
        response_text = gemini_response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]
            
        validation = json.loads(response_text)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini analysis failed: {str(e)}")

    if not validation.get("is_threat"):
        return {"status": "rejected", "message": "No environmental threat detected by AI."}

    # 3. Supabase Integration
    try:
        threat_data = {
            "image_url": image_url,
            "lat": lat,
            "lng": lon,
            "type": validation.get("threat_type", "unknown"),
            "title": f"Verified {validation.get('threat_type', 'Threat').capitalize()}"
        }
        if supabase:
            db_response = supabase.table("threats").insert(threat_data).execute()
        else:
            print("Warning: Supabase credentials not found. Skipping DB insert.")
            db_response = None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")

    return {"status": "success", "message": "Threat validated and saved.", "data": threat_data}

@router.get("/radar")
async def get_radar_threats():
    try:
        if supabase:
            response = supabase.table("threats").select("*").execute()
            return response.data
        else:
            return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch threats: {str(e)}")
