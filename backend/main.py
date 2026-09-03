from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Symbiosis MVP API")

# Configure CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Symbiosis FastAPI Backend!"}

from api.routes import threats, weather, predictions, analysis
app.include_router(threats.router, prefix="/api/threats", tags=["threats"])
app.include_router(weather.router, prefix="/api/weather", tags=["weather"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])

@app.get("/api/eco-uploads")
async def get_eco_uploads():
    # Return mock or empty list of eco-uploads for now
    return []

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
