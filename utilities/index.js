const jwt = require("jsonwebtoken");
const inventoryModel = require("../models/inventory-model");

// Navigation
async function getNav() {
  let navList = "<ul><li><a href='/'>Home</a></li>";
  try {
    const classifications = await inventoryModel.getClassifications();
    for (const cls of classifications) {
      navList += `<li><a href="/inv/type/${cls.classification_name}">${cls.classification_name}</a></li>`;
    }
  } catch (error) {
    console.error("Nav error:", error.message);
  }
  navList += "</ul>";
  return navList;
}

// Error handler wrapper
function handleErrors(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      account_id: user.account_id,
      account_firstname: user.account_firstname,
      account_lastname: user.account_lastname,
      account_email: user.account_email,
      account_type: user.account_type,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

// Verify JWT from cookie
function verifyToken(req, res, next) {
  const token = req.cookies.jwt;
  if (!token) {
    req.flash("notice", "Please log in.");
    return res.redirect("/account/login");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    res.locals.user = decoded;
    next();
  } catch (err) {
    res.clearCookie("jwt");
    req.flash("notice", "Session expired. Please log in again.");
    return res.redirect("/account/login");
  }
}

// Redirect if already logged in
function redirectIfLoggedIn(req, res, next) {
  const token = req.cookies.jwt;
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return res.redirect("/account/");
    } catch (err) {}
  }
  next();
}

// Role-based access
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      req.flash("notice", "Please log in.");
      return res.redirect("/account/login");
    }
    if (roles.includes(req.user.account_type)) return next();
    req.flash("error", "Access denied.");
    return res.redirect("/account/");
  };
}

// Backward compatibility (optional)
function checkLogin(req, res, next) {
  if (req.cookies.jwt) return next();
  req.flash("notice", "Please log in.");
  return res.redirect("/account/login");
}
function checkLogout(req, res, next) {
  if (!req.cookies.jwt) return next();
  return res.redirect("/account/");
}

// Build classification dropdown
async function buildClassificationList(selectedId = null) {
  const classifications = await inventoryModel.getClassifications();
  let list = '<select name="classification_id" id="classification_id" required>';
  list += '<option value="">Choose a classification</option>';
  for (const cls of classifications) {
    list += `<option value="${cls.classification_id}" ${selectedId == cls.classification_id ? 'selected' : ''}>${cls.classification_name}</option>`;
  }
  list += '</select>';
  return list;
}

// Build grid of vehicles (for classification view)
function buildClassificationGrid(vehicles) {
  if (!vehicles || vehicles.length === 0) return "<p>No vehicles found.</p>";
  let grid = '<div class="vehicle-grid">';
  for (const v of vehicles) {
    grid += `
      <div class="vehicle-card">
        <a href="/inv/detail/${v.inv_id}">
          <img src="${v.inv_thumbnail}" alt="${v.inv_make} ${v.inv_model}">
          <h3>${v.inv_make} ${v.inv_model}</h3>
          <p>$${v.inv_price}</p>
        </a>
      </div>
    `;
  }
  grid += '</div>';
  return grid;
}

module.exports = {
  getNav,
  handleErrors,
  generateToken,
  verifyToken,
  redirectIfLoggedIn,
  requireRole,
  checkLogin,
  checkLogout,
  buildClassificationList,
  buildClassificationGrid,
};