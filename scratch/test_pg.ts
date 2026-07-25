import { Client } from 'pg';

async function test() {
  const client = new Client({
    connectionString: "postgresql://postgres.jlzjyulcvqsdiqrxrrgo:Smarthub-agrochain@aws-0-eu-central-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log("PG CLIENT CONNECTED SUCCESSFULLY!");
    const res = await client.query('SELECT id, name FROM "Product" LIMIT 3');
    console.log("PRODUCTS IN DB:", res.rows);
    await client.end();
  } catch (err) {
    console.error("PG CLIENT ERROR:", err);
  }
}

test();
