import { UNKNOWN } from '../lib/ts.mjs';
import transformSchemaObject from './schema-object.mjs';

function transformMediaTypeObject(mediaTypeObject, options) {
  if (!mediaTypeObject.schema) {
    return UNKNOWN;
  }
  return transformSchemaObject(mediaTypeObject.schema, options);
}

export { transformMediaTypeObject as default };
//# sourceMappingURL=media-type-object.mjs.map
