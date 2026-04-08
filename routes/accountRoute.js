const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities/");
const regValidate = require("../utilities/account-validation");

const { redirectIfLoggedIn, verifyToken } = utilities;

// Public routes
router.get("/login", redirectIfLoggedIn, utilities.handleErrors(accountController.buildLogin));
router.get("/register", redirectIfLoggedIn, utilities.handleErrors(accountController.buildRegister));
router.post("/register", redirectIfLoggedIn, regValidate.registationRules(), regValidate.checkRegData, utilities.handleErrors(accountController.registerAccount));
router.post("/login", redirectIfLoggedIn, regValidate.loginRules(), regValidate.checkLoginData, utilities.handleErrors(accountController.loginAccount));

// Protected routes (require valid JWT)
router.use(verifyToken);

router.get("/", utilities.handleErrors(accountController.buildAccountManagement));
router.get("/update", utilities.handleErrors(accountController.buildUpdateAccount));
router.post("/update", regValidate.updateAccountRules(), regValidate.checkUpdateData, utilities.handleErrors(accountController.updateAccount));
router.post("/updatePassword", regValidate.changePasswordRules(), regValidate.checkPasswordData, utilities.handleErrors(accountController.updatePassword));
router.get("/logout", utilities.handleErrors(accountController.accountLogout));

module.exports = router;