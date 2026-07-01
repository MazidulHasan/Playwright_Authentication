const fs = require('fs');
const path = require('path');

function loadEnvFile() {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;

    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) continue;

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
        if (key && process.env[key] === undefined) process.env[key] = value;
    }
}

loadEnvFile();

const BASE_URL = process.env.BASE_URL || 'https://example.com';

const ROUTES = {
    login: process.env.LOGIN_PATH || '/index.html',
    home: process.env.HOME_PATH || '/home.html',
    dashboard: process.env.DASHBOARD_PATH || '/slider.html'
};

const USERS = {
    admin: {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        storageState: 'playwright/.auth/admin.json'
    },
    regular: {
        email: process.env.USER_EMAIL,
        password: process.env.USER_PASSWORD,
        storageState: 'playwright/.auth/user.json'
    },
    manager: {
        email: process.env.MANAGER_EMAIL,
        password: process.env.MANAGER_PASSWORD,
        storageState: 'playwright/.auth/manager.json'
    }
};

function urlFor(routeName) {
    return new URL(ROUTES[routeName], BASE_URL).toString();
}

function isRoleConfigured(role) {
    const user = USERS[role];
    return Boolean(
        user &&
        user.email &&
        user.password &&
        !user.email.endsWith('@example.com') &&
        user.password !== 'change-me'
    );
}

function requireUser(role) {
    const user = USERS[role];
    if (!user) throw new Error(`User type "${role}" was not found.`);
    if (!isRoleConfigured(role)) {
        throw new Error(`Missing credentials for "${role}". Add them to your environment variables.`);
    }
    return user;
}

module.exports = { BASE_URL, ROUTES, USERS, urlFor, isRoleConfigured, requireUser };
