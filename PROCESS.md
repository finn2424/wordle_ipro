# Development Process & Documentation

This document serves as a log for the tools, resources, and methodologies used during the development of "Wordle IPRO". It includes details on AI usage, design tools, and rationale behind specific implementation decisions.

## 🛠 Tools & Resources

### Design & Prototyping
- **Mockups**: [Stitch](https://stitch.withgoogle.com)
  - *Details*: Generated mockups using AI features.
- **Diagrams**: [SmartDraw](https://app.smartdraw.com)
  - *Details*: Manually created the game logic flowchart.

### Development Environment
- **IDE**: Visual Studio Code
- **Version Control**: Git & GitHub
- **Frameworks**: Angular (Frontend) - *See justification in Implementation Log below*
- **Deployment**: for now: GitHub Pages (via `angular-cli-ghpages`)

### Workflows
- **Update Docs**: A workflow (`.agent/workflows/update-docs.md`) to automatically check for and document changes in the repository.

## 🤖 AI Usage Report

### Role of AI
AI is utilized for generating visual design assets and providing file templates to structure the project.

### Specific Examples
- **Design**: Used Stitch to generate the mockups for the application.
- **Documentation**: Used an AI assistant to generate the template for `MILESTONES.md` based on a whiteboard photo.
- **Prototyping**: Used AI (Antigravity) to quickly implement a viewer to display the mockups within the web application.

## 📝 Implementation Log & Decisions

### Decision: Frontend Framework (Angular vs. Native HTML/JS)
- **Decision**: Framework (Angular) chosen over Native HTML/JS.
- **Reasoning**:
  - **State Management**: Wordle has a complex state (6 attempts, 5 letters each, keyboard status, game outcome). Angular Signals provide a clean, reactive way to manage this state without the "spaghetti code" often found in manual DOM manipulation.
  - **Component Reusability**: The game grid, rows, and keyboard keys are repeating elements. Angular's component architecture allows us to encapsulate logic and styles for these elements, promoting reusability and cleaner code.
  - **Scalability & Structure**: While native JS is sufficient for a basic clone, using Angular ensures the project is scalable. It simplifies adding future features like backend integration, user auth, and persistent stats.
  - **TypeScript**: First-class support for TypeScript ensures type safety for our game logic (interfaces for Guesses, GameState, etc.), reducing runtime errors.
  - **Tooling**: Angular CLI provides out-of-the-box build optimization, SCSS support, and PWA capabilities, which are manually configured in a native setup.

### Decision: Backend Technology (.NET vs. Node.js)
- **Decision**: .NET 10 (ASP.NET Core) chosen over Node.js.
- **Reasoning**:
  - **Kull.GenericBackend**: This library enables rapid API development by exposing SQL stored procedures directly as REST endpoints. This drastically reduces boilerplate code for CRUD operations and allows focusing on database logic.
  - **Type Safety**: C# and .NET provide strong type safety, which reduces runtime errors when handling API requests and database responses.
  - **SQL Server Integration**: Native integration with SQL Server via `Microsoft.Data.SqlClient` simplifies database connectivity.
  - **Swagger/OpenAPI**: Swashbuckle provides automatic API documentation generation, useful for frontend integration.
  - **Scalability**: ASP.NET Core is highly performant and suitable for production workloads.
- **Implementation Details**:
  - Project: `wordle-backend/`
  - Target Framework: .NET 10
  - Key Packages: `Kull.GenericBackend`, `Microsoft.Data.SqlClient`, `Swashbuckle.AspNetCore`

### Feature: Game Logic
- **Decision**: [Pending]
- **Reasoning**: [Pending]

### Feature: UI/UX
- **Approach**: [Pending]
- **Tooling**: [Pending]

### Feature: Deployment
- **Decision**: Use GitHub Pages for hosting the frontend.
- **Reasoning**: Free, easy integration with GitHub repository, and sufficient for static frontend hosting.
- **Implementation**: Configured `angular-cli-ghpages` and added `deploy-gh-pages` script to `package.json`.

---
*This document will be updated continuously as the project evolves.*
