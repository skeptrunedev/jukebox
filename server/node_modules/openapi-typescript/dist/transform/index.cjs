'use strict';

const ts$1 = require('typescript');
const node_perf_hooks = require('node:perf_hooks');
const ts = require('../lib/ts.cjs');
const utils = require('../lib/utils.cjs');
const componentsObject = require('./components-object.cjs');
const pathsObject = require('./paths-object.cjs');
const schemaObject = require('./schema-object.cjs');
const webhooksObject = require('./webhooks-object.cjs');
const pathsEnum = require('./paths-enum.cjs');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const ts__default = /*#__PURE__*/_interopDefaultCompat(ts$1);

const transformers = {
  paths: pathsObject,
  webhooks: webhooksObject,
  components: componentsObject.default,
  $defs: (node, options) => schemaObject.default(node, { path: utils.createRef(["$defs"]), ctx: options, schema: node })
};
function transformSchema(schema, ctx) {
  const type = [];
  if (ctx.inject) {
    const injectNodes = ts.stringToAST(ctx.inject);
    type.push(...injectNodes);
  }
  for (const root of Object.keys(transformers)) {
    const emptyObj = ts__default.factory.createTypeAliasDeclaration(
      /* modifiers      */
      ts.tsModifiers({ export: true }),
      /* name           */
      root,
      /* typeParameters */
      void 0,
      /* type           */
      ts.tsRecord(ts.STRING, ts.NEVER)
    );
    if (schema[root] && typeof schema[root] === "object") {
      const rootT = node_perf_hooks.performance.now();
      const subTypes = [].concat(transformers[root](schema[root], ctx));
      for (const subType of subTypes) {
        if (ts__default.isTypeNode(subType)) {
          if (subType.members?.length) {
            type.push(
              ctx.exportType ? ts__default.factory.createTypeAliasDeclaration(
                /* modifiers      */
                ts.tsModifiers({ export: true }),
                /* name           */
                root,
                /* typeParameters */
                void 0,
                /* type           */
                subType
              ) : ts__default.factory.createInterfaceDeclaration(
                /* modifiers       */
                ts.tsModifiers({ export: true }),
                /* name            */
                root,
                /* typeParameters  */
                void 0,
                /* heritageClauses */
                void 0,
                /* members         */
                subType.members
              )
            );
            utils.debug(`${root} done`, "ts", node_perf_hooks.performance.now() - rootT);
          } else {
            type.push(emptyObj);
            utils.debug(`${root} done (skipped)`, "ts", 0);
          }
        } else if (ts__default.isTypeAliasDeclaration(subType)) {
          type.push(subType);
        } else {
          type.push(emptyObj);
          utils.debug(`${root} done (skipped)`, "ts", 0);
        }
      }
    } else {
      type.push(emptyObj);
      utils.debug(`${root} done (skipped)`, "ts", 0);
    }
  }
  let hasOperations = false;
  for (const injectedType of ctx.injectFooter) {
    if (!hasOperations && injectedType?.name?.escapedText === "operations") {
      hasOperations = true;
    }
    type.push(injectedType);
  }
  if (!hasOperations) {
    type.push(
      ts__default.factory.createTypeAliasDeclaration(
        /* modifiers      */
        ts.tsModifiers({ export: true }),
        /* name           */
        "operations",
        /* typeParameters */
        void 0,
        /* type           */
        ts.tsRecord(ts.STRING, ts.NEVER)
      )
    );
  }
  if (ctx.makePathsEnum && schema.paths) {
    type.push(pathsEnum(schema.paths));
  }
  return type;
}

module.exports = transformSchema;
//# sourceMappingURL=index.cjs.map
