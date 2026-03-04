import os
import json
import re
import httpx
from httpx import HTTPStatusError

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openai/gpt-oss-20b:free"

NDA_FIELDS = [
    "partij_1_naam", "partij_1_adres", "partij_1_ondernemingsnummer",
    "partij_2_naam", "partij_2_adres", "partij_2_ondernemingsnummer",
    "doel_samenwerking", "duur_jaar", "gemeente", "datum_ondertekening",
]

SYSTEM_PROMPT = """Je bent een juridisch assistent die een Mutual NDA opstelt voor een Nederlandse gebruiker.
Verzamel via het gesprek de volgende veldwaarden:
- partij_1_naam: naam van de eerste partij
- partij_1_adres: adres van de eerste partij
- partij_1_ondernemingsnummer: KVK-nummer partij 1 (optioneel)
- partij_2_naam: naam van de tweede partij
- partij_2_adres: adres van de tweede partij
- partij_2_ondernemingsnummer: KVK-nummer partij 2 (optioneel)
- doel_samenwerking: doel van de informatieuitwisseling
- duur_jaar: looptijd in jaren (geheel getal)
- gemeente: gemeente voor ondertekening en bevoegde rechtbank
- datum_ondertekening: ondertekeningsdatum (ISO-formaat JJJJ-MM-DD, bijv. 2026-03-15)

Regels:
- Stel maximaal 2 vragen per bericht
- Wees zakelijk, gericht en efficiënt
- Vul alle velden in die de gebruiker noemt, ook als dat meerdere zijn per antwoord
- Sla optionele velden over als de gebruiker aangeeft dat ze niet van toepassing zijn

Antwoord ALTIJD als geldig JSON:
{"reply": "jouw bericht", "patches": [{"field": "veldnaam", "value": "waarde"}]}

Bij geen patches: "patches": []"""


def _extract_json(raw: str) -> dict:
    """Probeert JSON te parsen uit de ruwe AI-response. Drie lagen als fallback."""
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return {"reply": raw.strip(), "patches": []}


async def call_nda_chat(messages: list, current_values: dict) -> dict:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY niet ingesteld")

    filled = [f for f in NDA_FIELDS if current_values.get(f)]
    missing = [f for f in NDA_FIELDS if not current_values.get(f)]

    system_content = SYSTEM_PROMPT
    if filled:
        system_content += f"\n\nAl ingevuld: {', '.join(filled)}"
    if missing:
        system_content += f"\nNog ontbrekend: {', '.join(missing)}"

    payload = {
        "model": MODEL,
        "messages": [{"role": "system", "content": system_content}] + messages,
        "temperature": 0.3,
        "max_tokens": 800,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://prelegal.nl",
        "X-Title": "Prelegal",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(OPENROUTER_URL, json=payload, headers=headers)
        try:
            response.raise_for_status()
        except HTTPStatusError as exc:
            raise ValueError(f"OpenRouter API fout: {exc.response.status_code}") from exc
        data = response.json()

    raw_content = data["choices"][0]["message"]["content"]
    return _extract_json(raw_content)
