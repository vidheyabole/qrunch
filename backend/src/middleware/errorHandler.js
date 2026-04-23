const errorHandler = (err, req, res, next) => {
  const status = err.status || (res.statusCode === 200 ? 500 : res.statusCode);
  console.error(err.stack || err.message);
  res.status(status).json({ message: err.message || 'Internal server error' });
};

module.exports = errorHandler;