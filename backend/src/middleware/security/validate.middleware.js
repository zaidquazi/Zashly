/**
 * Joi validation wrapper — validates body, query, and params before controllers run.
 */
export function validate(schema) {
  return (req, res, next) => {
    const toValidate = {
      body: req.body,
      query: req.query,
      params: req.params,
    };

    const { error, value } = schema.validate(toValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message.replace(/"/g, "'"));
      return res.status(400).json({
        message: "Validation failed",
        errors: messages,
      });
    }

    if (value.body) req.body = value.body;
    if (value.query) req.query = value.query;
    if (value.params) req.params = value.params;
    next();
  };
}
