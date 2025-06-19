'use strict';

const refUtils_js = require('@redocly/openapi-core/lib/ref-utils.js');
const ts = require('typescript');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const ts__default = /*#__PURE__*/_interopDefaultCompat(ts);

const JS_PROPERTY_INDEX_RE = /^[A-Za-z_$][A-Za-z_$0-9]*$/;
const JS_ENUM_INVALID_CHARS_RE = /[^A-Za-z_$0-9]+(.)?/g;
const JS_PROPERTY_INDEX_INVALID_CHARS_RE = /[^A-Za-z_$0-9]+/g;
const SPECIAL_CHARACTER_MAP = {
  "+": "Plus"
  // Add more mappings as needed
};
const BOOLEAN = ts__default.factory.createKeywordTypeNode(ts__default.SyntaxKind.BooleanKeyword);
const FALSE = ts__default.factory.createLiteralTypeNode(ts__default.factory.createFalse());
const NEVER = ts__default.factory.createKeywordTypeNode(ts__default.SyntaxKind.NeverKeyword);
const NULL = ts__default.factory.createLiteralTypeNode(ts__default.factory.createNull());
const NUMBER = ts__default.factory.createKeywordTypeNode(ts__default.SyntaxKind.NumberKeyword);
const QUESTION_TOKEN = ts__default.factory.createToken(ts__default.SyntaxKind.QuestionToken);
const STRING = ts__default.factory.createKeywordTypeNode(ts__default.SyntaxKind.StringKeyword);
const TRUE = ts__default.factory.createLiteralTypeNode(ts__default.factory.createTrue());
const UNDEFINED = ts__default.factory.createKeywordTypeNode(ts__default.SyntaxKind.UndefinedKeyword);
const UNKNOWN = ts__default.factory.createKeywordTypeNode(ts__default.SyntaxKind.UnknownKeyword);
const LB_RE = /\r?\n/g;
const COMMENT_RE = /\*\//g;
function addJSDocComment(schemaObject, node) {
  if (!schemaObject || typeof schemaObject !== "object" || Array.isArray(schemaObject)) {
    return;
  }
  const output = [];
  if (schemaObject.title) {
    output.push(schemaObject.title.replace(LB_RE, "\n *     "));
  }
  if (schemaObject.summary) {
    output.push(schemaObject.summary.replace(LB_RE, "\n *     "));
  }
  if (schemaObject.format) {
    output.push(`Format: ${schemaObject.format}`);
  }
  if (schemaObject.deprecated) {
    output.push("@deprecated");
  }
  const supportedJsDocTags = ["description", "default", "example"];
  for (const field of supportedJsDocTags) {
    const allowEmptyString = field === "default" || field === "example";
    if (schemaObject[field] === void 0) {
      continue;
    }
    if (schemaObject[field] === "" && !allowEmptyString) {
      continue;
    }
    const serialized = typeof schemaObject[field] === "object" ? JSON.stringify(schemaObject[field], null, 2) : schemaObject[field];
    output.push(`@${field} ${String(serialized).replace(LB_RE, "\n *     ")}`);
  }
  if ("const" in schemaObject) {
    output.push("@constant");
  }
  if (schemaObject.enum) {
    let type = "unknown";
    if (Array.isArray(schemaObject.type)) {
      type = schemaObject.type.join("|");
    } else if (typeof schemaObject.type === "string") {
      type = schemaObject.type;
    }
    output.push(`@enum {${type}${schemaObject.nullable ? "|null" : ""}}`);
  }
  if (output.length) {
    let text = output.length === 1 ? `* ${output.join("\n")} ` : `*
 * ${output.join("\n * ")}
 `;
    text = text.replace(COMMENT_RE, "*\\/");
    ts__default.addSyntheticLeadingComment(
      /* node               */
      node,
      /* kind               */
      ts__default.SyntaxKind.MultiLineCommentTrivia,
      // note: MultiLine just refers to a "/* */" comment
      /* text               */
      text,
      /* hasTrailingNewLine */
      true
    );
  }
}
function isOasRef(obj) {
  return Boolean(obj.$ref);
}
function isParameterObject(obj) {
  return Boolean(obj && !isOasRef(obj) && obj.in);
}
function addIndexedAccess(node, ...segments) {
  return segments.reduce((acc, segment) => {
    return ts__default.factory.createIndexedAccessTypeNode(
      acc,
      ts__default.factory.createLiteralTypeNode(
        typeof segment === "number" ? ts__default.factory.createNumericLiteral(segment) : ts__default.factory.createStringLiteral(segment)
      )
    );
  }, node);
}
function oapiRef(path, resolved) {
  const { pointer } = refUtils_js.parseRef(path);
  if (pointer.length === 0) {
    throw new Error(`Error parsing $ref: ${path}. Is this a valid $ref?`);
  }
  const parametersObject = isParameterObject(resolved);
  const initialSegment = pointer[0];
  const leadingSegments = pointer.slice(1, 3);
  const restSegments = pointer.slice(3);
  const leadingType = addIndexedAccess(
    ts__default.factory.createTypeReferenceNode(ts__default.factory.createIdentifier(String(initialSegment))),
    ...leadingSegments
  );
  return restSegments.reduce((acc, segment, index, original) => {
    if (segment === "properties") {
      return acc;
    }
    if (parametersObject && index === original.length - 1) {
      return addIndexedAccess(acc, resolved.in, resolved.name);
    }
    return addIndexedAccess(acc, segment);
  }, leadingType);
}
function astToString(ast, options) {
  const sourceFile = ts__default.createSourceFile(
    options?.fileName ?? "openapi-ts.ts",
    options?.sourceText ?? "",
    ts__default.ScriptTarget.ESNext,
    false,
    ts__default.ScriptKind.TS
  );
  sourceFile.statements = ts__default.factory.createNodeArray(Array.isArray(ast) ? ast : [ast]);
  const printer = ts__default.createPrinter({
    newLine: ts__default.NewLineKind.LineFeed,
    removeComments: false,
    ...options?.formatOptions
  });
  return printer.printFile(sourceFile);
}
function stringToAST(source) {
  return ts__default.createSourceFile(
    /* fileName        */
    "stringInput",
    /* sourceText      */
    source,
    /* languageVersion */
    ts__default.ScriptTarget.ESNext,
    /* setParentNodes  */
    void 0,
    /* scriptKind      */
    void 0
  ).statements;
}
function tsDedupe(types) {
  const encounteredTypes = /* @__PURE__ */ new Set();
  const filteredTypes = [];
  for (const t of types) {
    if (!("text" in (t.literal ?? t))) {
      const { kind } = t.literal ?? t;
      if (encounteredTypes.has(kind)) {
        continue;
      }
      if (tsIsPrimitive(t)) {
        encounteredTypes.add(kind);
      }
    }
    filteredTypes.push(t);
  }
  return filteredTypes;
}
const enumCache = /* @__PURE__ */ new Map();
function tsEnum(name, members, metadata, options) {
  let enumName = sanitizeMemberName(name);
  enumName = `${enumName[0].toUpperCase()}${enumName.substring(1)}`;
  let key = "";
  if (options?.shouldCache) {
    key = `${members.slice(0).sort().map((v, i) => {
      return `${metadata?.[i]?.name ?? String(v)}:${metadata?.[i]?.description || ""}`;
    }).join(",")}`;
    if (enumCache.has(key)) {
      return enumCache.get(key);
    }
  }
  const enumDeclaration = ts__default.factory.createEnumDeclaration(
    /* modifiers */
    options ? tsModifiers({ export: options.export ?? false }) : void 0,
    /* name      */
    enumName,
    /* members   */
    members.map((value, i) => tsEnumMember(value, metadata?.[i]))
  );
  options?.shouldCache && enumCache.set(key, enumDeclaration);
  return enumDeclaration;
}
function tsArrayLiteralExpression(name, elementType, values, options) {
  let variableName = sanitizeMemberName(name);
  variableName = `${variableName[0].toLowerCase()}${variableName.substring(1)}`;
  const arrayType = options?.readonly ? tsReadonlyArray(elementType, options.injectFooter) : ts__default.factory.createArrayTypeNode(elementType);
  return ts__default.factory.createVariableStatement(
    options ? tsModifiers({ export: options.export ?? false }) : void 0,
    ts__default.factory.createVariableDeclarationList(
      [
        ts__default.factory.createVariableDeclaration(
          variableName,
          void 0,
          arrayType,
          ts__default.factory.createArrayLiteralExpression(
            values.map((value) => {
              if (typeof value === "number") {
                if (value < 0) {
                  return ts__default.factory.createPrefixUnaryExpression(
                    ts__default.SyntaxKind.MinusToken,
                    ts__default.factory.createNumericLiteral(Math.abs(value))
                  );
                } else {
                  return ts__default.factory.createNumericLiteral(value);
                }
              } else {
                return ts__default.factory.createStringLiteral(value);
              }
            })
          )
        )
      ],
      ts__default.NodeFlags.Const
    )
  );
}
function sanitizeMemberName(name) {
  let sanitizedName = name.replace(JS_ENUM_INVALID_CHARS_RE, (c) => {
    const last = c[c.length - 1];
    return JS_PROPERTY_INDEX_INVALID_CHARS_RE.test(last) ? "" : last.toUpperCase();
  });
  if (Number(name[0]) >= 0) {
    sanitizedName = `Value${name}`;
  }
  return sanitizedName;
}
function tsEnumMember(value, metadata = {}) {
  let name = metadata.name ?? String(value);
  if (!JS_PROPERTY_INDEX_RE.test(name)) {
    if (Number(name[0]) >= 0) {
      name = `Value${name}`.replace(".", "_");
    } else if (name[0] === "-") {
      name = `ValueMinus${name.slice(1)}`;
    }
    const invalidCharMatch = name.match(JS_PROPERTY_INDEX_INVALID_CHARS_RE);
    if (invalidCharMatch) {
      if (invalidCharMatch[0] === name) {
        name = `"${name}"`;
      } else {
        name = name.replace(JS_PROPERTY_INDEX_INVALID_CHARS_RE, (s) => {
          return s in SPECIAL_CHARACTER_MAP ? SPECIAL_CHARACTER_MAP[s] : "_";
        });
      }
    }
  }
  let member;
  if (typeof value === "number") {
    const literal = value < 0 ? ts__default.factory.createPrefixUnaryExpression(
      ts__default.SyntaxKind.MinusToken,
      ts__default.factory.createNumericLiteral(Math.abs(value))
    ) : ts__default.factory.createNumericLiteral(value);
    member = ts__default.factory.createEnumMember(name, literal);
  } else {
    member = ts__default.factory.createEnumMember(name, ts__default.factory.createStringLiteral(value));
  }
  if (metadata.description === void 0) {
    return member;
  }
  return ts__default.addSyntheticLeadingComment(
    member,
    ts__default.SyntaxKind.SingleLineCommentTrivia,
    " ".concat(metadata.description.trim()),
    true
  );
}
function tsIntersection(types) {
  if (types.length === 0) {
    return NEVER;
  }
  if (types.length === 1) {
    return types[0];
  }
  return ts__default.factory.createIntersectionTypeNode(tsDedupe(types));
}
function tsIsPrimitive(type) {
  if (!type) {
    return true;
  }
  return ts__default.SyntaxKind[type.kind] === "BooleanKeyword" || ts__default.SyntaxKind[type.kind] === "NeverKeyword" || ts__default.SyntaxKind[type.kind] === "NullKeyword" || ts__default.SyntaxKind[type.kind] === "NumberKeyword" || ts__default.SyntaxKind[type.kind] === "StringKeyword" || ts__default.SyntaxKind[type.kind] === "UndefinedKeyword" || "literal" in type && tsIsPrimitive(type.literal);
}
function tsLiteral(value) {
  if (typeof value === "string") {
    return ts__default.factory.createIdentifier(JSON.stringify(value));
  }
  if (typeof value === "number") {
    const literal = value < 0 ? ts__default.factory.createPrefixUnaryExpression(
      ts__default.SyntaxKind.MinusToken,
      ts__default.factory.createNumericLiteral(Math.abs(value))
    ) : ts__default.factory.createNumericLiteral(value);
    return ts__default.factory.createLiteralTypeNode(literal);
  }
  if (typeof value === "boolean") {
    return value === true ? TRUE : FALSE;
  }
  if (value === null) {
    return NULL;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return ts__default.factory.createArrayTypeNode(NEVER);
    }
    return ts__default.factory.createTupleTypeNode(value.map((v) => tsLiteral(v)));
  }
  if (typeof value === "object") {
    const keys = [];
    for (const [k, v] of Object.entries(value)) {
      keys.push(
        ts__default.factory.createPropertySignature(
          /* modifiers     */
          void 0,
          /* name          */
          tsPropertyIndex(k),
          /* questionToken */
          void 0,
          /* type          */
          tsLiteral(v)
        )
      );
    }
    return keys.length ? ts__default.factory.createTypeLiteralNode(keys) : tsRecord(STRING, NEVER);
  }
  return UNKNOWN;
}
function tsModifiers(modifiers) {
  const typeMods = [];
  if (modifiers.export) {
    typeMods.push(ts__default.factory.createModifier(ts__default.SyntaxKind.ExportKeyword));
  }
  if (modifiers.readonly) {
    typeMods.push(ts__default.factory.createModifier(ts__default.SyntaxKind.ReadonlyKeyword));
  }
  return typeMods;
}
function tsNullable(types) {
  return ts__default.factory.createUnionTypeNode([...types, NULL]);
}
function tsOmit(type, keys) {
  return ts__default.factory.createTypeReferenceNode(ts__default.factory.createIdentifier("Omit"), [
    type,
    ts__default.factory.createUnionTypeNode(keys.map((k) => tsLiteral(k)))
  ]);
}
function tsRecord(key, value) {
  return ts__default.factory.createTypeReferenceNode(ts__default.factory.createIdentifier("Record"), [key, value]);
}
function tsPropertyIndex(index) {
  if (typeof index === "number" && !(index < 0) || typeof index === "string" && String(Number(index)) === index && index[0] !== "-") {
    return ts__default.factory.createNumericLiteral(index);
  }
  return typeof index === "string" && JS_PROPERTY_INDEX_RE.test(index) ? ts__default.factory.createIdentifier(index) : ts__default.factory.createStringLiteral(String(index));
}
function tsUnion(types) {
  if (types.length === 0) {
    return NEVER;
  }
  if (types.length === 1) {
    return types[0];
  }
  return ts__default.factory.createUnionTypeNode(tsDedupe(types));
}
function tsWithRequired(type, keys, injectFooter) {
  if (keys.length === 0) {
    return type;
  }
  if (!injectFooter.some((node) => ts__default.isTypeAliasDeclaration(node) && node?.name?.escapedText === "WithRequired")) {
    const helper = stringToAST("type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };")[0];
    injectFooter.push(helper);
  }
  return ts__default.factory.createTypeReferenceNode(ts__default.factory.createIdentifier("WithRequired"), [
    type,
    tsUnion(keys.map((k) => tsLiteral(k)))
  ]);
}
function tsReadonlyArray(type, injectFooter) {
  if (injectFooter && !injectFooter.some((node) => ts__default.isTypeAliasDeclaration(node) && node?.name?.escapedText === "ReadonlyArray")) {
    const helper = stringToAST(
      "type ReadonlyArray<T> = [Exclude<T, undefined>] extends [unknown[]] ? Readonly<Exclude<T, undefined>> : Readonly<Exclude<T, undefined>[]>;"
    )[0];
    injectFooter.push(helper);
  }
  return ts__default.factory.createTypeReferenceNode(ts__default.factory.createIdentifier("ReadonlyArray"), [type]);
}

