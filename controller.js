const { validateUser, Checkgroup } = require("./middleware.js");
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
      return res.json({
        code: "PS002"
      })
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
    // S003: Check for any transaction error
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
    // S003: Check for any transaction error
    res.json({
      code: "T003"
    });
    return;
  }
}

/* --------------------------------------------------------------------------- */

exports.PromoteTask2Done = async (req, res) => {
  const { username, password, Task_id, Task_app_Acronym } = req.body
  /*
   * We are checking if the mandatory fields (username, password, Task_id) are present in the request parameters
   * If they are not present, we will send an error response
   * The error code PS001 is for missing parameters
   */
  if (!username || !password || !Task_id || !Task_app_Acronym) {
    return res.json({
      code: "PS001"
    })
  }
  /*
   * We are checking if they are valid data types
   * If they are not valid, we will send an error response
   * The error code PS002 is for invalid field data types
   */
  if (typeof username !== "string" || typeof password !== "string" || typeof Task_id !== "string" || typeof Task_app_Acronym !== "string") {
    return res.json({
      code: "PS002"
    })
  }
  /*
   * We are checking if the username and password are correct
   * If they are not correct, we will send an error response
   * The error code IM001 is for incorrect username or password
   */
  const user = await validateUser(username, password, connection)
  if (!user) {
    return res.json({
      code: "IM001"
    })
  }
  /*
   * We are checking if the user account is active
   * If it is not active, we will send an error response
   * The error code IM002 is for inactive user account
   */
  if (user.is_disabled === 1) {
    return res.json({
      code: "IM002"
    })
  }
  /*
   * We are checking if the application and task exists
   * If it does not exist, we will send an error response
   * The error code TM001 is for task does not exist
   */

  const [row2, fields2] = await connection.promise().query("SELECT * FROM application WHERE app_acronym = ?", [Task_app_Acronym])
  if (row2.length === 0) {
    return res.json({
      code: "AM001"
    })
  }

  const nextState = "Done"
  const havePermit = row2[0].App_permit_Doing

  if (havePermit === null || havePermit === undefined) {
    return res.json({
      code: "AM002"
    })
  }
  const user_groups = user.group_list.split(",")
  //Check if any of the user's groups is included in the permit array, then the user is authorized. The group has to match exactly
  //for each group in the group array, check match exact as group parameter
  const authorised = user_groups.includes(havePermit)
  //Since permit can only have one group, we just need to check if the user's groups contains the permit
  if (!authorised) {
    return res.json({
      code: "AM002"
    })
  }

  const [row1, fields1] = await connection.promise().query("SELECT * FROM task WHERE Task_id = ?", [Task_id])
  if (row1.length === 0) {
    return res.json({
      code: "T001"
    })
  }
  const Task_state = row1[0].Task_state

  if (Task_state !== "Doing") {
    return res.json({
      code: "T002"
    })
  }

  //Get the Task_owner from the req.user.username
  const Task_owner = user.username

  let Added_Task_notes
  if (req.body.Task_notes === undefined || req.body.Task_notes === null || req.body.Task_notes === "") {
    //append {Task_owner} moved {Task_name} from {Task_state} to {nextState} to the end of Task_note
    Added_Task_notes = Task_owner + " moved " + row1[0].Task_name + " from " + Task_state + " to " + nextState + " on " + new Date().toISOString().slice(0, 19).replace("T", " ")
  } else {
    //Get the Task_notes from the req.body.Task_notes and append {Task_owner} moved {Task_name} from {Task_state} to {nextState} to the end of Task_note
    Added_Task_notes = Task_owner + " moved " + row1[0].Task_name + " from " + Task_state + " to " + nextState + " on " + new Date().toISOString().slice(0, 19).replace("T", " ") + "\n" + req.body.Task_notes
  }

  //Append Task_notes to the preexisting Task_notes, I want it to have two new lines between the old notes and the new notes
  const Task_notes = Added_Task_notes + "\n\n" + row1[0].Task_notes
  //Update the task
  const result = await connection.promise().execute("UPDATE task SET Task_notes = ?, Task_state = ?, Task_owner = ? WHERE Task_id = ?", [Task_notes, nextState, Task_owner, Task_id])
  if (result[0].affectedRows === 0) {
    return res.json({
      code: "T003"
    })
  }

  return res.json({
    code: "S001"
  })
}
