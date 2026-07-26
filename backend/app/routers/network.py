from fastapi import APIRouter
from app.data.mock_data import MOCK_NETWORK_NODES, MOCK_NETWORK_EDGES, MOCK_PERSONS, MOCK_FIRS

router = APIRouter()


@router.get("")
async def get_graph():
    return {"nodes": MOCK_NETWORK_NODES, "edges": MOCK_NETWORK_EDGES}


@router.get("/{node_id}")
async def get_node_details(node_id: str):
    node = next((n for n in MOCK_NETWORK_NODES if n["id"] == node_id), None)
    person = next((p for p in MOCK_PERSONS if p["id"] == node_id), None)
    linked_firs = [f for f in MOCK_FIRS if f["id"] in person["linkedFIRs"]] if person else []
    return {"node": node, "person": person, "linkedFIRs": linked_firs}
