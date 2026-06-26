const sanitizeHtml = require('sanitize-html');

const sanitize = (req, _res, next) => {
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key], {
          allowedTags: [],
          allowedAttributes: {},
        }).trim();
      }
    }
  }
  next();
};

module.exports = sanitize;
