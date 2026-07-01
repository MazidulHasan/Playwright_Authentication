# A Standard Authentication Flow in Playwright: Stop Logging In Before Every Test

If you are new to Playwright, authentication can feel confusing at first.

You write one test, log in, check something, and everything looks fine. Then the test suite grows. Now every test starts with the same login steps:

```javascript
await page.goto('/login');
await page.getByRole('textbox', { name: 'Email address or Student ID' }).fill(email);
await page.getByRole('textbox', { name: 'Password' }).fill(password);
await page.getByRole('button', { name: 'Log In' }).click();
await page.waitForURL('/home');
```

It works, but it is slow. It also makes tests noisy. If the login page has a temporary issue, every test fails even though the actual feature under test may be fine.

The better approach is simple:

1. Log in once.
2. Save the browser state.
3. Reuse that state in your tests.

That saved browser state is what Playwright calls `storageState`.

In this article, I will explain the standard way to build an authentication flow in Playwright, when to use fixtures, and why `globalSetup` is usually not the best choice for UI login anymore.

---

## The Problem With Logging In Inside Every Test

A beginner Playwright test often looks like this:

```javascript
const { test, expect } = require('@playwright/test');

test('user can open dashboard', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.getByRole('textbox', { name: 'Email address or Student ID' }).fill('user@example.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('password');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('https://example.com/home');

  await page.goto('https://example.com/dashboard');
  await expect(page).toHaveURL('https://example.com/dashboard');
});
```

For one test, this is okay.

For fifty tests, this becomes painful.

You are not really testing login in every test. You are testing dashboard, profile, settings, orders, permissions, or some other feature. Login is just a precondition.

So the clean question is:

> How can every test start already logged in?

The answer is `storageState`.

---

## What Is `storageState`?

When a user logs in, the browser usually stores session data in places like:

- cookies
- local storage

Playwright can save that authenticated state into a JSON file:

```javascript
await page.context().storageState({
  path: 'playwright/.auth/user.json'
});
```

Later, another test can reuse that file:

```javascript
test.use({
  storageState: 'playwright/.auth/user.json'
});
```

Now the test starts with an already authenticated browser context.

No login steps needed.

---

## Important Security Rule

The `storageState` file can contain sensitive cookies or tokens. Treat it like a password.

Keep it inside:

```text
playwright/.auth/
```

And add that folder to `.gitignore`:

```text
playwright/.auth/
```

This project already follows that rule, which is good. Never commit generated auth files like:

```text
playwright/.auth/user.json
playwright/.auth/admin.json
```

---

## The Standard Flow: Setup Project + `storageState`

The most standard Playwright authentication pattern is the setup project pattern.

Instead of running login manually before every test, we create a special setup test. That setup test logs in and saves the authenticated state.

Then the real test projects depend on that setup project.

The flow looks like this:

```text
auth.setup.js
    logs in
    saves playwright/.auth/user.json

chromium project
    waits for setup
    starts tests with user.json

firefox project
    waits for setup
    starts tests with user.json

webkit project
    waits for setup
    starts tests with user.json
```

This is better than a separate `globalSetup` file because the login step becomes part of Playwright Test itself. That means it can appear in reports, traces, retries, and debugging tools.

---

## Step 1: Create an Auth Setup Test

Create a setup file:

```text
tests/auth/user.setup.js
```

Example:

```javascript
const { test, expect } = require('@playwright/test');

test('authenticate as user', async ({ page }) => {
  await page.goto('https://example.com/index.html');

  await page
    .getByRole('textbox', { name: 'Email address or Student ID' })
    .fill(process.env.USER_EMAIL);

  await page
    .getByRole('textbox', { name: 'Password' })
    .fill(process.env.USER_PASSWORD);

  await page.getByRole('button', { name: 'Log In' }).click();

  await page.waitForURL('https://example.com/home.html');
  await expect(page.locator('#email')).toHaveText(process.env.USER_EMAIL);

  await page.context().storageState({
    path: 'playwright/.auth/user.json'
  });
});
```

