const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Routes

// GET /api/invoices - Fetch all invoices
app.get('/api/invoices', async (req, res) => {
    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    // Map DB columns (snake_case) to frontend model (camelCase)
    const formattedInvoices = data.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        date: inv.date,
        clientName: inv.client_name,
        clientAddress: inv.client_address,
        companyDetails: inv.company_details,
        status: inv.status,
        totalAmount: inv.total_amount,
        paidAmount: inv.paid_amount || 0, // Handle partial payments
        items: inv.items
    }));

    res.json(formattedInvoices);
});

// GET /api/invoices/next-number - Get the next invoice number
app.get('/api/invoices/next-number', async (req, res) => {
    const date = new Date();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const prefix = `INV-${month}-${year}-`;

    const { data: lastInvoices, error: fetchError } = await supabase
        .from('invoices')
        .select('invoice_number')
        .ilike('invoice_number', `${prefix}%`)
        .order('created_at', { ascending: false })
        .limit(1);

    if (fetchError) {
        console.error('Error fetching last invoice:', fetchError);
        return res.status(500).json({ error: fetchError.message });
    }

    let sequence = 1;
    if (lastInvoices && lastInvoices.length > 0) {
        const lastNumber = lastInvoices[0].invoice_number;
        const lastSequence = parseInt(lastNumber.split('-').pop());
        if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
        }
    }

    const nextInvoiceNumber = `${prefix}${sequence}`;
    res.json({ nextInvoiceNumber });
});

// GET /api/invoices/:id - Get a single invoice by ID
app.get('/api/invoices/:id', async (req, res) => {
    const { id } = req.params;
    console.log('Fetching invoice with ID:', id);
    console.log('ID length:', id.length);

    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching invoice:', error);
        return res.status(500).json({ error: error.message });
    }

    if (!data) {
        return res.status(404).json({ error: 'Invoice not found' });
    }

    // Map DB columns to frontend model
    const formattedInvoice = {
        id: data.id,
        invoiceNumber: data.invoice_number,
        date: data.date,
        clientName: data.client_name,
        clientAddress: data.client_address,
        companyDetails: data.company_details,
        status: data.status,
        totalAmount: data.total_amount,
        paidAmount: data.paid_amount || 0,
        items: data.items
    };

    res.json(formattedInvoice);
});


// POST /api/invoices - Create a new invoice
app.post('/api/invoices', async (req, res) => {
    const invoice = req.body;

    // Generate Invoice Number: INV-MM-YY-Sequence
    const date = new Date();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const prefix = `INV-${month}-${year}-`;

    // Find last invoice with this prefix
    // Note: This is a simple implementation. For high concurrency, use a sequence or transaction.
    const { data: lastInvoices, error: fetchError } = await supabase
        .from('invoices')
        .select('invoice_number')
        .ilike('invoice_number', `${prefix}%`)
        .order('created_at', { ascending: false })
        .limit(1);

    if (fetchError) {
        console.error('Error fetching last invoice:', fetchError);
        return res.status(500).json({ error: fetchError.message });
    }

    let sequence = 1;
    if (lastInvoices && lastInvoices.length > 0) {
        const lastNumber = lastInvoices[0].invoice_number;
        const lastSequence = parseInt(lastNumber.split('-').pop());
        if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
        }
    }

    const newInvoiceNumber = `${prefix}${sequence}`;

    // Mapping frontend model to DB columns
    const dbInvoice = {
        id: crypto.randomUUID(),
        invoice_number: newInvoiceNumber, // Auto-generated
        date: invoice.date,
        client_name: invoice.clientName,
        client_address: invoice.clientAddress,
        company_details: invoice.companyDetails,
        status: invoice.status,
        total_amount: invoice.totalAmount,
        paid_amount: invoice.paidAmount || 0,
        items: invoice.items
    };

    const { data, error } = await supabase
        .from('invoices')
        .insert([dbInvoice])
        .select();

    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data[0]);
});

// PUT /api/invoices/:id - Update invoice status and paid amount
app.put('/api/invoices/:id', async (req, res) => {
    const { id } = req.params;
    const { status, paidAmount } = req.body; // paidAmount here is the *incremental* amount being paid

    // 1. Fetch current invoice details
    const { data: currentInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError) {
        return res.status(500).json({ error: fetchError.message });
    }

    let newStatus = status;
    let newPaidAmount = currentInvoice.paid_amount || 0;

    // 2. Calculate new paid amount if provided
    if (paidAmount !== undefined) {
        newPaidAmount += paidAmount;

        // Auto-update status if fully paid
        if (newPaidAmount >= currentInvoice.total_amount) {
            newStatus = 'Paid';
            // Optional: Cap paid amount at total? Or allow overpayment? 
            // Let's cap it for now to keep it clean, or just let it be.
            // newPaidAmount = currentInvoice.total_amount; 
        } else if (newPaidAmount > 0 && newStatus !== 'Paid') {
            newStatus = 'Partial';
        }
    } else {
        // If only status is changing (e.g. marking as Paid directly)
        if (status === 'Paid') {
            newPaidAmount = currentInvoice.total_amount;
        } else if (status === 'Pending') {
            newPaidAmount = 0;
        }
    }

    // 3. Update database
    const { data, error } = await supabase
        .from('invoices')
        .update({
            status: newStatus,
            paid_amount: newPaidAmount
        })
        .eq('id', id)
        .select();

    if (error) {
        console.error('Error updating invoice:', error);
        return res.status(500).json({ error: error.message });
    }

    res.json(data[0]);
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
