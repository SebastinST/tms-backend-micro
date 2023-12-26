const connection = require("./config/database");
const nodemailer = require("nodemailer");

// AS002: Check if endpoint contains special characters
exports.catchSpecialCharacters = (req, res, next) => {
  const regex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/
  
  //we should strip the first '/' from '/CreateTask'
  if (regex.test(req.url.slice(1))) {
    return res.json({
      code: "AS002"
    })
  }
  next();
}

exports.Checkgroup = async (userid, groupname) => {
  const result = await connection.promise().query(
      "SELECT * FROM user WHERE username = ? AND group_list LIKE ?", 
      [userid, `%,${groupname},%`]
  )
  if (result[0][0]) {
      return true;
  } else {
      return false;
  } 
}

// Send email to users App_permit_Done group for an app
// when any task is set to Done state for that app
exports.sendEmailToProjectLead = async (task, user, app) => {
  
  const groupname = app.App_permit_Done;

  //We need to pull the emails of all
  let result = await connection.promise().query(
    "SELECT * FROM user WHERE `group_list` LIKE ?", 
    [`%,${groupname},%`]
  )

  const users = result[0];

  //We need to pull the emails of all users that are in the group
  let emails = []
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (user.email) {
      emails.push(user.email);
    }
  }

  // Set up transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  // Define mail options
  const mailOptions = {
    from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
    to: emails, // Replace with the actual project lead's email
    subject: `Task Promotion Notification`,
    text: 
    `The following task has been promoted to "Done" by ${user.username}:
    \nTask Name: ${task.Task_name}
    \nTask ID: ${task.Task_id}
    \nApp: ${task.Task_app_Acronym}
    `
  }

  // Send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully.")
  } catch (error) {
    console.error("Failed to send email:", error)
  }
}