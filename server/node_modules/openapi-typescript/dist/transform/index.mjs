import ts from 'typescript';
import { performance } from 'node:perf_hooks';
import { stringToAST, tsModifiers, tsRecord, NEVER, STRING } from '../lib/ts.mjs';
import { debug, createRef } from '../lib/utils.mjs';
import transformComponentsObject from './components-object.mjs';
import transformPathsObject from './paths-object.mjs';
import transformSchemaObject from './schema-object.mjs';
import transformWebhooksObject from './webhooks-object.mjs';
import makeApiPathsEnum from './paths-enum.mjs';

const transformers = {
  paths: transformPathsObject,
  webhooks: transformWebhooksObject,
  components: transformComponentsObject,
  $defs: (node, options) => transformSchemaObject(node, { path: createRef(["$defs"]), ctx: options, schema: node })
};
function transformSchema(schema, ctx) {
  const type = [];
  if (ctx.inject) {
    const injectNodes = stringToAST(ctx.inject);
    type.push(...injectNodes);
  }
  for (const root of Object.keys(transformers)) {
    const emptyObj = ts.factory.createTypeAliasDeclaration(
      /* modifiers      */
      tsModifiers({ export: true }),
      /* name           */
      root,
      /* typeParameters */
      void 0,
      /* type           */
      tsRecord(STRING, NEVER)
    );
    if (schema[root] && typeof schema[root] === "object") {
      const rootT = performance.now();
      const subTypes = [].concat(transformers[root](schema[root], ctx));
      for (const subType of subTypes) {
        if (ts.isTypeNode(subType)) {
          if (subType.members?.length) {
            type.push(
              ctx.exportType ? ts.factory.createTypeAliasDeclaration(
                /* modifiers      */
                tsModifiers({ export: true }),
                /* name           */
                root,
                /* typeParameters */
                void 0,
                /* type           */
                subType
              ) : ts.factory.createInterfaceDeclaration(
                /* modifiers       */
                tsModifiers({ export: true }),
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
            debug(`${root} done`, "ts", performance.now() - rootT);
          } else {
            type.push(emptyObj);
            debug(`${root} done (skipped)`, "ts", 0);
          }
        } else if (ts.isTypeAliasDeclaration(subType)) {
          type.push(subType);
        } else {
          type.push(emptyObj);
          debug(`${root} done (skipped)`, "ts", 0);
        }
      }
    } else {
      type.push(emptyObj);
      debug(`${root} done (skipped)`, "ts", 0);
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
      ts.factory.createTypeAliasDeclaration(
        /* modifiers      */
        tsModifiers({ export: true }),
        /* name           */
        "operations",
        /* typeParameters */
        void 0,
        /* type           */
        tsRecord(STRING, NEVER)
      )
    );
  }
  if (ctx.makePathsEnum && schema.paths) {
    type.push(makeApiPathsEnum(schema.paths));
  }
  return type;
}

export { transformSchema as default };
//# sourceMappingURL=index.mjs.map
