# CLAUDE.md – Instructies voor Claude

## Over de gebruiker

- Ik ben een beginner met programmeren, VS Code en Claude Code. Ik volg een cursus.
- Ik snap nog niet altijd wat er technisch gebeurt. Leg daarom altijd kort uit **wat** je doet en **waarom**.
- Houd uitleg simpel en in het Nederlands.

---

## Over het project

**Prelegal** is een nederlands SaaS-platform waarop gebruikers juridische documenten op maat kunnen laten opstellen. De gebruiker vult zijn gegevens in, het systeem genereert automatisch een correct document.

- **Doelgroep:** iedereen (particulieren, bedrijven, zelfstandigen)
- **Nederlands recht** is van toepassing op alle documenten
- **Taal:** volledig in het Nederlands
- **Status:** actief in ontwikkeling, opleverdatum 9 maart 2026

---

## Projectstructuur

```
Prelegal/
├── data/
│   └── templates/          ← JSON-definitie per documenttype
│       ├── nda.json
│       ├── arbeidsovereenkomst.json
│       ├── huurovereenkomst.json
│       ├── koopovereenkomst.json
│       └── opdrachtsovereenkomst.json
├── prototype/
│   └── nda-creator/
│       └── index.html      ← Eerste werkend prototype
├── .claude/
│   └── commands/           ← Aangepaste slash-commands voor dit project
├── Dockerfile              ← Recept voor de Docker-container
├── docker-compose.yml      ← Hoe de container wordt opgestart
├── .env                    ← API-sleutels en secrets (staat NIET in git)
├── .gitignore              ← Bestanden die niet naar GitHub gaan (incl. .env)
├── CLAUDE.md
└── README.md
```

---

## Templates en data

Elk document is gedefinieerd als een JSON-bestand in `data/templates/`. Structuur:

```json
{
  "id": "nda",
  "name": "...",
  "category": "...",
  "variables": [
    { "name": "veldnaam", "label": "Label", "type": "text|textarea|number|date|select", "required": true }
  ],
  "content": "Documenttekst met {{veldnaam}} placeholders"
}
```

**Placeholder-syntaxis in de documenttekst:**
- `{{veldnaam}}` → vervangt een variabele
- `{{#veldnaam}}...{{/veldnaam}}` → conditioneel blok (verschijnt alleen als het veld is ingevuld)

Volg deze syntaxis **altijd** consistent bij het aanpassen van templates.

---

## Design & stijl

- **Kleurenpalet:** luxueus donkergroen met gouden accenten
- **Sfeer:** professioneel, betrouwbaar, premium juridisch platform
- **Taal UI:** volledig Nederlands
- **Lettertype-keuze:** karaktervol en luxueus (geen generieke fonts zoals Arial of Inter)

---

## Geplande functies (nog te bouwen)

1. **Gebruikersaccounts** – registreren, inloggen, uitloggen (inclusief database)
2. **AI-juridische assistent** – een chatfunctie waarbij gebruikers vragen kunnen stellen over juridische onderwerpen. De AI kan ook zelf wijzigingen doorvoeren in formuliervelden als de gebruiker daarnaar vraagt.
   - Model: `openai/gpt-oss-20b:free` via OpenRouter
   - API-sleutels worden **nooit** hardcoded in de code — altijd via omgevingsvariabelen
   de OPENROUTER_API_KEY staat in de .env file

---

## Huidige status & lopend werk

### PL-4 — GEREED (PR #5 open op GitHub)
Branch: `feature/PL-4-v1-prototype-fundering`
Gebouwd: FastAPI backend (`backend/main.py`), frontend login/home/document, template engine, form builder, Docker setup.

### PL-5 — IN UITVOERING (feature-dev skill, fase 4 afgerond)
Branch: **nog niet aangemaakt** — implementatie nog niet begonnen.

**Beslissingen al genomen (niet opnieuw vragen):**
- Layout: chat links, NDA preview rechts (2-kolom, vervangt formulierpaneel)
- AI vult velden **live** in tijdens het gesprek (niet pas aan het einde)
- Verborgen formulier beschikbaar via "Bewerk handmatig" toggle
- AI-toon: zakelijk, gericht, efficiënt — geen kleine talk
- Architectuur: **Optie A — gestructureerde JSON response (niet-streaming)** ← dit nog bevestigen bij start

