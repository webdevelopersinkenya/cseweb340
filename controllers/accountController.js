const accountModel = require("../models/account-model");
const utilities = require("../utilities");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

console.log("REGISTER CONTROLLER RUNNING");

/* ======================================
 * LOGIN VIEW
 * ====================================== */
async function buildLogin(req, res) {
  res.render("account/login", {
    title: "Login",
    nav: await utilities.getNav(),
    errors: null,               // for server-side validation errors
    account_email: "",          // sticky field (empty initially)
    notice: req.flash("notice"),
  });
}

/* ======================================
 * REGISTER VIEW
 * ====================================== */
async function buildRegister(req, res) {
  res.render("account/register", {
    title: "Register",
    nav: await utilities.getNav(),
    errors: null,               // for server-side validation errors
    account_firstname: "",      // sticky fields
    account_lastname: "",
    account_email: "",
    notice: req.flash("notice"),
  });
}

/* ======================================
 * REGISTER ACCOUNT (called only after validation passes)
 * ====================================== */
async function registerAccount(req, res) {
  const {
    account_firstname,
    account_lastname,
    account_email,
    account_password,
  } = req.body;

  try {
    // Check if email already exists
    const emailExists = await accountModel.checkExistingEmail(account_email);
    if (emailExists) {
      req.flash("notice", "Email already exists. Please login.");
      return res.redirect("/account/login");
    }

    // Set a default account type – change "user" to match your database column (e.g., 'Client')
    const account_type = "user";

    // Hash password
    const hashedPassword = await bcrypt.hash(account_password, 10);

    // Register the user
    await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword,
      account_type
    );

    req.flash("notice", "Registration successful. Please log in.");
    return res.redirect("/account/login");
  } catch (error) {
    console.error("Registration error:", error);
    req.flash("notice", "Registration failed. Try again.");
    return res.redirect("/account/register");
  }
}
/* ======================================
 * LOGIN ACCOUNT
 * ====================================== */
async function loginAccount(req, res) {
  const { account_email, account_password } = req.body;
  try {
    const user = await accountModel.getAccountByEmail(account_email);
    if (!user) {
      req.flash("notice", "Invalid email or password.");
      return res.redirect("/account/login");
    }
    const match = await bcrypt.compare(account_password, user.account_password);
    if (!match) {
      req.flash("notice", "Invalid email or password.");
      return res.redirect("/account/login");
    }

    // Create JWT token
    const token = jwt.sign(
      {
        account_id: user.account_id,
        account_type: user.account_type,
        account_firstname: user.account_firstname,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set JWT as HTTP‑only cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: process.env.NODE_ENV === "production",
    });

    // Keep session for existing header logic (optional but simpler)
    req.session.loggedin = true;
    req.session.accountData = {
      account_id: user.account_id,
      account_firstname: user.account_firstname,
      account_lastname: user.account_lastname,
      account_email: user.account_email,
      account_type: user.account_type,
    };

    req.flash("notice", `Welcome ${user.account_firstname}`);
    return res.redirect("/account/");
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).send("Server error");
  }
}

/* ======================================
 * ACCOUNT DASHBOARD
 * ====================================== */
async function buildAccountManagement(req, res) {
  res.render("account/account", {
    title: "Account Dashboard",
    nav: await utilities.getNav(),
    errors: null,
    account: req.session.accountData,
    notice: req.flash("notice"),
  });
}

/* ======================================
 * UPDATE ACCOUNT VIEW
 * ====================================== */
async function buildUpdateAccount(req, res, next) {
  try {
    if (!req.session.accountData || !req.session.accountData.account_id) {
      req.flash("notice", "Please log in first.");
      return res.redirect("/account/login");
    }

    // Use session data directly (already has firstname, lastname, email, id)
    const account = req.session.accountData;

    res.render("account/update-account", {
      title: "Update Account",
      nav: await utilities.getNav(),
      errors: null,
      account: account,
      notice: req.flash("notice"),
    });
  } catch (err) {
    next(err);
  }
}
/* ======================================
 * UPDATE ACCOUNT INFO
 * ====================================== */
async function updateAccount(req, res, next) {
  try {
    const account_id = req.session.accountData.account_id;
    const { account_firstname, account_lastname, account_email } = req.body;

    await accountModel.updateAccount({
      account_id,
      account_firstname,
      account_lastname,
      account_email,
    });

    // Refresh session data
    const updatedAccount = await accountModel.getAccountById(account_id);
    req.session.accountData = updatedAccount;

    req.flash("notice", "Account updated successfully.");
    // Redirect to dashboard (management view) instead of back to update page
    return res.redirect("/account/");
  } catch (err) {
    next(err);
  }
}

/* ======================================
 * UPDATE PASSWORD
 * ====================================== */
async function updatePassword(req, res, next) {
  try {
    const account_id = req.session.accountData.account_id;
    const { account_password, account_password_confirm } = req.body;

    if (account_password !== account_password_confirm) {
      req.flash("notice", "Passwords do not match.");
      return res.redirect("/account/update");
    }

    const hashedPassword = await bcrypt.hash(account_password, 10);
    await accountModel.updatePassword(account_id, hashedPassword);

    req.flash("notice", "Password updated successfully.");
    // Redirect to dashboard
    return res.redirect("/account/");
  } catch (err) {
    next(err);
  }
}
/* ======================================
 * LOGOUT
 * ====================================== */
function accountLogout(req, res) {
  res.clearCookie("token");
  req.session.destroy(() => {
    res.redirect("/");
  });
}
module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
  loginAccount,
  buildAccountManagement,
  buildUpdateAccount,
  updateAccount,
  updatePassword,
  accountLogout,
};