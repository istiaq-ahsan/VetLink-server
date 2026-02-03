const dns = require("dns");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");

dotenv.config();
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1pvay.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("vetlink-db");
    const bookingCollection = db.collection("bookings");

    app.get("/bookings", async (req, res) => {
      try {
        const bookings = await bookingCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();

        res.send(bookings);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch bookings", error });
      }
    });

    app.post("/bookings", async (req, res) => {
      try {
        const booking = req.body;

        //booking.status = "pending";
        //booking.createdAt = new Date();

        const result = await bookingCollection.insertOne(booking);

        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to create booking", error });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  res.send("Veterinary Telemedicine Server is Running 🐾");
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
