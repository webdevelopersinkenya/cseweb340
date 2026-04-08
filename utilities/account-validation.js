const { body, validationResult } = require("express-validator");
const utilities = require(".");
const accountModel = require("../models/account-model");

const validate = {};

// Registration rules
validate.registationRules = () => {
  return [
    body("account_firstname").trim().escape().notEmpty().isLength({ min: 1 }).withMessage("First name required."),
    body("account_lastname").trim().escape().notEmpty().isLength({ min: 2 }).withMessage("Last name required."),
    body("account_email").trim().escape().notEmpty().isEmail().normalizeEmail().withMessage("Valid email required.")
      .custom(async (email) => {
        const exists = await accountModel.checkExistingEmail(email);
        if (exists) throw new Error("Email already registered.");
        return true;
      }),
    body("account_password").trim().notEmpty().isStrongPassword({
      minLength: 12, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1,
    }).withMessage("Password must be at least 12 chars with 1 uppercase, 1 number, 1 special char."),
  ];
};

validate.checkRegData = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav();
    return res.render("account/register", {
      errors,
      title: "Register",
      nav,
      account_firstname: req.body.account_firstname,
      account_lastname: req.body.account_lastname,
      account_email: req.body.account_email,
      notice: req.flash("notice"),
    });
  }
  next();
};

// Login rules (only email + password presence)
validate.loginRules = () => {
  return [
    body("account_email").trim().escape().notEmpty().isEmail().normalizeEmail().withMessage("Valid email required."),
    body("account_password").trim().notEmpty().withMessage("Password required."),
  ];
};

validate.checkLoginData = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav();
    return res.render("account/login", {
      errors,
      title: "Login",
      nav,
      account_email: req.body.account_email,
      notice: req.flash("notice"),
    });
  }
  next();
};

// Update account rules
validate.updateAccountRules = () => {
  return [
    body("account_firstname").trim().escape().notEmpty().isLength({ min: 1 }).withMessage("First name required."),
    body("account_lastname").trim().escape().notEmpty().isLength({ min: 2 }).withMessage("Last name required."),
    body("account_email").trim().escape().notEmpty().isEmail().normalizeEmail().withMessage("Valid email required.")
      .custom(async (email, { req }) => {
        const existing = await accountModel.getAccountByEmail(email);
        if (existing && existing.account_id != req.body.account_id) {
          throw new Error("Email already in use by another account.");
        }
        return true;
      }),
  ];
};

validate.checkUpdateData = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav();
    return res.render("account/update-account", {
      errors,
      title: "Update Account",
      nav,
      account: {
        account_id: req.body.account_id,
        account_firstname: req.body.account_firstname,
        account_lastname: req.body.account_lastname,
        account_email: req.body.account_email,
      },
      notice: req.flash("notice"),
    });
  }
  next();
};

// Password change rules
validate.changePasswordRules = () => {
  return [
    body("account_password").trim().notEmpty().isStrongPassword({
      minLength: 12, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1,
    }).withMessage("Password must be at least 12 chars with 1 uppercase, 1 number, 1 special char."),
    body("account_password_confirm").custom((value, { req }) => {
      if (value !== req.body.account_password) throw new Error("Passwords do not match.");
      return true;
    }),
  ];
};

validate.checkPasswordData = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav();
    // fetch current account to repopulate the form (except password)
    const account = await accountModel.getAccountById(req.body.account_id);
    return res.render("account/update-account", {
      errors,
      title: "Update Account",
      nav,
      account: account || { account_id: req.body.account_id },
      notice: req.flash("notice"),
    });
  }
  next();
};

module.exports = validate;