// tests/helpers/auth.js
const fs = require('fs');
const { USERS, requireUser, urlFor } = require('./config');

// Login and get context
async function getAuthenticatedContext(browser, userType) {
    const user = requireUser(userType);

    if (fs.existsSync(user.storageState)) {
        const context = await browser.newContext({
            storageState: user.storageState
        });

        const page = await context.newPage();
        await page.goto(urlFor('home'));
        await page.waitForLoadState('networkidle');

        if (page.url() === urlFor('home')) {
            await page.close();
            return context;
        }

        await context.close();
    }

    return await loginAndGetContext(browser, user);
}

// Alternative: Login on the fly (if you don't want to pre-save storageState)
async function loginAndGetContext(browser, credentials) {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(urlFor('login'));
    await page.getByRole('textbox', { name: "Email address or Student ID" }).fill(credentials.email);
    await page.getByRole('textbox', { name: "Password" }).fill(credentials.password);
    await page.getByRole('button', { name: "Log In" }).click();
    await page.waitForURL(urlFor('home'));

    await context.storageState({ path: credentials.storageState });

    await page.close();

    return context;
}

// Get authenticated page
async function getAuthenticatedPage(browser, userType) {
    const context = await getAuthenticatedContext(browser, userType);
    const page = await context.newPage();
    return { page, context };
}

module.exports = { USERS, getAuthenticatedContext, loginAndGetContext, getAuthenticatedPage };
