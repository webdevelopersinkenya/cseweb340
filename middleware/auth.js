function ensureLoggedIn(req, res, next) {
  if (!req.session.accountData) {
    req.flash("notice", "Please log in.");
    return res.redirect("/account/login");
  }
  next();
}

function ensureAdmin(req, res, next) {
  if (!req.session.accountData) {
    req.flash("notice", "Please log in.");
    return res.redirect("/account/login");
  }

  if (req.session.accountData.account_type !== "admin") {
    req.flash("notice", "Access denied.");
    return res.redirect("/account");
  }

  next();
}

module.exports = { ensureLoggedIn, ensureAdmin };