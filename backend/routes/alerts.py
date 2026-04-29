from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from backend.services.database import alerts
from pydantic import BaseModel
from typing import Optional
from backend.utils.response import api_response

router = APIRouter(tags=["Alerts"])

class ResolveRequest(BaseModel):
    resolved_by: str
    note: Optional[str] = None

@router.get("/")
def get_all_alerts(shipment_id: str = Query(None), resolved: bool = Query(None), limit: int = Query(50)):
    query = {}
    if shipment_id: query["shipment_id"] = shipment_id
    if resolved is not None: query["resolved"] = resolved
    data = list(alerts.find(query, {"_id": 0}).sort("created_at", -1).limit(limit))
    return api_response(success=True, message="Alerts retrieved", data=data)

@router.get("/{shipment_id}")
def get_shipment_alerts(shipment_id: str):
    data = list(alerts.find({"shipment_id": shipment_id}, {"_id": 0}).sort("created_at", -1))
    return api_response(success=True, message=f"Alerts for {shipment_id}", data=data)

@router.patch("/{alert_id}/resolve")
def resolve_alert(alert_id: str, body: ResolveRequest):
    from bson import ObjectId
    try: oid = ObjectId(alert_id)
    except: return api_response(success=False, message="Invalid ID", error="Bad ID", status_code=400)
    result = alerts.find_one_and_update({"_id": oid},
        {"$set": {"resolved": True, "resolved_by": body.resolved_by, "resolved_at": datetime.now(timezone.utc)}},
        return_document=True)
    if not result: return api_response(success=False, message="Not found", error="Not Found", status_code=404)
    result["_id"] = str(result["_id"])
    return api_response(success=True, message="Alert resolved", data=result)
