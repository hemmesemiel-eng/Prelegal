from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import json
from pathlib import Path

from backend.nda_chat import call_nda_chat

app = FastAPI(title="Prelegal API", version="1.0.0")

BASE_DIR = Path(__file__).parent.parent
TEMPLATES_DIR = BASE_DIR / "data" / "templates"
FRONTEND_DIR = BASE_DIR / "frontend"


# ── API ENDPOINTS ─────────────────────────────────────────────────────────────

@app.get("/api/templates")
def get_all_templates():
    """Geeft metadata van alle templates terug. Gebruikt door de documentkiezer."""
    templates = []
    for file in sorted(TEMPLATES_DIR.glob("*.json")):
        with open(file, encoding="utf-8") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                continue  # kapot bestand overslaan, rest laden
        templates.append({
            "id":             data["id"],
            "name":           data["name"],
            "category":       data["category"],
            "description":    data.get("description", ""),
            "variable_count": len(data.get("variables", [])),
        })
    return {"templates": templates}


@app.get("/api/templates/{template_id}")
def get_template(template_id: str):
    """Geeft één volledig template terug inclusief variabelen en documenttekst."""
    # Voorkom path traversal (bijv. ../../.env)
    allowed = set("abcdefghijklmnopqrstuvwxyz0123456789-_")
    if not all(c in allowed for c in template_id):
        raise HTTPException(status_code=400, detail="Ongeldig template ID")

    file_path = TEMPLATES_DIR / f"{template_id}.json"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' niet gevonden")

    with open(file_path, encoding="utf-8") as f:
        return json.load(f)


# ── NDA CHAT ENDPOINT ─────────────────────────────────────────────────────────

class NdaChatRequest(BaseModel):
    messages: list
    current_values: dict = {}


@app.post("/api/nda-chat")
async def nda_chat(req: NdaChatRequest):
    try:
        result = await call_nda_chat(req.messages, req.current_values)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── FRONTEND SERVEREN ─────────────────────────────────────────────────────────
# FastAPI serveert de frontend-bestanden zodat alles via één server draait.

app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")


@app.get("/")
def root():
    return FileResponse(str(FRONTEND_DIR / "login.html"))


@app.get("/home")
def home():
    return FileResponse(str(FRONTEND_DIR / "home.html"))


@app.get("/document")
def document():
    return FileResponse(str(FRONTEND_DIR / "document.html"))
