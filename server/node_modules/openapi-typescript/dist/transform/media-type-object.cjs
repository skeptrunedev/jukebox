'use strict';

const ts = require('../lib/ts.cjs');
const schemaObject = require('./schema-object.cjs');

function transformMediaTypeObject(mediaTypeObject, options) {
  if (!mediaTypeObject.schema) {
    return ts.UNKNOWN;
  }
  return schemaObject.default(mediaTypeObject.schema, options);
}

module.exports = transformMediaTypeObject;
//# sourceMappingURL=media-type-object.cjs.map
