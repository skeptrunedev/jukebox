import { tsEnum } from '../lib/ts.mjs';
import { getEntries } from '../lib/utils.mjs';

function makeApiPathsEnum(pathsObject) {
  const enumKeys = [];
  const enumMetaData = [];
  for (const [url, pathItemObject] of getEntries(pathsObject)) {
    for (const [method, operation] of Object.entries(pathItemObject)) {
      if (!["get", "put", "post", "delete", "options", "head", "patch", "trace"].includes(method)) {
        continue;
      }
      let pathName;
      if (operation.operationId) {
        pathName = operation.operationId;
      } else {
        pathName = (method + url).split("/").map((part) => {
          const capitalised = part.charAt(0).toUpperCase() + part.slice(1);
          return capitalised.replace(/{.*}|:.*|[^a-zA-Z\d_]+/, "");
        }).join("");
      }
      enumKeys.push(url);
      enumMetaData.push({
        name: pathName
      });
    }
  }
  return tsEnum("ApiPaths", enumKeys, enumMetaData, {
    export: true
  });
}

export { makeApiPathsEnum as default };
//# sourceMappingURL=paths-enum.mjs.map
