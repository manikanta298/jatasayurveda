const crudFactory = require("../utils/crudFactory");
const ProductCategory = require("../models/ProductCategory");

const crud = crudFactory(ProductCategory, {
  slugField: "slug",
  searchFields: ["name", "description"],
  filterableFields: ["parent", "isVisible"],
  populate: [{ path: "parent", select: "name slug" }],
  publicFilter: () => ({ isVisible: true }),
  defaultSort: "sortOrder name",
});

module.exports = crud;
