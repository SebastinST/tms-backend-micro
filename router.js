const express = require("express");
const router = express.Router();

const { catchSpecialCharacters } = require("./middleware.js");
const { CreateTask, getTaskbyState, PromoteTask2Done } = require("./controller.js");

// Run check for special characters for all handled routes
router.use(catchSpecialCharacters);

// Routes for micro services
router.route("/CreateTask").post(CreateTask);
router.route("/getTaskbyState").post(getTaskbyState);
router.route("/PromoteTask2Done").post(PromoteTask2Done);

module.exports = router;
