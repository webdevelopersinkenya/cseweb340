const utilities = require("../utilities");
const { body, validationResult } = require("express-validator");

const validate = {};

/* ******************************
 * REGISTRATION RULES
 * ***************************** */
validate.registationRules = () => {
  return [
    body("account_firstname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a first name."),

    body("account_lastname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 2 })
      .withMessage("Please provide a last name."),

    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required."),

    body("account_password")
      .trim()
      .notEmpty()
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("Password does not meet requirements."),
  ];
};

/* ******************************
 * CHECK REGISTRATION DATA
 * ***************************** */
validate.checkRegData = async (req, res, next) => {
  try {
    const { account_firstname, account_lastname, account_email } = req.body;
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      let nav = await utilities.getNav();
      return res.render("account/register", {
        errors,
        title: "Registration",
        nav,
        account_firstname,
        account_lastname,
        account_email,
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

/* ******************************
 * LOGIN RULES
 * ***************************** */
validate.loginRules = () => {
  return [
    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required."),

    body("account_password")
      .trim()
      .notEmpty()
      .withMessage("Password is required."),
  ];
};

/* ******************************
 * CHECK LOGIN DATA
 * ***************************** */
validate.checkLoginData = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      let nav = await utilities.getNav();
      return res.render("account/login", {
        errors,
        title: "Login",
        nav,
        account_email: req.body.account_email,
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

/* ******************************
 * UPDATE ACCOUNT RULES
 * ***************************** */
validate.updateAccountRules = () => {
  return [
    body("account_firstname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a first name."),

    body("account_lastname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 2 })
      .withMessage("Please provide a last name."),

    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required."),
  ];
};

/* ******************************
 * CHECK UPDATE DATA (FIXED – was missing)
 * ***************************** */
validate.checkUpdateData = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      let nav = await utilities.getNav();
      return res.render("account/update-account", {
        errors,
        title: "Update Account",
        nav,
        account: {   // sticky values
          account_id: req.body.account_id,
          account_firstname: req.body.account_firstname,
          account_lastname: req.body.account_lastname,
          account_email: req.body.account_email,
        },
        notice: req.flash("notice"),
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};
/* ******************************
 * PASSWORD CHANGE RULES
 * ***************************** */
validate.changePasswordRules = () => {
  return [
    body("account_password")
      .trim()
      .notEmpty()
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("Password does not meet requirements."),
  ];
};

/* ******************************
 * CHECK PASSWORD DATA
 * ***************************** */
validate.checkPasswordData = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      let nav = await utilities.getNav();
      return res.render("account/update-account", {
        errors,
        title: "Update Password",
        nav,
        account: req.session.accountData || {},
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;