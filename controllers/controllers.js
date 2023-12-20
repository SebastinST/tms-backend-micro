const mysql = require("mysql2")
const bcrypt = require("bcryptjs")

//Setting up database connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})
if (connection) console.log(`MySQL Database connected with host: ${process.env.DB_HOST}`)

exports.CreateTask = async (req, res) => {
  const { username, password, Task_name, Task_app_Acronym } = req.body
  let { Task_description } = req.body
  //console.log(username, password, Task_name, Task_app_Acronym, Task_description)
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
  /*
   * We are checking if they are valid data types
   * If they are not valid, we will send an error response
   * The error code PS002 is for invalid field data types
   */
  if (typeof username !== "string" || typeof password !== "string" || typeof Task_name !== "string" || typeof Task_app_Acronym !== "string") {
    return res.json({
      code: "PS002",
      message: "Invalid field data types"
    })
  }
  /*
   * We are checking if the username and password are correct
   * If they are not correct, we will send an error response
   * The error code IM001 is for incorrect username or password
   */
  const [row, fields] = await connection.promise().query("SELECT * FROM user WHERE username = ?", [username])
  if (row.length === 0) {
    return res.json({
      code: "IM001",
      message: "Incorrect username or password"
    })
  }
  //we need to hash the password and compare it with the hashed password in the database
  const isPasswordMatched = await bcrypt.compare(password, row[0].password)
  if (!isPasswordMatched) {
    return res.json({
      code: "IM001",
      message: "Incorrect username or password"
    })
  }
  /*
   * We are checking if the user account is active
   * If it is not active, we will send an error response
   * The error code IM002 is for inactive user account
   */
  if (row[0].is_disabled === 1) {
    return res.json({
      code: "IM002",
      message: "Incorrect username or password"
    })
  }
  /*
   * We are checking if the application exists
   * If it does not exist, we will send an error response
   * The error code AM001 is for application does not exist
   */
  const [row1, fields1] = await connection.promise().query("SELECT * FROM application WHERE app_acronym = ?", [Task_app_Acronym])
  if (row1.length === 0) {
    return res.json({
      code: "AM001",
      message: "Application does not exist"
    })
  }
  /*
   * We are checking if the user has access to the application
   * If the user does not have access, we will send an error response
   * The error code AM002 is for user does not have access to the application
   */
  const permit = row1[0].App_permit_create
  if (permit === null || permit === undefined) {
    return res.json({
      code: "AM002",
      message: "User does not have access to the application"
    })
  }
  const user_groups = row[0].group_list.split(",")
  //Check if any of the user's groups is included in the permit array, then the user is authorized. The group has to match exactly
  //for each group in the group array, check match exact as group parameter
  const authorised = user_groups.includes(permit)
  //Since permit can only have one group, we just need to check if the user's groups contains the permit
  if (!authorised) {
    return res.json({
      code: "AM002",
      message: "User does not have access to the application"
    })
  }
  //We need to handle the optional parameters, if they are not provided, we will set them to null
  if (!Task_description) {
    Task_description = null
  }
  const Task_notes = "Task created by " + row[0].username + " on " + new Date().toISOString().slice(0, 10)
  const Task_id = Task_app_Acronym + row1[0].App_Rnumber
  //Generate Task_state
  const Task_state = "Open"

  //Generate Task_creator
  const Task_creator = row[0].username

  //Generate Task_owner
  const Task_owner = row[0].username
  //Generate Task_createDate, the date is in the format YYYY-MM-DD HH:MM:SS. This is using current local time
  const Task_createDate = new Date().toISOString().slice(0, 19).replace("T", " ")

  //Insert task into database
  const result = await connection.promise().execute("INSERT INTO task (Task_name, Task_description, Task_notes, Task_id, Task_plan, Task_app_acronym, Task_state, Task_creator, Task_owner, Task_createDate) VALUES (?,?,?,?,?,?,?,?,?,?)", [Task_name, Task_description, Task_notes, Task_id, null, Task_app_Acronym, Task_state, Task_creator, Task_owner, Task_createDate])
  if (result[0].affectedRows === 0) {
    return res.json({
      code: "T002",
      message: "Something went wrong..."
    })
  }

  //Increment the application R number
  const newApp_Rnumber = row1[0].App_Rnumber + 1
  const result2 = await connection.promise().execute("UPDATE application SET App_Rnumber = ? WHERE App_Acronym = ?", [newApp_Rnumber, Task_app_Acronym])
  if (result2[0].affectedRows === 0) {
    return res.json({
      code: "T002",
      message: "Something went wrong..."
    })
  }
  return res.json({
    code: "S001",
    message: "lets go to the gym buddy"
  })
}
