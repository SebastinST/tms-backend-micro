const express = require('express');
const dotenv = require("dotenv");
const cors = require("cors");

// Setting up config.env file variable
dotenv.config({ path: "./config/config.env" });

// Setting up database connection
const connection = require("./config/database");

// Inititalize the app and add middleware
const app = express();
app.use(express.json());
app.use(cors());

// Importing routes
const router = require("./router")

// Mounting routes
app.use("/", router)

// Handle unhandled promise rejections
process.on("unhandledRejection", e => {
  console.log(`ERROR: ${e.stack}`)
  console.log("Shutting down the server due to unhandled promise rejection")
  server.close(() => {
    process.exit(1)
  })
})

// AS001: Check that endpoint exist
app.all("*", (req, res, next) => {
  res.json({
    code: "AS001"
  });
  return;
})


// App listening on port
const PORT = process.env.PORT
const server = app.listen(PORT, () => {
  console.log(`TMS-Backend-Micro started on port ${PORT} in ${process.env.NODE_ENV} mode`)
})