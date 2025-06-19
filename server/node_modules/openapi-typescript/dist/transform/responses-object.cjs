'use strict';

const ts$1 = require('typescript');
const ts = require('../lib/ts.cjs');
const utils = require('../lib/utils.cjs');
const responseObject = require('./response-object.cjs');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const ts__default = /*#__PURE__*/_interopDefaultCompat(ts$1);

function transformResponsesObject(responsesObject, options) {
  const type = [];
  for (const [responseCode, responseObject$1] of utils.getEntries(responsesObject, options.ctx)) {
    const responseType = "$ref" in responseObject$1 ? ts.oapiRef(responseObject$1.$ref) : responseObject(responseObject$1, {
      ...options,
      path: utils.createRef([options.path, "responses", responseCode])
    });
    const property = ts__default.factory.createPropertySignature(
      /* modifiers     */
      ts.tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      ts.tsPropertyIndex(responseCode),
      /* questionToken */
      void 0,
      /* type          */
      responseType
    );
    ts.addJSDocComment(responseObject$1, property);
    type.push(property);
  }
  return type.length ? ts__default.factory.createTypeLiteralNode(type) : ts.NEVER;
}

module.exports = transformResponsesObject;
//# sourceMappingURL=responses-object.cjs.map
