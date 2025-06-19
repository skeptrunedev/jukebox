'use strict';

const ts = require('typescript');
const ts$1 = require('../lib/ts.cjs');
const utils = require('../lib/utils.cjs');
const operationObject = require('./operation-object.cjs');
const parametersArray = require('./parameters-array.cjs');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const ts__default = /*#__PURE__*/_interopDefaultCompat(ts);

function transformPathItemObject(pathItem, options) {
  const type = [];
  type.push(
    ...parametersArray.transformParametersArray(pathItem.parameters ?? [], {
      ...options,
      path: utils.createRef([options.path, "parameters"])
    })
  );
  for (const method of ["get", "put", "post", "delete", "options", "head", "patch", "trace"]) {
    const operationObject$1 = pathItem[method];
    if (!operationObject$1 || options.ctx.excludeDeprecated && ("$ref" in operationObject$1 ? options.ctx.resolve(operationObject$1.$ref) : operationObject$1)?.deprecated) {
      type.push(
        ts__default.factory.createPropertySignature(
          /* modifiers     */
          ts$1.tsModifiers({ readonly: options.ctx.immutable }),
          /* name          */
          ts$1.tsPropertyIndex(method),
          /* questionToken */
          ts$1.QUESTION_TOKEN,
          /* type          */
          ts$1.NEVER
        )
      );
      continue;
    }
    const keyedParameters = {};
    if (!("$ref" in operationObject$1)) {
      for (const parameter of [...pathItem.parameters ?? [], ...operationObject$1.parameters ?? []]) {
        const name = "$ref" in parameter ? `${options.ctx.resolve(parameter.$ref)?.in}-${options.ctx.resolve(parameter.$ref)?.name}` : `${parameter.in}-${parameter.name}`;
        if (name) {
          keyedParameters[name] = parameter;
        }
      }
    }
    let operationType;
    if ("$ref" in operationObject$1) {
      operationType = ts$1.oapiRef(operationObject$1.$ref);
    } else if (operationObject$1.operationId) {
      const operationId = operationObject$1.operationId.replace(HASH_RE, "/");
      operationType = ts$1.oapiRef(utils.createRef(["operations", operationId]));
      operationObject.injectOperationObject(
        operationId,
        { ...operationObject$1, parameters: Object.values(keyedParameters) },
        { ...options, path: utils.createRef([options.path, method]) }
      );
    } else {
      operationType = ts__default.factory.createTypeLiteralNode(
        operationObject.default(
          { ...operationObject$1, parameters: Object.values(keyedParameters) },
          { ...options, path: utils.createRef([options.path, method]) }
        )
      );
    }
    const property = ts__default.factory.createPropertySignature(
      /* modifiers     */
      ts$1.tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      ts$1.tsPropertyIndex(method),
      /* questionToken */
      void 0,
      /* type          */
      operationType
    );
    ts$1.addJSDocComment(operationObject$1, property);
    type.push(property);
  }
  return ts__default.factory.createTypeLiteralNode(type);
}
const HASH_RE = /#/g;

module.exports = transformPathItemObject;
//# sourceMappingURL=path-item-object.cjs.map
