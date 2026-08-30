from fastapi import APIRouter
import uuid

router = APIRouter()

def _db():
    from app.db.supabase_client import get_supabase
    return get_supabase()

@router.get("")
async def get_graph(limit: int = 40):
    db = _db()
    
    # 1. Fetch recent cases
    cases_resp = db.table("case_master").select(
        "case_master_id, crime_no, case_no, crime_registered_date, "
        "crime_head(crime_group_name), "
        "unit(unit_name, district(district_name))"
    ).order("crime_registered_date", desc=True).limit(limit).execute()
    
    cases = cases_resp.data or []
    case_ids = [c["case_master_id"] for c in cases]
    
    if not case_ids:
        return {"nodes": [], "edges": []}
    
    # 2. Fetch related accused
    accused_resp = db.table("accused").select("*").in_("case_master_id", case_ids).execute()
    accused_list = accused_resp.data or []
    
    # 3. Fetch related victims
    victim_resp = db.table("victim").select("*").in_("case_master_id", case_ids).execute()
    victim_list = victim_resp.data or []
    
    # 4. Fetch related evidence
    evidence_resp = db.table("evidence").select("*").in_("case_master_id", case_ids).limit(limit * 2).execute()
    evidence_list = evidence_resp.data or []

    nodes = []
    edges = []
    seen_nodes = set()

    def add_node(n_id, label, n_type, data_obj):
        if n_id not in seen_nodes:
            nodes.append({"id": str(n_id), "label": label or "Unknown", "type": n_type, "data": data_obj})
            seen_nodes.add(n_id)

    def add_edge(e_id, source, target, label):
        edges.append({"id": e_id, "source": str(source), "target": str(target), "label": label})

    # Process Cases
    for c in cases:
        cid = c["case_master_id"]
        ch = c.get("crime_head") or {}
        ctype = ch.get("crime_group_name", "Case") if isinstance(ch, dict) else "Case"
        add_node(cid, c.get("crime_no") or c.get("case_no"), "Case", {
            "crimeType": ctype,
            "date": c.get("crime_registered_date")
        })

    # Process Accused
    for a in accused_list:
        pid = a["accused_id"]
        cid = a["case_master_id"]
        add_node(pid, a.get("accused_name", "Unknown Suspect"), "Person", {
            "role": "Suspect",
            "age": a.get("age_year"),
            "riskScore": a.get("risk_score", 50)
        })
        add_edge(f"edge_{pid}_{cid}", pid, cid, "Involved in")

    # Process Victims
    for v in victim_list:
        pid = v["victim_id"]
        cid = v["case_master_id"]
        add_node(pid, v.get("victim_name", "Unknown Victim"), "Person", {
            "role": "Victim",
            "age": v.get("age_year")
        })
        add_edge(f"edge_{pid}_{cid}", pid, cid, "Victim of")

    # Process Evidence
    for e in evidence_list:
        eid = e["evidence_id"]
        cid = e["case_master_id"]
        add_node(eid, e.get("file_name", "Evidence"), "Evidence", {
            "description": e.get("description"),
            "type": e.get("type")
        })
        add_edge(f"edge_{eid}_{cid}", eid, cid, "Belongs to")

    return {"nodes": nodes, "edges": edges}


@router.get("/{node_id}")
async def get_node_details(node_id: str):
    db = _db()
    
    # Try to find if it's a person (accused)
    accused_resp = db.table("accused").select("*, case_master(*)").eq("accused_id", node_id).execute()
    if accused_resp.data:
        a = accused_resp.data[0]
        node = {"id": a["accused_id"], "label": a["accused_name"], "type": "Person", "data": {"role": "Suspect", "age": a.get("age_year"), "riskScore": a.get("risk_score")}}
        return {"node": node, "person": node, "linkedFIRs": [{"id": a["case_master"]["case_master_id"], "firNumber": a["case_master"]["crime_no"]}]}
    
    # Try victim
    victim_resp = db.table("victim").select("*, case_master(*)").eq("victim_id", node_id).execute()
    if victim_resp.data:
        v = victim_resp.data[0]
        node = {"id": v["victim_id"], "label": v["victim_name"], "type": "Person", "data": {"role": "Victim", "age": v.get("age_year")}}
        return {"node": node, "person": node, "linkedFIRs": [{"id": v["case_master"]["case_master_id"], "firNumber": v["case_master"]["crime_no"]}]}
        
    return {"node": None, "person": None, "linkedFIRs": []}