exports.BOOLEAN = BOOLEAN;
exports.FALSE = FALSE;
exports.JS_ENUM_INVALID_CHARS_RE = JS_ENUM_INVALID_CHARS_RE;
exports.JS_PROPERTY_INDEX_INVALID_CHARS_RE = JS_PROPERTY_INDEX_INVALID_CHARS_RE;
exports.JS_PROPERTY_INDEX_RE = JS_PROPERTY_INDEX_RE;
exports.NEVER = NEVER;
exports.NULL = NULL;
exports.NUMBER = NUMBER;
exports.QUESTION_TOKEN = QUESTION_TOKEN;
exports.SPECIAL_CHARACTER_MAP = SPECIAL_CHARACTER_MAP;
exports.STRING = STRING;
exports.TRUE = TRUE;
exports.UNDEFINED = UNDEFINED;
exports.UNKNOWN = UNKNOWN;
exports.addJSDocComment = addJSDocComment;
exports.astToString = astToString;
exports.enumCache = enumCache;
exports.oapiRef = oapiRef;
exports.stringToAST = stringToAST;
exports.tsArrayLiteralExpression = tsArrayLiteralExpression;
exports.tsDedupe = tsDedupe;
exports.tsEnum = tsEnum;
exports.tsEnumMember = tsEnumMember;
exports.tsIntersection = tsIntersection;
exports.tsIsPrimitive = tsIsPrimitive;
exports.tsLiteral = tsLiteral;
exports.tsModifiers = tsModifiers;
exports.tsNullable = tsNullable;
exports.tsOmit = tsOmit;
exports.tsPropertyIndex = tsPropertyIndex;
exports.tsReadonlyArray = tsReadonlyArray;
exports.tsRecord = tsRecord;
exports.tsUnion = tsUnion;
exports.tsWithRequired = tsWithRequired;
//# sourceMappingURL=ts.cjs.map
