import { Readable } from 'node:stream';
import ts from 'typescript';
import { Config, Referenced } from '@redocly/openapi-core';
import { PathLike } from 'node:fs';
export { default as c } from 'ansi-colors';

interface Extensable {
    [key: `x-${string}`]: any;
}
interface OpenAPI3 extends Extensable {
    openapi: string;
    info: InfoObject;
    jsonSchemaDialect?: string;
    servers?: ServerObject[];
    paths?: PathsObject;
    webhooks?: {
        [id: string]: PathItemObject | ReferenceObject;
    };
    components?: ComponentsObject;
    security?: SecurityRequirementObject[];
    tags?: TagObject[];
    externalDocs?: ExternalDocumentationObject;
    $defs?: $defs;
}
interface InfoObject extends Extensable {
    title: string;
    summary?: string;
    description?: string;
    termsOfService?: string;
    contact?: ContactObject;
    license?: LicenseObject;
    version: string;
}
interface ContactObject extends Extensable {
    name?: string;
    url?: string;
    email?: string;
}
interface LicenseObject extends Extensable {
    name: string;
    identifier: string;
    url: string;
}
interface ServerObject extends Extensable {
    url: string;
    description: string;
    variables: {
        [name: string]: ServerVariableObject;
    };
}
interface ServerVariableObject extends Extensable {
    enum?: string[];
    default: string;
    description?: string;
}
interface ComponentsObject extends Extensable {
    schemas?: Record<string, SchemaObject>;
    responses?: Record<string, ResponseObject | ReferenceObject>;
    parameters?: Record<string, ParameterObject | ReferenceObject>;
    examples?: Record<string, ExampleObject | ReferenceObject>;
    requestBodies?: Record<string, RequestBodyObject | ReferenceObject>;
    headers?: Record<string, HeaderObject | ReferenceObject>;
    securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>;
    links?: Record<string, LinkObject | ReferenceObject>;
    callbacks?: Record<string, CallbackObject | ReferenceObject>;
    pathItems?: Record<string, PathItemObject | ReferenceObject>;
}
interface PathsObject {
    [pathname: string]: PathItemObject | ReferenceObject;
}
interface WebhooksObject {
    [name: string]: PathItemObject;
}
interface PathItemObject extends Extensable {
    get?: OperationObject | ReferenceObject;
    put?: OperationObject | ReferenceObject;
    post?: OperationObject | ReferenceObject;
    delete?: OperationObject | ReferenceObject;
    options?: OperationObject | ReferenceObject;
    head?: OperationObject | ReferenceObject;
    patch?: OperationObject | ReferenceObject;
    trace?: OperationObject | ReferenceObject;
    servers?: ServerObject[];
    parameters?: (ParameterObject | ReferenceObject)[];
}
interface OperationObject extends Extensable {
    tags?: string[];
    summary?: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
    operationId?: string;
    parameters?: (ParameterObject | ReferenceObject)[];
    requestBody?: RequestBodyObject | ReferenceObject;
    responses?: ResponsesObject;
    callbacks?: Record<string, CallbackObject | ReferenceObject>;
    deprecated?: boolean;
    security?: SecurityRequirementObject[];
    servers?: ServerObject[];
}
interface ExternalDocumentationObject extends Extensable {
    description?: string;
    url: string;
}
interface ParameterObject extends Extensable {
    name: string;
    in: "query" | "header" | "path" | "cookie";
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
    schema?: SchemaObject;
    example?: any;
    examples?: {
        [name: string]: ExampleObject | ReferenceObject;
    };
    content?: {
        [contentType: string]: MediaTypeObject | ReferenceObject;
    };
}
interface RequestBodyObject extends Extensable {
    description?: string;
    content: {
        [contentType: string]: MediaTypeObject | ReferenceObject;
    };
    required?: boolean;
}
interface MediaTypeObject extends Extensable {
    schema?: SchemaObject | ReferenceObject;
    example?: any;
    examples?: {
        [name: string]: ExampleObject | ReferenceObject;
    };
    encoding?: {
        [propertyName: string]: EncodingObject;
    };
}
interface EncodingObject extends Extensable {
    contentType?: string;
    headers?: {
        [name: string]: HeaderObject | ReferenceObject;
    };
    style?: string;
    explode?: string;
    allowReserved?: string;
}
type ResponsesObject = {
    [responseCode: string]: ResponseObject | ReferenceObject;
} & {
    default?: ResponseObject | ReferenceObject;
};
interface ResponseObject extends Extensable {
    description: string;
    headers?: {
        [name: string]: HeaderObject | ReferenceObject;
    };
    content?: {
        [contentType: string]: MediaTypeObject;
    };
    links?: {
        [name: string]: LinkObject | ReferenceObject;
    };
}
type CallbackObject = Record<string, PathItemObject>;
interface ExampleObject extends Extensable {
    summary?: string;
    description?: string;
    value?: any;
    externalValue?: string;
}
interface LinkObject extends Extensable {
    operationRef?: string;
    operationId?: string;
    parameters?: {
        [name: string]: `$${string}`;
    };
    requestBody?: `$${string}`;
    description?: string;
    server?: ServerObject;
}
type HeaderObject = Omit<ParameterObject, "name" | "in">;
interface TagObject extends Extensable {
    name: string;
    description?: string;
    externalDocs?: ExternalDocumentationObject;
}
interface ReferenceObject extends Extensable {
    $ref: string;
    summary?: string;
    description?: string;
}
type SchemaObject = {
    discriminator?: DiscriminatorObject;
    xml?: XMLObject;
    externalDocs?: ExternalDocumentationObject;
    example?: any;
    title?: string;
    description?: string;
    $comment?: string;
    deprecated?: boolean;
    readOnly?: boolean;
    writeOnly?: boolean;
    enum?: unknown[];
    const?: unknown;
    default?: unknown;
    format?: string;
    nullable?: boolean;
    oneOf?: (SchemaObject | ReferenceObject)[];
    allOf?: (SchemaObject | ReferenceObject)[];
    anyOf?: (SchemaObject | ReferenceObject)[];
    required?: string[];
    [key: `x-${string}`]: any;
} & (StringSubtype | NumberSubtype | IntegerSubtype | ArraySubtype | BooleanSubtype | NullSubtype | ObjectSubtype | {
    type: ("string" | "number" | "integer" | "array" | "boolean" | "null" | "object")[];
});
interface TransformObject {
    schema: ts.TypeNode;
    questionToken: boolean;
}
interface StringSubtype {
    type: "string" | ["string", "null"];
    enum?: (string | ReferenceObject)[];
}
interface NumberSubtype {
    type: "number" | ["number", "null"];
    minimum?: number;
    maximum?: number;
    enum?: (number | ReferenceObject)[];
}
interface IntegerSubtype {
    type: "integer" | ["integer", "null"];
    minimum?: number;
    maximum?: number;
    enum?: (number | ReferenceObject)[];
}
interface ArraySubtype {
    type: "array" | ["array", "null"];
    prefixItems?: (SchemaObject | ReferenceObject)[];
    items?: SchemaObject | ReferenceObject | (SchemaObject | ReferenceObject)[];
    minItems?: number;
    maxItems?: number;
    enum?: (SchemaObject | ReferenceObject)[];
}
interface BooleanSubtype {
    type: "boolean" | ["boolean", "null"];
    enum?: (boolean | ReferenceObject)[];
}
interface NullSubtype {
    type: "null";
}
interface ObjectSubtype {
    type: "object" | ["object", "null"];
    properties?: {
        [name: string]: SchemaObject | ReferenceObject;
    };
    additionalProperties?: boolean | Record<string, never> | SchemaObject | ReferenceObject;
    required?: string[];
    allOf?: (SchemaObject | ReferenceObject)[];
    anyOf?: (SchemaObject | ReferenceObject)[];
    enum?: (SchemaObject | ReferenceObject)[];
    $defs?: $defs;
}
interface DiscriminatorObject {
    propertyName: string;
    mapping?: Record<string, string>;
    oneOf?: string[];
}
interface XMLObject extends Extensable {
    name?: string;
    namespace?: string;
    prefix?: string;
    attribute?: boolean;
    wrapped?: boolean;
}
type SecuritySchemeObject = {
    description?: string;
    [key: `x-${string}`]: any;
} & ({
    type: "apiKey";
    name: string;
    in: "query" | "header" | "cookie";
} | {
    type: "http";
    scheme: string;
    bearer?: string;
} | {
    type: "mutualTLS";
} | {
    type: "oauth2";
    flows: OAuthFlowsObject;
} | {
    type: "openIdConnect";
    openIdConnectUrl: string;
});
interface OAuthFlowsObject extends Extensable {
    implicit?: OAuthFlowObject;
    password?: OAuthFlowObject;
    clientCredentials?: OAuthFlowObject;
    authorizationCode?: OAuthFlowObject;
}
interface OAuthFlowObject extends Extensable {
    authorizationUrl: string;
    tokenUrl: string;
    refreshUrl: string;
    scopes: {
        [name: string]: string;
    };
}
type SecurityRequirementObject = {
    [P in keyof ComponentsObject["securitySchemes"]]?: string[];
};
interface OpenAPITSOptions {
    additionalProperties?: boolean;
    alphabetize?: boolean;
    arrayLength?: boolean;
    emptyObjectsUnknown?: boolean;
    cwd?: PathLike;
    defaultNonNullable?: boolean;
    excludeDeprecated?: boolean;
    transform?: (schemaObject: SchemaObject, options: TransformNodeOptions) => ts.TypeNode | TransformObject | undefined;
    postTransform?: (type: ts.TypeNode, options: TransformNodeOptions) => ts.TypeNode | undefined;
    immutable?: boolean;
    silent?: boolean;
    version?: number;
    exportType?: boolean;
    enum?: boolean;
    enumValues?: boolean;
    dedupeEnums?: boolean;
    pathParamsAsTypes?: boolean;
    propertiesRequiredByDefault?: boolean;
    rootTypes?: boolean;
    rootTypesNoSchemaPrefix?: boolean;
    redocly?: Config;
    inject?: string;
    makePathsEnum?: boolean;
    generatePathParams?: boolean;
}
interface GlobalContext {
    additionalProperties: boolean;
    alphabetize: boolean;
    arrayLength: boolean;
    defaultNonNullable: boolean;
    discriminators: {
        objects: Record<string, DiscriminatorObject>;
        refsHandled: string[];
    };
    emptyObjectsUnknown: boolean;
    enum: boolean;
    enumValues: boolean;
    dedupeEnums: boolean;
    excludeDeprecated: boolean;
    exportType: boolean;
    immutable: boolean;
    injectFooter: ts.Node[];
    pathParamsAsTypes: boolean;
    postTransform: OpenAPITSOptions["postTransform"];
    propertiesRequiredByDefault: boolean;
    rootTypes: boolean;
    rootTypesNoSchemaPrefix: boolean;
    redoc: Config;
    silent: boolean;
    transform: OpenAPITSOptions["transform"];
    resolve<T>($ref: string): T | undefined;
    inject?: string;
    makePathsEnum: boolean;
    generatePathParams: boolean;
}
type $defs = Record<string, SchemaObject>;
interface TransformNodeOptions {
    path?: string;
    schema?: SchemaObject | ReferenceObject;
    ctx: GlobalContext;
}

