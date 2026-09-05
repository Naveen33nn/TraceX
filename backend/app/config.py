from functools import lru_cache
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseModel):
    blockchain_com_api_key: str = os.getenv("BLOCKCHAIN_COM_API_KEY", "")
    etherscan_api_key: str = os.getenv("ETHERSCAN_API_KEY", "")
    bitquery_access_token: str = os.getenv("BITQUERY_ACCESS_TOKEN", "")
    infura_project_id: str = os.getenv("INFURA_PROJECT_ID", "")
    infura_ethereum_url: str = os.getenv("INFURA_ETHEREUM_URL", "")
    infura_polygon_url: str = os.getenv("INFURA_POLYGON_URL", "")
    alchemy_api_key: str = os.getenv("ALCHEMY_API_KEY", "")
    alchemy_ethereum_url: str = os.getenv("ALCHEMY_ETHEREUM_URL", "")
    alchemy_polygon_url: str = os.getenv("ALCHEMY_POLYGON_URL", "")
    metasleuth_api_key: str = os.getenv("METASLEUTH_API_KEY", "")
    metasleuth_base_url: str = os.getenv("METASLEUTH_BASE_URL", "https://aml.blocksec.com")
    walletexplorer_base_url: str = os.getenv("WALLETEXPLORER_BASE_URL", "https://www.walletexplorer.com/api/1")
    tron_data_base_url: str = os.getenv("TRON_DATA_BASE_URL", "https://api.trongrid.io")
    tron_api_key: str = os.getenv("TRON_API_KEY", "")
    vasp_providers: str = os.getenv("VASP_PROVIDERS", "metasleuth,walletexplorer,etherscan")
    storage_dir: str = os.getenv("STORAGE_DIR", os.getenv("DATA_DIR", "storage"))
    data_dir: str = os.getenv("DATA_DIR", os.getenv("STORAGE_DIR", "storage"))
    http_timeout_seconds: float = float(os.getenv("HTTP_TIMEOUT_SECONDS", "30"))
    page_size: int = int(os.getenv("PAGE_SIZE", "100"))
    max_pages: int = int(os.getenv("MAX_PAGES", "100"))
    max_records: int = int(os.getenv("MAX_RECORDS", "5000"))
    include_raw: bool = os.getenv("INCLUDE_RAW", "true").lower() == "true"
    alchemy_verify_transactions: bool = os.getenv("ALCHEMY_VERIFY_TRANSACTIONS", "true").lower() == "true"
    alchemy_include_token_balances: bool = os.getenv("ALCHEMY_INCLUDE_TOKEN_BALANCES", "true").lower() == "true"
    vasp_label_ttl_seconds: int = int(os.getenv("VASP_LABEL_TTL_SECONDS", "86400"))
    neo4j_enabled: bool = os.getenv("NEO4J_ENABLED", "true").lower() == "true"
    neo4j_uri: str = os.getenv("NEO4J_URI", "bolt://127.0.0.1:7687")
    neo4j_username: str = os.getenv("NEO4J_USERNAME", "neo4j")
    neo4j_password: str = os.getenv("NEO4J_PASSWORD", "")
    neo4j_database: str = os.getenv("NEO4J_DATABASE", "neo4j")
    neo4j_max_nodes: int = int(os.getenv("NEO4J_MAX_NODES", "10000"))
    neo4j_max_relationships: int = int(os.getenv("NEO4J_MAX_RELATIONSHIPS", "25000"))
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173")

    @property
    def vasp_provider_list(self) -> list[str]:
        return [item.strip().lower() for item in self.vasp_providers.split(",") if item.strip()]

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()
