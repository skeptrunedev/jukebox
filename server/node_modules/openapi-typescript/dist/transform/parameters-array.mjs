import ts from 'typescript';
import { oapiRef, tsModifiers, tsPropertyIndex, addJSDocComment, QUESTION_TOKEN, NEVER } from '../lib/ts.mjs';
import { createRef } from '../lib/utils.mjs';
import transformParameterObject from './parameter-object.mjs';

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
        optional = QUESTION_TOKEN;
      }
      const subType = "$ref" in original ? oapiRef(original.$ref, resolved) : transformParameterObject(resolved, {
        ...options,
        path: createRef([options.path, "parameters", resolved.in, resolved.name])
      });
      const property = ts.factory.createPropertySignature(
        /* modifiers     */
        tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        tsPropertyIndex(resolved?.name),
        /* questionToken */
        optional,
        /* type          */
        subType
      );
      addJSDocComment(resolved, property);
      paramLocType.push(property);
    }
    const allOptional = paramLocType.every((node) => !!node.questionToken);
    paramType.push(
      ts.factory.createPropertySignature(
        /* modifiers     */
        tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        tsPropertyIndex(paramIn),
        /* questionToken */
        allOptional || !paramLocType.length ? QUESTION_TOKEN : void 0,
        /* type          */
        paramLocType.length ? ts.factory.createTypeLiteralNode(paramLocType) : NEVER
      )
    );
  }
  type.push(
    ts.factory.createPropertySignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      tsPropertyIndex("parameters"),
      /* questionToken */
      !paramType.length ? QUESTION_TOKEN : void 0,
      /* type          */
      paramType.length ? ts.factory.createTypeLiteralNode(paramType) : NEVER
    )
  );
  return type;
}

export { transformParametersArray };
//# sourceMappingURL=parameters-array.mjs.map
