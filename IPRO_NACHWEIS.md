# Nachweis der Kompetenzen für Ipro

Dieses Dokument dient als Nachweis, dass im Projekt "Wordle Ipro" die geforderten Tätigkeiten in zwei Bereichen (**User Interaction** und **Software**) erfüllt wurden.

## Bereich 1: User Interaction

### Analyse
**Tätigkeit:** Erkunden von bestehenden interaktiven Konzepten, Diensten und Produkten.
*   **Nachweis:** Das Projekt basiert auf dem bekannten Spiel "Wordle". Die Spielmechaniken und Interaktionskonzepte wurden analysiert und adaptiert.
*   **Dokumente:**
    *   [README.md](./README.md) (Zeile 11): Beschreibt die Replikation der Spielmechaniken.
    *   [GAME_RULES.md](./GAME_RULES.md): Dokumentiert die regelspezifischen Interaktionen (5 Buchstaben, 6 Versuche, Farbcodierung).

### Design
**Tätigkeit:** Entwerfen einer Visualisierung eines einfachen Datensatzes.
*   **Nachweis:** Es wurden Mockups und ein Design für das `GameGrid` erstellt, um den Spielzustand (Buchstaben, Statusfarben) zu visualisieren.
*   **Dokumente:**
    *   [PROCESS.md](./PROCESS.md) (Zeile 8): Erstellung von Mockups mit Stitch.
    *   [MILESTONES.md](./MILESTONES.md) (Zeile 22): "Develop UI of GameGrid Component".
    *   [DESIGN_PATTERNS.md](./DESIGN_PATTERNS.md) (Zeile 13): Beschreibung, wie das `GameGrid` auf Datenänderungen (`guesses` Signal) reagiert.

### Umsetzung
**Tätigkeit:** Realisieren und testen von einfachen interaktiven Produkten auf der Grundlage eines Interaktionsdesigns.
*   **Nachweis:** Implementierung des Frontends in Angular mit interaktiven Komponenten (virtuelle Tastatur, modale Dialoge, Animationen).
*   **Code-Dateien:**
    *   [virtual-keyboard.ts](./wordle-frontend/src/app/components/virtual-keyboard/virtual-keyboard.ts): Implementierung der Eingabelogik.
    *   [game-grid.ts](./wordle-frontend/src/app/components/game-grid/game-grid.ts): Visualisierung der Versuche.
    *   [virtual-keyboard.spec.ts](./wordle-frontend/src/app/components/virtual-keyboard/virtual-keyboard.spec.ts): Tests für die Interaktion.

---

## Bereich 2: Software

### Analyse
**Tätigkeit:** Sammeln und validieren von funktionalen Anforderungen für ein Softwaresystem.
*   **Nachweis:** Definition der Spielregeln und Anforderungen an das Backend (Datenbank, API). Auswahl der Wortliste basierend auf Anforderungen.
*   **Dokumente:**
    *   [GAME_RULES.md](./GAME_RULES.md): Detaillierte funktionale Anforderungen.
    *   [PROCESS.md](./PROCESS.md) (Zeile 169): Analyse und Auswahl der Wortliste (`slushman/wordle-list`).

### Design
**Tätigkeit:** Entwerfen eines Designs für ein Softwaresystem einschließlich einer Datenbank unter Verwendung von Modellierungstechniken.
*   **Nachweis:** Entwurf des Datenbankschemas (Users, Games, Attempts) und der API-Struktur. Verwendung von Design Patterns.
*   **Dokumente:**
    *   [PROCESS.md](./PROCESS.md) (Zeile 156): "Feature: Database Schema & Stored Procedure API".
    *   [DESIGN_PATTERNS.md](./DESIGN_PATTERNS.md): Dokumentation der verwendeten Software-Muster (Singleton, Observer, Facade).
    *   [docker-compose.yml](./docker-compose.yml): Infrastruktur-Design (Container-Orchestrierung).

### Umsetzung
**Tätigkeit:** Auf strukturierte Weise ein einfaches Softwaresystem entwickeln, testen und bereitstellen.
*   **Nachweis:** Implementierung des .NET Backends und des Angular Frontends. Einrichtung einer CI/CD Pipeline und Deployment.
*   **Code-Dateien:**
    *   [wordle-backend/Program.cs](./wordle-backend/Program.cs): Einstiegspunkt des Backends.
    *   [game.service.ts](./wordle-frontend/src/app/services/game.service.ts): Kernlogik des Spiels.
    *   [game.service.spec.ts](./wordle-frontend/src/app/services/game.service.spec.ts): Automatisierte Tests der Logik.
    *   [PROCESS.md](./PROCESS.md) (Zeile 135): CI/CD Pipeline Implementierung.
