const http = require('http');

http.get('http://localhost:3000/api/invoices', (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        try {
            const invoices = JSON.parse(data);
            if (invoices.length > 0) {
                console.log(invoices[0].id);
            } else {
                console.log('No invoices found');
            }
        } catch (e) {
            console.error(e.message);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
