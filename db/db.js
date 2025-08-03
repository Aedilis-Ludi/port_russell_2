const { ServerApiVersion } = require('mongodb');
const mongoose = require('mongoose')

const clientOption = {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
};

exports.initClientDbConnection = async () => {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        //await clientOption.connect();
        // Send a ping to confirm a successful connection
        //await clientOption.db("admin").command({ ping: 1 });
        //console.log("Pinged your deployment. You successfully connected to MongoDB!");
        await mongoose.connect(process.env.URL_MONGO, clientOption)
        console.log("connected")
      } catch (e) {
        // Ensures that the client will close when you finish/error
        console.log(e);
        throw e
    }
};