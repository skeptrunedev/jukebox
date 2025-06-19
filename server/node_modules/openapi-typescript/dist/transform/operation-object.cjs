'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const ts$1 = require('typescript');
const ts = require('../lib/ts.cjs');
const utils = require('../lib/utils.cjs');
const parametersArray = require('./parameters-array.cjs');
const requestBodyObject = require('./request-body-object.cjs');
const responsesObject = require('./responses-object.cjs');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const ts__default = /*#__PURE__*/_interopDefaultCompat(ts$1);

function transformOperationObject(operationObject, options) {
  const type = [];
  type.push(...parametersArray.transformParametersArray(operationObject.parameters ?? [], options));
  if (operationObject.requestBody) {
    const requestBodyType = "$ref" in operationObject.requestBody ? ts.oapiRef(operationObject.requestBody.$ref) : requestBodyObject(operationObject.requestBody, {
      ...options,
      path: utils.createRef([options.path, "requestBody"])
    });
    const required = !!("$ref" in operationObject.requestBody ? options.ctx.resolve(operationObject.requestBody.$ref) : operationObject.requestBody)?.required;
    const property = ts__default.factory.createPropertySignature(
      /* modifiers     */
      ts.tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      ts.tsPropertyIndex("requestBody"),
      /* questionToken */
      required ? void 0 : ts.QUESTION_TOKEN,
      /* type          */
      requestBodyType
    );
    ts.addJSDocComment(operationObject.requestBody, property);
    type.push(property);
  } else {
    type.push(
      ts__default.factory.createPropertySignature(
        /* modifiers     */
        ts.tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        ts.tsPropertyIndex("requestBody"),
        /* questionToken */
        ts.QUESTION_TOKEN,
        /* type          */
        ts.NEVER
      )
    );
  }
  type.push(
    ts__default.factory.createPropertySignature(
      /* modifiers     */
      ts.tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      ts.tsPropertyIndex("responses"),
      /* questionToken */
      void 0,
      /* type          */
      responsesObject(operationObject.responses ?? {}, options)
    )
  );
  return type;
}
function injectOperationObject(operationId, operationObject, options) {
  let operations = options.ctx.injectFooter.find(
    (node) => ts__default.isInterfaceDeclaration(node) && node.name.text === "operations"
  );
  if (!operations) {
    operations = ts__default.factory.createInterfaceDeclaration(
      /* modifiers       */
      ts.tsModifiers({
        export: true
        // important: do NOT make this immutable
      }),
      /* name            */
      ts__default.factory.createIdentifier("operations"),
      /* typeParameters  */
      void 0,
      /* heritageClauses */
      void 0,
      /* members         */
      []
    );
    options.ctx.injectFooter.push(operations);
  }
  const type = transformOperationObject(operationObject, options);
  operations.members = ts__default.factory.createNodeArray([
    ...operations.members,
    ts__default.factory.createPropertySignature(
      /* modifiers     */
      ts.tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      ts.tsPropertyIndex(operationId),
      /* questionToken */
      void 0,
      /* type          */
      ts__default.factory.createTypeLiteralNode(type)
    )
  ]);
}

exports.default = transformOperationObject;
exports.injectOperationObject = injectOperationObject;
//# sourceMappingURL=operation-object.cjs.map
