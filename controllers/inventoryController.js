const inventoryModel = require("../models/inventory-model");
const utilities = require("../utilities");
const { validationResult } = require("express-validator");

/* ***************************
 * Build inventory by classification (public)
 ***************************** */
async function buildByClassificationName(req, res, next) {
  try {
    const classificationName = req.params.classificationName;
    const classificationData = await inventoryModel.getClassificationByName(classificationName);
    if (!classificationData) {
      return res.render("inventory/classification", {
        title: `${classificationName} Vehicles`,
        classificationName,
        vehicles: [],
        nav: await utilities.getNav(),
        flashMessage: req.flash("notice"),
      });
    }
    const classificationId = classificationData.classification_id;
    const data = await inventoryModel.getInventoryByClassificationId(classificationId);
    const vehicles = data.rows || [];
    res.render("inventory/classification", {
      title: `${classificationName} Vehicles`,
      classificationName,
      vehicles,
      nav: await utilities.getNav(),
      flashMessage: req.flash("notice"),
    });
  } catch (error) {
    next(error);
  }
}

/* ***************************
 * Build single inventory item detail view (public)
 ***************************** */
async function buildByInvId(req, res, next) {
  try {
    const invId = parseInt(req.params.invId);
    if (isNaN(invId)) throw new Error("Invalid inventory ID");
    const vehicle = await inventoryModel.getInventoryById(invId);
    if (!vehicle) throw new Error("Vehicle not found");
    res.render("inventory/detail", {
      title: `${vehicle.inv_make} ${vehicle.inv_model}`,
      nav: await utilities.getNav(),
      vehicle,
      flashMessage: req.flash("notice"),
    });
  } catch (error) {
    next(error);
  }
}

/* ***************************
 * Inventory management dashboard (protected)
 ***************************** */
async function buildManagement(req, res, next) {
  try {
    const vehicles = await inventoryModel.getAllInventory(); // you may need to implement this
    res.render("inventory/management", {
      title: "Inventory Management",
      nav: await utilities.getNav(),
      vehicles: vehicles || [],
      flashMessage: req.flash("notice"),
    });
  } catch (error) {
    next(error);
  }
}

/* ***************************
 * Add Classification Form (protected)
 ***************************** */
async function buildAddClassification(req, res, next) {
  try {
    res.render("inventory/add-classification", {
      title: "Add New Classification",
      nav: await utilities.getNav(),
      errors: null,
      classification_name: "",
      flashMessage: req.flash("notice"),
    });
  } catch (error) {
    next(error);
  }
}

/* ***************************
 * Process Add Classification (protected)
 ***************************** */
async function registerClassification(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render("inventory/add-classification", {
      title: "Add New Classification",
      nav: await utilities.getNav(),
      errors: errors.array(),
      classification_name: req.body.classification_name,
      flashMessage: req.flash("notice"),
    });
  }
  try {
    const result = await inventoryModel.addClassification(req.body.classification_name);
    if (result) {
      req.flash("notice", `Classification "${req.body.classification_name}" added.`);
      return res.redirect("/inv/");
    }
    throw new Error("Insert failed");
  } catch (error) {
    next(error);
  }
}

/* ***************************
 * Add Inventory Form (protected)
 ***************************** */
async function buildAddInventory(req, res, next) {
  try {
    const classifications = await inventoryModel.getClassifications();
    res.render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav: await utilities.getNav(),
      classifications,
      errors: null,
      flashMessage: req.flash("notice"),
      vehicle: {}, // empty for sticky
    });
  } catch (error) {
    next(error);
  }
}

/* ***************************
 * Process Add Inventory (protected)
 ***************************** */
async function registerInventory(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const classifications = await inventoryModel.getClassifications();
    return res.status(400).render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav: await utilities.getNav(),
      classifications,
      errors: errors.array(),
      flashMessage: req.flash("notice"),
      vehicle: req.body, // sticky
    });
  }
  try {
    const result = await inventoryModel.addInventory(req.body);
    if (result) {
      req.flash("notice", `Vehicle "${req.body.inv_make} ${req.body.inv_model}" added.`);
      return res.redirect("/inv/");
    }
    throw new Error("Insert failed");
  } catch (error) {
    next(error);
  }
}

/* ***************************
 * Edit Vehicle Form (protected)
 ***************************** */
async function editVehicleView(req, res, next) {
  try {
    const invId = parseInt(req.params.invId);
    const vehicle = await inventoryModel.getInventoryById(invId);
    if (!vehicle) throw new Error("Vehicle not found");
    const classifications = await inventoryModel.getClassifications();
    res.render("inventory/edit-vehicle", {
      title: `Edit ${vehicle.inv_make} ${vehicle.inv_model}`,
      nav: await utilities.getNav(),
      vehicle,
      classifications,
      errors: null,
      flashMessage: req.flash("notice"),
    });
  } catch (error) {
    next(error);
  }
}

/* ***************************
 * Process Update Vehicle (protected)
 ***************************** */
async function updateInventory(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const classifications = await inventoryModel.getClassifications();
    return res.status(400).render("inventory/edit-vehicle", {
      title: "Edit Vehicle",
      nav: await utilities.getNav(),
      vehicle: req.body,
      classifications,
      errors: errors.array(),
      flashMessage: req.flash("notice"),
    });
  }
  try {
    const invId = req.params.invId || req.body.inv_id;
    const result = await inventoryModel.updateInventory(invId, req.body);
    if (result) {
      req.flash("notice", `Vehicle updated.`);
      return res.redirect(`/inv/detail/${invId}`);
    }
    throw new Error("Update failed");
  } catch (error) {
    next(error);
  }
}

/* ***************************
 * Process Delete Vehicle (protected)
 ***************************** */
async function deleteInventory(req, res, next) {
  try {
    const invId = req.body.inv_id;
    const result = await inventoryModel.deleteInventory(invId);
    if (result) {
      req.flash("notice", "Vehicle deleted.");
      return res.redirect("/inv/");
    }
    throw new Error("Delete failed");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  buildByClassificationName,
  buildByInvId,
  buildManagement,
  buildAddClassification,
  registerClassification,
  buildAddInventory,
  registerInventory,
  editVehicleView,
  updateInventory,
  deleteInventory,
};