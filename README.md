# VibeOps Env DB Demo

Small app used to validate VibeOps project configuration:

- `prod` branch for production.
- `dev` branch for development/workspaces.
- Runtime env injection.
- File-backed SQLite database inside the workspace.

Dev branch test trigger: VibeOps should render APP_ENV=development and DB_FILE=/workspace/db/dev.sqlite.
