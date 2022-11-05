const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eq7dcrm.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




async function run() {
    try {
        await client.connect();
        const planetsCollection = client.db("sample_guides").collection("planets");
        const gradesCollection = client.db("sample_guides").collection("childrens");
        const usersCollection = client.db("sample_guides").collection("users");


        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true }; //if exists update else add
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACESS_TOKEN, { expiresIn: '1h' })
            res.send(result, token);
        })
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })

        //For users data
        app.get('/users', async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users);
        });

        //admin role
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            console.log("PUT", user);
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        //Sample planet data showing 
        app.get('/planet', async (req, res) => {
            const query = {};
            const cursor = planetsCollection.find(query);
            const planets = await cursor.toArray();
            res.send(planets)
        })

        //For individual id see grade sheet
        app.get('/grades', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const grades = await gradesCollection.find(query).toArray();
            res.send(grades);
        })


    }
    finally {

    }
}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
