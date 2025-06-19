'use strict';

const ts$1 = require('typescript');
const ts = require('../lib/ts.cjs');
const utils = require('../lib/utils.cjs');
const headerObject = require('./header-object.cjs');
const mediaTypeObject = require('./media-type-object.cjs');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const ts__default = /*#__PURE__*/_interopDefaultCompat(ts$1);

function transformResponseObject(responseObject, options) {
  const type = [];
  const headersObject = [];
  if (responseObject.headers) {
    for (const [name, headerObject$1] of utils.getEntries(responseObject.headers, options.ctx)) {
      const optional = "$ref" in headerObject$1 || headerObject$1.required ? void 0 : ts.QUESTION_TOKEN;
      const subType = "$ref" in headerObject$1 ? ts.oapiRef(headerObject$1.$ref) : headerObject(headerObject$1, {
        ...options,
        path: utils.createRef([options.path, "headers", name])
      });
      const property = ts__default.factory.createPropertySignature(
        /* modifiers     */
        ts.tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        ts.tsPropertyIndex(name),
        /* questionToken */
        optional,
        /* type          */
        subType
      );
      ts.addJSDocComment(headerObject$1, property);
      headersObject.push(property);
    }
  }
  headersObject.push(
    ts__default.factory.createIndexSignature(
      /* modifiers     */
      ts.tsModifiers({ readonly: options.ctx.immutable }),
      /* parameters */
      [
        ts__default.factory.createParameterDeclaration(
          /* modifiers      */
          void 0,
          /* dotDotDotToken */
          void 0,
          /* name           */
          ts__default.factory.createIdentifier("name"),
          /* questionToken  */
          void 0,
          /* type           */
          ts.STRING
        )
      ],
      /* type          */
      ts.UNKNOWN
    )
  );
  type.push(
    ts__default.factory.createPropertySignature(
      /* modifiers     */
      void 0,
      /* name          */
      ts.tsPropertyIndex("headers"),
      /* questionToken */
      void 0,
      /* type          */
      ts__default.factory.createTypeLiteralNode(headersObject)
    )
  );
  const contentObject = [];
  if (responseObject.content) {
    for (const [contentType, mediaTypeObject$1] of utils.getEntries(responseObject.content ?? {}, options.ctx)) {
      const property = ts__default.factory.createPropertySignature(
        /* modifiers     */
        ts.tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        ts.tsPropertyIndex(contentType),
        /* questionToken */
        void 0,
        /* type          */
        mediaTypeObject(mediaTypeObject$1, {
          ...options,
          path: utils.createRef([options.path, "content", contentType])
        })
      );
      ts.addJSDocComment(mediaTypeObject$1, property);
      contentObject.push(property);
    }
  }
  if (contentObject.length) {
    type.push(
      ts__default.factory.createPropertySignature(
        /* modifiers     */
        void 0,
        /* name          */
        ts.tsPropertyIndex("content"),
        /* questionToken */
        void 0,
        /* type          */
        ts__default.factory.createTypeLiteralNode(contentObject)
      )
    );
  } else {
    type.push(
      ts__default.factory.createPropertySignature(
        /* modifiers     */
        void 0,
        /* name          */
        ts.tsPropertyIndex("content"),
        /* questionToken */
        ts.QUESTION_TOKEN,
        /* type          */
        ts.NEVER
      )
    );
  }
  return ts__default.factory.createTypeLiteralNode(type);
}

module.exports = transformResponseObject;
//# sourceMappingURL=response-object.cjs.map
