'use strict';

const ts = require('typescript');
const ts$1 = require('../lib/ts.cjs');
const utils = require('../lib/utils.cjs');
const mediaTypeObject = require('./media-type-object.cjs');
const schemaObject = require('./schema-object.cjs');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const ts__default = /*#__PURE__*/_interopDefaultCompat(ts);

function transformRequestBodyObject(requestBodyObject, options) {
  const type = [];
  for (const [contentType, mediaTypeObject$1] of utils.getEntries(requestBodyObject.content ?? {}, options.ctx)) {
    const nextPath = utils.createRef([options.path, contentType]);
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
  return ts__default.factory.createTypeLiteralNode([
    ts__default.factory.createPropertySignature(
      /* modifiers     */
      ts$1.tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      ts$1.tsPropertyIndex("content"),
      /* questionToken */
      void 0,
      /* type          */
      ts__default.factory.createTypeLiteralNode(
        type.length ? type : (
          // add `"*/*": never` if no media types are defined
          [
            ts__default.factory.createPropertySignature(
              /* modifiers     */
              void 0,
              /* name          */
              ts$1.tsPropertyIndex("*/*"),
              /* questionToken */
              ts$1.QUESTION_TOKEN,
              /* type          */
              ts$1.NEVER
            )
          ]
        )
      )
    )
  ]);
}

module.exports = transformRequestBodyObject;
//# sourceMappingURL=request-body-object.cjs.map
