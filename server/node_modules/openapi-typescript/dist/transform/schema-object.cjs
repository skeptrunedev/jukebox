'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const refUtils_js = require('@redocly/openapi-core/lib/ref-utils.js');
const ts$1 = require('typescript');
const ts = require('../lib/ts.cjs');
const utils = require('../lib/utils.cjs');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const ts__default = /*#__PURE__*/_interopDefaultCompat(ts$1);

function transformSchemaObject(schemaObject, options) {
  const type = transformSchemaObjectWithComposition(schemaObject, options);
  if (typeof options.ctx.postTransform === "function") {
    const postTransformResult = options.ctx.postTransform(type, options);
    if (postTransformResult) {
      return postTransformResult;
    }
  }
  return type;
}
function transformSchemaObjectWithComposition(schemaObject, options) {
  if (!schemaObject) {
    return ts.NEVER;
  }
  if (schemaObject === true) {
    return ts.UNKNOWN;
  }
  if (Array.isArray(schemaObject) || typeof schemaObject !== "object") {
    throw new Error(
      `Expected SchemaObject, received ${Array.isArray(schemaObject) ? "Array" : typeof schemaObject} at ${options.path}`
    );
  }
  if ("$ref" in schemaObject) {
    return ts.oapiRef(schemaObject.$ref);
  }
  if (schemaObject.const !== null && schemaObject.const !== void 0) {
    return ts.tsLiteral(schemaObject.const);
  }
  if (Array.isArray(schemaObject.enum) && (!("type" in schemaObject) || schemaObject.type !== "object") && !("properties" in schemaObject) && !("additionalProperties" in schemaObject)) {
    if (options.ctx.enum && schemaObject.enum.every((v) => typeof v === "string" || typeof v === "number" || v === null)) {
      let enumName = refUtils_js.parseRef(options.path ?? "").pointer.join("/");
      enumName = enumName.replace("components/schemas", "");
      const metadata = schemaObject.enum.map((_, i) => ({
        name: schemaObject["x-enum-varnames"]?.[i] ?? schemaObject["x-enumNames"]?.[i],
        description: schemaObject["x-enum-descriptions"]?.[i] ?? schemaObject["x-enumDescriptions"]?.[i]
      }));
      let hasNull = false;
      const validSchemaEnums = schemaObject.enum.filter((enumValue) => {
        if (enumValue === null) {
          hasNull = true;
          return false;
        }
        return true;
      });
      const enumType2 = ts.tsEnum(enumName, validSchemaEnums, metadata, {
        shouldCache: options.ctx.dedupeEnums,
        export: true
        // readonly: TS enum do not support the readonly modifier
      });
      if (!options.ctx.injectFooter.includes(enumType2)) {
        options.ctx.injectFooter.push(enumType2);
      }
      const ref = ts__default.factory.createTypeReferenceNode(enumType2.name);
      return hasNull ? ts.tsUnion([ref, ts.NULL]) : ref;
    }
    const enumType = schemaObject.enum.map(ts.tsLiteral);
    if (Array.isArray(schemaObject.type) && schemaObject.type.includes("null") || schemaObject.nullable) {
      enumType.push(ts.NULL);
    }
    const unionType = ts.tsUnion(enumType);
    if (options.ctx.enumValues && schemaObject.enum.every((v) => typeof v === "string" || typeof v === "number")) {
      let enumValuesVariableName = refUtils_js.parseRef(options.path ?? "").pointer.join("/");
      enumValuesVariableName = enumValuesVariableName.replace("components/schemas", "");
      enumValuesVariableName = `${enumValuesVariableName}Values`;
      const enumValuesArray = ts.tsArrayLiteralExpression(
        enumValuesVariableName,
        ts.oapiRef(options.path ?? ""),
        schemaObject.enum,
        {
          export: true,
          readonly: true,
          injectFooter: options.ctx.injectFooter
        }
      );
      options.ctx.injectFooter.push(enumValuesArray);
    }
    return unionType;
  }
  function collectUnionCompositions(items) {
    const output = [];
    for (const item of items) {
      output.push(transformSchemaObject(item, options));
    }
    return output;
  }
  function collectAllOfCompositions(items, required) {
    const output = [];
    for (const item of items) {
      let itemType;
      if ("$ref" in item) {
        itemType = transformSchemaObject(item, options);
        const resolved = options.ctx.resolve(item.$ref);
        if (resolved && typeof resolved === "object" && "properties" in resolved && // we have already handled this item (discriminator property was already added as required)
        !options.ctx.discriminators.refsHandled.includes(item.$ref)) {
          const validRequired = (required ?? []).filter((key) => !!resolved.properties?.[key]);
          if (validRequired.length) {
            itemType = ts.tsWithRequired(itemType, validRequired, options.ctx.injectFooter);
          }
        }
      } else {
        const itemRequired = [...required ?? []];
        if (typeof item === "object" && Array.isArray(item.required)) {
          itemRequired.push(...item.required);
        }
        itemType = transformSchemaObject({ ...item, required: itemRequired }, options);
      }
      const discriminator = "$ref" in item && options.ctx.discriminators.objects[item.$ref] || item.discriminator;
      if (discriminator) {
        output.push(ts.tsOmit(itemType, [discriminator.propertyName]));
      } else {
        output.push(itemType);
      }
    }
    return output;
  }
  let finalType = void 0;
  const coreObjectType = transformSchemaObjectCore(schemaObject, options);
  const allOfType = collectAllOfCompositions(schemaObject.allOf ?? [], schemaObject.required);
  if (coreObjectType || allOfType.length) {
    const allOf = allOfType.length ? ts.tsIntersection(allOfType) : void 0;
    finalType = ts.tsIntersection([...coreObjectType ? [coreObjectType] : [], ...allOf ? [allOf] : []]);
  }
  const anyOfType = collectUnionCompositions(schemaObject.anyOf ?? []);
  if (anyOfType.length) {
    finalType = ts.tsUnion([...finalType ? [finalType] : [], ...anyOfType]);
  }
  const oneOfType = collectUnionCompositions(
    schemaObject.oneOf || "type" in schemaObject && schemaObject.type === "object" && schemaObject.enum || []
  );
  if (oneOfType.length) {
    if (oneOfType.every(ts.tsIsPrimitive)) {
      finalType = ts.tsUnion([...finalType ? [finalType] : [], ...oneOfType]);
    } else {
      finalType = ts.tsIntersection([...finalType ? [finalType] : [], ts.tsUnion(oneOfType)]);
    }
  }
  if (!finalType) {
    if ("type" in schemaObject) {
      finalType = ts.tsRecord(ts.STRING, options.ctx.emptyObjectsUnknown ? ts.UNKNOWN : ts.NEVER);
    } else {
      finalType = ts.UNKNOWN;
    }
  }
  if (finalType !== ts.UNKNOWN && schemaObject.nullable) {
    finalType = ts.tsNullable([finalType]);
  }
  return finalType;
}
function transformSchemaObjectCore(schemaObject, options) {
  if ("type" in schemaObject && schemaObject.type) {
    if (typeof options.ctx.transform === "function") {
      const result = options.ctx.transform(schemaObject, options);
      if (result && typeof result === "object") {
        if ("schema" in result) {
          if (result.questionToken) {
            return ts__default.factory.createUnionTypeNode([result.schema, ts.UNDEFINED]);
          } else {
            return result.schema;
          }
        } else {
          return result;
        }
      }
    }
    if (schemaObject.type === "null") {
      return ts.NULL;
    }
    if (schemaObject.type === "string") {
      return ts.STRING;
    }
    if (schemaObject.type === "number" || schemaObject.type === "integer") {
      return ts.NUMBER;
    }
    if (schemaObject.type === "boolean") {
      return ts.BOOLEAN;
    }
    if (schemaObject.type === "array") {
      let itemType = ts.UNKNOWN;
      if (schemaObject.prefixItems || Array.isArray(schemaObject.items)) {
        const prefixItems = schemaObject.prefixItems ?? schemaObject.items;
        itemType = ts__default.factory.createTupleTypeNode(prefixItems.map((item) => transformSchemaObject(item, options)));
      } else if (schemaObject.items) {
        if (hasKey(schemaObject.items, "type") && schemaObject.items.type === "array") {
          itemType = ts__default.factory.createArrayTypeNode(transformSchemaObject(schemaObject.items, options));
        } else {
          itemType = transformSchemaObject(schemaObject.items, options);
        }
      }
      const min = typeof schemaObject.minItems === "number" && schemaObject.minItems >= 0 ? schemaObject.minItems : 0;
      const max = typeof schemaObject.maxItems === "number" && schemaObject.maxItems >= 0 && min <= schemaObject.maxItems ? schemaObject.maxItems : void 0;
      const estimateCodeSize = typeof max !== "number" ? min : (max * (max + 1) - min * (min - 1)) / 2;
      if (options.ctx.arrayLength && (min !== 0 || max !== void 0) && estimateCodeSize < 30) {
        if (min === max) {
          const elements = [];
          for (let i = 0; i < min; i++) {
            elements.push(itemType);
          }
          return ts.tsUnion([ts__default.factory.createTupleTypeNode(elements)]);
        } else if (schemaObject.maxItems > 0) {
          const members = [];
          for (let i = 0; i <= (max ?? 0) - min; i++) {
            const elements = [];
            for (let j = min; j < i + min; j++) {
              elements.push(itemType);
            }
            members.push(ts__default.factory.createTupleTypeNode(elements));
          }
          return ts.tsUnion(members);
        } else {
          const elements = [];
          for (let i = 0; i < min; i++) {
            elements.push(itemType);
          }
          elements.push(ts__default.factory.createRestTypeNode(ts__default.factory.createArrayTypeNode(itemType)));
          return ts__default.factory.createTupleTypeNode(elements);
        }
      }
      const finalType = ts__default.isTupleTypeNode(itemType) || ts__default.isArrayTypeNode(itemType) ? itemType : ts__default.factory.createArrayTypeNode(itemType);
      return options.ctx.immutable ? ts__default.factory.createTypeOperatorNode(ts__default.SyntaxKind.ReadonlyKeyword, finalType) : finalType;
    }
    if (Array.isArray(schemaObject.type) && !Array.isArray(schemaObject)) {
      const uniqueTypes = [];
      if (Array.isArray(schemaObject.oneOf)) {
        for (const t of schemaObject.type) {
          if ((t === "boolean" || t === "string" || t === "number" || t === "integer" || t === "null") && schemaObject.oneOf.find((o) => typeof o === "object" && "type" in o && o.type === t)) {
            continue;
          }
          uniqueTypes.push(
            t === "null" || t === null ? ts.NULL : transformSchemaObject(
              { ...schemaObject, type: t, oneOf: void 0 },
              // don’t stack oneOf transforms
              options
            )
          );
        }
      } else {
        for (const t of schemaObject.type) {
          if (t === "null" || t === null) {
            uniqueTypes.push(ts.NULL);
          } else {
            uniqueTypes.push(transformSchemaObject({ ...schemaObject, type: t }, options));
          }
        }
      }
      return ts.tsUnion(uniqueTypes);
    }
  }
  const coreObjectType = [];
  for (const k of ["allOf", "anyOf"]) {
    if (!schemaObject[k]) {
      continue;
    }
    const discriminator = !schemaObject.discriminator && !options.ctx.discriminators.refsHandled.includes(options.path ?? "") && options.ctx.discriminators.objects[options.path ?? ""];
    if (discriminator) {
      coreObjectType.unshift(
        utils.createDiscriminatorProperty(discriminator, {
          path: options.path ?? "",
          readonly: options.ctx.immutable
        })
      );
      break;
    }
  }
  if ("properties" in schemaObject && schemaObject.properties && Object.keys(schemaObject.properties).length || "additionalProperties" in schemaObject && schemaObject.additionalProperties || "$defs" in schemaObject && schemaObject.$defs) {
    if (Object.keys(schemaObject.properties ?? {}).length) {
      for (const [k, v] of utils.getEntries(schemaObject.properties ?? {}, options.ctx)) {
        if (typeof v !== "object" && typeof v !== "boolean" || Array.isArray(v)) {
          throw new Error(
            `${options.path}: invalid property ${k}. Expected Schema Object or boolean, got ${Array.isArray(v) ? "Array" : typeof v}`
          );
        }
        const { $ref, readOnly, hasDefault } = typeof v === "object" ? {
          $ref: "$ref" in v && v.$ref,
          readOnly: "readOnly" in v && v.readOnly,
          hasDefault: "default" in v && v.default !== void 0
        } : {};
        if (options.ctx.excludeDeprecated) {
          const resolved = $ref ? options.ctx.resolve($ref) : v;
          if (resolved?.deprecated) {
            continue;
          }
        }
        let optional = schemaObject.required?.includes(k) || schemaObject.required === void 0 && options.ctx.propertiesRequiredByDefault || hasDefault && options.ctx.defaultNonNullable && !options.path?.includes("parameters") && !options.path?.includes("requestBody") && !options.path?.includes("requestBodies") ? void 0 : ts.QUESTION_TOKEN;
        let type = $ref ? ts.oapiRef($ref) : transformSchemaObject(v, {
          ...options,
          path: utils.createRef([options.path, k])
        });
        if (typeof options.ctx.transform === "function") {
          const result = options.ctx.transform(v, options);
          if (result && typeof result === "object") {
            if ("schema" in result) {
              type = result.schema;
              optional = result.questionToken ? ts.QUESTION_TOKEN : optional;
            } else {
              type = result;
            }
          }
        }
        const property = ts__default.factory.createPropertySignature(
          /* modifiers     */
          ts.tsModifiers({
            readonly: options.ctx.immutable || readOnly
          }),
          /* name          */
          ts.tsPropertyIndex(k),
          /* questionToken */
          optional,
          /* type          */
          type
        );
        ts.addJSDocComment(v, property);
        coreObjectType.push(property);
      }
    }
    if (schemaObject.$defs && typeof schemaObject.$defs === "object" && Object.keys(schemaObject.$defs).length) {
      const defKeys = [];
      for (const [k, v] of Object.entries(schemaObject.$defs)) {
        const property = ts__default.factory.createPropertySignature(
          /* modifiers    */
          ts.tsModifiers({
            readonly: options.ctx.immutable || "readonly" in v && !!v.readOnly
          }),
          /* name          */
          ts.tsPropertyIndex(k),
          /* questionToken */
          void 0,
          /* type          */
          transformSchemaObject(v, {
            ...options,
            path: utils.createRef([options.path, "$defs", k])
          })
        );
        ts.addJSDocComment(v, property);
        defKeys.push(property);
      }
      coreObjectType.push(
        ts__default.factory.createPropertySignature(
          /* modifiers     */
          void 0,
          /* name          */
          ts.tsPropertyIndex("$defs"),
          /* questionToken */
          void 0,
          /* type          */
          ts__default.factory.createTypeLiteralNode(defKeys)
        )
      );
    }
    if (schemaObject.additionalProperties || options.ctx.additionalProperties) {
      const hasExplicitAdditionalProperties = typeof schemaObject.additionalProperties === "object" && Object.keys(schemaObject.additionalProperties).length;
      const addlType = hasExplicitAdditionalProperties ? transformSchemaObject(schemaObject.additionalProperties, options) : ts.UNKNOWN;
      return ts.tsIntersection([
        ...coreObjectType.length ? [ts__default.factory.createTypeLiteralNode(coreObjectType)] : [],
        ts__default.factory.createTypeLiteralNode([
          ts__default.factory.createIndexSignature(
            /* modifiers  */
            ts.tsModifiers({
              readonly: options.ctx.immutable
            }),
            /* parameters */
            [
              ts__default.factory.createParameterDeclaration(
                /* modifiers      */
                void 0,
                /* dotDotDotToken */
                void 0,
                /* name           */
                ts__default.factory.createIdentifier("key"),
                /* questionToken  */
                void 0,
                /* type           */
                ts.STRING
              )
            ],
            /* type       */
            addlType
          )
        ])
      ]);
    }
  }
  return coreObjectType.length ? ts__default.factory.createTypeLiteralNode(coreObjectType) : void 0;
}
function hasKey(possibleObject, key) {
  return typeof possibleObject === "object" && possibleObject !== null && key in possibleObject;
}

exports.default = transformSchemaObject;
exports.transformSchemaObjectWithComposition = transformSchemaObjectWithComposition;
//# sourceMappingURL=schema-object.cjs.map
