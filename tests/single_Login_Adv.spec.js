const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { USERS, isRoleConfigured, requireUser, urlFor } = require('./helpers/config');

test.describe('Regular User Scenarios', () => {
    test.skip(
        !isRoleConfigured('regular') || !fs.existsSync(USERS.regular.storageState),
        'Run the user auth setup before this storageState example.'
    );

    test.use({
        storageState: USERS.regular.storageState
    });

    test('Login check', async ({ page }) => {
        const user = requireUser('regular');
        await page.goto(urlFor('home'));
        await expect(page.locator('#email')).toHaveText(user.email);
    });
});
