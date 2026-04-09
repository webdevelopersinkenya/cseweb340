const pool = require("../database");

// Get all inventory items (for management dashboard)
async function getAllInventory() {
  const sql = `
    SELECT i.*, c.classification_name 
    FROM inventory i 
    JOIN classification c ON i.classification_id = c.classification_id 
    ORDER BY i.inv_id
  `;
  const result = await pool.query(sql);
  return result.rows;
}

// Get inventory by ID
async function getInventoryById(inv_id) {
  const sql = `
    SELECT i.*, c.classification_name 
    FROM inventory i 
    JOIN classification c ON i.classification_id = c.classification_id 
    WHERE i.inv_id = $1
  `;
  const result = await pool.query(sql, [inv_id]);
  return result.rows[0];
}

// Get classification by name
async function getClassificationByName(classificationName) {
  const sql = "SELECT * FROM classification WHERE classification_name = $1";
  const result = await pool.query(sql, [classificationName]);
  return result.rows[0];
}

// Get inventory by classification ID
async function getInventoryByClassificationId(classificationId) {
  const sql = `
    SELECT i.*, c.classification_name 
    FROM inventory i 
    JOIN classification c ON i.classification_id = c.classification_id 
    WHERE i.classification_id = $1
    ORDER BY i.inv_id
  `;
  const result = await pool.query(sql, [classificationId]);
  return result;
}

// Get all classifications
async function getClassifications() {
  const sql = "SELECT * FROM classification ORDER BY classification_name";
  const result = await pool.query(sql);
  return result.rows;
}

// Add classification
async function addClassification(classification_name) {
  const sql = "INSERT INTO classification (classification_name) VALUES ($1) RETURNING *";
  const result = await pool.query(sql, [classification_name]);
  return result.rows[0];
}

// Add inventory (accepts object)
async function addInventory(item) {
  const sql = `
    INSERT INTO inventory (inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  const result = await pool.query(sql, [
    item.inv_make, item.inv_model, item.inv_year, item.inv_description,
    item.inv_image, item.inv_thumbnail, item.inv_price, item.inv_miles,
    item.inv_color, item.classification_id
  ]);
  return result.rows[0];
}

// Update inventory
async function updateInventory(inv_id, item) {
  const sql = `
    UPDATE inventory 
    SET inv_make = $1, inv_model = $2, inv_year = $3, inv_description = $4,
        inv_image = $5, inv_thumbnail = $6, inv_price = $7, inv_miles = $8,
        inv_color = $9, classification_id = $10
    WHERE inv_id = $11
    RETURNING *
  `;
  const result = await pool.query(sql, [
    item.inv_make, item.inv_model, item.inv_year, item.inv_description,
    item.inv_image, item.inv_thumbnail, item.inv_price, item.inv_miles,
    item.inv_color, item.classification_id, inv_id
  ]);
  return result.rows[0];
}

// Delete inventory
async function deleteInventory(inv_id) {
  const sql = "DELETE FROM inventory WHERE inv_id = $1 RETURNING inv_id";
  const result = await pool.query(sql, [inv_id]);
  return result.rows[0];
}

module.exports = {
  getAllInventory,
  getInventoryById,
  getClassificationByName,
  getInventoryByClassificationId,
  getClassifications,
  addClassification,
  addInventory,
  updateInventory,
  deleteInventory,
};