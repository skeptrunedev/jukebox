import ts from 'typescript';
import { performance } from 'node:perf_hooks';
import { tsModifiers, tsPropertyIndex, oapiRef, addJSDocComment, stringToAST } from '../lib/ts.mjs';
import { getEntries, createRef, debug } from '../lib/utils.mjs';
import transformPathItemObject from './path-item-object.mjs';

const PATH_PARAM_RE = /\{[^}]+\}/g;
function transformPathsObject(pathsObject, ctx) {
  const type = [];
  for (const [url, pathItemObject] of getEntries(pathsObject, ctx)) {
    if (!pathItemObject || typeof pathItemObject !== "object") {
      continue;
    }
    const pathT = performance.now();
    if ("$ref" in pathItemObject) {
      const property = ts.factory.createPropertySignature(
        /* modifiers     */
        tsModifiers({ readonly: ctx.immutable }),
        /* name          */
        tsPropertyIndex(url),
        /* questionToken */
        void 0,
        /* type          */
        oapiRef(pathItemObject.$ref)
      );
      addJSDocComment(pathItemObject, property);
      type.push(property);
    } else {
      const pathItemType = transformPathItemObject(pathItemObject, {
        path: createRef(["paths", url]),
        ctx
      });
      if (ctx.pathParamsAsTypes && url.includes("{")) {
        const pathParams = extractPathParams(pathItemObject, ctx);
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
          const pathType = stringToAST(rawPath)[0]?.expression;
          if (pathType) {
            type.push(
              ts.factory.createIndexSignature(
                /* modifiers     */
                tsModifiers({ readonly: ctx.immutable }),
                /* parameters    */
                [
                  ts.factory.createParameterDeclaration(
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
        ts.factory.createPropertySignature(
          /* modifiers     */
          tsModifiers({ readonly: ctx.immutable }),
          /* name          */
          tsPropertyIndex(url),
          /* questionToken */
          void 0,
          /* type          */
          pathItemType
        )
      );
      debug(`Transformed path "${url}"`, "ts", performance.now() - pathT);
    }
  }
  return ts.factory.createTypeLiteralNode(type);
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

export { transformPathsObject as default };
//# sourceMappingURL=paths-object.mjs.map
