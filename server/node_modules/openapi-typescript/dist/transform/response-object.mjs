import ts from 'typescript';
import { QUESTION_TOKEN, oapiRef, tsModifiers, tsPropertyIndex, addJSDocComment, STRING, UNKNOWN, NEVER } from '../lib/ts.mjs';
import { getEntries, createRef } from '../lib/utils.mjs';
import transformHeaderObject from './header-object.mjs';
import transformMediaTypeObject from './media-type-object.mjs';

function transformResponseObject(responseObject, options) {
  const type = [];
  const headersObject = [];
  if (responseObject.headers) {
    for (const [name, headerObject] of getEntries(responseObject.headers, options.ctx)) {
      const optional = "$ref" in headerObject || headerObject.required ? void 0 : QUESTION_TOKEN;
      const subType = "$ref" in headerObject ? oapiRef(headerObject.$ref) : transformHeaderObject(headerObject, {
        ...options,
        path: createRef([options.path, "headers", name])
      });
      const property = ts.factory.createPropertySignature(
        /* modifiers     */
        tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        tsPropertyIndex(name),
        /* questionToken */
        optional,
        /* type          */
        subType
      );
      addJSDocComment(headerObject, property);
      headersObject.push(property);
    }
  }
  headersObject.push(
    ts.factory.createIndexSignature(
      /* modifiers     */
      tsModifiers({ readonly: options.ctx.immutable }),
      /* parameters */
      [
        ts.factory.createParameterDeclaration(
          /* modifiers      */
          void 0,
          /* dotDotDotToken */
          void 0,
          /* name           */
          ts.factory.createIdentifier("name"),
          /* questionToken  */
          void 0,
          /* type           */
          STRING
        )
      ],
      /* type          */
      UNKNOWN
    )
  );
  type.push(
    ts.factory.createPropertySignature(
      /* modifiers     */
      void 0,
      /* name          */
      tsPropertyIndex("headers"),
      /* questionToken */
      void 0,
      /* type          */
      ts.factory.createTypeLiteralNode(headersObject)
    )
  );
  const contentObject = [];
  if (responseObject.content) {
    for (const [contentType, mediaTypeObject] of getEntries(responseObject.content ?? {}, options.ctx)) {
      const property = ts.factory.createPropertySignature(
        /* modifiers     */
        tsModifiers({ readonly: options.ctx.immutable }),
        /* name          */
        tsPropertyIndex(contentType),
        /* questionToken */
        void 0,
        /* type          */
        transformMediaTypeObject(mediaTypeObject, {
          ...options,
          path: createRef([options.path, "content", contentType])
        })
      );
      addJSDocComment(mediaTypeObject, property);
      contentObject.push(property);
    }
  }
  if (contentObject.length) {
    type.push(
      ts.factory.createPropertySignature(
        /* modifiers     */
        void 0,
        /* name          */
        tsPropertyIndex("content"),
        /* questionToken */
        void 0,
        /* type          */
        ts.factory.createTypeLiteralNode(contentObject)
      )
    );
  } else {
    type.push(
      ts.factory.createPropertySignature(
        /* modifiers     */
        void 0,
        /* name          */
        tsPropertyIndex("content"),
        /* questionToken */
        QUESTION_TOKEN,
        /* type          */
        NEVER
      )
    );
  }
  return ts.factory.createTypeLiteralNode(type);
}

export { transformResponseObject as default };
//# sourceMappingURL=response-object.mjs.map
