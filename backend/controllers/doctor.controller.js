const crudFactory = require("../utils/crudFactory");
const Doctor = require("../models/Doctor");

const crud = crudFactory(Doctor, {
  searchFields: ["name", "role", "bio"],
  filterableFields: ["isVisible"],
  publicFilter: () => ({ isVisible: true }),
  defaultSort: "sortOrder",
});

module.exports = crud;
