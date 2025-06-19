'use strict';

const refUtils_js = require('@redocly/openapi-core/lib/ref-utils.js');
const ts = require('typescript');
const ts$1 = require('../lib/ts.cjs');
const utils = require('../lib/utils.cjs');
const mediaTypeObject = require('./media-type-object.cjs');
const schemaObject = require('./schema-object.cjs');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const ts__default = /*#__PURE__*/_interopDefaultCompat(ts);

function transformHeaderObject(headerObject, options) {
  if (headerObject.schema) {
    return schemaObject.default(headerObject.schema, options);
  }
  if (headerObject.content) {
    const type = [];
    for (const [contentType, mediaTypeObject$1] of utils.getEntries(headerObject.content ?? {}, options.ctx)) {
      const nextPath = `${options.path ?? "#"}/${refUtils_js.escapePointer(contentType)}`;
      const mediaType = "$ref" in mediaTypeObject$1 ? schemaObject.default(mediaTypeObject$1, {
        ...options,
        path: nextPath
      }) : mediaTypeObject(mediaTypeObject$1, {
        ...options,
        path: nextPath
      });
      const property = ts__default.factory.createPropertySignature(
        /* modifiers     */
        ts$1.tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        ts$1.tsPropertyIndex(contentType),
        /* questionToken */
        void 0,
        /* type          */
        mediaType
      );
      ts$1.addJSDocComment(mediaTypeObject$1, property);
      type.push(property);
    }
    return ts__default.factory.createTypeLiteralNode(type);
  }
  return ts$1.UNKNOWN;
}

module.exports = transformHeaderObject;
//# sourceMappingURL=header-object.cjs.map
