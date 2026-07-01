const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { USERS, isRoleConfigured, requireUser, urlFor } = require('./helpers/config');

// ====== ADMIN TESTS ======
test.describe('Admin Scenarios', () => {
    test.skip(
        !isRoleConfigured('admin') || !fs.existsSync(USERS.admin.storageState),
        'Run the admin auth setup before this storageState example.'
    );

    test.use({
        storageState: USERS.admin.storageState  // Admin auth
    });

    test('Admin can delete users', async ({ page }) => {
        const admin = requireUser('admin');
        await page.goto(urlFor('home'));
        await expect(page.locator('#email')).toHaveText(admin.email);
    });
});

// ====== REGULAR USER TESTS ======
test.describe('Regular User Scenarios', () => {
    test.skip(
        !isRoleConfigured('regular') || !fs.existsSync(USERS.regular.storageState),
        'Run the user auth setup before this storageState example.'
    );

    test.use({
        storageState: USERS.regular.storageState  // Regular user auth
    });

    test('User can view profile', async ({ page }) => {
        const user = requireUser('regular');
        await page.goto(urlFor('home'));
        await expect(page.locator('#email')).toHaveText(user.email);
    });
});
