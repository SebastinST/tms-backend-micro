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