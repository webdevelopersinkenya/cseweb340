const pool = require("../database/");
const inventoryModel = require("../models/inventory-model");
const jwt = require("jsonwebtoken");
require("dotenv").config();

/* ****************************************
 * Navigation
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
 * LOGIN CHECK (SESSION ONLY - FIXED)
 ****************************************/
function checkLogin(req, res, next) {
  if (req.session?.loggedin) return next();

  req.flash("notice", "Please log in.");
  return res.redirect("/account/login");
}

/* ****************************************
 * LOGOUT CHECK
 ****************************************/
function checkLogout(req, res, next) {
  if (req.session?.loggedin) {
    return res.redirect("/account");
  }
  next();
}

/* ****************************************
 * ROLE CHECK (FIXED CASE HANDLING)
 ****************************************/
function checkAccountType(req, res, next) {
  const role = req.session?.accountData?.account_type?.toLowerCase();

  if (req.session?.loggedin && (role === "admin" || role === "employee")) {
    return next();
  }

  req.flash("notice", "Not authorized.");
  return res.redirect("/account");
}

/* ****************************************
 * ERROR WRAPPER
 ****************************************/
function handleErrors(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  getNav,
  checkLogin,
  checkLogout,
  checkAccountType,
  handleErrors,
};