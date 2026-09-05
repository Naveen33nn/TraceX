from typing import Any
from app.config import Settings
from app.core.http import post_json

class BitqueryConnector:
    name = "bitquery"
    ENDPOINT = "https://streaming.bitquery.io/graphql"

    def __init__(self, settings: Settings):
        self.settings = settings

    async def query(self, gql: str) -> dict[str, Any]:
        if not self.settings.bitquery_access_token:
            raise RuntimeError("BITQUERY_ACCESS_TOKEN is not configured")
        headers = {
            "Authorization": f"Bearer {self.settings.bitquery_access_token}",
            "Content-Type": "application/json",
        }
        body = {"query": gql}
        return await post_json(
            self.ENDPOINT, json_body=body, headers=headers,
            timeout=self.settings.http_timeout_seconds
        )

    async def evm_transactions(self, address: str, network: str, limit: int = 25) -> dict[str, Any]:
        q = f'''
        query {{
          EVM(dataset: archive, network: {network}) {{
            Transactions(
              limit: {{count: {min(limit, 100)}}}
              where: {{any: [
                {{Transaction: {{From: {{is: "{address}"}}}}}},
                {{Transaction: {{To: {{is: "{address}"}}}}}}
              ]}}
            ) {{
              Block {{ Number Time }}
              Transaction {{ Hash From To Cost }}
            }}
          }}
        }}
        '''
        return await self.query(q)

    async def transfers(self, address: str, network: str, limit: int = 25) -> dict[str, Any]:
        q = f'''
        query {{
          EVM(dataset: archive, network: {network}) {{
            Transfers(
              limit: {{count: {min(limit, 100)}}}
              where: {{any: [
                {{Transfer: {{Sender: {{is: "{address}"}}}}}},
                {{Transfer: {{Receiver: {{is: "{address}"}}}}}}
              ]}}
            ) {{
              Block {{ Number Time }}
              Transaction {{ Hash }}
              Transfer {{
                Amount
                Sender
                Receiver
                Success
                Type
                Currency {{ Name Symbol Fungible }}
              }}
            }}
          }}
        }}
        '''
        return await self.query(q)
