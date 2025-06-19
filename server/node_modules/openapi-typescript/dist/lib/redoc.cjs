'use strict';

const openapiCore = require('@redocly/openapi-core');
const node_perf_hooks = require('node:perf_hooks');
const node_stream = require('node:stream');
const node_url = require('node:url');
const parseJson = require('parse-json');
const utils = require('./utils.cjs');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const parseJson__default = /*#__PURE__*/_interopDefaultCompat(parseJson);

async function parseSchema(schema, { absoluteRef, resolver }) {
  if (!schema) {
    throw new Error("Can\u2019t parse empty schema");
  }
  if (schema instanceof URL) {
    const result = await resolver.resolveDocument(null, absoluteRef, true);
    if ("parsed" in result) {
      return result;
    }
    throw result.originalError;
  }
  if (schema instanceof node_stream.Readable) {
    const contents = await new Promise((resolve) => {
      schema.resume();
      schema.setEncoding("utf8");
      let content = "";
      schema.on("data", (chunk) => {
        content += chunk;
      });
      schema.on("end", () => {
        resolve(content.trim());
      });
    });
    return parseSchema(contents, { absoluteRef, resolver });
  }
  if (schema instanceof Buffer) {
    return parseSchema(schema.toString("utf8"), { absoluteRef, resolver });
  }
  if (typeof schema === "string") {
    if (schema.startsWith("http://") || schema.startsWith("https://") || schema.startsWith("file://")) {
      const url = new URL(schema);
      return parseSchema(url, {
        absoluteRef: url.protocol === "file:" ? node_url.fileURLToPath(url) : url.href,
        resolver
      });
    }
    if (schema[0] === "{") {
      return {
        source: new openapiCore.Source(absoluteRef, schema, "application/json"),
        parsed: parseJson__default(schema)
      };
    }
    return openapiCore.makeDocumentFromString(schema, absoluteRef);
  }
  if (typeof schema === "object" && !Array.isArray(schema)) {
    return {
      source: new openapiCore.Source(absoluteRef, JSON.stringify(schema), "application/json"),
      parsed: schema
    };
  }
  throw new Error(`Expected string, object, or Buffer. Got ${Array.isArray(schema) ? "Array" : typeof schema}`);
}
function _processProblems(problems, options) {
  if (problems.length) {
    let errorMessage = void 0;
    for (const problem of problems) {
      const problemLocation = problem.location?.[0].pointer;
      const problemMessage = problemLocation ? `${problem.message} at ${problemLocation}` : problem.message;
      if (problem.severity === "error") {
        errorMessage = problemMessage;
        utils.error(problemMessage);
      } else {
        utils.warn(problemMessage, options.silent);
      }
    }
    if (errorMessage) {
      throw new Error(errorMessage);
    }
  }
}
async function validateAndBundle(source, options) {
  const redocConfigT = node_perf_hooks.performance.now();
  utils.debug("Loaded Redoc config", "redoc", node_perf_hooks.performance.now() - redocConfigT);
  const redocParseT = node_perf_hooks.performance.now();
  let absoluteRef = node_url.fileURLToPath(new URL(options?.cwd ?? `file://${process.cwd()}/`));
  if (source instanceof URL) {
    absoluteRef = source.protocol === "file:" ? node_url.fileURLToPath(source) : source.href;
  }
  const resolver = new openapiCore.BaseResolver(options.redoc.resolve);
  const document = await parseSchema(source, {
    absoluteRef,
    resolver
  });
  utils.debug("Parsed schema", "redoc", node_perf_hooks.performance.now() - redocParseT);
  const openapiVersion = Number.parseFloat(document.parsed.openapi);
  if (document.parsed.swagger || !document.parsed.openapi || Number.isNaN(openapiVersion) || openapiVersion < 3 || openapiVersion >= 4) {
    if (document.parsed.swagger) {
      throw new Error("Unsupported Swagger version: 2.x. Use OpenAPI 3.x instead.");
    }
    if (document.parsed.openapi || openapiVersion < 3 || openapiVersion >= 4) {
      throw new Error(`Unsupported OpenAPI version: ${document.parsed.openapi}`);
    }
    throw new Error("Unsupported schema format, expected `openapi: 3.x`");
  }
  const redocLintT = node_perf_hooks.performance.now();
  const problems = await openapiCore.lintDocument({
    document,
    config: options.redoc.styleguide,
    externalRefResolver: resolver
  });
  _processProblems(problems, options);
  utils.debug("Linted schema", "lint", node_perf_hooks.performance.now() - redocLintT);
  const redocBundleT = node_perf_hooks.performance.now();
  const bundled = await openapiCore.bundle({
    config: options.redoc,
    dereference: false,
    doc: document
  });
  _processProblems(bundled.problems, options);
  utils.debug("Bundled schema", "bundle", node_perf_hooks.performance.now() - redocBundleT);
  return bundled.bundle.parsed;
}

exports.parseSchema = parseSchema;
exports.validateAndBundle = validateAndBundle;
//# sourceMappingURL=redoc.cjs.map
