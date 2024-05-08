const { query } = require('express');
const {MongoClient, ObjectId} = require('mongodb');

//connection string to mongodb cloud 
const uri = 'mongodb+srv://user_1:password_1@cluster0.qx29rxa.mongodb.net/test-db?retryWrites=true&w=majority&appName=Cluster0';

const client = new MongoClient(uri);

async function connectToMongoDB(){
    try{
        await client.connect();
        console.log('Connected to MongoDB Cloud');
    } catch (error){
        console.log('Error connecting to MongoDB Cloud:', error);
        process.exit(1);
    }
}

connectToMongoDB();

//Get the list of customers with search and pagination

async function getCustomers(req, res){
    const {first_name, last_name, city, page = 1, limit = 10} = req.query;
    try{
        const database = client.db('test-db');
        const collection = database.collection('customers');
        const query = {};

        //Search filter
        if(first_name){
            query.first_name = new RegExp(first_name, 'i');
        }
        if(last_name){
            query.last_name = new RegExp(last_name, 'i');
        }
        if(city){
            query.city = new RegExp(city, 'i');
        }

        const options = {
            skip: (page - 1) * limit,
            limit: parseInt(limit, 10)
        }
        const customers = await collection.find(query, options).toArray();
        res.json(customers);
    } catch(error){
        console.error('Error fetching customers:', error);
        res.status(500).json({error:'Internal Server Error'});
    }
}
//Get a single customer by ID

async function getCustomerById(req, res){
    const { id } = req.params;
    try{
        const database = client.db('test-db');
        const collection = database.collection('customers');
        const customer = await collection.findOne({'id':id})
        if(customer){
            res.json(customer);
        } else{
            res.status(404).json({error: 'Customer not found'});
        }
    } catch (error){
        console.error('Error fetching customer:', error);
        res.status(500).json({error:'Internal server error'});
    }
}

// List all unique cities with the number of customers from each city.
async function listCities(req, res) {
    try {
        const database = client.db('test-db');
        const collection = database.collection('customers');
        const pipeline = [
            {
                $group: {
                    _id: '$city',
                    count: { $sum: 1 },
                },
            },
        ];
        const results = await collection.aggregate(pipeline).toArray();
        res.json(results);
    } catch (error) {
        console.error('Error fetching city data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
// Add a customer with validations
async function addCustomer(req, res){
    //console.log('Request body:', req.body);
    const {id, first_name, last_name, city, company} = req.body;
    //All fields are required
    if(!id || !first_name || !last_name || !city || !company){
         return res.status(400).json({error: 'All fields are required'});
     }
    try{
        const database = client.db('test-db');
        const collection = database.collection('customers');

        // Check if city and company exist
        const existingCity = await collection.findOne({ city });
        const existingCompany = await collection.findOne({ company });

        if (!existingCity || !existingCompany) {
            return res.status(400).json({ error: 'City and company must already exist' });
        }
        // Add the new customer
        const newCustomer = { id, first_name, last_name, city, company };
        const existingId = await collection.findOne({ id });
        if(existingId){
            return res.status(400).json({ error: 'Id alreday exists' });
        }
        const result = await collection.insertOne(newCustomer);
        //console.log('Result:', result);
        // Retrieve the inserted document using `insertedId`
        const insertedDocument = await collection.findOne({ _id: result.insertedId });
        // Send the inserted document as a response
        res.status(201).json(insertedDocument);
    } catch (error) {
        console.error('Error adding customer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Export the functions
module.exports = {
    getCustomers,
    getCustomerById,
    listCities,
    addCustomer
};