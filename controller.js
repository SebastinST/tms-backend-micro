const { Checkgroup } = require("./middleware.js");
const connection = require("./config/database");
const bcrypt = require("bcryptjs");

exports.CreateTask = async (req, res) => {
  try {
    const { username, password, Task_name, Task_app_Acronym } = req.body;
    let { Task_description } = req.body;

    // PS001: Check for mandatory fields in request body
    if (username === undefined
      || password === undefined
      || Task_name === undefined
      || Task_app_Acronym === undefined
    ) {
      res.json({
        code: "PS001"
      });
      return;
    }

    // PS002: Check for valid data types for mandatory fields
    if (typeof username !== "string" 
      || typeof password !== "string" 
      || typeof Task_name !== "string" 
      || typeof Task_app_Acronym !== "string"
    ) {
      res.json({
        code: "PS002"
      });
      return;
    }
    
    // Get user details from DB
    const getUser = await connection.promise().query(
      "SELECT * FROM user WHERE username = ?", 
      [username]
    );
    const user = getUser[0][0];
    
    // IM001: Check for valid user credentials
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.json({
        code: "IM001"
      });
      return;
    }
    
    // IM002: Check for active user account
    if (user.is_disabled === 1) {
      res.json({
        code: "IM002"
      });
      return;
    }
    
    // Get app details from DB
    let getApp = await connection.promise().query(
      "SELECT * FROM application WHERE app_acronym = ?", 
      [Task_app_Acronym]
    )
    const app = getApp[0][0];

    // AM001: Check for valid application
    if (!app) {
      res.json({
        code: "AM001"
      });
      return;
    }

    // AM002: Check if user has permit to create task
    if (!app.App_permit_create 
      || !(await Checkgroup(username, app.App_permit_create))
    ) {
      res.json({
        code: "AM002"
      });
      return;
    }

    // Set generated task parameters
    if (!Task_description) { Task_description = null }
    const Task_creator = username;
    const Task_owner = username;
    const Task_id = Task_app_Acronym + app.App_Rnumber;
    const Task_state = "Open";
    const Task_notes = 
    `
    \nCreated in 'Open' state by User (${username}) at Datetime: ${new Date().toLocaleString()}
    \n******************************************************************************************************************************************************************************
    \n
    `

    // Create task in DB
    await connection.promise().execute(
      "INSERT INTO task (Task_name, Task_description, Task_notes, Task_id, Task_app_Acronym, Task_state, Task_creator, Task_owner) VALUES (?,?,?,?,?,?,?,?)", 
      [
        Task_name, 
        Task_description, 
        Task_notes,
        Task_id,
        Task_app_Acronym, 
        Task_state, 
        Task_creator, 
        Task_owner
      ]
    )

    // Increment app Running number after successful creation
    await connection.promise().execute(
      "UPDATE application SET `App_Rnumber` = ? WHERE `App_Acronym` = ?", 
      [app.App_Rnumber + 1, Task_app_Acronym]
    )

    // S001: Return successful creation
    res.json({
      code: "S001"
    });
    return;

  } catch(e) {
    // T003: Check for any transaction error
    res.json({
      code: "T003"
    });
    return;
  }
};

/* --------------------------------------------------------------------------- */

