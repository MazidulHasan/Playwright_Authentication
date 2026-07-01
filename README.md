# Playwright Authentication Flow

This project demonstrates common Playwright authentication patterns:

- reusable login with `storageState`
- setup-project authentication
- multiple roles such as admin and regular user
- fixtures for tests that need more than one logged-in page

It pairs well with the Medium article draft in:

```text
Standard_Playwright_Authentication_Flow_Medium.md
```

## Install

```bash
npm install
npx playwright install
```

## Configure Credentials

Copy `.env.example` to `.env` and replace the placeholder values with your own test environment.

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

The tests read these values:

```text
BASE_URL
LOGIN_PATH
HOME_PATH
DASHBOARD_PATH
ADMIN_EMAIL
ADMIN_PASSWORD
USER_EMAIL
USER_PASSWORD
MANAGER_EMAIL
MANAGER_PASSWORD
```

Do not commit `.env` or files under `playwright/.auth/`.

## Run Tests

```bash
npm test
```

Run headed:

```bash
npm run test:headed
```

Open Playwright UI mode:

```bash
npm run test:ui
```

Open the latest HTML report:

```bash
npm run report
```

## Notes

The generated authentication files live in:

```text
playwright/.auth/
```

That folder is ignored by Git because it can contain sensitive cookies or tokens.

The active `playwright.config.js` currently shows the fixture-based setup. The same file also contains commented examples for global setup and the setup-project pattern so you can compare the approaches.
