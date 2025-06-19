import ts from 'typescript';
import * as changeCase from 'change-case';
import { performance } from 'node:perf_hooks';
import { tsModifiers, tsPropertyIndex, QUESTION_TOKEN, addJSDocComment, NEVER } from '../lib/ts.mjs';
import { getEntries, createRef, debug } from '../lib/utils.mjs';
import transformHeaderObject from './header-object.mjs';
import transformParameterObject from './parameter-object.mjs';
import transformPathItemObject from './path-item-object.mjs';
import transformRequestBodyObject from './request-body-object.mjs';
import transformResponseObject from './response-object.mjs';
import transformSchemaObject from './schema-object.mjs';

const transformers = {
  schemas: transformSchemaObject,
  responses: transformResponseObject,
  parameters: transformParameterObject,
  requestBodies: transformRequestBodyObject,
  headers: transformHeaderObject,
  pathItems: transformPathItemObject
};
function transformComponentsObject(componentsObject, ctx) {
  const type = [];
  const rootTypeAliases = {};
  for (const key of Object.keys(transformers)) {
    const componentT = performance.now();
    const items = [];
    if (componentsObject[key]) {
      for (const [name, item] of getEntries(componentsObject[key], ctx)) {
        let subType = transformers[key](item, {
          path: createRef(["components", key, name]),
          schema: item,
          ctx
        });
        let hasQuestionToken = false;
        if (ctx.transform) {
          const result = ctx.transform(item, {
            path: createRef(["components", key, name]),
            schema: item,
            ctx
          });
          if (result) {
            if ("schema" in result) {
              subType = result.schema;
              hasQuestionToken = result.questionToken;
            } else {
              subType = result;
            }
          }
        }
        const property = ts.factory.createPropertySignature(
          /* modifiers     */
          tsModifiers({ readonly: ctx.immutable }),
          /* name          */
          tsPropertyIndex(name),
          /* questionToken */
          hasQuestionToken ? QUESTION_TOKEN : void 0,
          /* type          */
          subType
        );
        addJSDocComment(item, property);
        items.push(property);
        if (ctx.rootTypes) {
          const componentKey = changeCase.pascalCase(singularizeComponentKey(key));
          let aliasName = `${componentKey}${changeCase.pascalCase(name)}`;
          let conflictCounter = 1;
          while (rootTypeAliases[aliasName] !== void 0) {
            conflictCounter++;
            aliasName = `${componentKey}${changeCase.pascalCase(name)}_${conflictCounter}`;
          }
          const ref = ts.factory.createTypeReferenceNode(`components['${key}']['${name}']`);
          if (ctx.rootTypesNoSchemaPrefix && key === "schemas") {
            aliasName = aliasName.replace(componentKey, "");
          }
          const typeAlias = ts.factory.createTypeAliasDeclaration(
            /* modifiers      */
            tsModifiers({ export: true }),
            /* name           */
            aliasName,
            /* typeParameters */
            void 0,
            /* type           */
            ref
          );
          rootTypeAliases[aliasName] = typeAlias;
        }
      }
    }
    type.push(
      ts.factory.createPropertySignature(
        /* modifiers     */
        void 0,
        /* name          */
        tsPropertyIndex(key),
        /* questionToken */
        void 0,
        /* type          */
        items.length ? ts.factory.createTypeLiteralNode(items) : NEVER
      )
    );
    debug(`Transformed components \u2192 ${key}`, "ts", performance.now() - componentT);
  }
  let rootTypes = [];
  if (ctx.rootTypes) {
    rootTypes = Object.keys(rootTypeAliases).map((k) => rootTypeAliases[k]);
  }
  return [ts.factory.createTypeLiteralNode(type), ...rootTypes];
}
function singularizeComponentKey(key) {
  switch (key) {
    // Handle special singular case
    case "requestBodies":
      return "requestBody";
    // Default to removing the "s"
    default:
      return key.slice(0, -1);
  }
}

export { transformComponentsObject as default, singularizeComponentKey };
//# sourceMappingURL=components-object.mjs.map
