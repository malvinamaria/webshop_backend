import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import listEndpoints from 'express-list-endpoints';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import wineData from './data/wine.json';

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
  price: {
    type: Number,
    min: 1,
    max: 1000,
  },
  createdAt: {
    type: Date,
    default: new Date(), // this will set the default value of the createdAt field to be the current date
  },
  variety: {
    type: String,
    // enum: [
    //   'red',
    //   'white',
    //   'rose',
    //   'sparkling',
    //   'Tinta de Toro',
    //   'Sauvignon Blanc',
    //   'Pinot Noir',
    //   'other',
    // ],
    required: true,
  },
  country: {
    type: String,
  },
});

/////////////////// MODEL ///////////////////////
const Wine = mongoose.model('Wine', WineSchema);

////////////////////////// RESET DATABASE //////////////////////////
// reset database with use of environment variable or do it manually
// run in terminal RESET_DB=true npm run dev
if (process.env.RESET_DB) {
  const resetDatabase = async () => {
    // async function to reset database
    await Wine.deleteMany(); // delete all data wines
    wineData.forEach((singleWine) => {
      // loop through the wineData array
      const newWine = new Wine(singleWine); // create new wine item
      newWine.save(); // save to database
    });
  };
  console.log('Resetting database!');
  resetDatabase();
}

/////////////////// ENDPOINTS ///////////////////////
app.post('/wines', async (req, res) => {
  //  POST endpoint to create a new wine
  const { name, description, rating, variety } = req.body; //  destructuring the request body to get the values of name, description, rating and kind
  try {
    const newWineItem = await new Wine({
      name,
      description,
      rating,
      variety,
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
// with added variety and price query, we can search for example GET http://localhost:8080/wines?variety=red in order to get variety=red or white
// with http://localhost:8080/wines?price=16 >> we can get all wines with price greater than 16
app.get('/wines', async (req, res) => {
  const { variety, price } = req.query;
  const response = {
    success: true,
    body: {},
  };
  // Regex only for strings
  const varietyRegex = new RegExp(variety);
  const priceQuery = { $gt: price ? price : 0 };

  try {
    const searchResultFromDB = await Wine.find({
      variety: varietyRegex,
      price: priceQuery,
    });
    if (searchResultFromDB) {
      response.body = searchResultFromDB;
      res.status(200).json(response);
    } else {
      (response.success = false), res.status(500).json(response);
    }
  } catch (e) {
    (response.success = false), res.status(500).json(response);
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

/////////////////////////////// LOGIN  + USER ///////////////////////////////

////// USER /////////
// create user schema
// const { Schema } = mongoose;

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 20,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString('hex'),
  },
});

// create user model
const User = mongoose.model('User', UserSchema);

// create user endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body; // get username and password from request body
  try {
    const salt = bcrypt.genSaltSync(); // generate salt
    const newUser = await new User({
      // create new user
      username: username, // set username
      password: bcrypt.hashSync(password, salt), // set password
    }).save(); // save user to database
    res.status(201).json({
      // send response
      success: true, // set success to true
      response: {
        // send response object
        username: newUser.username, // send username
        id: newUser._id, // send id
        accessToken: newUser.accessToken, // send accessToken
      },
    });
  } catch (e) {
    res.status(400).json({
      success: false,
      response: e,
      // message: 'Invalid request',
      // errors: err.errors,
    });
  }
});
/////////////////// LOGIN ///////////////////////
// in Postman, add the username and password to the request body, http://localhost:8080/login
// under Headers add Authorization and paste accessToken of specific user
app.post('/login', async (req, res) => {
  const { username, password } = req.body; // get username and password from request body
  try {
    const user = await User.findOne({ username }); // find user
    if (user && bcrypt.compareSync(password, user.password)) {
      // if user exists and password is correct
      res.status(200).json({
        // send response
        success: true, // set success to true
        response: {
          // send response object to frontend
          username: user.username, // send username
          id: user._id, // send id
          accessToken: user.accessToken, // send accessToken
        },
      });
    } else {
      res.status(404).json({
        success: false,
        response: 'User not found',
      });
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      response: e,
      // message: 'Invalid request',
      // errors: err.errors,
    });
  }
});
/// Secret message
const SecretSchema = new mongoose.Schema({
  message: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
  user: {
    type: String,
    required: true,
  },
});

// secret message model
const Secret = mongoose.model('Secret', SecretSchema);

// authenticate the user
const authenticateUser = async (req, res, next) => {
  const accessToken = req.header('Authorization'); // get accessToken from request header
  try {
    // try to find user by accessToken
    const user = await User.findOne({ accessToken: accessToken }); // find user by accessToken
    if (user) {
      // if user exists
      next(); // call next() to continue to the next middleware
    } else {
      // if user does not exist
      res.status(401).json({
        // send response to frontend
        success: false,
        response: 'Not authorized',
      });
    }
  } catch (e) {
    // if something goes wrong with the database query we send an error response
    res.status(401).json({
      success: false,
      response: e,
    });
  }
};

// we want to make sure that only logged in users can access this endpoint
// http://localhost:8080/secrets in Postman with accessToken in the header of scpecific user
app.get('/secrets', authenticateUser);
app.get('/secrets', async (req, res) => {
  const accessToken = req.header('Authorization');
  const user = await User.findOne({ accessToken: accessToken });
  const secrets = await Secret.find({ user: user._id });
  // const secrets = await Secret.find({ user: user._id });
  res.status(200).json({ success: true, response: secrets });
});

// In Postman, add the accessToken to the request header under the key Authorization, with http://localhost:8080/secrets and in the body
// {
//    "message": "I am a genius"
// }
app.post('/secrets', authenticateUser);
app.post('/secrets', async (req, res) => {
  // create secret message
  const { message } = req.body; // get message from request body
  const accessToken = req.header('Authorization'); // get accessToken from request header
  const user = await User.findOne({ accessToken: accessToken }); // find user by accessToken
  const secrets = await new Secret({ message: message, user: user._id }).save(); // create new secret message and save to database
});

////////////
// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
