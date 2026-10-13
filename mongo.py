from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import sys

MONGO_URI = (
    "mongodb+srv://nishant3054_db_user:Nishantyadav2@cluster0.lamfpuu.mongodb.net/timetable?retryWrites=true&w=majority&authSource=admin"
)

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
