import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import listEndpoints from 'express-list-endpoints';

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/project-wine';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Start defining your routes here
app.get('/', (req, res) => {
  res.json({
    responseMessage: 'Final Project - Backend',
    data: listEndpoints(app),
  });
});

/////////////////// SCHEMA ///////////////////////
const { Schema } = mongoose;
const WineSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true, // this is a validation rule that will make sure that no two wines have the same name
  },
  description: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 300,
    trim: true, // removes whitespace before and after the string
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(), // this will set the default value of the createdAt field to be the current date
  },
  kind: {
    type: String,
    enum: ['red', 'white', 'rose', 'sparkling', 'other'], // array of strings that the value of kind can be
    required: true,
  },
});

/////////////////// MODEL ///////////////////////
const Wine = mongoose.model('Wine', WineSchema);

/////////////////// ENDPOINTS ///////////////////////
app.post('/wines', async (req, res) => {
  //  POST endpoint to create a new wine
  const { name, description, rating, kind } = req.body; //  destructuring the request body to get the values of name, description, rating and kind
  try {
    const newWineItem = await new Wine({
      name,
      description,
      rating,
      kind,
    }).save(); //  creating a new wine item and saving it to the database
    res.status(201).json({
      success: true,
      response: newWineItem,
      message: 'Wine item successfully created',
    });
  } catch (e) {
    res.status(418).json({
      success: false,
      response: e,
      message: 'Error occured could not create wine item',
    });
  }
});

// POST - create smth
// GET - get smth
// PUT - replace smth
// DELETE - delete smth
// PATCH - update smth

// GET - get all wines
app.get('/wines', async (req, res) => {
  const wines = await Wine.find();
  if (wines) {
    res.status(200).json({
      success: true,
      response: wines,
      message: 'Wine items successfully retrieved',
    });
  } else {
    res.status(404).json({
      success: false,
      response: 'No wine items found',
      message: 'No wine items found',
    });
  }
});

// PATCH - update a wine item by id
// in Postman do PATCH req example: http://localhost:8080/wines/6475f2223f1a82fd858bd83d
// make sure in the body you have ONLY "newDescription": "Your new description"
app.patch('/wines/:id', async (req, res) => {
  const { id } = req.params;
  // const newDescription = req.body.newDescription;
  const { newDescription } = req.body;
  try {
    const wineItem = await Wine.findByIdAndUpdate(
      id,
      {
        description: newDescription,
      },
      { new: true } // this will make sure that the updated wine item is returned
    );
    res.status(200).json({
      success: true,
      response: wineItem, // this will return the updated wine item
      message: 'Updated successfully',
    });
  } catch (e) {
    res.status(400).json({
      success: false,
      response: e,
      message: 'Did not updated successfully',
    });
  }
});

// modify the endpoint when nothing is found

// GET - get a wine item by id
app.get('/wines/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const wineItem = await Wine.findById(id);
    res.status(200).json({
      success: true,
      response: wineItem,
      message: 'Found successfully',
    });
  } catch (e) {
    res.status(400).json({
      success: false,
      response: e,
      message: 'Did not found successfully',
    });
  }
});

// DELETE - delete a wine item by id
app.delete('/wines/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const wineItem = await Wine.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      response: wineItem,
      message: 'Deleted successfully',
    });
  } catch (e) {
    res.status(400).json({
      success: false,
      response: e,
      message: 'Did not deleted',
    });
  }
});
// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
