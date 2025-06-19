import ts from 'typescript';
import { tsModifiers, tsPropertyIndex, addJSDocComment, QUESTION_TOKEN, NEVER } from '../lib/ts.mjs';
import { getEntries, createRef } from '../lib/utils.mjs';
import transformMediaTypeObject from './media-type-object.mjs';
import transformSchemaObject from './schema-object.mjs';

function transformRequestBodyObject(requestBodyObject, options) {
  const type = [];
  for (const [contentType, mediaTypeObject] of getEntries(requestBodyObject.content ?? {}, options.ctx)) {
    const nextPath = createRef([options.path, contentType]);
    const mediaType = "$ref" in mediaTypeObject ? transformSchemaObject(mediaTypeObject, {
      ...options,
      path: nextPath
    }) : transformMediaTypeObject(mediaTypeObject, {
      ...options,
      path: nextPath
    });
    const property = ts.factory.createPropertySignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      tsPropertyIndex(contentType),
      /* questionToken */
      void 0,
      /* type          */
      mediaType
    );
    addJSDocComment(mediaTypeObject, property);
    type.push(property);
  }
  return ts.factory.createTypeLiteralNode([
    ts.factory.createPropertySignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* name          */
      tsPropertyIndex("content"),
      /* questionToken */
      void 0,
      /* type          */
      ts.factory.createTypeLiteralNode(
        type.length ? type : (
          // add `"*/*": never` if no media types are defined
          [
            ts.factory.createPropertySignature(
              /* modifiers     */
              void 0,
              /* name          */
              tsPropertyIndex("*/*"),
              /* questionToken */
              QUESTION_TOKEN,
              /* type          */
              NEVER
            )
          ]
        )
      )
    )
  ]);
}

export { transformRequestBodyObject as default };
//# sourceMappingURL=request-body-object.mjs.map
