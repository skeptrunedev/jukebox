import { escapePointer } from '@redocly/openapi-core/lib/ref-utils.js';
import ts from 'typescript';
import { tsModifiers, tsPropertyIndex, addJSDocComment, UNKNOWN } from '../lib/ts.mjs';
import { getEntries } from '../lib/utils.mjs';
import transformMediaTypeObject from './media-type-object.mjs';
import transformSchemaObject from './schema-object.mjs';

function transformHeaderObject(headerObject, options) {
  if (headerObject.schema) {
    return transformSchemaObject(headerObject.schema, options);
  }
  if (headerObject.content) {
    const type = [];
    for (const [contentType, mediaTypeObject] of getEntries(headerObject.content ?? {}, options.ctx)) {
      const nextPath = `${options.path ?? "#"}/${escapePointer(contentType)}`;
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
    return ts.factory.createTypeLiteralNode(type);
  }
  return UNKNOWN;
}

export { transformHeaderObject as default };
//# sourceMappingURL=header-object.mjs.map
