export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const status = Number.isInteger(err?.status) ? err.status : 500;
  const error = status >= 500 ? 'Internal Server Error' : 'Request Error';
  res.status(status).json({ error, message: err.message });
};
