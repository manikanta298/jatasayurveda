const crudFactory = require("../utils/crudFactory");
const Testimonial = require("../models/Testimonial");

const crud = crudFactory(Testimonial, {
  searchFields: ["name", "role", "quote"],
  filterableFields: ["isPublished"],
  publicFilter: () => ({ isPublished: true }),
  defaultSort: "sortOrder -createdAt",
});

module.exports = crud;
