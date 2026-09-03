import os
import google.generativeai as genai
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("")
async def get_analysis():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"analysis": "<h3>Error: Gemini API Key missing</h3><p>Please configure your API key in the backend .env file.</p>"}

    try:
        model = genai.GenerativeModel('gemini-3.6-flash')
        prompt = """
        Write a short, professional, 3-paragraph global environmental analysis report. 
        Format it in HTML. Include a <h2> title, and use <p> tags. 
        Focus on current trends in deforestation, plastic pollution, and coral bleaching.
        """
        response = model.generate_content(prompt)
        # Clean up markdown formatting if Gemini includes it
        html_content = response.text.replace("```html", "").replace("```", "").strip()
        
        return {"analysis": html_content}
    except Exception as e:
        return {"analysis": f"<h3>Analysis Generation Failed</h3><p>{str(e)}</p>"}
