
const accountModel = require("../models/account-model");
const utilities = require("../utilities");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

console.log("ACCOUNT CONTROLLER LOADED");

/* ======================================
 * LOGIN VIEW
 * ====================================== */
async function buildLogin(req, res) {
  res.render("account/login", {
    title: "Login",
    nav: await utilities.getNav(),
    errors: null,
    account_email: "",
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
    errors: null,
    account_firstname: "",
    account_lastname: "",
    account_email: "",
    notice: req.flash("notice"),
  });
}

/* ======================================
 * REGISTER ACCOUNT (called after validation passes)
 * ====================================== */
async function registerAccount(req, res) {
  const { account_firstname, account_lastname, account_email, account_password } = req.body;

  try {
    const emailExists = await accountModel.checkExistingEmail(account_email);
    if (emailExists) {
      req.flash("notice", "Email already exists. Please login.");
      return res.redirect("/account/login");
    }

    // Use 'Client' as default account type (adjust if your DB uses 'user')
    const account_type = "Client";
    const hashedPassword = await bcrypt.hash(account_password, 10);

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
 * LOGIN ACCOUNT (creates JWT and sets cookie)
 * ====================================== */
async function loginAccount(req, res) {
  const { account_email, account_password } = req.body;

  try {
    console.log("LOGIN STARTED");

    const user = await accountModel.getAccountByEmail(account_email);

    console.log("USER FOUND:", user ? "YES" : "NO");

    if (!user) {
      req.flash("notice", "Invalid email or password.");
      return res.redirect("/account/login");
    }

    const match = await bcrypt.compare(account_password, user.account_password);

    console.log("PASSWORD MATCH:", match);

    if (!match) {
      req.flash("notice", "Invalid email or password.");
      return res.redirect("/account/login");
    }

    const payload = {
      account_id: user.account_id,
      account_firstname: user.account_firstname,
      account_lastname: user.account_lastname,
      account_email: user.account_email,
      account_type: user.account_type,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    console.log("TOKEN CREATED");

    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    console.log("COOKIE SET");

    return res.redirect("/account/");
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).send(error.message);
  }
}
/* ======================================
 * ACCOUNT DASHBOARD (uses JWT user)
 * ====================================== */
async function buildAccountManagement(req, res) {
  // Ensure user is attached (middleware should have set req.user)
  if (!req.user) {
    req.flash("notice", "Please log in.");
    return res.redirect("/account/login");
  }

  res.render("account/account", {
    title: "Account Dashboard",
    nav: await utilities.getNav(),
    errors: null,
    account: req.user,
    notice: req.flash("notice"),
  });
}

/* ======================================
 * UPDATE ACCOUNT VIEW (uses JWT user)
 * ====================================== */
async function buildUpdateAccount(req, res, next) {
  try {
    if (!req.user) {
      req.flash("notice", "Please log in first.");
      return res.redirect("/account/login");
    }

    // Optionally refresh from DB to get latest data
    const freshAccount = await accountModel.getAccountById(req.user.account_id);
    const accountData = freshAccount || req.user;

    res.render("account/update-account", {
      title: "Update Account",
      nav: await utilities.getNav(),
      errors: null,
      account: accountData,
      notice: req.flash("notice"),
    });
  } catch (err) {
    next(err);
  }
}

/* ======================================
 * UPDATE ACCOUNT INFO (updates DB, refreshes JWT & session)
 * ====================================== */
async function updateAccount(req, res, next) {
  try {
    const account_id = req.user.account_id;
    const { account_firstname, account_lastname, account_email } = req.body;

    // Call model with correct positional arguments
    const updatedAccount = await accountModel.updateAccount(
      account_id,
      account_firstname,
      account_lastname,
      account_email
    );

    if (!updatedAccount) {
      req.flash("notice", "Update failed. Please try again.");
      return res.redirect("/account/update");
    }

    // Refresh session data (if you still use session)
    req.session.accountData = updatedAccount;

    // Create new JWT token with updated data
    const newToken = jwt.sign(
      {
        account_id: updatedAccount.account_id,
        account_firstname: updatedAccount.account_firstname,
        account_lastname: updatedAccount.account_lastname,
        account_email: updatedAccount.account_email,
        account_type: updatedAccount.account_type,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("jwt", newToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
    });

    req.flash("notice", "Account updated successfully.");
    return res.redirect("/account/");
  } catch (err) {
    next(err);
  }
}

/* ======================================
 * UPDATE PASSWORD (changes password, redirects to dashboard)
 * ====================================== */
async function updatePassword(req, res, next) {
  try {
    const account_id = req.user.account_id;
    const { account_password, account_password_confirm } = req.body;

    if (account_password !== account_password_confirm) {
      req.flash("notice", "Passwords do not match.");
      return res.redirect("/account/update");
    }

    const hashedPassword = await bcrypt.hash(account_password, 10);
    await accountModel.updatePassword(account_id, hashedPassword);

    req.flash("notice", "Password updated successfully.");
    return res.redirect("/account/");
  } catch (err) {
    next(err);
  }
}

/* ======================================
 * LOGOUT (clears JWT cookie and destroys session)
 * ====================================== */
function accountLogout(req, res) {
  res.clearCookie("jwt"); //   match cookie name
  req.flash("notice", "You have been logged out.");
  return res.redirect("/");
}

/* ======================================
 * EXPORTS
 * ====================================== */
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