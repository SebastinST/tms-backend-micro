const bcrypt = require("bcryptjs");
const connection = require("./config/database");

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

exports.validateUser = async (username, password, connection) => {
  
  // Get user details from DB
  const result = await connection.promise().query("SELECT * FROM user WHERE username = ?", [username])
  const user = result[0][0];

  // Return false if no user found
  if (!user) {
    return false;
  }

  // Return false if hashed provided password and DB password don't match
  const isPasswordMatched = await bcrypt.compare(password, user.password)
  if (!isPasswordMatched) {
    return false;
  }

  // Return user details
  return user;
}