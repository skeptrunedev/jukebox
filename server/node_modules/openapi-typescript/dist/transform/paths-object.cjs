'use strict';

const ts = require('typescript');
const node_perf_hooks = require('node:perf_hooks');
const ts$1 = require('../lib/ts.cjs');
const utils = require('../lib/utils.cjs');
const pathItemObject = require('./path-item-object.cjs');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const ts__default = /*#__PURE__*/_interopDefaultCompat(ts);

const PATH_PARAM_RE = /\{[^}]+\}/g;
function transformPathsObject(pathsObject, ctx) {
  const type = [];
  for (const [url, pathItemObject$1] of utils.getEntries(pathsObject, ctx)) {
    if (!pathItemObject$1 || typeof pathItemObject$1 !== "object") {
      continue;
    }
    const pathT = node_perf_hooks.performance.now();
    if ("$ref" in pathItemObject$1) {
      const property = ts__default.factory.createPropertySignature(
        /* modifiers     */
        ts$1.tsModifiers({ readonly: ctx.immutable }),
        /* name          */
        ts$1.tsPropertyIndex(url),
        /* questionToken */
        void 0,
        /* type          */
        ts$1.oapiRef(pathItemObject$1.$ref)
      );
      ts$1.addJSDocComment(pathItemObject$1, property);
      type.push(property);
    } else {
      const pathItemType = pathItemObject(pathItemObject$1, {
        path: utils.createRef(["paths", url]),
        ctx
      });
      if (ctx.pathParamsAsTypes && url.includes("{")) {
        const pathParams = extractPathParams(pathItemObject$1, ctx);
        const matches = url.match(PATH_PARAM_RE);
        let rawPath = `\`${url}\``;
        if (matches) {
          for (const match of matches) {
            const paramName = match.slice(1, -1);
            const param = pathParams[paramName];
            switch (param?.schema?.type) {
              case "number":
              case "integer":
                rawPath = rawPath.replace(match, "${number}");
                break;
              case "boolean":
                rawPath = rawPath.replace(match, "${boolean}");
                break;
              default:
                rawPath = rawPath.replace(match, "${string}");
                break;
            }
          }
          const pathType = ts$1.stringToAST(rawPath)[0]?.expression;
          if (pathType) {
            type.push(
              ts__default.factory.createIndexSignature(
                /* modifiers     */
                ts$1.tsModifiers({ readonly: ctx.immutable }),
                /* parameters    */
                [
                  ts__default.factory.createParameterDeclaration(
                    /* modifiers      */
                    void 0,
                    /* dotDotDotToken */
                    void 0,
                    /* name           */
                    "path",
                    /* questionToken  */
                    void 0,
                    /* type           */
                    pathType,
                    /* initializer    */
                    void 0
                  )
                ],
                /* type          */
                pathItemType
              )
            );
            continue;
          }
        }
      }
      type.push(
        ts__default.factory.createPropertySignature(
          /* modifiers     */
          ts$1.tsModifiers({ readonly: ctx.immutable }),
          /* name          */
          ts$1.tsPropertyIndex(url),
          /* questionToken */
          void 0,
          /* type          */
          pathItemType
        )
      );
      utils.debug(`Transformed path "${url}"`, "ts", node_perf_hooks.performance.now() - pathT);
    }
  }
  return ts__default.factory.createTypeLiteralNode(type);
}
function extractPathParams(pathItemObject, ctx) {
  const params = {};
  for (const p of pathItemObject.parameters ?? []) {
    const resolved = "$ref" in p && p.$ref ? ctx.resolve(p.$ref) : p;
    if (resolved && resolved.in === "path") {
      params[resolved.name] = resolved;
    }
  }
  for (const method of ["get", "put", "post", "delete", "options", "head", "patch", "trace"]) {
    if (!(method in pathItemObject)) {
      continue;
    }
    const resolvedMethod = pathItemObject[method].$ref ? ctx.resolve(pathItemObject[method].$ref) : pathItemObject[method];
    if (resolvedMethod?.parameters) {
      for (const p of resolvedMethod.parameters) {
        const resolvedParam = "$ref" in p && p.$ref ? ctx.resolve(p.$ref) : p;
        if (resolvedParam && resolvedParam.in === "path") {
          params[resolvedParam.name] = resolvedParam;
        }
      }
    }
  }
  return params;
}

module.exports = transformPathsObject;
//# sourceMappingURL=paths-object.cjs.map