The key line is:

```javascript
await page.context().storageState({
  path: 'playwright/.auth/user.json'
});
```

That writes the logged-in browser state to a file.

In real projects, prefer environment variables for usernames and passwords. Avoid hardcoding credentials in test files.

---

## Step 2: Connect Setup to Your Browser Projects

In `playwright.config.js`, add a setup project and make browser projects depend on it:

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: 'html',

  use: {
    trace: 'on-first-retry'
  },

  projects: [
    {
      name: 'setup',
      testDir: './tests/auth',
      testMatch: /user\.setup\.js/
    },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup']
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup']
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup']
    }
  ]
});
```

The important part is:

```javascript
dependencies: ['setup']
```

This tells Playwright:

> Run the setup project first. Only start the browser tests after authentication is ready.

---

## Step 3: Write Tests Without Login Code

Now your test can be clean:

```javascript
const { test, expect } = require('@playwright/test');

test('user can open dashboard', async ({ page }) => {
  await page.goto('https://example.com/slider.html');
  await expect(page).toHaveURL('https://example.com/slider.html');
});
```

Notice what is missing:

No email.

No password.

No login button.

The test starts already authenticated because the project loaded:

```text
playwright/.auth/user.json
```

That is the clean separation we want.

Login is setup. The test is only about the feature.

---

## Multiple Roles: Admin and Regular User

Many real test suites need more than one role.

For example:

- admin can manage users
- regular user can view profile
- manager can approve requests

In that case, save one storage file per role:

```text
playwright/.auth/admin.json
playwright/.auth/user.json
playwright/.auth/manager.json
```

The setup project can authenticate each role and save each file.

Example:

```javascript
const { test, expect } = require('@playwright/test');