declare const JS_PROPERTY_INDEX_RE: RegExp;
declare const JS_ENUM_INVALID_CHARS_RE: RegExp;
declare const JS_PROPERTY_INDEX_INVALID_CHARS_RE: RegExp;
declare const SPECIAL_CHARACTER_MAP: Record<string, string>;
declare const BOOLEAN: ts.KeywordTypeNode<ts.SyntaxKind.BooleanKeyword>;
declare const FALSE: ts.LiteralTypeNode;
declare const NEVER: ts.KeywordTypeNode<ts.SyntaxKind.NeverKeyword>;
declare const NULL: ts.LiteralTypeNode;
declare const NUMBER: ts.KeywordTypeNode<ts.SyntaxKind.NumberKeyword>;
declare const QUESTION_TOKEN: ts.PunctuationToken<ts.SyntaxKind.QuestionToken>;
declare const STRING: ts.KeywordTypeNode<ts.SyntaxKind.StringKeyword>;
declare const TRUE: ts.LiteralTypeNode;
declare const UNDEFINED: ts.KeywordTypeNode<ts.SyntaxKind.UndefinedKeyword>;
declare const UNKNOWN: ts.KeywordTypeNode<ts.SyntaxKind.UnknownKeyword>;
interface AnnotatedSchemaObject {
    const?: unknown;
    default?: unknown;
    deprecated?: boolean;
    description?: string;
    enum?: unknown[];
    example?: string;
    format?: string;
    nullable?: boolean;
    summary?: string;
    title?: string;
    type?: string | string[];
}
declare function addJSDocComment(schemaObject: AnnotatedSchemaObject, node: ts.PropertySignature): void;
type OapiRefResolved = Referenced<ParameterObject>;
declare function oapiRef(path: string, resolved?: OapiRefResolved): ts.TypeNode;
interface AstToStringOptions {
    fileName?: string;
    sourceText?: string;
    formatOptions?: ts.PrinterOptions;
}
declare function astToString(ast: ts.Node | ts.Node[] | ts.TypeElement | ts.TypeElement[], options?: AstToStringOptions): string;
declare function stringToAST(source: string): unknown[];
declare function tsDedupe(types: ts.TypeNode[]): ts.TypeNode[];
declare const enumCache: Map<string, ts.EnumDeclaration>;
declare function tsEnum(name: string, members: (string | number)[], metadata?: {
    name?: string;
    description?: string;
}[], options?: {
    export?: boolean;
    shouldCache?: boolean;
}): ts.EnumDeclaration;
declare function tsArrayLiteralExpression(name: string, elementType: ts.TypeNode, values: (string | number)[], options?: {
    export?: boolean;
    readonly?: boolean;
    injectFooter?: ts.Node[];
}): ts.VariableStatement;
declare function tsEnumMember(value: string | number, metadata?: {
    name?: string;
    description?: string;
}): ts.EnumMember;
declare function tsIntersection(types: ts.TypeNode[]): ts.TypeNode;
declare function tsIsPrimitive(type: ts.TypeNode): boolean;
declare function tsLiteral(value: unknown): ts.TypeNode;
declare function tsModifiers(modifiers: {
    readonly?: boolean;
    export?: boolean;
}): ts.Modifier[];
declare function tsNullable(types: ts.TypeNode[]): ts.TypeNode;
declare function tsOmit(type: ts.TypeNode, keys: string[]): ts.TypeNode;
declare function tsRecord(key: ts.TypeNode, value: ts.TypeNode): ts.TypeReferenceNode;
declare function tsPropertyIndex(index: string | number): ts.Identifier | ts.NumericLiteral | ts.StringLiteral;
declare function tsUnion(types: ts.TypeNode[]): ts.TypeNode;
declare function tsWithRequired(type: ts.TypeNode, keys: string[], injectFooter: ts.Node[]): ts.TypeNode;
declare function tsReadonlyArray(type: ts.TypeNode, injectFooter?: ts.Node[]): ts.TypeNode;

