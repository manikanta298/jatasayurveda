const crudFactory = require("../utils/crudFactory");
const BlogPost = require("../models/BlogPost");

const crud = crudFactory(BlogPost, {
  slugField: "slug",
  searchFields: ["title", "excerpt", "tags"],
  filterableFields: ["status"],
  publicFilter: () => ({ status: "published" }),
  defaultSort: "-publishedAt",
});

module.exports = crud;
