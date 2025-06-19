'use strict';

const refUtils_js = require('@redocly/openapi-core/lib/ref-utils.js');
const c = require('ansi-colors');
const supportsColor = require('supports-color');
const ts = require('typescript');
const ts$1 = require('./ts.cjs');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const c__default = /*#__PURE__*/_interopDefaultCompat(c);
const supportsColor__default = /*#__PURE__*/_interopDefaultCompat(supportsColor);
const ts__default = /*#__PURE__*/_interopDefaultCompat(ts);

if (!supportsColor__default.stdout || supportsColor__default.stdout.hasBasic === false) {
  c__default.enabled = false;
}
const DEBUG_GROUPS = {
  redoc: c__default.cyanBright,
  lint: c__default.yellowBright,
  bundle: c__default.magentaBright,
  ts: c__default.blueBright
};
function createDiscriminatorProperty(discriminator, { path, readonly = false }) {
  let value = refUtils_js.parseRef(path).pointer.pop();
  if (discriminator.mapping) {
    const matchedValue = Object.entries(discriminator.mapping).find(
      ([, v]) => !v.startsWith("#") && v === value || v.startsWith("#") && refUtils_js.parseRef(v).pointer.pop() === value
    );
    if (matchedValue) {
      value = matchedValue[0];
    }
  }
  return ts__default.factory.createPropertySignature(
    /* modifiers     */
    ts$1.tsModifiers({
      readonly
    }),
    /* name          */
    ts$1.tsPropertyIndex(discriminator.propertyName),
    /* questionToken */
    void 0,
    /* type          */
    ts$1.tsLiteral(value)
  );
}
function createRef(parts) {
  let pointer = "#";
  for (const part of parts) {
    if (part === void 0 || part === null || part === "") {
      continue;
    }
    const maybeRef = refUtils_js.parseRef(String(part)).pointer;
    if (maybeRef.length) {
      for (const refPart of maybeRef) {
        pointer += `/${refUtils_js.escapePointer(refPart)}`;
      }
    } else {
      pointer += `/${refUtils_js.escapePointer(part)}`;
    }
  }
  return pointer;
}
function debug(msg, group, time) {
  if (process.env.DEBUG && (!group || process.env.DEBUG === "*" || process.env.DEBUG === "openapi-ts:*" || process.env.DEBUG.toLocaleLowerCase() === `openapi-ts:${group.toLocaleLowerCase()}`)) {
    const groupColor = group && DEBUG_GROUPS[group] || c__default.whiteBright;
    const groupName = groupColor(`openapi-ts:${group ?? "info"}`);
    let timeFormatted = "";
    if (typeof time === "number") {
      timeFormatted = c__default.green(` ${formatTime(time)} `);
    }
    console.debug(`  ${c__default.bold(groupName)}${timeFormatted}${msg}`);
  }
}
function error(msg) {
  console.error(c__default.red(` \u2718  ${msg}`));
}
function formatTime(t) {
  if (typeof t === "number") {
    if (t < 1e3) {
      return `${Math.round(10 * t) / 10}ms`;
    }
    if (t < 6e4) {
      return `${Math.round(t / 100) / 10}s`;
    }
    return `${Math.round(t / 6e3) / 10}m`;
  }
  return t;
}
function getEntries(obj, options) {
  let entries = Object.entries(obj);
  if (options?.alphabetize) {
    entries.sort(([a], [b]) => a.localeCompare(b, "en-us", { numeric: true }));
  }
  if (options?.excludeDeprecated) {
    entries = entries.filter(([, v]) => !(v && typeof v === "object" && "deprecated" in v && v.deprecated));
  }
  return entries;
}
function resolveRef(schema, $ref, { silent = false, visited = [] }) {
  const { pointer } = refUtils_js.parseRef($ref);
  if (!pointer.length) {
    return void 0;
  }
  let node = schema;
  for (const key of pointer) {
    if (node && typeof node === "object" && node[key]) {
      node = node[key];
    } else {
      warn(`Could not resolve $ref "${$ref}"`, silent);
      return void 0;
    }
  }
  if (node && typeof node === "object" && node.$ref) {
    if (visited.includes(node.$ref)) {
      warn(`Could not resolve circular $ref "${$ref}"`, silent);
      return void 0;
    }
    return resolveRef(schema, node.$ref, {
      silent,
      visited: [...visited, node.$ref]
    });
  }
  return node;
}
function createDiscriminatorEnum(values, prevSchema) {
  return {
    type: "string",
    enum: values,
    description: prevSchema?.description ? `${prevSchema.description} (enum property replaced by openapi-typescript)` : "discriminator enum property added by openapi-typescript"
  };
}
function patchDiscriminatorEnum(schema, ref, values, discriminator, discriminatorRef, options) {
  const resolvedSchema = resolveRef(schema, ref, {
    silent: options.silent ?? false
  });
  if (resolvedSchema?.allOf) {
    resolvedSchema.allOf.push({
      type: "object",
      // discriminator enum properties always need to be required
      required: [discriminator.propertyName],
      properties: {
        [discriminator.propertyName]: createDiscriminatorEnum(values)
      }
    });
    return true;
  } else if (typeof resolvedSchema === "object" && "type" in resolvedSchema && resolvedSchema.type === "object") {
    if (!resolvedSchema.properties) {
      resolvedSchema.properties = {};
    }
    if (!resolvedSchema.required) {
      resolvedSchema.required = [discriminator.propertyName];
    } else if (!resolvedSchema.required.includes(discriminator.propertyName)) {
      resolvedSchema.required.push(discriminator.propertyName);
    }
    resolvedSchema.properties[discriminator.propertyName] = createDiscriminatorEnum(
      values,
      resolvedSchema.properties[discriminator.propertyName]
    );
    return true;
  }
  warn(
    `Discriminator mapping has an invalid schema (neither an object schema nor an allOf array): ${ref} => ${values.join(
      ", "
    )} (Discriminator: ${discriminatorRef})`,
    options.silent
  );
  return false;
}
function scanDiscriminators(schema, options) {
  const objects = {};
  const refsHandled = [];
  walk(schema, (obj, path) => {
    const discriminator = obj?.discriminator;
    if (!discriminator?.propertyName) {
      return;
    }
    const ref = createRef(path);
    objects[ref] = discriminator;
    if (!obj?.oneOf || !Array.isArray(obj.oneOf)) {
      return;
    }
    const oneOf = obj.oneOf;
    const mapping = {};
    for (const item of oneOf) {
      if ("$ref" in item) {
        const value = item.$ref.split("/").pop();
        if (value) {
          if (!mapping[item.$ref]) {
            mapping[item.$ref] = { inferred: value };
          } else {
            mapping[item.$ref].inferred = value;
          }
        }
      }
    }
    if (discriminator.mapping) {
      for (const mappedValue in discriminator.mapping) {
        const mappedRef = discriminator.mapping[mappedValue];
        if (!mappedRef) {
          continue;
        }
        if (!mapping[mappedRef]?.defined) {
          mapping[mappedRef] = { defined: [] };
        }
        mapping[mappedRef].defined?.push(mappedValue);
      }
    }
    for (const [mappedRef, { inferred, defined }] of Object.entries(mapping)) {
      if (refsHandled.includes(mappedRef)) {
        continue;
      }
      if (!inferred && !defined) {
        continue;
      }
      const mappedValues = defined ?? [inferred];
      if (patchDiscriminatorEnum(schema, mappedRef, mappedValues, discriminator, ref, options)) {
        refsHandled.push(mappedRef);
      }
    }
  });
  walk(schema, (obj, path) => {
    if (!obj || !Array.isArray(obj.allOf)) {
      return;
    }
    for (const item of obj.allOf) {
      if ("$ref" in item) {
        if (!objects[item.$ref]) {
          return;
        }
        const ref = createRef(path);
        const discriminator = objects[item.$ref];
        const mappedValues = [];
        if (discriminator.mapping) {
          for (const mappedValue in discriminator.mapping) {
            if (discriminator.mapping[mappedValue] === ref) {
              mappedValues.push(mappedValue);
            }
          }
          if (mappedValues.length > 0) {
            if (patchDiscriminatorEnum(
              schema,
              ref,
              mappedValues,
              discriminator,
              item.$ref,
              options
            )) {
              refsHandled.push(ref);
            }
          }
        }
        objects[ref] = {
          ...objects[item.$ref]
        };
      } else if (item.discriminator?.propertyName) {
        objects[createRef(path)] = { ...item.discriminator };
      }
    }
  });
  return { objects, refsHandled };
}
function walk(obj, cb, path = []) {
  if (!obj || typeof obj !== "object") {
    return;
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      walk(obj[i], cb, path.concat(i));
    }
    return;
  }
  cb(obj, path);
  for (const k of Object.keys(obj)) {
    walk(obj[k], cb, path.concat(k));
  }
}
function warn(msg, silent = false) {
  if (!silent) {
    console.warn(c__default.yellow(` \u26A0  ${msg}`));
  }
}

exports.c = c__default;
exports.createDiscriminatorProperty = createDiscriminatorProperty;
exports.createRef = createRef;
exports.debug = debug;
exports.error = error;
exports.formatTime = formatTime;
exports.getEntries = getEntries;
exports.resolveRef = resolveRef;
exports.scanDiscriminators = scanDiscriminators;
exports.walk = walk;
exports.warn = warn;
//# sourceMappingURL=utils.cjs.map