declare function createDiscriminatorProperty(discriminator: DiscriminatorObject, { path, readonly }: {
    path: string;
    readonly?: boolean;
}): ts.TypeElement;
declare function createRef(parts: (number | string | undefined | null)[]): string;
declare function debug(msg: string, group?: string, time?: number): void;
declare function error(msg: string): void;
declare function formatTime(t: number): string;
declare function getEntries<T>(obj: ArrayLike<T> | Record<string, T>, options?: {
    alphabetize?: boolean;
    excludeDeprecated?: boolean;
}): [string, T][];
declare function resolveRef<T>(schema: any, $ref: string, { silent, visited }: {
    silent: boolean;
    visited?: string[];
}): T | undefined;
declare function scanDiscriminators(schema: OpenAPI3, options: OpenAPITSOptions): {
    objects: Record<string, DiscriminatorObject>;
    refsHandled: string[];
};
declare function walk(obj: unknown, cb: (value: Record<string, unknown>, path: (string | number)[]) => void, path?: (string | number)[]): void;
declare function warn(msg: string, silent?: boolean): void;

declare function transformSchema(schema: OpenAPI3, ctx: GlobalContext): ts.Node[];

declare function transformComponentsObject(componentsObject: ComponentsObject, ctx: GlobalContext): ts.Node[];

