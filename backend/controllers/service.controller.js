const crudFactory = require("../utils/crudFactory");
const Service = require("../models/Service");

const crud = crudFactory(Service, {
  slugField: "slug",
  searchFields: ["name", "shortDescription", "symptoms", "benefits"],
  filterableFields: ["status", "isEnabled"],
  populate: [{ path: "relatedProducts", select: "name slug featuredImageUrl pricePaise discountPricePaise" }],
  publicFilter: () => ({ status: "published", isEnabled: true }),
  defaultSort: "sortOrder -createdAt",
});

module.exports = crud;
