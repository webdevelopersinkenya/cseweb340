const pool = require("../database"); // adjust path if needed

/* *****************************
 * Register a new account
 ***************************** */
async function registerAccount(firstname, lastname, email, hashedPassword, account_type = 'Client') {
  const sql = `
    INSERT INTO account 
      (account_firstname, account_lastname, account_email, account_password, account_type) 
    VALUES ($1, $2, $3, $4, $5)
    RETURNING account_id, account_firstname, account_lastname, account_email, account_type
  `;
  const result = await pool.query(sql, [firstname, lastname, email, hashedPassword, account_type]);
  return result.rows[0];
}

/* *****************************
 * Check if email exists
 ***************************** */
async function checkExistingEmail(account_email) {
  const sql = `SELECT account_id FROM account WHERE account_email = $1`;
  const result = await pool.query(sql, [account_email]);
  return result.rows.length > 0;
}

/* *****************************
 * Get account by email (for login)
 ***************************** */
async function getAccountByEmail(account_email) {
  const sql = `
    SELECT account_id, account_firstname, account_lastname, account_email, account_password, account_type
    FROM account
    WHERE account_email = $1
  `;
  const result = await pool.query(sql, [account_email]);
  return result.rows[0] || null;
}

/* *****************************
 * Get account by ID (for update forms)
 ***************************** */
async function getAccountById(account_id) {
  const sql = `
    SELECT account_id, account_firstname, account_lastname, account_email, account_type
    FROM account
    WHERE account_id = $1
  `;
  const result = await pool.query(sql, [account_id]);
  return result.rows[0] || null;
}

/* *****************************
 * Update account info (returns updated row)
 ***************************** */
async function updateAccount(account_id, firstname, lastname, email) {
  const sql = `
    UPDATE account 
    SET account_firstname = $1, account_lastname = $2, account_email = $3 
    WHERE account_id = $4 
    RETURNING account_id, account_firstname, account_lastname, account_email, account_type
  `;
  const result = await pool.query(sql, [firstname, lastname, email, account_id]);
  return result.rows[0];
}

/* *****************************
 * Update password (no return needed)
 ***************************** */
async function updatePassword(account_id, hashedPassword) {
  const sql = `UPDATE account SET account_password = $1 WHERE account_id = $2`;
  await pool.query(sql, [hashedPassword, account_id]);
}

module.exports = {
  registerAccount,
  checkExistingEmail,
  getAccountByEmail,
  getAccountById,
  updateAccount,
  updatePassword,
};