const pool = require("../database/index"); // ✅ make sure this matches your project structure

/* *****************************
 * Register a new account
 ***************************** */
async function registerAccount(firstname, lastname, email, hashedPassword, account_type) {
  const sql = `
    INSERT INTO account 
      (account_firstname, account_lastname, account_email, account_password, account_type) 
    VALUES ($1, $2, $3, $4, $5)
    RETURNING account_id, account_firstname, account_lastname, account_email, account_type
  `;
  const result = await pool.query(sql, [firstname, lastname, email, hashedPassword, account_type]);
  return result.rows[0];   // returns the full new account object
}

/* *****************************
 * Get total account count
 ***************************** */
async function getAccountCount() {
  const result = await pool.query("SELECT COUNT(*) FROM accounts");
  return parseInt(result.rows[0].count);
}

/* *****************************
 * Check if email exists
 ***************************** */
async function checkExistingEmail(account_email) {
  try {
    const sql = `
      SELECT COUNT(*) 
      FROM accounts 
      WHERE account_email = $1
    `;

    const result = await pool.query(sql, [account_email]);
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error("checkExistingEmail error:", error);
    return false;
  }
}

/* *****************************
 * Get account by email (LOGIN)
 ***************************** */
async function getAccountByEmail(account_email) {
  try {
    const sql = `
      SELECT 
        account_id,
        account_firstname,
        account_lastname,
        account_email,
        account_password,
        account_type
      FROM accounts
      WHERE account_email = $1;
    `;

    const result = await pool.query(sql, [account_email]);

    // ✅ IMPORTANT: safe return
    return result.rows[0] || null;
  } catch (error) {
    console.error("getAccountByEmail error:", error);
    return null;
  }
}

/* *****************************
 * Get account by ID
 ***************************** */
async function getAccountById(account_id) {
  try {
    const sql = `
      SELECT 
        account_id,
        account_firstname,
        account_lastname,
        account_email,
        account_type
      FROM accounts
      WHERE account_id = $1;
    `;

    const result = await pool.query(sql, [account_id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("getAccountById error:", error);
    return null;
  }
}

/* *****************************
 * Update account info
 ***************************** */
async function updateAccount(account_id, firstname, lastname, email) {
  const sql = `
    UPDATE account 
    SET account_firstname = $1, account_lastname = $2, account_email = $3 
    WHERE account_id = $4 
    RETURNING *
  `;
  const result = await pool.query(sql, [firstname, lastname, email, account_id]);
  return result.rows[0];
}
/* *****************************
 * Update password
 ***************************** */
async function updatePassword(account_id, hashedPassword) {
  const sql = `UPDATE account SET account_password = $1 WHERE account_id = $2`;
  await pool.query(sql, [hashedPassword, account_id]);
}

async function getAccountById(account_id) {
  try {
    const sql = "SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password FROM account WHERE account_id = $1";
    const result = await pool.query(sql, [account_id]);
    console.log("getAccountById result:", result.rows[0]); // debug
    return result.rows[0];
  } catch (error) {
    console.error("Error in getAccountById:", error);
    return null;
  }
}
module.exports = {
  registerAccount,
  checkExistingEmail,
  getAccountByEmail,
  getAccountById,
  updateAccount,
  updatePassword,
};