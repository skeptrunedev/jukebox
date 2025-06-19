'use strict';

const ts$1 = require('typescript');
const ts = require('../lib/ts.cjs');
const utils = require('../lib/utils.cjs');
const parameterObject = require('./parameter-object.cjs');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const ts__default = /*#__PURE__*/_interopDefaultCompat(ts$1);

const PATH_PARAM_RE = /\{([^}]+)\}/g;
function createPathParameter(paramName) {
  return {
    name: paramName,
    in: "path",
    required: true,
    schema: { type: "string" }
  };
}
function extractPathParamsFromUrl(path) {
  const params = [];
  const matches = path.match(PATH_PARAM_RE);
  if (matches) {
    for (const match of matches) {
      const paramName = match.slice(1, -1);
      params.push(createPathParameter(paramName));
    }
  }
  return params;
}
function transformParametersArray(parametersArray, options) {
  const type = [];
  const workingParameters = [...parametersArray];
  if (options.ctx.generatePathParams && options.path) {
    const pathString = Array.isArray(options.path) ? options.path[0] : options.path;
    if (typeof pathString === "string") {
      const pathParams = extractPathParamsFromUrl(pathString);
      for (const param of pathParams) {
        const exists = workingParameters.some((p) => {
          const resolved = "$ref" in p ? options.ctx.resolve(p.$ref) : p;
          return resolved?.in === "path" && resolved?.name === param.name;
        });
        if (!exists) {
          workingParameters.push(param);
        }
      }
    }
  }
  const paramType = [];
  for (const paramIn of ["query", "header", "path", "cookie"]) {
    const paramLocType = [];
    let operationParameters = workingParameters.map((param) => ({
      original: param,
      resolved: "$ref" in param ? options.ctx.resolve(param.$ref) : param
    }));
    if (options.ctx.alphabetize) {
      operationParameters.sort((a, b) => (a.resolved?.name ?? "").localeCompare(b.resolved?.name ?? ""));
    }
    if (options.ctx.excludeDeprecated) {
      operationParameters = operationParameters.filter(
        ({ resolved }) => !resolved?.deprecated && !resolved?.schema?.deprecated
      );
    }
    for (const { original, resolved } of operationParameters) {
      if (resolved?.in !== paramIn) {
        continue;
      }
      let optional = void 0;
      if (paramIn !== "path" && !resolved.required) {
        optional = ts.QUESTION_TOKEN;
      }
      const subType = "$ref" in original ? ts.oapiRef(original.$ref, resolved) : parameterObject(resolved, {
        ...options,
        path: utils.createRef([options.path, "parameters", resolved.in, resolved.name])
      });
      const property = ts__default.factory.createPropertySignature(
        /* modifiers     */
        ts.tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        ts.tsPropertyIndex(resolved?.name),
        /* questionToken */
        optional,
        /* type          */
        subType
      );
      ts.addJSDocComment(resolved, property);
      paramLocType.push(property);
    }
    const allOptional = paramLocType.every((node) => !!node.questionToken);
    paramType.push(
      ts__default.factory.createPropertySignature(
        /* modifiers     */
        ts.tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        ts.tsPropertyIndex(paramIn),
        /* questionToken */
        allOptional || !paramLocType.length ? ts.QUESTION_TOKEN : void 0,
        /* type          */
        paramLocType.length ? ts__default.factory.createTypeLiteralNode(paramLocType) : ts.NEVER
      )
    );
  }
  type.push(
    ts__default.factory.createPropertySignature(
      /* modifiers     */
      ts.tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      ts.tsPropertyIndex("parameters"),
      /* questionToken */
      !paramType.length ? ts.QUESTION_TOKEN : void 0,
      /* type          */
      paramType.length ? ts__default.factory.createTypeLiteralNode(paramType) : ts.NEVER
    )
  );
  return type;
}

exports.transformParametersArray = transformParametersArray;
//# sourceMappingURL=parameters-array.cjs.map
