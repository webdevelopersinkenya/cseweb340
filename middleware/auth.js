const jwt = require("jsonwebtoken")

function checkAuth(req, res, next) {
  const token = req.cookies.jwt

  if (!token) return res.redirect("/account/login")

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.redirect("/account/login")
  }
}

module.exports = checkAuth