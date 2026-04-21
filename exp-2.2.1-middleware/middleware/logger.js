/**
 * Custom Logging Middleware
 * Logs method, URL, status code, response time, and IP for every request.
 */
const logger = (req, res, next) => {
  const start = Date.now();

  // Intercept res.send to capture status code after response
  const originalSend = res.send.bind(res);
  res.send = function (body) {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;

    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | ${duration}ms | IP: ${ip}`
    );

    return originalSend(body);
  };

  next();
};

module.exports = logger;
