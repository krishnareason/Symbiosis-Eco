from fastapi import APIRouter

router = APIRouter()

# Mock data for predictions
mock_predictions = {
    "deforestation": [
        {"id": "pred-d1", "lat": 21.0, "lng": 79.0, "type": "predicted_deforestation", "title": "Predicted Deforestation High Risk"}
    ],
    "plastic": [
        {"id": "pred-p1", "lat": 20.0, "lng": 78.5, "type": "predicted_plastic", "title": "Predicted Plastic Accumulation"}
    ],
    "coral": [
        {"id": "pred-c1", "lat": 19.5, "lng": 79.5, "type": "predicted_coral", "title": "Predicted Coral Bleaching"}
    ]
}

@router.get("/deforestation")
async def get_deforestation_predictions():
    return mock_predictions["deforestation"]

@router.get("/plastic")
async def get_plastic_predictions():
    return mock_predictions["plastic"]

@router.get("/coral")
async def get_coral_predictions():
    return mock_predictions["coral"]
