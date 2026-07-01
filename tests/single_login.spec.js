const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { USERS, isRoleConfigured, urlFor } = require('./helpers/config');

test.skip(
    !isRoleConfigured('regular') || !fs.existsSync(USERS.regular.storageState),
    'Run the user auth setup before this storageState example.'
);
test.use({
    storageState: USERS.regular.storageState
});

test('Open dashboard', async ({ page }) => {
    await page.goto(urlFor('dashboard'));
    await expect(page).toHaveURL(urlFor('dashboard'));
}); 
// Notice: No Login Here. User is already authenticated.
