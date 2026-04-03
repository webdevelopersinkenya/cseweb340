const accountModel = require("../models/account-model");
const utilities = require("../utilities/");
const bcrypt = require("bcryptjs");

/* ****************************************
 * Deliver Login View
 **************************************** */
async function buildLogin(req, res) {
  res.render("account/login", {
    title: "Login",
    nav: await utilities.getNav(),
    errors: null,
    account_email: "",
    notice: req.flash("notice"),
  });
}

/* ****************************************
 * Deliver Registration View
 **************************************** */
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

/* ****************************************
 * Process Registration
 **************************************** */
async function registerAccount(req, res) {
  const { account_firstname, account_lastname, account_email, account_password } = req.body;

  try {
    const emailExists = await accountModel.checkExistingEmail(account_email);
    if (emailExists) {
      req.flash("notice", "Email already exists. Please login or use a different email.");
      return res.redirect("/account/register");
    }

    //  NEW: Count existing users
    const accountCount = await accountModel.getAccountCount();

    //  First user becomes Admin
    let account_type = "user";
    if (accountCount === 0) {
      account_type = "Admin";
    }

    const hashedPassword = await bcrypt.hash(account_password, 10);

    await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword,
      account_type //  NOW INCLUDED
    );

    req.flash("notice", `Congratulations ${account_firstname}, you are now registered. Please log in.`);
    return res.redirect("/account/login");

  } catch (error) {
    console.error("Registration error:", error);
    req.flash("notice", "Sorry, there was an error processing your registration.");
    return res.redirect("/account/register");
  }
}

/* ****************************************
 * Process Login
 **************************************** */
async function loginAccount(req, res) {
  const { account_email, account_password } = req.body;

  try {
    const user = await accountModel.getAccountByEmail(account_email);

    if (!user) {
      req.flash("notice", "Invalid email or password");
      return res.redirect("/account/login");
    }

    const isMatch = await bcrypt.compare(
      account_password,
      user.account_password
    );

    if (!isMatch) {
      req.flash("notice", "Invalid email or password");
      return res.redirect("/account/login");
    }

    // ✅ FIXED SESSION (THIS IS THE CRITICAL PART)
    req.session.loggedin = true;

    req.session.accountData = {
      account_id: user.account_id,
      account_firstname: user.account_firstname,
      account_lastname: user.account_lastname,
      account_email: user.account_email,
      account_type: user.account_type
    };

    req.flash("notice", "Login successful!");

    return res.redirect("/account");

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Server error");
  }
}

/* ****************************************
 * Deliver Account Management View
 **************************************** */
async function buildAccountManagement(req, res) {
  const accountData = req.session.accountData;
  res.render("account/account", {
    title: "Account Dashboard",
    nav: await utilities.getNav(),
    errors: null,
    account: accountData,
    notice: req.flash("notice"),
  });
}

/* ****************************************
 * Deliver Account Update Form (GET)
 **************************************** */
async function buildUpdateAccount(req, res, next) {
  try {
    const account_id = req.session.accountData.account_id;
    const accountData = await accountModel.getAccountById(account_id);
    const account = accountData || {};

    res.render("account/update-account", {
      title: "Update Account",
      errors: null,
      account,
      notice: req.flash("notice"),
    });
  } catch (err) {
    next(err);
  }
}

/* ****************************************
 * Process Account Profile Update (POST)
 **************************************** */
async function updateAccount(req, res, next) {
  try {
    const account_id = req.session.accountData.account_id;
    const { account_firstname, account_lastname, account_email } = req.body;

    if (!account_firstname || !account_lastname || !account_email) {
      req.flash("notice", "All fields are required.");
      return res.redirect("/account/update");
    }

    await accountModel.updateAccount({ account_id, account_firstname, account_lastname, account_email });

    req.session.accountData = await accountModel.getAccountById(account_id);
    req.flash("notice", "Account updated successfully.");
    return res.redirect("/account/update");
  } catch (err) {
    next(err);
  }
}

/* ****************************************
 * Process Password Update (POST)
 **************************************** */
async function updatePassword(req, res, next) {
  try {
    const account_id = req.session.accountData.account_id;
    const { account_password, account_password_confirm } = req.body;

    if (!account_password || !account_password_confirm) {
      req.flash("notice", "Both password fields are required.");
      return res.redirect("/account/update");
    }

    if (account_password !== account_password_confirm) {
      req.flash("notice", "Passwords do not match.");
      return res.redirect("/account/update");
    }

    const hashedPassword = await bcrypt.hash(account_password, 10);
    await accountModel.updatePassword(account_id, hashedPassword);

    req.session.accountData = await accountModel.getAccountById(account_id);
    req.flash("notice", "Password updated successfully.");
    return res.redirect("/account/update");
  } catch (err) {
    next(err);
  }
}

/* ****************************************
 * Process Logout
 **************************************** */
async function accountLogout(req, res) {
  req.flash("notice", "You have been logged out.");

  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.redirect("/");
    }

    return res.redirect("/");
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
