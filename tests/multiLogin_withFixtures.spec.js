const { test, expect } = require('./fixtures');
const { isRoleConfigured, requireUser, urlFor } = require('./helpers/config');

test.skip(
    !isRoleConfigured('admin') || !isRoleConfigured('regular'),
    'Admin and regular user credentials are required for this fixture example.'
);

test('Admin can manage user profiles', async ({ adminPage, userPage }) => {
    const admin = requireUser('admin');
    const user = requireUser('regular');

    await adminPage.goto(urlFor('home'));
    await expect(adminPage.locator('#email')).toHaveText(admin.email);

    await userPage.goto(urlFor('home'));
    await expect(userPage.locator('#email')).toHaveText(user.email);
});