exports.GetTaskbyState = async (req, res) => {
  try {
    const { username, password, Task_state, Task_app_Acronym } = req.body
    
    // PS001: Check for mandatory fields in request body
    if (username === undefined
      || password === undefined
      || Task_state === undefined
      || Task_app_Acronym === undefined
    ) {
      res.json({
        code: "PS001"
      });
      return;
    }

    // PS002: Check for valid data types for mandatory fields
    if (typeof username !== "string" 
      || typeof password !== "string" 
      || typeof Task_state !== "string" 
      || typeof Task_app_Acronym !== "string"
    ) {
      res.json({
        code: "PS002"
      });
      return;
    }

    // Get user details from DB
    const getUser = await connection.promise().query(
      "SELECT * FROM user WHERE username = ?", 
      [username]
    );
    const user = getUser[0][0];
    
    // IM001: Check for valid user credentials
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.json({
        code: "IM001"
      });
      return;
    }

    // IM002: Check for active user account
    if (user.is_disabled === 1) {
      res.json({
        code: "IM002"
      });
      return;
    }

    // Get app details from DB
    let getApp = await connection.promise().query(
      "SELECT * FROM application WHERE app_acronym = ?", 
      [Task_app_Acronym]
    )
    const app = getApp[0][0];

    // AM001: Check for valid application
    if (!app) {
      res.json({
        code: "AM001"
      });
      return;
    }

    // TS001: Check for valid task state
    if (Task_state !== "Open" 
      && Task_state !== "ToDo" 
      && Task_state !== "Doing" 
      && Task_state !== "Done" 
      && Task_state !== "Close"
    ) {
      res.json({
        code: "T002"
      });
      return;
    }

    // Get tasks details
    const result = await connection.promise().query(
      "SELECT * FROM task WHERE Task_state = ? AND Task_app_acronym = ?", 
      [Task_state, Task_app_Acronym]
    )
    const tasks = result[0];
    
    // S001: Return tasks
    res.json({
      code: "S001",
      data: tasks
    });
    return;

  } catch(e) {
    // T003: Check for any transaction error
    res.json({
      code: "T003"
    });
    return;
  }
}

/* --------------------------------------------------------------------------- */

exports.PromoteTask2Done = async (req, res) => {
  try {
    const { username, password, Task_id, Task_app_Acronym } = req.body;
    let { New_notes } = req.body;

    // PS001: Check for mandatory fields in request body
    if (username === undefined
      || password === undefined
      || Task_id === undefined
      || Task_app_Acronym === undefined
    ) {
      res.json({
        code: "PS001"
      });
      return;
    }

    // PS002: Check for valid data types for mandatory fields
    if (typeof username !== "string" 
      || typeof password !== "string" 
      || typeof Task_id !== "string" 
      || typeof Task_app_Acronym !== "string"
    ) {
      res.json({
        code: "PS002"
      });
      return;
    }
    
    // Get user details from DB
    const getUser = await connection.promise().query(
      "SELECT * FROM user WHERE username = ?", 
      [username]
    );
    const user = getUser[0][0];
    
    // IM001: Check for valid user credentials
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.json({
        code: "IM001"
      });
      return;
    }
    
    // IM002: Check for active user account
    if (user.is_disabled === 1) {
      res.json({
        code: "IM002"
      });
      return;
    }
    
    // Get app details from DB
    let getApp = await connection.promise().query(
      "SELECT * FROM application WHERE app_acronym = ?", 
      [Task_app_Acronym]
    )
    const app = getApp[0][0];

    // AM001: Check for valid application
    if (!app) {
      res.json({
        code: "AM001"
      });
      return;
    }

    // AM002: Check if user has permit to promote task
    if (!app.App_permit_Doing 
      || !(await Checkgroup(username, app.App_permit_Doing))
    ) {
      res.json({
        code: "AM002"
      });
      return;
    }

    // Get task details from DB
    let getTask = await connection.promise().query(
      "SELECT * FROM task WHERE Task_id = ?", 
      [Task_id]
    )
    const task = getTask[0][0];

    // T001: Check for valid task
    if (!task) {
      res.json({
        code: "T001"
      });
      return;
    }

    // T002: Check that task is in "Doing" state
    if (task.Task_state !== "Doing") {
      res.json({
        code: "T002"
      });
      return;
    }

    // Set generated task parameters
    New_notes += 
    `
    \nPromoted to 'Done' state by User (${username}) at Datetime: ${new Date().toLocaleString()}
    \n******************************************************************************************************************************************************************************
    \n
    `
    + task.Task_notes;

    // Update the task in DB
    const result = await connection.promise().execute(
      "UPDATE task SET `Task_notes`=?, `Task_state`=?, `Task_owner`=? WHERE `Task_id`=?", 
      [New_notes, 'Done', username, Task_id]
    )
    
    // T003: Check if task is updated in DB
    if (result[0].affectedRows === 0) {
      res.json({
        code: "T003"
      });
      return;
    }

    // S001: Return successful update
    res.json({
      code: "S001"
    });
    return;

  } catch(e) {
    // T003: Check for any transaction error
    res.json({
      code: "T003"
    });
    return;
  }
}
