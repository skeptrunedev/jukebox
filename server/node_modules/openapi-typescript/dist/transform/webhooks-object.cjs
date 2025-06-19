'use strict';

const ts = require('typescript');
const ts$1 = require('../lib/ts.cjs');
const utils = require('../lib/utils.cjs');
const pathItemObject = require('./path-item-object.cjs');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const ts__default = /*#__PURE__*/_interopDefaultCompat(ts);

function transformWebhooksObject(webhooksObject, options) {
  const type = [];
  for (const [name, pathItemObject$1] of utils.getEntries(webhooksObject, options)) {
    type.push(
      ts__default.factory.createPropertySignature(
        /* modifiers     */
        ts$1.tsModifiers({
          readonly: options.immutable
        }),
        /* name          */
        ts$1.tsPropertyIndex(name),
        /* questionToken */
        void 0,
        /* type          */
        pathItemObject(pathItemObject$1, {
          path: utils.createRef(["webhooks", name]),
          ctx: options
        })
      )
    );
  }
  return ts__default.factory.createTypeLiteralNode(type);
}

module.exports = transformWebhooksObject;
//# sourceMappingURL=webhooks-object.cjs.map
