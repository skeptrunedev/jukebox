'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const ts = require('typescript');
const changeCase = require('change-case');
const node_perf_hooks = require('node:perf_hooks');
const ts$1 = require('../lib/ts.cjs');
const utils = require('../lib/utils.cjs');
const headerObject = require('./header-object.cjs');
const parameterObject = require('./parameter-object.cjs');
const pathItemObject = require('./path-item-object.cjs');
const requestBodyObject = require('./request-body-object.cjs');
const responseObject = require('./response-object.cjs');
const schemaObject = require('./schema-object.cjs');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

function _interopNamespaceCompat(e) {
  if (e && typeof e === 'object' && 'default' in e) return e;
  const n = Object.create(null);
  if (e) {
    for (const k in e) {
      n[k] = e[k];
    }
  }
  n.default = e;
  return n;
}

const ts__default = /*#__PURE__*/_interopDefaultCompat(ts);
const changeCase__namespace = /*#__PURE__*/_interopNamespaceCompat(changeCase);

const transformers = {
  schemas: schemaObject.default,
  responses: responseObject,
  parameters: parameterObject,
  requestBodies: requestBodyObject,
  headers: headerObject,
  pathItems: pathItemObject
};
function transformComponentsObject(componentsObject, ctx) {
  const type = [];
  const rootTypeAliases = {};
  for (const key of Object.keys(transformers)) {
    const componentT = node_perf_hooks.performance.now();
    const items = [];
    if (componentsObject[key]) {
      for (const [name, item] of utils.getEntries(componentsObject[key], ctx)) {
        let subType = transformers[key](item, {
          path: utils.createRef(["components", key, name]),
          schema: item,
          ctx
        });
        let hasQuestionToken = false;
        if (ctx.transform) {
          const result = ctx.transform(item, {
            path: utils.createRef(["components", key, name]),
            schema: item,
            ctx
          });
          if (result) {
            if ("schema" in result) {
              subType = result.schema;
              hasQuestionToken = result.questionToken;
            } else {
              subType = result;
            }
          }
        }
        const property = ts__default.factory.createPropertySignature(
          /* modifiers     */
          ts$1.tsModifiers({ readonly: ctx.immutable }),
          /* name          */
          ts$1.tsPropertyIndex(name),
          /* questionToken */
          hasQuestionToken ? ts$1.QUESTION_TOKEN : void 0,
          /* type          */
          subType
        );
        ts$1.addJSDocComment(item, property);
        items.push(property);
        if (ctx.rootTypes) {
          const componentKey = changeCase__namespace.pascalCase(singularizeComponentKey(key));
          let aliasName = `${componentKey}${changeCase__namespace.pascalCase(name)}`;
          let conflictCounter = 1;
          while (rootTypeAliases[aliasName] !== void 0) {
            conflictCounter++;
            aliasName = `${componentKey}${changeCase__namespace.pascalCase(name)}_${conflictCounter}`;
          }
          const ref = ts__default.factory.createTypeReferenceNode(`components['${key}']['${name}']`);
          if (ctx.rootTypesNoSchemaPrefix && key === "schemas") {
            aliasName = aliasName.replace(componentKey, "");
          }
          const typeAlias = ts__default.factory.createTypeAliasDeclaration(
            /* modifiers      */
            ts$1.tsModifiers({ export: true }),
            /* name           */
            aliasName,
            /* typeParameters */
            void 0,
            /* type           */
            ref
          );
          rootTypeAliases[aliasName] = typeAlias;
        }
      }
    }
    type.push(
      ts__default.factory.createPropertySignature(
        /* modifiers     */
        void 0,
        /* name          */
        ts$1.tsPropertyIndex(key),
        /* questionToken */
        void 0,
        /* type          */
        items.length ? ts__default.factory.createTypeLiteralNode(items) : ts$1.NEVER
      )
    );
    utils.debug(`Transformed components \u2192 ${key}`, "ts", node_perf_hooks.performance.now() - componentT);
  }
  let rootTypes = [];
  if (ctx.rootTypes) {
    rootTypes = Object.keys(rootTypeAliases).map((k) => rootTypeAliases[k]);
  }
  return [ts__default.factory.createTypeLiteralNode(type), ...rootTypes];
}
function singularizeComponentKey(key) {
  switch (key) {
    // Handle special singular case
    case "requestBodies":
      return "requestBody";
    // Default to removing the "s"
    default:
      return key.slice(0, -1);
  }
}

exports.default = transformComponentsObject;
exports.singularizeComponentKey = singularizeComponentKey;
//# sourceMappingURL=components-object.cjs.map
