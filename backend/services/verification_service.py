import logging
from datetime import datetime, timezone
from backend.services.document_service import verify_all_documents
from backend.services.handoff_service import validate_custody_chain
from backend.services.temperature_service import get_breach_summary
from backend.services.risk_service import compute_and_save_risk
from backend.services.database import shipments, audit_logs

logger = logging.getLogger(__name__)
def _utcnow(): return datetime.now(timezone.utc)

def full_verify(shipment_id: str) -> dict:
    shipment = shipments.find_one({"shipment_id": shipment_id}, {"_id": 0})
    if not shipment: return {"verdict": "ERROR", "reason": "Shipment not found"}
    reasons = []
    checks = {}
    doc_result = verify_all_documents(shipment_id)
    if doc_result["status"] == "NO_DOCUMENTS":
        checks["document_check"] = "NO_DOCUMENTS"; reasons.append("No documents uploaded")
    elif doc_result["status"] == "FAIL":
        checks["document_check"] = "FAIL"; reasons.append(f"{doc_result['failed']} document(s) failed hash verification")
    else:
        checks["document_check"] = "PASS"
    custody = validate_custody_chain(shipment_id)
    if custody["status"] == "NO_HANDOFFS":
        checks["custody_check"] = "NO_HANDOFFS"; reasons.append("No custody handoffs recorded")
    elif custody["status"] == "FAIL":
        checks["custody_check"] = "FAIL"
        for issue in custody["issues"]: reasons.append(f"Custody: {issue}")
    else:
        checks["custody_check"] = "PASS"
    temp = get_breach_summary(shipment_id)
    if temp["breach_count"] > 0:
        checks["temperature_check"] = "BREACH_DETECTED"; reasons.append(f"{temp['breach_count']} temperature breach(es)")
    elif temp["total_readings"] == 0:
        checks["temperature_check"] = "NO_DATA"; reasons.append("No temperature readings")
    else:
        checks["temperature_check"] = "PASS"
    risk = compute_and_save_risk(shipment_id)
    if risk["score"] > 70: reasons.append(f"Risk score {risk['score']}/100 (HIGH)")
    verdict = "FLAGGED" if any([checks.get("document_check") == "FAIL", checks.get("custody_check") == "FAIL", risk["score"] > 70]) else "APPROVED"
    return {"shipment_id": shipment_id, "verdict": verdict, "reasons": reasons or ["All checks passed"],
            "document_check": checks.get("document_check"), "custody_check": checks.get("custody_check"),
            "temperature_check": checks.get("temperature_check"), "risk_score": risk["score"],
            "verified_at": _utcnow().isoformat()}
