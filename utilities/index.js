const jwt = require("jsonwebtoken");
const inventoryModel = require("../models/inventory-model");

// Navigation
async function getNav() {
  let navList = "<ul><li><a href='/'>Home</a></li>";
  try {
    const classifications = await inventoryModel.getClassifications();
    const seen = new Set();
    classifications.forEach(({ classification_name }) => {
      if (!seen.has(classification_name)) {
        navList += `<li><a href="/inv/type/${classification_name}">${classification_name}</a></li>`;
        seen.add(classification_name);
      }
    });
  } catch (error) {
    console.error("Nav error:", error.message);
  }
  navList += "</ul>";
  return navList;
}

// Error handler wrapper
function handleErrors(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      account_id: user.account_id,
      account_firstname: user.account_firstname,
      account_lastname: user.account_lastname,
      account_email: user.account_email,
      account_type: user.account_type,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

// Verify JWT from cookie (name = "jwt")
function verifyToken(req, res, next) {
  const token = req.cookies.jwt;
  if (!token) {
    req.flash("notice", "Please log in.");
    return res.redirect("/account/login");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    res.locals.user = decoded;
    next();
  } catch (err) {
    res.clearCookie("jwt");
    req.flash("notice", "Session expired. Please log in again.");
    return res.redirect("/account/login");
  }
}

// Redirect if already logged in (for login/register pages)
function redirectIfLoggedIn(req, res, next) {
  const token = req.cookies.jwt;
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return res.redirect("/account/");
    } catch (err) {}
  }
  next();
}

// Role-based access control
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      req.flash("notice", "Please log in.");
      return res.redirect("/account/login");
    }
    if (roles.includes(req.user.account_type)) {
      return next();
    }
    req.flash("error", "Access denied. You do not have permission.");
    return res.redirect("/account/");
  };
}
// For backward compatibility (session-based – not used but kept)
function checkLogin(req, res, next) {
  if (req.cookies.jwt) return next();
  req.flash("notice", "Please log in.");
  return res.redirect("/account/login");
}

function checkLogout(req, res, next) {
  if (!req.cookies.jwt) return next();
  return res.redirect("/account/");
}
// Build a select list of classifications (for inventory forms)
async function buildClassificationList() {
  const inventoryModel = require("../models/inventory-model");
  const classifications = await inventoryModel.getClassifications();
  let list = '<select name="classification_id" id="classification_id" required>';
  list += '<option value="">Choose a classification</option>';
  classifications.forEach((cls) => {
    list += `<option value="${cls.classification_id}">${cls.classification_name}</option>`;
  });
  list += '</select>';
  return list;
}

module.exports = {
  getNav,
  handleErrors,
  generateToken,
  verifyToken,
  redirectIfLoggedIn,
  requireRole,
  checkLogin,
  checkLogout,
  buildClassificationList,   
};