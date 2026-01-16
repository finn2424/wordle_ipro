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
- **Frameworks**: Angular (Frontend)
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
