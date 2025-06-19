import ts from 'typescript';
import { tsModifiers, tsPropertyIndex } from '../lib/ts.mjs';
import { getEntries, createRef } from '../lib/utils.mjs';
import transformPathItemObject from './path-item-object.mjs';

function transformWebhooksObject(webhooksObject, options) {
  const type = [];
  for (const [name, pathItemObject] of getEntries(webhooksObject, options)) {
    type.push(
      ts.factory.createPropertySignature(
        /* modifiers     */
        tsModifiers({
          readonly: options.immutable
        }),
        /* name          */
        tsPropertyIndex(name),
        /* questionToken */
        void 0,
        /* type          */
        transformPathItemObject(pathItemObject, {
          path: createRef(["webhooks", name]),
          ctx: options
        })
      )
    );
  }
  return ts.factory.createTypeLiteralNode(type);
}

export { transformWebhooksObject as default };
//# sourceMappingURL=webhooks-object.mjs.map
