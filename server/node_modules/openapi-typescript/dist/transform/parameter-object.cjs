'use strict';

const ts = require('../lib/ts.cjs');
const schemaObject = require('./schema-object.cjs');

function transformParameterObject(parameterObject, options) {
  return parameterObject.schema ? schemaObject.default(parameterObject.schema, options) : ts.STRING;
}

module.exports = transformParameterObject;
//# sourceMappingURL=parameter-object.cjs.map
