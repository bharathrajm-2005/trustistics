from fastapi import APIRouter, HTTPException, Query
from backend.models.schemas import TemperatureLogCreate, EventCreate
import backend.services.temperature_service as svc
import backend.services.shipment_service as ship_svc
from backend.utils.response import api_response
from backend.services.blockchain_service import blockchain

router = APIRouter(tags=["Tracking"])

@router.post("/shipment/{shipment_id}/event")
def add_event(shipment_id: str, payload: EventCreate):
    result = ship_svc.add_shipment_event(shipment_id, payload.event_type, payload.location)
    if not result.get("success"):
        return api_response(success=False, message="Failed to add event", error=result.get("error"), blockchain_ready=blockchain.is_ready)
    return api_response(success=True, message="Event added", data=result, blockchain_ready=blockchain.is_ready)

@router.get("/shipment/{shipment_id}/timeline")
def get_timeline(shipment_id: str):
    doc = ship_svc.get_shipment(shipment_id)
    if not doc:
        return api_response(success=False, message="Shipment not found", error="Not Found", status_code=404)
    data = {
        "shipment_id": shipment_id,
        "events": doc.get("events", [])
    }
    return api_response(success=True, message="Timeline retrieved", data=data)

@router.post("/{shipment_id}/temperature", status_code=201)
def log_temperature(shipment_id: str, data: TemperatureLogCreate):
    record = svc.log_temperature(shipment_id, data)
    if record is None:
        return api_response(success=False, message="Shipment not found", error="Not Found", status_code=404)
    return api_response(success=True, message="Temperature logged", data=record)

@router.get("/{shipment_id}/temperature")
def get_logs(shipment_id: str, limit: int = Query(200)):
    items = svc.get_temperature_logs(shipment_id, limit=limit)
    return api_response(success=True, message="Temperature logs", data=items)

@router.get("/{shipment_id}/temperature/summary")
def get_summary(shipment_id: str):
    summary = svc.get_breach_summary(shipment_id)
    return api_response(success=True, message="Breach summary", data=summary)
