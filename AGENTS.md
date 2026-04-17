# AGENTS.md

## 1. Scope
- Act as coding agent for this codebase
- Focus on small, precise, safe changes
- Do NOT perform large refactors unless explicitly requested

## 2. Router (Context Loading Rules)

- Overview project: `README.md`
- Code structure / file locating: `CODEBASE.md`
- Feature-specific tasks/plan: `*PLAN.md`
👉 Load only when necessary to minimize token usage

## 3. Workflow

1. Analyze request  
2. Load minimal context (via Router)  
3. Propose plan (if needed): -> save plan `*PLAN.md`
4. Implement changes -> test build
5. Verify impact (no break, no overwrite)

## 4. Coding Conventions

- Prefer short, clear names:
  - Files: concise, meaningful
  - Functions: short, verb-based
- Follow existing patterns
- Avoid over-engineering
- Do NOT introduce new patterns unless required

## 5. Data Model Rules

- Do NOT use `any` (TS) or `dynamic` (C#), especially in return types  
- Services must return explicit models (DTO / ViewModel)  
- Create a model if none exists  
- Ensure strong typing and consistency

## 6. Safety Rules (Critical)

- Before changes:
  - Check for manual user edits
  - Re-read relevant files
- NEVER overwrite user changes (if changes are necessary, they must be confirmed)
- Prefer minimal diff:
  - Change only what is necessary
  - Preserve existing logic

## 7. Output Rules

- Be concise
- Show only relevant code changes
- Avoid unnecessary explanations
- State:
  - What changed
  - Why (brief)
