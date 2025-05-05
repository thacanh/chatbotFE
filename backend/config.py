import os
from dotenv import load_dotenv
import logging

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Output to console
        logging.FileHandler("app.log")  # Output to file
    ]
)

# Database settings
NEO4J_URI = os.getenv("NEO4J_URI", "neo4j+s://1704bf0f.databases.neo4j.io")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")

# API keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Model configurations
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "models/embedding-001")

# Application settings
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
API_PREFIX = os.getenv("API_PREFIX", "")
PORT = int(os.getenv("PORT", "8000"))

# Validate required environment variables
def validate_env_vars():
    missing_vars = []
    
    if not NEO4J_URI:
        missing_vars.append("NEO4J_URI")
    if not NEO4J_USERNAME:
        missing_vars.append("NEO4J_USERNAME")
    if not NEO4J_PASSWORD:
        missing_vars.append("NEO4J_PASSWORD")
    if not GEMINI_API_KEY:
        missing_vars.append("GEMINI_API_KEY")
    
    if missing_vars:
        logging.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        return False
    
    return True