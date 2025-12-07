const http = require('http');

const data = JSON.stringify({
    status: 'Partial',
    paidAmount: 10
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/invoices/9750b349-fe98-4eda-83ba-ebec5a4f6b4d',
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
