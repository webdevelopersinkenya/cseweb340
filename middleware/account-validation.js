const { body, validationResult } = require("express-validator");
const accountModel = require("../models/account-model");
const utilities = require("../utilities");

const validate = {};

/* ======================================
 * LOGIN RULES
 * ====================================== */
validate.loginRules = () => {
  return [
    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required."),

    body("account_password")
      .trim()
      .notEmpty()
      .withMessage("Password is required."),
  ];
};

/* Login validation check */
validate.checkLoginData = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();

    return res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: errors.array(),
      account_email: req.body.account_email || "",
      notice: req.flash("notice") || [],
    });
  }

  next();
};

/* ======================================
 * REGISTRATION RULES
 * ====================================== */
validate.registrationRules = () => {
  return [
    body("account_firstname")
      .trim()
      .notEmpty()
      .withMessage("First name is required."),

    body("account_lastname")
      .trim()
      .notEmpty()
      .withMessage("Last name is required."),

    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required.")
      .custom(async (account_email) => {
        const exists = await accountModel.checkExistingEmail(account_email);
        if (exists) {
          throw new Error("Email already exists. Please login instead.");
        }
      }),

    body("account_password")
      .trim()
      .isLength({ min: 4 })
      .withMessage("Password must be at least 4 characters."),
  ];
};

/* Registration validation check */
validate.checkRegData = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();

    return res.status(400).render("account/register", {
      title: "Register",
      nav,
      errors: errors.array(),
      account_firstname: req.body.account_firstname || "",
      account_lastname: req.body.account_lastname || "",
      account_email: req.body.account_email || "",
      notice: req.flash("notice") || [],
    });
  }

  next();
};

/* ======================================
 * UPDATE ACCOUNT RULES
 * ====================================== */
validate.updateAccountRules = () => {
  return [
    body("account_firstname")
      .trim()
      .notEmpty()
      .withMessage("First name is required."),

    body("account_lastname")
      .trim()
      .notEmpty()
      .withMessage("Last name is required."),

    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required.")
      .custom(async (account_email, { req }) => {
        const current = req.session.accountData;

        if (!current) {
          throw new Error("Session expired. Please log in again.");
        }

        if (account_email !== current.account_email) {
          const exists = await accountModel.checkExistingEmail(account_email);
          if (exists) {
            throw new Error("Email already in use.");
          }
        }
      }),
  ];
};

/* Update check */
validate.checkUpdateData = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();

    return res.status(400).render("account/update-account", {
      title: "Update Account",
      nav,
      errors: errors.array(),
      account: {
        account_id: req.body.account_id,
        account_firstname: req.body.account_firstname,
        account_lastname: req.body.account_lastname,
        account_email: req.body.account_email,
      },
      notice: req.flash("notice") || [],
    });
  }

  next();
};

/* ======================================
 * PASSWORD RULES
 * ====================================== */
validate.changePasswordRules = () => {
  return [
    body("account_password")
      .trim()
      .isLength({ min: 4 })
      .withMessage("Password must be at least 4 characters."),
  ];
};

/* Password check */
validate.checkPasswordData = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();

    return res.status(400).render("account/update-account", {
      title: "Change Password",
      nav,
      errors: errors.array(),
      account: req.session.accountData || {},
      notice: req.flash("notice") || [],
    });
  }

  next();
};

module.exports = validate;