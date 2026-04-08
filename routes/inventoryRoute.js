const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const { body } = require("express-validator");
const utilities = require("../utilities/");
const { verifyToken, requireRole } = utilities;

// Validation rules (must be defined before use)
const inventoryValidationRules = [
  body("inv_make").trim().isLength({ min: 3 }).withMessage("Make required"),
  body("inv_model").trim().isLength({ min: 3 }).withMessage("Model required"),
  body("inv_year").isInt({ min: 1900, max: new Date().getFullYear() + 2 }).withMessage("Valid year required"),
  body("inv_description").trim().isLength({ min: 10 }).withMessage("Description too short"),
  body("inv_image").trim().isLength({ min: 6 }).withMessage("Image path required"),
  body("inv_thumbnail").trim().isLength({ min: 6 }).withMessage("Thumbnail path required"),
  body("inv_price").isFloat({ min: 0 }).withMessage("Price must be positive"),
  body("inv_miles").isInt({ min: 0 }).withMessage("Miles must be positive"),
  body("inv_color").trim().isLength({ min: 3 }).withMessage("Color required"),
  body("classification_id").isInt({ min: 1 }).withMessage("Classification required"),
];

/* PUBLIC ROUTES (no login required) */
router.get("/", utilities.handleErrors(inventoryController.buildManagement));
router.get("/type/:classificationName", utilities.handleErrors(inventoryController.buildByClassificationName));
router.get("/detail/:invId", utilities.handleErrors(inventoryController.buildByInvId));

/* PROTECTED ROUTES (Admin/Employee only) */
router.get("/add-classification", verifyToken, requireRole(["Admin", "Employee"]), utilities.handleErrors(inventoryController.buildAddClassification));
router.post("/add-classification", verifyToken, requireRole(["Admin", "Employee"]),
  body("classification_name").trim().isLength({ min: 1 }).withMessage("Classification name required.").matches(/^[A-Za-z0-9]+$/).withMessage("No spaces or special characters."),
  utilities.handleErrors(inventoryController.registerClassification)
);

router.get("/edit-vehicle/:invId", verifyToken, requireRole(["Admin", "Employee"]), utilities.handleErrors(inventoryController.editVehicleView));
router.post("/edit-vehicle", verifyToken, requireRole(["Admin", "Employee"]), inventoryValidationRules, utilities.handleErrors(inventoryController.updateInventory));

router.post("/delete-vehicle", verifyToken, requireRole(["Admin", "Employee"]), utilities.handleErrors(inventoryController.deleteInventory));

router.get("/add-inventory", verifyToken, requireRole(["Admin", "Employee"]), utilities.handleErrors(inventoryController.buildAddInventory));
router.post("/add-inventory", verifyToken, requireRole(["Admin", "Employee"]), inventoryValidationRules, utilities.handleErrors(inventoryController.registerInventory));

module.exports = router;