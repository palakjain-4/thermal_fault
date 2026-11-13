import logging
from typing import Optional, Tuple
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config import settings

logger = logging.getLogger("thermal_fault.database")

class MongoDBConnectionError(Exception):
    """Custom exception raised when MongoDB is unreachable."""
    def __init__(self, message: str, details: Optional[str] = None):
        super().__init__(message)
        self.message = message
        self.details = details

class MongoDatabase:
    def __init__(self):
        self._client: Optional[MongoClient] = None
        self._db = None

    def connect(self) -> Tuple[bool, Optional[str]]:
        """Attempt to connect and verify MongoDB heartbeat."""
        try:
            self._client = MongoClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=settings.MONGODB_TIMEOUT_MS,
                connectTimeoutMS=settings.MONGODB_TIMEOUT_MS,
            )
            # Force server round-trip check
            self._client.admin.command("ping")
            self._db = self._client[settings.DATABASE_NAME]
            logger.info(f"Connected to MongoDB at {settings.MONGODB_URL}, db: {settings.DATABASE_NAME}")
            return True, None
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            err_msg = f"Failed to connect to MongoDB at {settings.MONGODB_URL}: {str(e)}"
            logger.warning(err_msg)
            self._client = None
            self._db = None
            return False, err_msg
        except Exception as e:
            err_msg = f"Unexpected database connection error: {str(e)}"
            logger.error(err_msg)
            self._client = None
            self._db = None
            return False, err_msg

    def is_connected(self) -> bool:
        """Check if client is active and responsive."""
        if self._client is None:
            ok, _ = self.connect()
            return ok
        try:
            self._client.admin.command("ping")
            return True
        except Exception:
            self._client = None
            self._db = None
            return False

    def get_collection(self):
        """Retrieve analyses collection or raise MongoDBConnectionError."""
        if not self.is_connected():
            ok, err = self.connect()
            if not ok:
                raise MongoDBConnectionError(
                    message="MongoDB connection error: Database is currently unavailable.",
                    details=(
                        f"Cannot connect to MongoDB at '{settings.MONGODB_URL}'. "
                        "Please verify that MongoDB service is started (e.g., 'brew services start mongodb-community' "
                        "or 'mongod --dbpath <data_dir>') and reachable."
                    )
                )
        return self._db[settings.COLLECTION_NAME]

    def close(self):
        if self._client:
            self._client.close()
            self._client = None
            self._db = None

mongo_db = MongoDatabase()
