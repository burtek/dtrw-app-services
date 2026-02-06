import { createApp } from '../src/app';

import { seedData } from './setup-db';


export const setupAppWithDb = async ({ closeAfterAll = true } = {}) => {
    const { app, runMigrations } = await createApp();

    beforeAll(async () => {
        runMigrations();
        await seedData(app.database.db);
    });

    beforeEach(() => {
        app.database.db.$client.exec('BEGIN');
    });

    afterEach(() => {
        app.database.db.$client.exec('ROLLBACK');
    });

    afterAll(async () => {
        if (closeAfterAll) {
            await app.close();
        }
    });

    return await app;
};
