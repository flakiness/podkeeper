import { test } from '@playwright/test';
import pg from 'pg';
import { Postgres } from '../src/postgres.js';

test('should work', async ({}) => {
  const s = await Postgres.start({
    user: 'foo',
    password: 'bar',
    db: 'postgres',
  });
  const client = new pg.Client(s.connectOptions());
  await client.connect();
  await client.query('SELECT 1');
  await client.end();
  await s.stop();
})