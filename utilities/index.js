const inventoryModel = require("../models/inventory-model");
require("dotenv").config();

/* ****************************************
 * IMPORT GRID FUNCTION (from separate file)
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
  if (req.session.loggedin) {
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
 * ROLE CHECK
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
 * ERROR HANDLER
 ****************************************/
function handleErrors(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/* ****************************************
 * EXPORTS (ONLY ONCE)
 ****************************************/
module.exports = {
  getNav,
  checkLogin,
  checkLogout,
  checkAccountType,
  handleErrors,
  buildClassificationGrid,
};