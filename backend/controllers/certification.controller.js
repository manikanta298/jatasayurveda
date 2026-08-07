const crudFactory = require("../utils/crudFactory");
const Certification = require("../models/Certification");

const crud = crudFactory(Certification, {
  searchFields: ["label"],
  filterableFields: ["isVisible"],
  publicFilter: () => ({ isVisible: true }),
  defaultSort: "sortOrder",
});

module.exports = crud;
