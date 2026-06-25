const dns = require("node:dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setServers(["1.1.1.1", "1.0.0.1"]);

const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGO_DB_URI;

const app = express();
const cors = require("cors");

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const run = async () => {
  try {
    await client.connect();

    await client.db("peyaraful-nest").command({ ping: 1 });

    const database = client.db("peyaraful-nest");
    const propertiesCollection = database.collection("properties");
    const bookingCollection = database.collection("bookings");
    const favoriteCollection = database.collection("favorites");
    const paymentCollection = database.collection("payments");
    const usersCollection = database.collection("user");

    // getting properties all data
    app.get("/api/properties", async (req, res) => {
      const cursor = propertiesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // getting approved 6 properties for featured section
    app.get("/api/properties", async (req, res) => {
      const query = { status: "Approved" };
      const cursor = propertiesCollection.find(query).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // getting properties data by properties id for UI detials page
    app.get("/api/properties/:propertyId", async (req, res) => {
      const id = req.params.propertyId;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await propertiesCollection.findOne(query);
      res.send(result);
    });

    //getting properties data by owner id for UI owner dashboard page
    app.get("/api/properties/owner/:ownerId", async (req, res) => {
      const id = req.params.ownerId;

      const result = await propertiesCollection.find({ ownerId: id }).toArray();
      res.send(result);
    });

    //add new properties data
    app.post("/api/properties", async (req, res) => {
      const property = req.body;
      const result = await propertiesCollection.insertOne(property);

      console.log(result);
      res.send(result);
    });

    //update properties data by properties id
    app.patch("/api/properties/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      const result = await propertiesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );
      res.send(result);
    });

    // delete my-properties data by properties id
    app.delete("/api/properties/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await propertiesCollection.deleteOne(query);
      res.send(result);
    });

    // getting bookings data by tenant or owner id
    app.get("/api/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const result = await bookingCollection
        .find({ $or: [{ tenantId: id }, { ownerId: id }] })
        .toArray();
      res.send(result);
    });

    //bookingStatus update by property owner
    app.patch("/api/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      const result = await bookingCollection.updateOne(
        {
          _id: new ObjectId(id),
          bookingStatusUpdatedCount: { $lt: 1 },
        },
        {
          $set: updatedData,
          $inc: { bookingStatusUpdatedCount: 1 },
        },
      );

      if (result.matchedCount === 0) {
        return res.status(403).send({
          success: false,
          message:
            "This booking has already been updated once and cannot be modified again.",
        });
      }

      res.send({
        success: true,
        message: "Booking updated successfully",
        result,
      });
    });

    //getting transactions data
    app.get("/api/payments", async (req, res) => {
      const cursor = paymentCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //getting payments data by owner id
    app.get("/api/payments/:ownerId", async (req, res) => {
      const ownerId = req.params.ownerId;
      const result = await paymentCollection
        .find({ ownerId: ownerId })
        .toArray();
      res.send(result);
    });

    //getting favorites data by tenant id
    app.get("/api/favorites/tenant/:tenantId", async (req, res) => {
      const tenantId = req.params.tenantId;
      const result = await favoriteCollection
        .find({ tenantId: tenantId })
        .toArray();
      res.send(result);
    });

    //getting users data
    app.get("/api/users", async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //update users role by admin id
    app.patch("/api/users/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );
      res.send(result);
    });
  } finally {
  }
};

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello world!");
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
