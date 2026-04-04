const jwt = require("jsonwebtoken");
const inventoryModel = require("../models/inventory-model");

/* ****************************************
 * NAVIGATION
 ****************************************/
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

/* ****************************************
 * LOGIN CHECK (session-based)
 ****************************************/
function checkLogin(req, res, next) {
  if (req.session.loggedin && req.session.accountData) {
    return next();
  }
  req.flash("notice", "Please log in.");
  return res.redirect("/account/login");
}

/* ****************************************
 * LOGOUT CHECK
 ****************************************/
function checkLogout(req, res, next) {
  if (!req.session.loggedin) {
    return next();
  }
  return res.redirect("/account/");
}

/* ****************************************
 * ROLE CHECK (for session-based, kept for compatibility)
 ****************************************/
function checkAccountType(req, res, next) {
  const role = req.session?.accountData?.account_type?.toLowerCase();
  if (req.session?.loggedin && (role === "admin" || role === "employee")) {
    return next();
  }
  req.flash("notice", "Not authorized.");
  return res.redirect("/account/");
}

/* ****************************************
 * JWT MIDDLEWARE (for Assignment 5)
 ****************************************/
function checkJWT(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    req.flash("notice", "Please log in.");
    return res.redirect("/account/login");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    req.flash("notice", "Session expired. Please log in again.");
    return res.redirect("/account/login");
  }
}

function checkRole(requiredRoles) {
  return (req, res, next) => {
    if (!req.user) {
      req.flash("notice", "Not authorized.");
      return res.redirect("/account/login");
    }
    if (requiredRoles.includes(req.user.account_type)) {
      return next();
    }
    req.flash("notice", "You do not have permission to access this area.");
    return res.redirect("/account/");
  };
}

/* ****************************************
 * ERROR HANDLER WRAPPER
 ****************************************/
function handleErrors(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/* ****************************************
 * EXPORTS
 ****************************************/
module.exports = {
  getNav,
  checkLogin,
  checkLogout,
  checkAccountType,
  handleErrors,
  checkJWT,
  checkRole,
};