**Wat nog gebouwd moet worden:**
1. `backend/nda_chat.py` — nieuw bestand met AI-logica + OpenRouter aanroep
2. `backend/main.py` — `NdaChatRequest` model + `POST /api/nda-chat` endpoint toevoegen
3. `backend/requirements.txt` — `httpx==0.27.0` toevoegen
4. `frontend/assets/js/api.js` — `sendNdaChat()` functie toevoegen
5. `frontend/assets/css/prelegal.css` — chat panel CSS toevoegen
6. `frontend/document.html` — chat panel HTML + JS logica (chat state, sendMessage, applyPatches, manual toggle)

**Technische details Optie A:**
- Backend: `POST /api/nda-chat` ontvangt `{messages, current_values}`, roept OpenRouter aan, geeft `{reply, patches}` terug
- AI-systeemprompt instrueert het model om ALTIJD te antwoorden als: `{"reply": "...", "patches": [{"field": "...", "value": "..."}]}`
- `_extract_json()` fallback als het model geen geldig JSON teruggeeft
- `temperature: 0.3`, `max_tokens: 800`
- Headers vereist door OpenRouter: `Authorization: Bearer <key>`, `HTTP-Referer: https://prelegal.nl`
- OPENROUTER_API_KEY via `os.environ.get("OPENROUTER_API_KEY")` — staat al in `.env`
- NDA-velden: `partij_1_naam`, `partij_1_adres`, `partij_1_ondernemingsnummer`, `partij_2_naam`, `partij_2_adres`, `partij_2_ondernemingsnummer`, `doel_samenwerking`, `duur_jaar`, `gemeente`, `datum_ondertekening`
- Chat is **alleen actief als `currentTemplate.id === 'nda'`** — andere documenten blijven ongewijzigd
- `applyPatches()`: `document.getElementById(field).value = value` + `el.dispatchEvent(new Event('input'))` + `updatePreview()`

---

## Technische context

- **Huidige fase:** V1 prototype live — FastAPI backend + frontend operationeel
- **Lokale ontwikkelserver:** `http://localhost:8000` (via Docker)
- **Hosting:** nog niet bepaald
- **GitHub:** verbonden via MCP — gebruik de MCP-tools voor git-acties, **niet** de `gh` CLI (die is niet beschikbaar)
- **Jira:** verbonden via MCP — gebruik de MCP-tools voor tickets

---

## Docker

Het project draait in een **Docker-container**. Docker zorgt ervoor dat de app op elke computer hetzelfde werkt, ongeacht de lokale installatie.

**Bestanden:**
- `Dockerfile` — het recept voor de container (wat wordt geïnstalleerd, hoe de app start)
- `docker-compose.yml` — hoe de container wordt opgestart (poort, omgevingsvariabelen, etc.)

**Lokaal starten:**
```bash
docker compose up
```
De app is dan bereikbaar op `http://localhost:8000`.

**Omgevingsvariabelen** (API-sleutels, database-credentials) gaan **nooit** in de code. Ze worden ingesteld via een `.env`-bestand dat **niet** in git staat (staat in `.gitignore`).

**Belangrijk voor Claude:**
- Zorg dat nieuwe bestanden en mappen ook werken binnen de Docker-omgeving
- Bij het aanmaken van een `Dockerfile` of `docker-compose.yml`: leg altijd kort uit wat elke regel doet

---

## Git workflow

- Code-aanpassingen gaan **altijd op een aparte branch**, nooit rechtstreeks op `main`
- Branch-naamgeving: `feature/PL-X-korte-beschrijving` (waarbij X het Jira-ticketnummer is)
- **Nooit pushen zonder expliciete toestemming** van de gebruiker
- **Nooit mergen** — dat beslist de gebruiker altijd zelf
- Een PR open ik **alleen als de gebruiker er expliciet om vraagt**

---

## Toestemmingsverzoeken

Wanneer ik om toestemming vraag voor een actie:
1. Vraag in **normale/technische taal** (zodat de gebruiker leert wat de termen betekenen)
2. Voeg een **korte simpele uitleg** toe tussen haakjes

Voorbeeld:
> "Mag ik `git push -u origin feature/PL-2` uitvoeren? *(Dit uploadt de nieuwe branch naar GitHub zodat we een PR kunnen openen.)*"

---

## Communicatiestijl

- Altijd in het **Nederlands**
- Leg nieuwe concepten (branches, commits, PR's, etc.) kort uit als ze voorkomen
- Geen vakjargon zonder uitleg
- Houd antwoorden **kort en praktisch**

---

## Trainer rol

- Wijs de gebruiker proactief op betere gewoontes of veelgemaakte fouten, met een korte uitleg waarom
- Raad dingen af als ze niet de beste aanpak zijn, maar dwing niets af
- Geef af en toe een kleine tip als iets slimmer of efficiënter kan
- Doe dit beknopt — alleen als het echt nuttig is
