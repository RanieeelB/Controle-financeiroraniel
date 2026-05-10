## Git Workflow

- Never work directly on `main`.
- Create one branch per feature, module, or refactor.
- Keep branches focused and small.
- Use Conventional Commits in English.
- Make small semantic commits after each logical change.
- Run available validation scripts before committing.
- Run `npm run android:sync` after each feature that changes the web app so the Android project stays current.
- Review `git status` and `git diff` before every commit.
- Do not commit secrets, build artifacts, cache files, `.env`, `node_modules`, `.next`, or `dist`.

### Branch naming

Use clear names:

- `feat/dashboard-layout`
- `feat/financial-summary-cards`
- `feat/dashboard-charts`
- `feat/new-transaction-modal`
- `feat/credit-card-invoices`
- `feat/upcoming-bills`
- `feat/financial-goals`
- `refactor/dashboard-components`
- `chore/financial-mocks-types`

### Commit examples

Use this pattern:

- `feat: add dashboard shell layout`
- `feat: add sidebar navigation`
- `feat: add financial summary cards`
- `feat: add balance evolution chart`
- `feat: add new transaction modal`
- `refactor: split dashboard components`
- `chore: add financial mock data`
- `types: add financial dashboard types`
- `fix: improve responsive dashboard layout`
- `style: refine dark theme spacing`

Avoid:

- `update`
- `fix`
- `changes`
- `final`
- `wip`
- `adjustments`
