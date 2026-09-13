from ninja import Router
from typing import List
from ..schemas import PredictionOut

router = Router()

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

@router.get("/deforestation", response=List[PredictionOut])
def get_deforestation_predictions(request):
    return mock_predictions["deforestation"]

@router.get("/plastic", response=List[PredictionOut])
def get_plastic_predictions(request):
    return mock_predictions["plastic"]

@router.get("/coral", response=List[PredictionOut])
def get_coral_predictions(request):
    return mock_predictions["coral"]
