const http = require('http');

const id = '79c69d89-f88f-46d5-8e0a-10e91bc045d8';
const url = `http://localhost:3000/api/invoices/${id}`;

console.log(`Fetching: ${url}`);

http.get(url, (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        console.log('Status Code:', resp.statusCode);
        try {
            const invoice = JSON.parse(data);
            console.log('Response Data:', JSON.stringify(invoice, null, 2));
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw data:', data);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
