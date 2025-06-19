import { STRING } from '../lib/ts.mjs';
import transformSchemaObject from './schema-object.mjs';

function transformParameterObject(parameterObject, options) {
  return parameterObject.schema ? transformSchemaObject(parameterObject.schema, options) : STRING;
}

export { transformParameterObject as default };
//# sourceMappingURL=parameter-object.mjs.map
