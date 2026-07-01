// tests/fixtures.js
const { test: base, expect } = require('@playwright/test');
const { getAuthenticatedPage } = require('./helpers/auth');

// Extend test with user fixtures
const test = base.extend({
    adminPage: async ({ browser }, use) => {
        const { page, context } = await getAuthenticatedPage(browser, 'admin');
        await use(page);
        await context.close();
    },
    
    userPage: async ({ browser }, use) => {
        const { page, context } = await getAuthenticatedPage(browser, 'regular');
        await use(page);
        await context.close();
    },
    
    managerPage: async ({ browser }, use) => {
        const { page, context } = await getAuthenticatedPage(browser, 'manager');
        await use(page);
        await context.close();
    }
});

module.exports = { test, expect };
