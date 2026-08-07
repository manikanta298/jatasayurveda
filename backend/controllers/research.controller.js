const crudFactory = require("../utils/crudFactory");
const ResearchItem = require("../models/ResearchItem");

const crud = crudFactory(ResearchItem, {
  searchFields: ["title", "summary"],
  filterableFields: ["year", "isPublished"],
  publicFilter: () => ({ isPublished: true }),
  defaultSort: "-year sortOrder",
});

module.exports = crud;
