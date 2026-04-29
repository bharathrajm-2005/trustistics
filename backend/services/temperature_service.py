import logging
from datetime import datetime, timezone
from backend.services.database import temperature_logs, shipments, alerts, audit_logs
from backend.models.schemas import TemperatureLogCreate, AlertType

logger = logging.getLogger(__name__)
def _utcnow(): return datetime.now(timezone.utc)

def log_temperature(shipment_id: str, data: TemperatureLogCreate) -> dict:
    shipment = shipments.find_one({"shipment_id": shipment_id})
    if not shipment: return None
    min_t = shipment.get("min_temp_celsius", 2.0)
    max_t = shipment.get("max_temp_celsius", 8.0)
    is_breach = not (min_t <= data.temperature_celsius <= max_t)
    log = {
        "shipment_id": shipment_id, "temperature_celsius": data.temperature_celsius,
        "location": data.location, "latitude": data.latitude, "longitude": data.longitude,
        "logged_by": data.logged_by, "logged_at": _utcnow(),
        "is_breach": is_breach, "safe_min": min_t, "safe_max": max_t,
    }
    temperature_logs.insert_one(log)
    log.pop("_id", None)
    if is_breach:
        alerts.insert_one({
            "shipment_id": shipment_id, "alert_type": AlertType.TEMPERATURE_BREACH,
            "message": f"Breach: {data.temperature_celsius}°C (safe: {min_t}–{max_t}°C)",
            "severity": "HIGH", "resolved": False, "created_at": _utcnow(),
        })
    return log

def get_temperature_logs(shipment_id: str, limit: int = 200) -> list:
    return list(temperature_logs.find({"shipment_id": shipment_id}, {"_id": 0}).sort("logged_at", -1).limit(limit))

def get_breach_summary(shipment_id: str) -> dict:
    all_logs = list(temperature_logs.find({"shipment_id": shipment_id}, {"_id": 0}))
    breaches = [l for l in all_logs if l.get("is_breach")]
    if not all_logs: return {"total_readings": 0, "breach_count": 0, "breach_rate": 0.0}
    return {"total_readings": len(all_logs), "breach_count": len(breaches),
            "breach_rate": round(len(breaches) / len(all_logs) * 100, 2), "breaches": breaches}
