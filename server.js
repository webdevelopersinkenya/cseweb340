/*******************************
 * Load environment variables first
 *******************************/
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is not defined in the .env file");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the .env file");
}

/*******************************
 * Required modules
 *******************************/
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const pgSession = require("connect-pg-simple")(session);
const jwt = require("jsonwebtoken");

const app = express();

/*******************************
 * Database
 *******************************/
const pool = require("./database");

/*******************************
 * Test DB connection (safe)
 *******************************/
(async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database connected:", result.rows[0].now);
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
  }
})();

/*******************************
 * Routes (imported after dependencies)
 *******************************/
const staticRoutes = require("./routes/static");
const inventoryRoute = require("./routes/inventoryRoute");
const accountRoute = require("./routes/accountRoute");

/*******************************
 * Session Middleware (for flash messages & non‑auth data)
 *******************************/
app.use(
  session({
    store: new pgSession({
      pool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "sessionId",
  })
);

/*******************************
 * Flash messages
 *******************************/
app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.notice = req.flash("notice");
  res.locals.error = req.flash("error");
  next();
});

/*******************************
 * Cookie Parser (required for JWT)
 *******************************/
app.use(cookieParser());

/*******************************
 * JWT Middleware – decode token and attach user globally
 *******************************/
app.use((req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      res.locals.user = decoded;
    } catch (err) {
      res.clearCookie("jwt");
      res.locals.user = null;   //  ensure defined
    }
  } else {
    res.locals.user = null;     //  ensure defined
  }
  next();
});
/*******************************
 * Global view variables (based on JWT)
 *******************************/
app.use((req, res, next) => {
  res.locals.loggedin = !!res.locals.user;
  res.locals.accountData = res.locals.user || null;
  next();
});

/*******************************
 * Navigation & other utilities
 *******************************/
const utilities = require("./utilities");

app.use(async (req, res, next) => {
  try {
    res.locals.nav = await utilities.getNav();
    res.locals.currentPath = req.path;
    next();
  } catch (error) {
    next(error);
  }
});

/*******************************
 * Body Parsers & Static Files
 *******************************/
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/*******************************
 * View Engine (EJS with layouts)
 *******************************/
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "./layouts/layout");

/*******************************
 * Application Routes
 *******************************/
app.use("/", staticRoutes);
app.use("/inv", inventoryRoute);
app.use("/account", accountRoute);

/*******************************
 * 404 Error Handler (page not found)
 *******************************/
app.use(async (req, res) => {
  const nav = await utilities.getNav();
  res.status(404).render("errors/error", {
    title: "404 Not Found",
    message: "Sorry, we can't find that page.",
    nav,
    loggedin: res.locals.loggedin,
    accountData: res.locals.user,
  });
});

/*******************************
 * Global Error Handler
 *******************************/
app.use(async (err, req, res, next) => {
  const nav = await utilities.getNav();
  console.error(`❌ Server Error: ${err.message}`);
  res.status(500).render("errors/error", {
    title: "Server Error",
    message: err.message,
    nav,
    loggedin: res.locals.loggedin,
    accountData: res.locals.user,
  });
});

/*******************************
 * Start Server
 *******************************/
const port = process.env.PORT || 5500;
app.listen(port, () => {
  console.log(`🚀 App is running on http://localhost:${port}`);
});