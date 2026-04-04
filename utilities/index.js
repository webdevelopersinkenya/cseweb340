const inventoryModel = require("../models/inventory-model");
require("dotenv").config();

/* ****************************************
 * IMPORT GRID FUNCTION
 ****************************************/
const buildClassificationGrid = require("./classification-grid");

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
 * LOGIN CHECK
 ****************************************/
function checkLogin(req, res, next) {
  // Check if user is logged in using session data
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
  // If not logged in, allow access to login/register pages
  if (!req.session.loggedin) {
    return next();
  }
    // Already logged in, redirect to dashboard
  return res.redirect("/account/");
}

/* ****************************************
 * ROLE CHECK
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
  buildClassificationGrid,
};