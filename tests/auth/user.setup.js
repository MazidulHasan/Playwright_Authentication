const { test, expect } = require('@playwright/test');
const { isRoleConfigured, requireUser, urlFor } = require('../helpers/config');

test('authenticate as user', async ({ page }) => {
    test.skip(!isRoleConfigured('regular'), 'User credentials are not configured.');

    const user = requireUser('regular');
    await page.goto(urlFor('login'));
    await page.getByRole('textbox',{name: "Email address or Student ID"}).fill(user.email);
    await page.getByRole('textbox',{name: "Password"}).fill(user.password);
    await page.getByRole('button',{name:"Log In"}).click();
    await page.waitForURL(urlFor('home'));
    await expect(page.locator('#email')).toHaveText(user.email);
    await page.context().storageState({ path: user.storageState });
});
