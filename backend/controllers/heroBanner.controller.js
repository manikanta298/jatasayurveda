const crudFactory = require("../utils/crudFactory");
const HeroBanner = require("../models/HeroBanner");

const crud = crudFactory(HeroBanner, {
  searchFields: ["title", "subtitle"],
  filterableFields: ["isVisible"],
  publicFilter: () => ({ isVisible: true }),
  defaultSort: "sortOrder",
});

module.exports = crud;