async function login(page, email, password, authFile) {
  await page.goto('https://example.com/index.html');
  await page.getByRole('textbox', { name: 'Email address or Student ID' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('https://example.com/home.html');
  await expect(page.locator('#email')).toHaveText(email);

  await page.context().storageState({ path: authFile });
}

test('authenticate as admin', async ({ page }) => {
  await login(
    page,
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_PASSWORD,
    'playwright/.auth/admin.json'
  );
});

test('authenticate as user', async ({ page }) => {
  await login(
    page,
    process.env.USER_EMAIL,
    process.env.USER_PASSWORD,
    'playwright/.auth/user.json'
  );
});
```

Then a test file can choose the state it needs:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Admin scenarios', () => {
  test.use({
    storageState: 'playwright/.auth/admin.json'
  });

  test('admin can see admin account', async ({ page }) => {
    await page.goto('https://example.com/home.html');
    await expect(page.locator('#email')).toHaveText(process.env.ADMIN_EMAIL);
  });
});

test.describe('Regular user scenarios', () => {
  test.use({
    storageState: 'playwright/.auth/user.json'
  });

  test('user can see user account', async ({ page }) => {
    await page.goto('https://example.com/home.html');
    await expect(page.locator('#email')).toHaveText(process.env.USER_EMAIL);
  });
});
```

This is a simple and readable way to handle multiple roles when each test only needs one role at a time.

---

## When Fixtures Become Useful

Sometimes one test needs multiple logged-in users at the same time.

Example:

1. Admin creates or approves something.
2. Regular user logs in and verifies the result.

In that case, switching `test.use({ storageState })` is not enough, because one test needs two authenticated pages.

This is where fixtures are useful.

In this project, the fixture idea looks like this:

```javascript
import { test as base } from '@playwright/test';
import { getAuthenticatedPage } from './helpers/auth';

export const test = base.extend({
  adminPage: async ({ browser }, use) => {
    const { page, context } = await getAuthenticatedPage(browser, 'admin');
    await use(page);
    await context.close();
  },

  userPage: async ({ browser }, use) => {
    const { page, context } = await getAuthenticatedPage(browser, 'regular');
    await use(page);
    await context.close();
  }
});

export { expect } from '@playwright/test';
```

Then the test becomes very expressive:

```javascript
import { test, expect } from './fixtures';

test('admin and user can be tested together', async ({ adminPage, userPage }) => {
  await adminPage.goto('https://example.com/home.html');
  await expect(adminPage.locator('#email')).toHaveText(process.env.ADMIN_EMAIL);

  await userPage.goto('https://example.com/home.html');
  await expect(userPage.locator('#email')).toHaveText(process.env.USER_EMAIL);
});
```

This reads nicely:

```text
Give me an admin page.
Give me a user page.
Now test the flow.
```

Use fixtures when your test needs multiple roles or dynamic authentication behavior.

---

## Where `globalSetup` Fits

Playwright also supports `globalSetup`.

A global setup file runs before the test runner starts. You can use it to do things like:

- seed a database
- start external services
- clear test data
- prepare something outside Playwright Test

You can also use it for authentication, and many older examples do that.

But for UI authentication, the setup project pattern is usually cleaner.

Why?

Because a setup project is still a Playwright test. It gets normal test-runner behavior:

- HTML report visibility
- traces
- retries
- project configuration
- easier debugging
- cleaner dependency handling

So my rule is:

Use setup projects for Playwright authentication.

Use `globalSetup` for work that truly belongs outside the test runner.

---

## Quick Comparison

| Approach | Best for | Main advantage | Main downside |
| --- | --- | --- | --- |
| Login inside every test | Very small experiments | Easy to understand | Slow and repetitive |
| `globalSetup` | External one-time preparation | Runs before everything | Login is outside normal test flow |
| Setup project with `storageState` | Standard authenticated test suites | Clean, reportable, reusable | Needs a little config |
| Fixtures | Multi-role tests or dynamic users | Flexible and expressive | Needs careful caching |

For most projects, start with:

```text
Setup project + storageState
```

Then add fixtures only when the test flow actually needs them.

---

## A Practical Folder Structure

A clean structure can look like this:

```text
tests/
  auth/
    user.setup.js
    admin.setup.js
  helpers/
    auth.js
  fixtures.js
  single_login.spec.js
  multi_login.spec.js

playwright/
  .auth/
    user.json
    admin.json

playwright.config.js
```

Remember:

```text
playwright/.auth/
```

should be ignored by Git.

---

## Common Mistakes to Avoid

Do not save the storage state before login is fully complete.

Wait for the final URL or a reliable element that proves the user is logged in:

```javascript
await page.waitForURL('https://example.com/home.html');
await expect(page.locator('#email')).toHaveText(process.env.USER_EMAIL);
```

Do not commit `user.json`, `admin.json`, or any other auth state file.

Do not hardcode real credentials in examples that will be shared publicly.

Do not use one shared account for tests that change the same server-side data in parallel. If tests modify shared state, consider separate accounts per worker or per role.

Do not use fixtures for everything. Fixtures are powerful, but the setup project pattern is simpler for normal authenticated tests.

If you use Playwright UI mode and your saved authentication expires, run the setup test again before running the dependent tests.

---

## Final Recommendation

If your tests need one logged-in user, use:

```text
setup project + storageState
```

If your tests need admin and user roles, use:

```text
setup project + one storageState file per role
```

If a single test needs multiple logged-in users at the same time, use:

```text
fixtures that create adminPage, userPage, or managerPage
```

And keep `globalSetup` for non-authentication preparation unless you have a specific reason to run authentication outside the Playwright Test lifecycle.

Authentication should not make every test longer and harder to read.

Let Playwright log in once, save the state, and let your tests focus on the feature they are actually testing.

---

## Tags

Playwright, Test Automation, End-to-End Testing, JavaScript, QA Automation

## Further Reading

Playwright authentication documentation: https://playwright.dev/docs/auth
