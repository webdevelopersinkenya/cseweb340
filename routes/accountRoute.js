const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities/");
const regValidate = require("../utilities/account-validation");

/* **************************************
 * Middleware shortcuts
 **************************************/
const { checkLogin, checkLogout } = utilities;

/* **************************************
 * Login & Registration Routes
 **************************************/
router.get(
  "/login",
  checkLogout,
  utilities.handleErrors(accountController.buildLogin)
);

router.get(
  "/register",
  checkLogout,
  utilities.handleErrors(accountController.buildRegister)
);

// Registration POST – follows instruction exactly (registationRules typo included)
router.post(
  "/register",
  regValidate.registationRules(),   // note: spelling matches instruction
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
);

// Login POST – validation rules (optional, but keeps your app functional)
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.loginAccount)
);

/* **************************************
 * Account Dashboard
 **************************************/
router.get(
  "/",
  checkLogin,
  utilities.handleErrors(accountController.buildAccountManagement)
);

/* **************************************
 * Account Update Form (GET)
 **************************************/
router.get(
  "/update",
  checkLogin,
  utilities.handleErrors(accountController.buildUpdateAccount)
);

/* **************************************
 * Account Profile Update (POST)
 **************************************/
router.post(
  "/update",
  checkLogin,
  regValidate.updateAccountRules(),
  regValidate.checkUpdateData,
  utilities.handleErrors(accountController.updateAccount)
);

/* **************************************
 * Account Password Update (POST)
 **************************************/
router.post(
  "/updatePassword",
  checkLogin,
  regValidate.changePasswordRules(),
  regValidate.checkPasswordData,
  utilities.handleErrors(accountController.updatePassword)
);

/* **************************************
 * Logout
 **************************************/
router.get(
  "/logout",
  utilities.handleErrors(accountController.accountLogout)
);

module.exports = router;