const mysql = require("mysql2")

//Setting up database connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})
if (connection) console.log(`MySQL Database connected with host: ${process.env.DB_HOST}`)

exports.CreateTask = (req, res) => {
  const { username, password, Task_name, Task_app_Acronym, Task_description } = req.body
  console.log(username, password, Task_name, Task_app_Acronym, Task_description)
  /*
   * We are checking if the mandatory fields (username, password, Task_name, Task_app_Acronym) are present in the request parameters
   * If they are not present, we will send an error response
   * The error code PS001 is for missing parameters
   */
  if (!username || !password || !Task_name || !Task_app_Acronym) {
    return res.json({
      code: "PS001",
      message: "Missing parameters"
    })
  }
  return res.json({
    code: "S001",
    message: "lets go to the gym buddy"
  })
}
