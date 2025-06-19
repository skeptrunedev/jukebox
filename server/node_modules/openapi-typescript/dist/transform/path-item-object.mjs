import ts from 'typescript';
import { tsModifiers, tsPropertyIndex, QUESTION_TOKEN, NEVER, oapiRef, addJSDocComment } from '../lib/ts.mjs';
import { createRef } from '../lib/utils.mjs';
import transformOperationObject, { injectOperationObject } from './operation-object.mjs';
import { transformParametersArray } from './parameters-array.mjs';

function transformPathItemObject(pathItem, options) {
  const type = [];
  type.push(
    ...transformParametersArray(pathItem.parameters ?? [], {
      ...options,
      path: createRef([options.path, "parameters"])
    })
  );
  for (const method of ["get", "put", "post", "delete", "options", "head", "patch", "trace"]) {
    const operationObject = pathItem[method];
    if (!operationObject || options.ctx.excludeDeprecated && ("$ref" in operationObject ? options.ctx.resolve(operationObject.$ref) : operationObject)?.deprecated) {
      type.push(
        ts.factory.createPropertySignature(
          /* modifiers     */
          tsModifiers({ readonly: options.ctx.immutable }),
          /* name          */
          tsPropertyIndex(method),
          /* questionToken */
          QUESTION_TOKEN,
          /* type          */
          NEVER
        )
      );
      continue;
    }
    const keyedParameters = {};
    if (!("$ref" in operationObject)) {
      for (const parameter of [...pathItem.parameters ?? [], ...operationObject.parameters ?? []]) {
        const name = "$ref" in parameter ? `${options.ctx.resolve(parameter.$ref)?.in}-${options.ctx.resolve(parameter.$ref)?.name}` : `${parameter.in}-${parameter.name}`;
        if (name) {
          keyedParameters[name] = parameter;
        }
      }
    }
    let operationType;
    if ("$ref" in operationObject) {
      operationType = oapiRef(operationObject.$ref);
    } else if (operationObject.operationId) {
      const operationId = operationObject.operationId.replace(HASH_RE, "/");
      operationType = oapiRef(createRef(["operations", operationId]));
      injectOperationObject(
        operationId,
        { ...operationObject, parameters: Object.values(keyedParameters) },
        { ...options, path: createRef([options.path, method]) }
      );
    } else {
      operationType = ts.factory.createTypeLiteralNode(
        transformOperationObject(
          { ...operationObject, parameters: Object.values(keyedParameters) },
          { ...options, path: createRef([options.path, method]) }
        )
      );
    }
    const property = ts.factory.createPropertySignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      tsPropertyIndex(method),
      /* questionToken */
      void 0,
      /* type          */
      operationType
    );
    addJSDocComment(operationObject, property);
    type.push(property);
  }
  return ts.factory.createTypeLiteralNode(type);
}
const HASH_RE = /#/g;

export { transformPathItemObject as default };
//# sourceMappingURL=path-item-object.mjs.map
