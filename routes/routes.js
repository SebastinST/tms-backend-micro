const express = require("express")
const router = express.Router()

const { catchSpecialCharacters } = require("../middleware/middleware.js")
const { CreateTask } = require("../controllers/controllers.js")

router.use(catchSpecialCharacters)

router.route("/CreateTask").post(CreateTask)

module.exports = router
