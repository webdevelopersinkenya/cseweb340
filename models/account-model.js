const pool = require("../database/index"); // ✅ make sure this matches your project structure

/* *****************************
 * Register a new account
 ***************************** */
async function registerAccount(
  firstname,
  lastname,
  email,
  password,
  account_type = "user"
) {
  const sql = `
    INSERT INTO accounts 
    (account_firstname, account_lastname, account_email, account_password, account_type)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const result = await pool.query(sql, [
    firstname,
    lastname,
    email,
    password,
    account_type,
  ]);

  return result.rows[0];
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
async function updateAccount({
  account_id,
  account_firstname,
  account_lastname,
  account_email,
}) {
  try {
    const sql = `
      UPDATE accounts
      SET account_firstname = $1,
          account_lastname = $2,
          account_email = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE account_id = $4
      RETURNING *;
    `;

    const result = await pool.query(sql, [
      account_firstname,
      account_lastname,
      account_email,
      account_id,
    ]);

    return result.rows[0];
  } catch (error) {
    console.error("updateAccount error:", error);
    throw error;
  }
}

/* *****************************
 * Update password
 ***************************** */
async function updatePassword(account_id, hashedPassword) {
  try {
    const sql = `
      UPDATE accounts
      SET account_password = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE account_id = $2
      RETURNING *;
    `;

    const result = await pool.query(sql, [hashedPassword, account_id]);

    return result.rows[0];
  } catch (error) {
    console.error("updatePassword error:", error);
    throw error;
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