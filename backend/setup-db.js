const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('Missing SUPABASE_URL (Connection String) in .env');
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
});

async function setupDatabase() {
    try {
        await client.connect();
        console.log('Connected to database');

        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY,
        invoice_number TEXT NOT NULL,
        date DATE NOT NULL,
        client_name TEXT NOT NULL,
        client_address TEXT,
        company_details JSONB,
        status TEXT NOT NULL,
        total_amount NUMERIC NOT NULL,
        paid_amount NUMERIC DEFAULT 0,
        items JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

        await client.query(createTableQuery);
        console.log('Table "invoices" created or already exists.');

        // Add paid_amount column if it doesn't exist (for existing tables)
        const alterTableQuery = `
            ALTER TABLE invoices 
            ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0;
        `;
        await client.query(alterTableQuery);
        console.log('Column "paid_amount" checked/added.');

    } catch (err) {
        console.error('Error setting up database:', err);
    } finally {
        await client.end();
    }
}

setupDatabase();
