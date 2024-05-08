const express = require('express');
const bodyParser = require('body-parser');
const { getCustomers, getCustomerById, listCities, addCustomer } = require('../api/customers');
const app = express();
const port = 3000;

app.use(bodyParser.json());

//API endpoints
app.get('/api/customers', getCustomers);
app.get('/api/customers/:id', getCustomerById);
app.get('/api/cities', listCities);
app.post('/api/customers', addCustomer);

//Serve static files from the "public" directory
app.use(express.static('../public'));

//Start the server
app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
});