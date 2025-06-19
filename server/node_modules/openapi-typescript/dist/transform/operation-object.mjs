import ts from 'typescript';
import { oapiRef, tsModifiers, tsPropertyIndex, QUESTION_TOKEN, addJSDocComment, NEVER } from '../lib/ts.mjs';
import { createRef } from '../lib/utils.mjs';
import { transformParametersArray } from './parameters-array.mjs';
import transformRequestBodyObject from './request-body-object.mjs';
import transformResponsesObject from './responses-object.mjs';

function transformOperationObject(operationObject, options) {
  const type = [];
  type.push(...transformParametersArray(operationObject.parameters ?? [], options));
  if (operationObject.requestBody) {
    const requestBodyType = "$ref" in operationObject.requestBody ? oapiRef(operationObject.requestBody.$ref) : transformRequestBodyObject(operationObject.requestBody, {
      ...options,
      path: createRef([options.path, "requestBody"])
    });
    const required = !!("$ref" in operationObject.requestBody ? options.ctx.resolve(operationObject.requestBody.$ref) : operationObject.requestBody)?.required;
    const property = ts.factory.createPropertySignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      tsPropertyIndex("requestBody"),
      /* questionToken */
      required ? void 0 : QUESTION_TOKEN,
      /* type          */
      requestBodyType
    );
    addJSDocComment(operationObject.requestBody, property);
    type.push(property);
  } else {
    type.push(
      ts.factory.createPropertySignature(
        /* modifiers     */
        tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        tsPropertyIndex("requestBody"),
        /* questionToken */
        QUESTION_TOKEN,
        /* type          */
        NEVER
      )
    );
  }
  type.push(
    ts.factory.createPropertySignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      tsPropertyIndex("responses"),
      /* questionToken */
      void 0,
      /* type          */
      transformResponsesObject(operationObject.responses ?? {}, options)
    )
  );
  return type;
}
function injectOperationObject(operationId, operationObject, options) {
  let operations = options.ctx.injectFooter.find(
    (node) => ts.isInterfaceDeclaration(node) && node.name.text === "operations"
  );
  if (!operations) {
    operations = ts.factory.createInterfaceDeclaration(
      /* modifiers       */
      tsModifiers({
        export: true
        // important: do NOT make this immutable
      }),
      /* name            */
      ts.factory.createIdentifier("operations"),
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
  operations.members = ts.factory.createNodeArray([
    ...operations.members,
    ts.factory.createPropertySignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      tsPropertyIndex(operationId),
      /* questionToken */
      void 0,
      /* type          */
      ts.factory.createTypeLiteralNode(type)
    )
  ]);
}

export { transformOperationObject as default, injectOperationObject };
//# sourceMappingURL=operation-object.mjs.map
