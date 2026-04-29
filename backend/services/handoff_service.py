import hashlib, logging
from datetime import datetime, timezone
from backend.services.database import handoffs, alerts, audit_logs, shipments
from backend.services.blockchain_service import blockchain
from backend.models.schemas import HandoffCreate, EventType, AlertType

logger = logging.getLogger(__name__)
def _utcnow(): return datetime.now(timezone.utc)

def record_handoff(shipment_id: str, data: HandoffCreate) -> dict:
    shipment = shipments.find_one({"shipment_id": shipment_id})
    if not shipment: return None
    timestamp = _utcnow()
    payload = f"{shipment_id}|{data.from_party}|{data.to_party}|{data.location}|{data.signed_by}|{timestamp.isoformat()}"
    handoff_hash = "0x" + hashlib.sha256(payload.encode()).hexdigest()
    bc_result = blockchain.anchor_event(shipment_id, EventType.CUSTODY_HANDOFF, handoff_hash)
    record = {
        "shipment_id": shipment_id, "from_party": data.from_party, "to_party": data.to_party,
        "location": data.location, "notes": data.notes, "signed_by": data.signed_by,
        "handoff_hash": handoff_hash,
        "blockchain_tx": bc_result.get("tx_hash") if bc_result else None,
        "timestamp": timestamp,
    }
    handoffs.insert_one(record)
    record.pop("_id", None)
    shipments.update_one({"shipment_id": shipment_id}, {"$set": {"status": "CUSTODY_TRANSFER", "updated_at": timestamp}})
    return record

def get_handoffs(shipment_id: str) -> list:
    return list(handoffs.find({"shipment_id": shipment_id}, {"_id": 0}).sort("timestamp", 1))

def validate_custody_chain(shipment_id: str) -> dict:
    chain = get_handoffs(shipment_id)
    if not chain: return {"status": "NO_HANDOFFS", "issues": []}
    issues = []
    for i in range(len(chain) - 1):
        if chain[i]["to_party"] != chain[i + 1]["from_party"]:
            issues.append(f"Gap at step {i+1}: expected '{chain[i]['to_party']}' got '{chain[i+1]['from_party']}'")
    for h in chain:
        if h.get("handoff_hash"):
            if not blockchain.verify_hash(shipment_id, h["handoff_hash"]):
                issues.append(f"Hash not on chain: {h['handoff_hash'][:18]}…")
    return {"status": "PASS" if not issues else "FAIL", "total_handoffs": len(chain), "issues": issues, "chain": chain}
