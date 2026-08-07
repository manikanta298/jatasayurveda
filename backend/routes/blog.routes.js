const express = require("express");
const attachCrudRoutes = require("./attachCrudRoutes");
const crud = require("../controllers/blog.controller");

const router = express.Router();

attachCrudRoutes(router, crud, {
  writeRoles: ["admin", "content_manager"],
});

module.exports = router;
