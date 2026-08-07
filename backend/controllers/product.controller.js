const crudFactory = require("../utils/crudFactory");
const Product = require("../models/Product");

const crud = crudFactory(Product, {
  slugField: "slug",
  searchFields: ["name", "shortDescription", "tags"],
  filterableFields: ["category", "status", "isEnabled"],
  populate: [{ path: "category" }, { path: "relatedProducts", select: "name slug featuredImageUrl pricePaise discountPricePaise" }],
  publicFilter: () => ({ status: "published", isEnabled: true }),
  defaultSort: "sortOrder -createdAt",
});

module.exports = crud;