declare function transformHeaderObject(headerObject: HeaderObject, options: TransformNodeOptions): ts.TypeNode;

declare function transformMediaTypeObject(mediaTypeObject: MediaTypeObject, options: TransformNodeOptions): ts.TypeNode;

declare function transformOperationObject(operationObject: OperationObject, options: TransformNodeOptions): ts.TypeElement[];
declare function injectOperationObject(operationId: string, operationObject: OperationObject, options: TransformNodeOptions): void;

declare function transformParameterObject(parameterObject: ParameterObject, options: TransformNodeOptions): ts.TypeNode;

type Method = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";
declare function transformPathItemObject(pathItem: PathItemObject, options: TransformNodeOptions): ts.TypeNode;

declare function transformPathsObject(pathsObject: PathsObject, ctx: GlobalContext): ts.TypeNode;

declare function transformRequestBodyObject(requestBodyObject: RequestBodyObject, options: TransformNodeOptions): ts.TypeNode;

declare function transformResponseObject(responseObject: ResponseObject, options: TransformNodeOptions): ts.TypeNode;

declare function transformResponsesObject(responsesObject: ResponsesObject, options: TransformNodeOptions): ts.TypeNode;

declare function transformSchemaObject(schemaObject: SchemaObject | ReferenceObject, options: TransformNodeOptions): ts.TypeNode;
declare function transformSchemaObjectWithComposition(schemaObject: SchemaObject | ReferenceObject, options: TransformNodeOptions): ts.TypeNode;

