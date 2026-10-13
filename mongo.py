from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
import sys

# Load .env file for local development (no-op if python-dotenv is not installed)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    print("Error: MONGO_URI environment variable is not set.")
    sys.exit(1)

def connect_db():
    try:
        print("Attempting to connect to MongoDB...")
        
        client = MongoClient(
            MONGO_URI,
            tls=True,
            tlsAllowInvalidCertificates=True,
            retryWrites=True,
            w="majority",
            connectTimeoutMS=10000,
            socketTimeoutMS=45000,
        )

        # Force connection check
        client.admin.command("ping")

        print("MongoDB connected successfully")
        return client

    except ConnectionFailure as error:
        print("MongoDB connection failed:", error)
        sys.exit(1)

# Example usage
if __name__ == "__main__":
    db_client = connect_db()
