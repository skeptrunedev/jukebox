import ts from 'typescript';
import { oapiRef, tsModifiers, tsPropertyIndex, addJSDocComment, NEVER } from '../lib/ts.mjs';
import { getEntries, createRef } from '../lib/utils.mjs';
import transformResponseObject from './response-object.mjs';

function transformResponsesObject(responsesObject, options) {
  const type = [];
  for (const [responseCode, responseObject] of getEntries(responsesObject, options.ctx)) {
    const responseType = "$ref" in responseObject ? oapiRef(responseObject.$ref) : transformResponseObject(responseObject, {
      ...options,
      path: createRef([options.path, "responses", responseCode])
    });
    const property = ts.factory.createPropertySignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      tsPropertyIndex(responseCode),
      /* questionToken */
      void 0,
      /* type          */
      responseType
    );
    addJSDocComment(responseObject, property);
    type.push(property);
  }
  return type.length ? ts.factory.createTypeLiteralNode(type) : NEVER;
}

export { transformResponsesObject as default };
//# sourceMappingURL=responses-object.mjs.map
