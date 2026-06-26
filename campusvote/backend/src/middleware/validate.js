function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details.map((d) => d.message).join(', '),
        code: 'VALIDATION_ERROR',
      });
    }
    next();
  };
}

module.exports = { validate };
