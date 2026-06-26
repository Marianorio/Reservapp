const AppError = require('../utils/AppError');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError(errors.map((e) => e.message).join('. '), 422));
    }
    req[source] = result.data;
    next();
  };
};

module.exports = validate;
