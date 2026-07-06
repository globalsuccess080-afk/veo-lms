# veoLMS Project Structure Design

This document explains how our code folders are organized. We chose a "Monorepo" structure because it keeps everything related to the project in one place, making it easy to manage and scale.

## 1. The Monorepo Architecture (apps & packages)
**The Challenge:** In a big project, we have a frontend (client) and a backend (server). Usually, they are in different repositories. But when they are separate, sharing code (like Types or utility functions) between them becomes very painful and leads to copy-pasting.

**Our Solution (The Design):** 
- We used a Monorepo structure. Inside the root folder, we have an `apps/` folder for our main applications (like `client`, `server`, and `architecture`).
- We also have a `packages/` folder containing a `shared` package for common code used by both the frontend and backend.

**The Trade-off:**
- **Downside:** A monorepo can get slightly large to download at first.
- **Upside:** It is the best choice for development speed. If we change a database type in the backend, the frontend instantly knows about it and throws a TypeScript error if something breaks. We never have to publish internal NPM packages just to share code.

## 2. Server Folder Structure (Modular Design)
**The Challenge:** As a backend grows (auth, courses, video processing, payments, emails), putting all controllers in one folder and all models in another folder creates a massive, confusing mess. 

**Our Solution (The Design):** 
- We used a "Feature-Based" (or Modular) structure inside `apps/server/src/modules/`. 
- Every feature (like `auth`, `video`, `course`) gets its own folder. Inside the `course` folder, you will find `course.controller.ts`, `course.service.ts`, `course.model.ts`, and `course.router.ts`.

**The Trade-off:**
- **Downside:** If a developer is used to the old MVC structure (where all controllers are together), this takes a minute to learn.
- **Upside:** It makes the code incredibly easy to maintain. If you need to fix a bug in video processing, you just go to the `video` folder, and every single file you need is right there. It perfectly separates concerns.

## 3. Dedicated Architecture Folder
**The Challenge:** Documentation and system diagrams often get lost in Google Drive or random wiki pages, and new developers struggle to understand the system.

**Our Solution (The Design):** 
- We created an `apps/architecture/` folder right inside the codebase to hold all our `.md` (Markdown) and `.puml` (PlantUML) design documents.

**The Trade-off:**
- **Downside:** It adds non-code files to the main repository.
- **Upside:** The documentation lives right next to the code. If the code changes, a developer can immediately update the design document in the same pull request. It ensures our designs are never outdated.
