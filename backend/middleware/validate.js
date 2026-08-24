const ApiError = require("../utils/ApiError");

// Wraps a Joi schema into an Express middleware. Validates req[source]
// (defaults to "body"), replaces it with the sanitized/coerced value on
// success, or short-circuits with a 400 listing every failing field.
function validate(schema, source = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false, // collect every invalid field in one response
      stripUnknown: true, // drop fields the schema doesn't expect
    });

    if (error) {
      const message = error.details.map((d) => d.message).join("; ");
      return next(new ApiError(400, message));
    }

    req[source] = value;
    next();
  };
}

module.exports = validate;
