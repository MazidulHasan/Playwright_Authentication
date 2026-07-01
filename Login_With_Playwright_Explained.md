# The 3 Approaches Explained

## 1. Global Setup + storageState in use (Your Current Setup)
You run a script (`global-setup.js`) before any tests start. It logs in via an API or UI, saves `auth.json`, and then the global `use` block injects it into every browser instance.
* **Pros:** Simple to understand. It runs exactly once before the entire test runner boots up.
* **Cons:** It runs completely outside the standard Playwright Test runner lifecycle. This means you lose access to Playwright’s built-in UI mode tracking, auto-retries, easy HTML reporting for the login step, and project-specific configurations.

## 2. Dependencies (The "Setup Project" Pattern)
Instead of an external script, you create a dedicated "Setup" Project inside the `projects` array. Your main testing projects are configured with a `dependencies: ['setup']` property.
* **Pros:** The login script is just a normal Playwright test (`login.setup.js`). It gets full reporting, tracing, video, UI-mode support, and automatic retries if it flakes.
* **Cons:** Slightly more boilerplate in your config file.

## 3. Fixtures
You create a custom fixture (e.g., `loggedInPage`) that intercepts the page creation, checks for a state or logs in on the fly, and yields an authenticated page directly to the test.
* **Pros:** Highly dynamic. Great if you need to log in as multiple different users (e.g., `adminPage`, `userPage`) within the same test run.
* **Cons:** If not cached carefully, it can accidentally re-run the login code multiple times across different workers, slowing down parallel execution.

## Comparison Table

| Feature | 1. Global Setup | 2. Dependencies (Setup Project) | 3. Fixtures |
| :--- | :--- | :--- | :--- |
| **Execution Context** | Outside the test runner | Inside the test runner | Inside individual tests |
| **Shows in HTML Report?** | No (or very limited) | Yes (Full details/traces) | Yes (As a step) |
| **Works with UI Mode?** | Finicky / Requires manual steps | Perfectly | Perfectly |
| **Handles Multiple Roles?** | Hard / Clunky | Excellent (via multiple projects) | Excellent (via multiple fixtures) |
| **Parallelization Friendly** | Yes | Yes | Requires careful setup to avoid duplication |

Which is the In... [truncated]

```javascript
    // 1. Define the setup project
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/, 
    },
    // 2. Tie your browser projects to it
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Move storageState down to the project level so it waits for setup
        storageState: 'auth.json', 
      },
      dependencies: ['setup'], // <-- Magic happens here
    },
  ]
```

## Use Fixtures if:
* You are doing Multi-Role Testing within a single test file. For example, your test flow requires an Admin to approve an item, and then a regular User to verify they can see it.
* You need to generate random user accounts dynamically on the fly for every single test isolated from each other.

## Use Global Setup (Your current approach) only if:
* You are performing non-Playwright initialization tasks that must happen before anything else (e.g., seeding a massive docker database, spinning up an orchestration tunnel, or clearing backend cache pools). For pure UI authentication, it is outdated.
