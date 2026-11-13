import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.database.connection import mongo_db, MongoDBConnectionError

logger = logging.getLogger("thermal_fault.repository")

class AnalysisRepository:
    """Repository handling CRUD operations for thermal analysis records in MongoDB."""

    def __init__(self):
        self.db_manager = mongo_db

    def _format_doc(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Convert MongoDB ObjectId and datetime to string format."""
        if not doc:
            return doc
        if "_id" in doc and isinstance(doc["_id"], ObjectId):
            doc["_id"] = str(doc["_id"])
        if "createdAt" in doc and isinstance(doc["createdAt"], datetime):
            doc["createdAt"] = doc["createdAt"].isoformat()
        return doc

    def create(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new thermal analysis record."""
        collection = self.db_manager.get_collection()
        if "createdAt" not in record or not record["createdAt"]:
            record["createdAt"] = datetime.utcnow().isoformat()
        
        insert_data = dict(record)
        result = collection.insert_one(insert_data)
        insert_data["_id"] = str(result.inserted_id)
        return self._format_doc(insert_data)

    def get_by_id(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single analysis record by ID."""
        collection = self.db_manager.get_collection()
        query = {}
        try:
            query = {"_id": ObjectId(analysis_id)}
        except Exception:
            query = {"_id": analysis_id}
            
        doc = collection.find_one(query)
        if not doc and query != {"_id": analysis_id}:
            doc = collection.find_one({"_id": analysis_id})
        return self._format_doc(doc) if doc else None

    def list_all(self, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
        """Retrieve list of analysis records sorted by creation date descending."""
        collection = self.db_manager.get_collection()
        cursor = collection.find().sort("createdAt", -1).skip(skip).limit(limit)
        return [self._format_doc(doc) for doc in cursor]

    def delete(self, analysis_id: str) -> bool:
        """Delete an analysis record by ID."""
        collection = self.db_manager.get_collection()
        try:
            res = collection.delete_one({"_id": ObjectId(analysis_id)})
            if res.deleted_count > 0:
                return True
        except Exception:
            pass
        res = collection.delete_one({"_id": analysis_id})
        return res.deleted_count > 0

    def get_stats(self) -> Dict[str, Any]:
        """Aggregate statistics for dashboard."""
        collection = self.db_manager.get_collection()
        records = list(collection.find())
        total = len(records)
        normal_count = sum(1 for r in records if r.get("predictedCondition") == "Normal")
        fault_count = total - normal_count

        severity_counts = {"Low": 0, "Medium": 0, "High": 0, "None": 0}
        fault_type_counts = {}

        for r in records:
            sev = r.get("severity") or "None"
            severity_counts[sev] = severity_counts.get(sev, 0) + 1
            
            ft = r.get("faultType", "Unknown")
            fault_type_counts[ft] = fault_type_counts.get(ft, 0) + 1

        recent = [
            self._format_doc(doc)
            for doc in sorted(records, key=lambda x: x.get("createdAt", ""), reverse=True)[:5]
        ]

        return {
            "totalAnalyzed": total,
            "normalCount": normal_count,
            "faultCount": fault_count,
            "severityBreakdown": severity_counts,
            "faultTypeBreakdown": fault_type_counts,
            "recentAnalyses": recent,
        }

analysis_repository = AnalysisRepository()
