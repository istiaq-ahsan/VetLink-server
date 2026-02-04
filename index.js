const dns = require("dns");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    const usersCollection = db.collection("users");

    app.get("/bookings", async (req, res) => {
      try {
        const email = req.query.userEmail;
        const query = email ? { created_by: email } : {};
        const options = {
          sort: { createdAt: -1 },
        };
        const bookings = await bookingCollection.find(query, options).toArray();

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

    //delete a booking by id
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;

      try {
        const result = await bookingCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send(result);
      } catch (err) {
        console.error("Failed to delete booking:", err);
        return res.status(500).json({ message: "Server error" });
      }
    });

    // 1️⃣ GET all users or a specific user by email
    app.get("/users", async (req, res) => {
      try {
        const email = req.query.email;
        const query = email ? { email } : {};
        const options = {
          sort: { createdAt: -1 }, // optional sorting by creation date
        };
        const users = await usersCollection.find(query, options).toArray();
        res.send(users);
      } catch (error) {
        res.status(500).send({ message: "Failed to fetch users", error });
      }
    });

    // users related apis
    app.post("/users", async (req, res) => {
      const user = req.body;
      user.role = "user";
      user.createdAt = new Date();
      const email = user.email;
      const userExists = await usersCollection.findOne({ email });

      if (userExists) {
        return res.send({ message: "user exists" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
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
