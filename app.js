const express = require("express")
const cors = require("cors")
const app = express()

app.use(cors())
const mysql = require("mysql2")

const dotenv = require("dotenv")

//Setting up config.env file variable
dotenv.config({ path: "./config/config.env" })

//Handle uncaught exceptions
process.on("uncaughtException", err => {
  console.log(`Error: ${err.message}`)
  console.log("Shutting down server due to uncaught exception")
  process.exit(1)
})

app.use(express.json())

app.get("/", (req, res) => {
  res.send("Hello World!")
})

app.all("*", (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Can't find ${req.originalUrl} on this server!`
  })
})

const PORT = process.env.PORT
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT} in ${process.env.NODE_ENV} mode`)
})

//Handle unhandled promise rejections
process.on("unhandledRejection", err => {
  console.log(`Error: ${err.message}`)
  console.log("Shutting down server due to unhandled promise rejection")
  server.close(() => {
    process.exit(1)
  })
})
