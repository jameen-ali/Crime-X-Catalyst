from fastapi import APIRouter
from app.data.mock_data import MOCK_FIRS, MOCK_PERSONS, MOCK_VEHICLES

router = APIRouter()


@router.get("")
async def search(q: str = ""):
    query = q.lower()
    firs = [
        {**f, "_type": "FIR", "_score": 0.8}
        for f in MOCK_FIRS
        if query in f["firNumber"].lower() or query in f["crimeType"].lower() or query in f["location"].lower()
    ][:5]
    persons = [
        {**p, "_type": "Person", "_score": 0.75}
        for p in MOCK_PERSONS
        if query in p["name"].lower() or query in p["address"].lower()
    ][:5]
    vehicles = [
        {**v, "_type": "Vehicle", "_score": 0.7}
        for v in MOCK_VEHICLES
        if query in v["registrationNumber"].lower() or query in v["ownerName"].lower()
    ][:5]
    return {"firs": firs, "persons": persons, "vehicles": vehicles, "query": q, "total": len(firs) + len(persons) + len(vehicles)}


@router.get("/suggestions")
async def suggestions(q: str = ""):
    query = q.lower()
    return [
        *[{"label": f["firNumber"], "type": "FIR"} for f in MOCK_FIRS if query in f["firNumber"].lower() or query in f["crimeType"].lower()][:3],
        *[{"label": p["name"], "type": "Person"} for p in MOCK_PERSONS if query in p["name"].lower()][:3],
    ]