declare const COMMENT_HEADER = "/**\n * This file was auto-generated by openapi-typescript.\n * Do not make direct changes to the file.\n */\n\n";
declare function openapiTS(source: string | URL | OpenAPI3 | Buffer | Readable, options?: OpenAPITSOptions): Promise<ts.Node[]>;

// @ts-ignore
export = openapiTS;
export { BOOLEAN, COMMENT_HEADER, FALSE, JS_ENUM_INVALID_CHARS_RE, JS_PROPERTY_INDEX_INVALID_CHARS_RE, JS_PROPERTY_INDEX_RE, NEVER, NULL, NUMBER, QUESTION_TOKEN, SPECIAL_CHARACTER_MAP, STRING, TRUE, UNDEFINED, UNKNOWN, addJSDocComment, astToString, createDiscriminatorProperty, createRef, debug, enumCache, error, formatTime, getEntries, injectOperationObject, oapiRef, resolveRef, scanDiscriminators, stringToAST, transformComponentsObject, transformHeaderObject, transformMediaTypeObject, transformOperationObject, transformParameterObject, transformPathItemObject, transformPathsObject, transformRequestBodyObject, transformResponseObject, transformResponsesObject, transformSchema, transformSchemaObject, transformSchemaObjectWithComposition, tsArrayLiteralExpression, tsDedupe, tsEnum, tsEnumMember, tsIntersection, tsIsPrimitive, tsLiteral, tsModifiers, tsNullable, tsOmit, tsPropertyIndex, tsReadonlyArray, tsRecord, tsUnion, tsWithRequired, walk, warn };
export type { $defs, AnnotatedSchemaObject, ArraySubtype, AstToStringOptions, BooleanSubtype, CallbackObject, ComponentsObject, ContactObject, DiscriminatorObject, EncodingObject, ExampleObject, Extensable, ExternalDocumentationObject, GlobalContext, HeaderObject, InfoObject, IntegerSubtype, LicenseObject, LinkObject, MediaTypeObject, Method, NullSubtype, NumberSubtype, OAuthFlowObject, OAuthFlowsObject, ObjectSubtype, OpenAPI3, OpenAPITSOptions, OperationObject, ParameterObject, PathItemObject, PathsObject, ReferenceObject, RequestBodyObject, ResponseObject, ResponsesObject, SchemaObject, SecurityRequirementObject, SecuritySchemeObject, ServerObject, ServerVariableObject, StringSubtype, TagObject, TransformNodeOptions, TransformObject, WebhooksObject, XMLObject };
