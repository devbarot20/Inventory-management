'use strict';

/**
 * Middleware generator for Zod schemas.
 * Validates req.body, req.query, or req.params and passes typed/sanitised values forward.
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = validate;

