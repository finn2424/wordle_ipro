# Project Milestones

## Milestone 1: Project Setup & Tools
**Deadline:** 2026-01-16
- [x] Initialize Git Repository
- [x] Setup Angular Frontend Project (`wordle-frontend`)
- [x] Create Mockups for Game Interface
- [x] Create MILESTONES.md and basic README.md
- [x] Create simple flowchart for game logic
- [x] Implement Mockup Viewer (Prototyping Tool)
- [x] Setup GitHub Pages Deployment (`angular-cli-ghpages`)

## Milestone 2: Functionalities & Requirements
**Deadline:** 2026-01-19
- [x] Select & Initialize Backend Technology (.NET 10 with Kull.GenericBackend)
- [ ] Define Detailed Game Rules (e.g., Word length: 5, Max attempts: 6)
- [ ] Select Word Dictionary Source (API vs Local JSON)

## Milestone 3: MVP (Basic UI & Infra)
**Deadline:** 2026-01-23
- [ ] Implement Main App Layout (Header, Game Container)
- [ ] Develop `GameGrid` Component (Responsive 6x5 Grid)
- [ ] Develop `VirtualKeyboard` Component with click events

## Milestone 4: Core Implementation (Wordle)
**Deadline:** 2026-01-30
- [ ] Implement `GameService` for State Management (Signals/Subject)
- [ ] Develop Logic for Word Validation & Color Coding (Correct, Present, Absent)
- [ ] Handle Keyboard Input (Physical & Virtual)
- [ ] Implement Win/Loss Conditions & Notifications
- [ ] Add CSS Animations (Flip reveal, Invalid shake)

## Milestone 5: Statistics & Database
**Deadline:** 2026-02-06
- [ ] Design API Specification (Endpoints for Game State & User Stats)
- [ ] Provision SQL Database & Define Schema (Users, Games, Attempts)
- [ ] Implement Backend Endpoints for Storing Game Results
- [ ] Integrate Frontend with Backend Stats API
- [ ] Create `StatisticsModal` (Win %, Streak, Guess Distribution Chart)

## Milestone 6: Deployment & Presentation
**Deadline:** 2026-08-17
- [ ] Optimize Production Build (AOT, Lazy Loading)
- [ ] Deploy Frontend & Backend to Cloud Provider
- [ ] Perform Final manual Testing
- [ ] Create Presentation Slides & Live Demo Script
