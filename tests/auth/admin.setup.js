const { test, expect } = require('@playwright/test');
const { isRoleConfigured, requireUser, urlFor } = require('../helpers/config');

test('authenticate as admin', async ({ page }) => {
    test.skip(!isRoleConfigured('admin'), 'Admin credentials are not configured.');

    const admin = requireUser('admin');
    await page.goto(urlFor('login'));
    await page.getByRole('textbox',{name: "Email address or Student ID"}).fill(admin.email);
    await page.getByRole('textbox',{name: "Password"}).fill(admin.password);
    await page.getByRole('button',{name:"Log In"}).click();
    await page.waitForURL(urlFor('home'));
    await expect(page.locator('#email')).toHaveText(admin.email);
    await page.context().storageState({ path: admin.storageState });
});
