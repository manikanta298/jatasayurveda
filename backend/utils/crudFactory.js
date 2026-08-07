const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const sanitizeHtml = require("sanitize-html");
const ApiError = require("./ApiError");
const { sendSuccess } = require("./ApiResponse");

/**
 * Escapes regex metacharacters so user-supplied search text can't be used
 * to build an expensive/malicious regular expression.
 */
function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Strips dangerous HTML/JS out of rich-text fields before they are persisted.
 * Currently only BlogPost.content is rich text; extend the map below if more
 * models gain a WYSIWYG/HTML field.
 */
const RICH_TEXT_FIELDS = {
  BlogPost: ["content"],
};

function sanitizePayload(modelName, body) {
  const fields = RICH_TEXT_FIELDS[modelName];
  if (!fields) return body;

  const next = { ...body };
  for (const field of fields) {
    if (typeof next[field] === "string") {
      next[field] = sanitizeHtml(next[field], {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          "img",
          "h1",
          "h2",
          "h3",
          "h4",
          "blockquote",
          "pre",
          "code",
          "span",
        ]),
        allowedAttributes: {
          a: ["href", "name", "target", "rel"],
          img: ["src", "alt", "title"],
          span: ["class"],
          code: ["class"],
        },
        allowedSchemes: ["http", "https", "mailto"],
      });
    }
  }
  return next;
}

/**
 * Builds standard list/getOne/create/update/remove handlers for a Mongoose model.
 *
 * options:
 *  - slugField: field name used for public-facing lookups (default "slug")
 *  - searchFields: string[] fields included in ?q= regex search
 *  - filterableFields: string[] query params passed straight through to the Mongo filter
 *  - populate: string | string[] passed to .populate()
 *  - publicFilter: (req) => object — extra filter merged in for the `listPublic`/`getOnePublic` variants
 *  - defaultSort: string, default "-createdAt"
 */
function crudFactory(Model, options = {}) {
  const {
    slugField = "slug",
    searchFields = [],
    filterableFields = [],
    populate = null,
    publicFilter = () => ({}),
    defaultSort = "-createdAt",
  } = options;

  function buildFilter(req, { forcePublic = false } = {}) {
    const filter = forcePublic ? { ...publicFilter(req) } : {};

    filterableFields.forEach((field) => {
      if (req.query[field] !== undefined && req.query[field] !== "") {
        filter[field] = req.query[field];
      }
    });

    const q = String(req.query.q || "").trim().slice(0, 64);
    if (q && searchFields.length) {
      const regex = new RegExp(escapeRegExp(q), "i");
      filter.$or = searchFields.map((f) => ({ [f]: regex }));
    }

    return filter;
  }

  function applyPopulate(query) {
    return populate ? query.populate(populate) : query;
  }

  const list = (forcePublic = false) =>
    asyncHandler(async (req, res) => {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
      const filter = buildFilter(req, { forcePublic });
      const sort = req.query.sort || defaultSort;

      const [items, total] = await Promise.all([
        applyPopulate(
          Model.find(filter)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
        ),
        Model.countDocuments(filter),
      ]);

      return sendSuccess(res, 200, items, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      });
    });

  const getOne = (forcePublic = false) =>
    asyncHandler(async (req, res) => {
      const { idOrSlug } = req.params;
      const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
      const lookup = isObjectId ? { _id: idOrSlug } : { [slugField]: idOrSlug };
      const filter = forcePublic ? { ...lookup, ...publicFilter(req) } : lookup;

      const doc = await applyPopulate(Model.findOne(filter));
      if (!doc) throw new ApiError(404, `${Model.modelName} not found`);
      return sendSuccess(res, 200, doc);
    });

  const create = asyncHandler(async (req, res) => {
    const doc = await Model.create(sanitizePayload(Model.modelName, req.body));
    return sendSuccess(res, 201, doc);
  });

  const update = asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const lookup = isObjectId ? { _id: idOrSlug } : { [slugField]: idOrSlug };

    const doc = await Model.findOneAndUpdate(
      lookup,
      sanitizePayload(Model.modelName, req.body),
      { new: true, runValidators: true }
    );
    if (!doc) throw new ApiError(404, `${Model.modelName} not found`);
    return sendSuccess(res, 200, doc);
  });

  const remove = asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const lookup = isObjectId ? { _id: idOrSlug } : { [slugField]: idOrSlug };

    const doc = await Model.findOneAndDelete(lookup);
    if (!doc) throw new ApiError(404, `${Model.modelName} not found`);
    return sendSuccess(res, 200, { deleted: true, id: doc._id });
  });

  return { list, getOne, create, update, remove };
}

module.exports = crudFactory;
