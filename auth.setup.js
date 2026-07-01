const { chromium } = require('@playwright/test');
const { requireUser, urlFor } = require('./tests/helpers/config');

async function loginAndSaveState(browser, role) {
    const user = requireUser(role);
    const page = await browser.newPage();

    await page.goto(urlFor('login'));
    await page.getByRole('textbox',{name: "Email address or Student ID"}).fill(user.email);
    await page.getByRole('textbox',{name: "Password"}).fill(user.password);
    await page.getByRole('button',{name:"Log In"}).click();
    await page.waitForURL(urlFor('home'));
    await page.context().storageState({ path: user.storageState });

    await page.close();
    console.log(`${role} auth saved to ${user.storageState}`);
}

async function globalSetup() {
    // ====== ADMIN AUTH ======
    const adminBrowser = await chromium.launch();
    console.log('Setting up Admin authentication...');
    await loginAndSaveState(adminBrowser, 'admin');
    await adminBrowser.close();

    // ====== REGULAR USER AUTH ======
    console.log('Setting up Regular User authentication...');
    const userBrowser = await chromium.launch();
    await loginAndSaveState(userBrowser, 'regular');
    await userBrowser.close();
}

module.exports = globalSetup;
