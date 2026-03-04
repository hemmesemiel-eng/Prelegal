# Stap 1: Begin met een officieel Python-image (3.12, slank formaat)
FROM python:3.12-slim

# Stap 2: Maak een werkmap aan in de container
WORKDIR /app

# Stap 3: Kopieer requirements.txt eerst — Docker cachet dit als de code nog niet is veranderd
COPY backend/requirements.txt ./requirements.txt

# Stap 4: Installeer de Python-packages
RUN pip install --no-cache-dir -r requirements.txt

# Stap 5: Kopieer de rest van het project naar de container
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY data/ ./data/

# Stap 6: Documenteer op welke poort de app luistert
EXPOSE 8000

# Stap 7: Start de FastAPI server
# --host 0.0.0.0 = bereikbaar van buiten de container
# --reload = herstart automatisch als code verandert (handig tijdens ontwikkeling)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
