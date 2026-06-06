"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // packages/core/src/easing.ts
  var clamp01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
  var EASINGS = {
    linear: (p) => p,
    easeIn: (p) => p * p,
    easeOut: (p) => 1 - (1 - p) * (1 - p),
    easeInOut: (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2,
    easeOutCubic: (p) => 1 - Math.pow(1 - p, 3),
    easeInOutCubic: (p) => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
    easeOutExpo: (p) => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p),
    easeOutBack: (p) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
    }
  };
  var ease = (name, p) => (EASINGS[name ?? "linear"] ?? EASINGS.linear)(clamp01(p));

  // packages/core/src/preset.ts
  var resolveParams = (preset, given) => {
    const out = {};
    for (const [k, spec] of Object.entries(preset.params)) {
      let v = given?.[k] ?? spec.default;
      if (spec.min !== void 0) v = Math.max(spec.min, v);
      if (spec.max !== void 0) v = Math.min(spec.max, v);
      out[k] = v;
    }
    return out;
  };

  // node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/external.js
  var external_exports = {};
  __export(external_exports, {
    BRAND: () => BRAND,
    DIRTY: () => DIRTY,
    EMPTY_PATH: () => EMPTY_PATH,
    INVALID: () => INVALID,
    NEVER: () => NEVER,
    OK: () => OK,
    ParseStatus: () => ParseStatus,
    Schema: () => ZodType,
    ZodAny: () => ZodAny,
    ZodArray: () => ZodArray,
    ZodBigInt: () => ZodBigInt,
    ZodBoolean: () => ZodBoolean,
    ZodBranded: () => ZodBranded,
    ZodCatch: () => ZodCatch,
    ZodDate: () => ZodDate,
    ZodDefault: () => ZodDefault,
    ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
    ZodEffects: () => ZodEffects,
    ZodEnum: () => ZodEnum,
    ZodError: () => ZodError,
    ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
    ZodFunction: () => ZodFunction,
    ZodIntersection: () => ZodIntersection,
    ZodIssueCode: () => ZodIssueCode,
    ZodLazy: () => ZodLazy,
    ZodLiteral: () => ZodLiteral,
    ZodMap: () => ZodMap,
    ZodNaN: () => ZodNaN,
    ZodNativeEnum: () => ZodNativeEnum,
    ZodNever: () => ZodNever,
    ZodNull: () => ZodNull,
    ZodNullable: () => ZodNullable,
    ZodNumber: () => ZodNumber,
    ZodObject: () => ZodObject,
    ZodOptional: () => ZodOptional,
    ZodParsedType: () => ZodParsedType,
    ZodPipeline: () => ZodPipeline,
    ZodPromise: () => ZodPromise,
    ZodReadonly: () => ZodReadonly,
    ZodRecord: () => ZodRecord,
    ZodSchema: () => ZodType,
    ZodSet: () => ZodSet,
    ZodString: () => ZodString,
    ZodSymbol: () => ZodSymbol,
    ZodTransformer: () => ZodEffects,
    ZodTuple: () => ZodTuple,
    ZodType: () => ZodType,
    ZodUndefined: () => ZodUndefined,
    ZodUnion: () => ZodUnion,
    ZodUnknown: () => ZodUnknown,
    ZodVoid: () => ZodVoid,
    addIssueToContext: () => addIssueToContext,
    any: () => anyType,
    array: () => arrayType,
    bigint: () => bigIntType,
    boolean: () => booleanType,
    coerce: () => coerce,
    custom: () => custom,
    date: () => dateType,
    datetimeRegex: () => datetimeRegex,
    defaultErrorMap: () => en_default,
    discriminatedUnion: () => discriminatedUnionType,
    effect: () => effectsType,
    enum: () => enumType,
    function: () => functionType,
    getErrorMap: () => getErrorMap,
    getParsedType: () => getParsedType,
    instanceof: () => instanceOfType,
    intersection: () => intersectionType,
    isAborted: () => isAborted,
    isAsync: () => isAsync,
    isDirty: () => isDirty,
    isValid: () => isValid,
    late: () => late,
    lazy: () => lazyType,
    literal: () => literalType,
    makeIssue: () => makeIssue,
    map: () => mapType,
    nan: () => nanType,
    nativeEnum: () => nativeEnumType,
    never: () => neverType,
    null: () => nullType,
    nullable: () => nullableType,
    number: () => numberType,
    object: () => objectType,
    objectUtil: () => objectUtil,
    oboolean: () => oboolean,
    onumber: () => onumber,
    optional: () => optionalType,
    ostring: () => ostring,
    pipeline: () => pipelineType,
    preprocess: () => preprocessType,
    promise: () => promiseType,
    quotelessJson: () => quotelessJson,
    record: () => recordType,
    set: () => setType,
    setErrorMap: () => setErrorMap,
    strictObject: () => strictObjectType,
    string: () => stringType,
    symbol: () => symbolType,
    transformer: () => effectsType,
    tuple: () => tupleType,
    undefined: () => undefinedType,
    union: () => unionType,
    unknown: () => unknownType,
    util: () => util,
    void: () => voidType
  });

  // node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/util.js
  var util;
  (function(util2) {
    util2.assertEqual = (_) => {
    };
    function assertIs(_arg) {
    }
    util2.assertIs = assertIs;
    function assertNever(_x) {
      throw new Error();
    }
    util2.assertNever = assertNever;
    util2.arrayToEnum = (items) => {
      const obj = {};
      for (const item of items) {
        obj[item] = item;
      }
      return obj;
    };
    util2.getValidEnumValues = (obj) => {
      const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
      const filtered = {};
      for (const k of validKeys) {
        filtered[k] = obj[k];
      }
      return util2.objectValues(filtered);
    };
    util2.objectValues = (obj) => {
      return util2.objectKeys(obj).map(function(e) {
        return obj[e];
      });
    };
    util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
      const keys = [];
      for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          keys.push(key);
        }
      }
      return keys;
    };
    util2.find = (arr, checker) => {
      for (const item of arr) {
        if (checker(item))
          return item;
      }
      return void 0;
    };
    util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
    function joinValues(array, separator = " | ") {
      return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
    }
    util2.joinValues = joinValues;
    util2.jsonStringifyReplacer = (_, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    };
  })(util || (util = {}));
  var objectUtil;
  (function(objectUtil2) {
    objectUtil2.mergeShapes = (first, second) => {
      return {
        ...first,
        ...second
        // second overwrites first
      };
    };
  })(objectUtil || (objectUtil = {}));
  var ZodParsedType = util.arrayToEnum([
    "string",
    "nan",
    "number",
    "integer",
    "float",
    "boolean",
    "date",
    "bigint",
    "symbol",
    "function",
    "undefined",
    "null",
    "array",
    "object",
    "unknown",
    "promise",
    "void",
    "never",
    "map",
    "set"
  ]);
  var getParsedType = (data) => {
    const t = typeof data;
    switch (t) {
      case "undefined":
        return ZodParsedType.undefined;
      case "string":
        return ZodParsedType.string;
      case "number":
        return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
      case "boolean":
        return ZodParsedType.boolean;
      case "function":
        return ZodParsedType.function;
      case "bigint":
        return ZodParsedType.bigint;
      case "symbol":
        return ZodParsedType.symbol;
      case "object":
        if (Array.isArray(data)) {
          return ZodParsedType.array;
        }
        if (data === null) {
          return ZodParsedType.null;
        }
        if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
          return ZodParsedType.promise;
        }
        if (typeof Map !== "undefined" && data instanceof Map) {
          return ZodParsedType.map;
        }
        if (typeof Set !== "undefined" && data instanceof Set) {
          return ZodParsedType.set;
        }
        if (typeof Date !== "undefined" && data instanceof Date) {
          return ZodParsedType.date;
        }
        return ZodParsedType.object;
      default:
        return ZodParsedType.unknown;
    }
  };

  // node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/ZodError.js
  var ZodIssueCode = util.arrayToEnum([
    "invalid_type",
    "invalid_literal",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of",
    "not_finite"
  ]);
  var quotelessJson = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(/"([^"]+)":/g, "$1:");
  };
  var ZodError = class _ZodError extends Error {
    get errors() {
      return this.issues;
    }
    constructor(issues) {
      super();
      this.issues = [];
      this.addIssue = (sub) => {
        this.issues = [...this.issues, sub];
      };
      this.addIssues = (subs = []) => {
        this.issues = [...this.issues, ...subs];
      };
      const actualProto = new.target.prototype;
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(this, actualProto);
      } else {
        this.__proto__ = actualProto;
      }
      this.name = "ZodError";
      this.issues = issues;
    }
    format(_mapper) {
      const mapper = _mapper || function(issue) {
        return issue.message;
      };
      const fieldErrors = { _errors: [] };
      const processError = (error) => {
        for (const issue of error.issues) {
          if (issue.code === "invalid_union") {
            issue.unionErrors.map(processError);
          } else if (issue.code === "invalid_return_type") {
            processError(issue.returnTypeError);
          } else if (issue.code === "invalid_arguments") {
            processError(issue.argumentsError);
          } else if (issue.path.length === 0) {
            fieldErrors._errors.push(mapper(issue));
          } else {
            let curr = fieldErrors;
            let i = 0;
            while (i < issue.path.length) {
              const el2 = issue.path[i];
              const terminal = i === issue.path.length - 1;
              if (!terminal) {
                curr[el2] = curr[el2] || { _errors: [] };
              } else {
                curr[el2] = curr[el2] || { _errors: [] };
                curr[el2]._errors.push(mapper(issue));
              }
              curr = curr[el2];
              i++;
            }
          }
        }
      };
      processError(this);
      return fieldErrors;
    }
    static assert(value) {
      if (!(value instanceof _ZodError)) {
        throw new Error(`Not a ZodError: ${value}`);
      }
    }
    toString() {
      return this.message;
    }
    get message() {
      return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
      return this.issues.length === 0;
    }
    flatten(mapper = (issue) => issue.message) {
      const fieldErrors = {};
      const formErrors = [];
      for (const sub of this.issues) {
        if (sub.path.length > 0) {
          const firstEl = sub.path[0];
          fieldErrors[firstEl] = fieldErrors[firstEl] || [];
          fieldErrors[firstEl].push(mapper(sub));
        } else {
          formErrors.push(mapper(sub));
        }
      }
      return { formErrors, fieldErrors };
    }
    get formErrors() {
      return this.flatten();
    }
  };
  ZodError.create = (issues) => {
    const error = new ZodError(issues);
    return error;
  };

  // node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/locales/en.js
  var errorMap = (issue, _ctx) => {
    let message;
    switch (issue.code) {
      case ZodIssueCode.invalid_type:
        if (issue.received === ZodParsedType.undefined) {
          message = "Required";
        } else {
          message = `Expected ${issue.expected}, received ${issue.received}`;
        }
        break;
      case ZodIssueCode.invalid_literal:
        message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
        break;
      case ZodIssueCode.unrecognized_keys:
        message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
        break;
      case ZodIssueCode.invalid_union:
        message = `Invalid input`;
        break;
      case ZodIssueCode.invalid_union_discriminator:
        message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
        break;
      case ZodIssueCode.invalid_enum_value:
        message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
        break;
      case ZodIssueCode.invalid_arguments:
        message = `Invalid function arguments`;
        break;
      case ZodIssueCode.invalid_return_type:
        message = `Invalid function return type`;
        break;
      case ZodIssueCode.invalid_date:
        message = `Invalid date`;
        break;
      case ZodIssueCode.invalid_string:
        if (typeof issue.validation === "object") {
          if ("includes" in issue.validation) {
            message = `Invalid input: must include "${issue.validation.includes}"`;
            if (typeof issue.validation.position === "number") {
              message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
            }
          } else if ("startsWith" in issue.validation) {
            message = `Invalid input: must start with "${issue.validation.startsWith}"`;
          } else if ("endsWith" in issue.validation) {
            message = `Invalid input: must end with "${issue.validation.endsWith}"`;
          } else {
            util.assertNever(issue.validation);
          }
        } else if (issue.validation !== "regex") {
          message = `Invalid ${issue.validation}`;
        } else {
          message = "Invalid";
        }
        break;
      case ZodIssueCode.too_small:
        if (issue.type === "array")
          message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
        else if (issue.type === "string")
          message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
        else if (issue.type === "number")
          message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
        else if (issue.type === "bigint")
          message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
        else if (issue.type === "date")
          message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
        else
          message = "Invalid input";
        break;
      case ZodIssueCode.too_big:
        if (issue.type === "array")
          message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
        else if (issue.type === "string")
          message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
        else if (issue.type === "number")
          message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
        else if (issue.type === "bigint")
          message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
        else if (issue.type === "date")
          message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
        else
          message = "Invalid input";
        break;
      case ZodIssueCode.custom:
        message = `Invalid input`;
        break;
      case ZodIssueCode.invalid_intersection_types:
        message = `Intersection results could not be merged`;
        break;
      case ZodIssueCode.not_multiple_of:
        message = `Number must be a multiple of ${issue.multipleOf}`;
        break;
      case ZodIssueCode.not_finite:
        message = "Number must be finite";
        break;
      default:
        message = _ctx.defaultError;
        util.assertNever(issue);
    }
    return { message };
  };
  var en_default = errorMap;

  // node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/errors.js
  var overrideErrorMap = en_default;
  function setErrorMap(map) {
    overrideErrorMap = map;
  }
  function getErrorMap() {
    return overrideErrorMap;
  }

  // node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.js
  var makeIssue = (params) => {
    const { data, path, errorMaps, issueData } = params;
    const fullPath = [...path, ...issueData.path || []];
    const fullIssue = {
      ...issueData,
      path: fullPath
    };
    if (issueData.message !== void 0) {
      return {
        ...issueData,
        path: fullPath,
        message: issueData.message
      };
    }
    let errorMessage = "";
    const maps = errorMaps.filter((m) => !!m).slice().reverse();
    for (const map of maps) {
      errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
    }
    return {
      ...issueData,
      path: fullPath,
      message: errorMessage
    };
  };
  var EMPTY_PATH = [];
  function addIssueToContext(ctx, issueData) {
    const overrideMap = getErrorMap();
    const issue = makeIssue({
      issueData,
      data: ctx.data,
      path: ctx.path,
      errorMaps: [
        ctx.common.contextualErrorMap,
        // contextual error map is first priority
        ctx.schemaErrorMap,
        // then schema-bound map if available
        overrideMap,
        // then global override map
        overrideMap === en_default ? void 0 : en_default
        // then global default map
      ].filter((x) => !!x)
    });
    ctx.common.issues.push(issue);
  }
  var ParseStatus = class _ParseStatus {
    constructor() {
      this.value = "valid";
    }
    dirty() {
      if (this.value === "valid")
        this.value = "dirty";
    }
    abort() {
      if (this.value !== "aborted")
        this.value = "aborted";
    }
    static mergeArray(status, results) {
      const arrayValue = [];
      for (const s of results) {
        if (s.status === "aborted")
          return INVALID;
        if (s.status === "dirty")
          status.dirty();
        arrayValue.push(s.value);
      }
      return { status: status.value, value: arrayValue };
    }
    static async mergeObjectAsync(status, pairs) {
      const syncPairs = [];
      for (const pair of pairs) {
        const key = await pair.key;
        const value = await pair.value;
        syncPairs.push({
          key,
          value
        });
      }
      return _ParseStatus.mergeObjectSync(status, syncPairs);
    }
    static mergeObjectSync(status, pairs) {
      const finalObject = {};
      for (const pair of pairs) {
        const { key, value } = pair;
        if (key.status === "aborted")
          return INVALID;
        if (value.status === "aborted")
          return INVALID;
        if (key.status === "dirty")
          status.dirty();
        if (value.status === "dirty")
          status.dirty();
        if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
          finalObject[key.value] = value.value;
        }
      }
      return { status: status.value, value: finalObject };
    }
  };
  var INVALID = Object.freeze({
    status: "aborted"
  });
  var DIRTY = (value) => ({ status: "dirty", value });
  var OK = (value) => ({ status: "valid", value });
  var isAborted = (x) => x.status === "aborted";
  var isDirty = (x) => x.status === "dirty";
  var isValid = (x) => x.status === "valid";
  var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

  // node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.js
  var errorUtil;
  (function(errorUtil2) {
    errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
    errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
  })(errorUtil || (errorUtil = {}));

  // node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.js
  var ParseInputLazyPath = class {
    constructor(parent, value, path, key) {
      this._cachedPath = [];
      this.parent = parent;
      this.data = value;
      this._path = path;
      this._key = key;
    }
    get path() {
      if (!this._cachedPath.length) {
        if (Array.isArray(this._key)) {
          this._cachedPath.push(...this._path, ...this._key);
        } else {
          this._cachedPath.push(...this._path, this._key);
        }
      }
      return this._cachedPath;
    }
  };
  var handleResult = (ctx, result) => {
    if (isValid(result)) {
      return { success: true, data: result.value };
    } else {
      if (!ctx.common.issues.length) {
        throw new Error("Validation failed but no issues detected.");
      }
      return {
        success: false,
        get error() {
          if (this._error)
            return this._error;
          const error = new ZodError(ctx.common.issues);
          this._error = error;
          return this._error;
        }
      };
    }
  };
  function processCreateParams(params) {
    if (!params)
      return {};
    const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
    if (errorMap2 && (invalid_type_error || required_error)) {
      throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
    }
    if (errorMap2)
      return { errorMap: errorMap2, description };
    const customMap = (iss, ctx) => {
      const { message } = params;
      if (iss.code === "invalid_enum_value") {
        return { message: message ?? ctx.defaultError };
      }
      if (typeof ctx.data === "undefined") {
        return { message: message ?? required_error ?? ctx.defaultError };
      }
      if (iss.code !== "invalid_type")
        return { message: ctx.defaultError };
      return { message: message ?? invalid_type_error ?? ctx.defaultError };
    };
    return { errorMap: customMap, description };
  }
  var ZodType = class {
    get description() {
      return this._def.description;
    }
    _getType(input) {
      return getParsedType(input.data);
    }
    _getOrReturnCtx(input, ctx) {
      return ctx || {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      };
    }
    _processInputParams(input) {
      return {
        status: new ParseStatus(),
        ctx: {
          common: input.parent.common,
          data: input.data,
          parsedType: getParsedType(input.data),
          schemaErrorMap: this._def.errorMap,
          path: input.path,
          parent: input.parent
        }
      };
    }
    _parseSync(input) {
      const result = this._parse(input);
      if (isAsync(result)) {
        throw new Error("Synchronous parse encountered promise.");
      }
      return result;
    }
    _parseAsync(input) {
      const result = this._parse(input);
      return Promise.resolve(result);
    }
    parse(data, params) {
      const result = this.safeParse(data, params);
      if (result.success)
        return result.data;
      throw result.error;
    }
    safeParse(data, params) {
      const ctx = {
        common: {
          issues: [],
          async: params?.async ?? false,
          contextualErrorMap: params?.errorMap
        },
        path: params?.path || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      const result = this._parseSync({ data, path: ctx.path, parent: ctx });
      return handleResult(ctx, result);
    }
    "~validate"(data) {
      const ctx = {
        common: {
          issues: [],
          async: !!this["~standard"].async
        },
        path: [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      if (!this["~standard"].async) {
        try {
          const result = this._parseSync({ data, path: [], parent: ctx });
          return isValid(result) ? {
            value: result.value
          } : {
            issues: ctx.common.issues
          };
        } catch (err) {
          if (err?.message?.toLowerCase()?.includes("encountered")) {
            this["~standard"].async = true;
          }
          ctx.common = {
            issues: [],
            async: true
          };
        }
      }
      return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
        value: result.value
      } : {
        issues: ctx.common.issues
      });
    }
    async parseAsync(data, params) {
      const result = await this.safeParseAsync(data, params);
      if (result.success)
        return result.data;
      throw result.error;
    }
    async safeParseAsync(data, params) {
      const ctx = {
        common: {
          issues: [],
          contextualErrorMap: params?.errorMap,
          async: true
        },
        path: params?.path || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
      const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
      return handleResult(ctx, result);
    }
    refine(check, message) {
      const getIssueProperties = (val) => {
        if (typeof message === "string" || typeof message === "undefined") {
          return { message };
        } else if (typeof message === "function") {
          return message(val);
        } else {
          return message;
        }
      };
      return this._refinement((val, ctx) => {
        const result = check(val);
        const setError = () => ctx.addIssue({
          code: ZodIssueCode.custom,
          ...getIssueProperties(val)
        });
        if (typeof Promise !== "undefined" && result instanceof Promise) {
          return result.then((data) => {
            if (!data) {
              setError();
              return false;
            } else {
              return true;
            }
          });
        }
        if (!result) {
          setError();
          return false;
        } else {
          return true;
        }
      });
    }
    refinement(check, refinementData) {
      return this._refinement((val, ctx) => {
        if (!check(val)) {
          ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
          return false;
        } else {
          return true;
        }
      });
    }
    _refinement(refinement) {
      return new ZodEffects({
        schema: this,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect: { type: "refinement", refinement }
      });
    }
    superRefine(refinement) {
      return this._refinement(refinement);
    }
    constructor(def) {
      this.spa = this.safeParseAsync;
      this._def = def;
      this.parse = this.parse.bind(this);
      this.safeParse = this.safeParse.bind(this);
      this.parseAsync = this.parseAsync.bind(this);
      this.safeParseAsync = this.safeParseAsync.bind(this);
      this.spa = this.spa.bind(this);
      this.refine = this.refine.bind(this);
      this.refinement = this.refinement.bind(this);
      this.superRefine = this.superRefine.bind(this);
      this.optional = this.optional.bind(this);
      this.nullable = this.nullable.bind(this);
      this.nullish = this.nullish.bind(this);
      this.array = this.array.bind(this);
      this.promise = this.promise.bind(this);
      this.or = this.or.bind(this);
      this.and = this.and.bind(this);
      this.transform = this.transform.bind(this);
      this.brand = this.brand.bind(this);
      this.default = this.default.bind(this);
      this.catch = this.catch.bind(this);
      this.describe = this.describe.bind(this);
      this.pipe = this.pipe.bind(this);
      this.readonly = this.readonly.bind(this);
      this.isNullable = this.isNullable.bind(this);
      this.isOptional = this.isOptional.bind(this);
      this["~standard"] = {
        version: 1,
        vendor: "zod",
        validate: (data) => this["~validate"](data)
      };
    }
    optional() {
      return ZodOptional.create(this, this._def);
    }
    nullable() {
      return ZodNullable.create(this, this._def);
    }
    nullish() {
      return this.nullable().optional();
    }
    array() {
      return ZodArray.create(this);
    }
    promise() {
      return ZodPromise.create(this, this._def);
    }
    or(option) {
      return ZodUnion.create([this, option], this._def);
    }
    and(incoming) {
      return ZodIntersection.create(this, incoming, this._def);
    }
    transform(transform2) {
      return new ZodEffects({
        ...processCreateParams(this._def),
        schema: this,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect: { type: "transform", transform: transform2 }
      });
    }
    default(def) {
      const defaultValueFunc = typeof def === "function" ? def : () => def;
      return new ZodDefault({
        ...processCreateParams(this._def),
        innerType: this,
        defaultValue: defaultValueFunc,
        typeName: ZodFirstPartyTypeKind.ZodDefault
      });
    }
    brand() {
      return new ZodBranded({
        typeName: ZodFirstPartyTypeKind.ZodBranded,
        type: this,
        ...processCreateParams(this._def)
      });
    }
    catch(def) {
      const catchValueFunc = typeof def === "function" ? def : () => def;
      return new ZodCatch({
        ...processCreateParams(this._def),
        innerType: this,
        catchValue: catchValueFunc,
        typeName: ZodFirstPartyTypeKind.ZodCatch
      });
    }
    describe(description) {
      const This = this.constructor;
      return new This({
        ...this._def,
        description
      });
    }
    pipe(target) {
      return ZodPipeline.create(this, target);
    }
    readonly() {
      return ZodReadonly.create(this);
    }
    isOptional() {
      return this.safeParse(void 0).success;
    }
    isNullable() {
      return this.safeParse(null).success;
    }
  };
  var cuidRegex = /^c[^\s-]{8,}$/i;
  var cuid2Regex = /^[0-9a-z]+$/;
  var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
  var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
  var nanoidRegex = /^[a-z0-9_-]{21}$/i;
  var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
  var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
  var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
  var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
  var emojiRegex;
  var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
  var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
  var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
  var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
  var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
  var dateRegex = new RegExp(`^${dateRegexSource}$`);
  function timeRegexSource(args) {
    let secondsRegexSource = `[0-5]\\d`;
    if (args.precision) {
      secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
    } else if (args.precision == null) {
      secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
    }
    const secondsQuantifier = args.precision ? "+" : "?";
    return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
  }
  function timeRegex(args) {
    return new RegExp(`^${timeRegexSource(args)}$`);
  }
  function datetimeRegex(args) {
    let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
    const opts = [];
    opts.push(args.local ? `Z?` : `Z`);
    if (args.offset)
      opts.push(`([+-]\\d{2}:?\\d{2})`);
    regex = `${regex}(${opts.join("|")})`;
    return new RegExp(`^${regex}$`);
  }
  function isValidIP(ip, version) {
    if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
      return true;
    }
    if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
      return true;
    }
    return false;
  }
  function isValidJWT(jwt, alg) {
    if (!jwtRegex.test(jwt))
      return false;
    try {
      const [header] = jwt.split(".");
      if (!header)
        return false;
      const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
      const decoded = JSON.parse(atob(base64));
      if (typeof decoded !== "object" || decoded === null)
        return false;
      if ("typ" in decoded && decoded?.typ !== "JWT")
        return false;
      if (!decoded.alg)
        return false;
      if (alg && decoded.alg !== alg)
        return false;
      return true;
    } catch {
      return false;
    }
  }
  function isValidCidr(ip, version) {
    if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
      return true;
    }
    if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
      return true;
    }
    return false;
  }
  var ZodString = class _ZodString extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = String(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.string) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.string,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      const status = new ParseStatus();
      let ctx = void 0;
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          if (input.data.length < check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          if (input.data.length > check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "length") {
          const tooBig = input.data.length > check.value;
          const tooSmall = input.data.length < check.value;
          if (tooBig || tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            if (tooBig) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "string",
                inclusive: true,
                exact: true,
                message: check.message
              });
            } else if (tooSmall) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "string",
                inclusive: true,
                exact: true,
                message: check.message
              });
            }
            status.dirty();
          }
        } else if (check.kind === "email") {
          if (!emailRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "email",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "emoji") {
          if (!emojiRegex) {
            emojiRegex = new RegExp(_emojiRegex, "u");
          }
          if (!emojiRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "emoji",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "uuid") {
          if (!uuidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "uuid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "nanoid") {
          if (!nanoidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "nanoid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cuid") {
          if (!cuidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cuid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cuid2") {
          if (!cuid2Regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cuid2",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "ulid") {
          if (!ulidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "ulid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "url") {
          try {
            new URL(input.data);
          } catch {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "url",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "regex") {
          check.regex.lastIndex = 0;
          const testResult = check.regex.test(input.data);
          if (!testResult) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "regex",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "trim") {
          input.data = input.data.trim();
        } else if (check.kind === "includes") {
          if (!input.data.includes(check.value, check.position)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { includes: check.value, position: check.position },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "toLowerCase") {
          input.data = input.data.toLowerCase();
        } else if (check.kind === "toUpperCase") {
          input.data = input.data.toUpperCase();
        } else if (check.kind === "startsWith") {
          if (!input.data.startsWith(check.value)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { startsWith: check.value },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "endsWith") {
          if (!input.data.endsWith(check.value)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { endsWith: check.value },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "datetime") {
          const regex = datetimeRegex(check);
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "datetime",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "date") {
          const regex = dateRegex;
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "date",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "time") {
          const regex = timeRegex(check);
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "time",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "duration") {
          if (!durationRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "duration",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "ip") {
          if (!isValidIP(input.data, check.version)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "ip",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "jwt") {
          if (!isValidJWT(input.data, check.alg)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "jwt",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cidr") {
          if (!isValidCidr(input.data, check.version)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cidr",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "base64") {
          if (!base64Regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "base64",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "base64url") {
          if (!base64urlRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "base64url",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    _regex(regex, validation, message) {
      return this.refinement((data) => regex.test(data), {
        validation,
        code: ZodIssueCode.invalid_string,
        ...errorUtil.errToObj(message)
      });
    }
    _addCheck(check) {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    email(message) {
      return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
    }
    url(message) {
      return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
    }
    emoji(message) {
      return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
    }
    uuid(message) {
      return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
    }
    nanoid(message) {
      return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
    }
    cuid(message) {
      return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
    }
    cuid2(message) {
      return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
    }
    ulid(message) {
      return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
    }
    base64(message) {
      return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
    }
    base64url(message) {
      return this._addCheck({
        kind: "base64url",
        ...errorUtil.errToObj(message)
      });
    }
    jwt(options) {
      return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
    }
    ip(options) {
      return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
    }
    cidr(options) {
      return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
    }
    datetime(options) {
      if (typeof options === "string") {
        return this._addCheck({
          kind: "datetime",
          precision: null,
          offset: false,
          local: false,
          message: options
        });
      }
      return this._addCheck({
        kind: "datetime",
        precision: typeof options?.precision === "undefined" ? null : options?.precision,
        offset: options?.offset ?? false,
        local: options?.local ?? false,
        ...errorUtil.errToObj(options?.message)
      });
    }
    date(message) {
      return this._addCheck({ kind: "date", message });
    }
    time(options) {
      if (typeof options === "string") {
        return this._addCheck({
          kind: "time",
          precision: null,
          message: options
        });
      }
      return this._addCheck({
        kind: "time",
        precision: typeof options?.precision === "undefined" ? null : options?.precision,
        ...errorUtil.errToObj(options?.message)
      });
    }
    duration(message) {
      return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
    }
    regex(regex, message) {
      return this._addCheck({
        kind: "regex",
        regex,
        ...errorUtil.errToObj(message)
      });
    }
    includes(value, options) {
      return this._addCheck({
        kind: "includes",
        value,
        position: options?.position,
        ...errorUtil.errToObj(options?.message)
      });
    }
    startsWith(value, message) {
      return this._addCheck({
        kind: "startsWith",
        value,
        ...errorUtil.errToObj(message)
      });
    }
    endsWith(value, message) {
      return this._addCheck({
        kind: "endsWith",
        value,
        ...errorUtil.errToObj(message)
      });
    }
    min(minLength, message) {
      return this._addCheck({
        kind: "min",
        value: minLength,
        ...errorUtil.errToObj(message)
      });
    }
    max(maxLength, message) {
      return this._addCheck({
        kind: "max",
        value: maxLength,
        ...errorUtil.errToObj(message)
      });
    }
    length(len, message) {
      return this._addCheck({
        kind: "length",
        value: len,
        ...errorUtil.errToObj(message)
      });
    }
    /**
     * Equivalent to `.min(1)`
     */
    nonempty(message) {
      return this.min(1, errorUtil.errToObj(message));
    }
    trim() {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "trim" }]
      });
    }
    toLowerCase() {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "toLowerCase" }]
      });
    }
    toUpperCase() {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "toUpperCase" }]
      });
    }
    get isDatetime() {
      return !!this._def.checks.find((ch) => ch.kind === "datetime");
    }
    get isDate() {
      return !!this._def.checks.find((ch) => ch.kind === "date");
    }
    get isTime() {
      return !!this._def.checks.find((ch) => ch.kind === "time");
    }
    get isDuration() {
      return !!this._def.checks.find((ch) => ch.kind === "duration");
    }
    get isEmail() {
      return !!this._def.checks.find((ch) => ch.kind === "email");
    }
    get isURL() {
      return !!this._def.checks.find((ch) => ch.kind === "url");
    }
    get isEmoji() {
      return !!this._def.checks.find((ch) => ch.kind === "emoji");
    }
    get isUUID() {
      return !!this._def.checks.find((ch) => ch.kind === "uuid");
    }
    get isNANOID() {
      return !!this._def.checks.find((ch) => ch.kind === "nanoid");
    }
    get isCUID() {
      return !!this._def.checks.find((ch) => ch.kind === "cuid");
    }
    get isCUID2() {
      return !!this._def.checks.find((ch) => ch.kind === "cuid2");
    }
    get isULID() {
      return !!this._def.checks.find((ch) => ch.kind === "ulid");
    }
    get isIP() {
      return !!this._def.checks.find((ch) => ch.kind === "ip");
    }
    get isCIDR() {
      return !!this._def.checks.find((ch) => ch.kind === "cidr");
    }
    get isBase64() {
      return !!this._def.checks.find((ch) => ch.kind === "base64");
    }
    get isBase64url() {
      return !!this._def.checks.find((ch) => ch.kind === "base64url");
    }
    get minLength() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxLength() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
  };
  ZodString.create = (params) => {
    return new ZodString({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodString,
      coerce: params?.coerce ?? false,
      ...processCreateParams(params)
    });
  };
  function floatSafeRemainder(val, step) {
    const valDecCount = (val.toString().split(".")[1] || "").length;
    const stepDecCount = (step.toString().split(".")[1] || "").length;
    const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
    const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
    const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
    return valInt % stepInt / 10 ** decCount;
  }
  var ZodNumber = class _ZodNumber extends ZodType {
    constructor() {
      super(...arguments);
      this.min = this.gte;
      this.max = this.lte;
      this.step = this.multipleOf;
    }
    _parse(input) {
      if (this._def.coerce) {
        input.data = Number(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.number) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.number,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      let ctx = void 0;
      const status = new ParseStatus();
      for (const check of this._def.checks) {
        if (check.kind === "int") {
          if (!util.isInteger(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_type,
              expected: "integer",
              received: "float",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "min") {
          const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
          if (tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "number",
              inclusive: check.inclusive,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
          if (tooBig) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "number",
              inclusive: check.inclusive,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "multipleOf") {
          if (floatSafeRemainder(input.data, check.value) !== 0) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_multiple_of,
              multipleOf: check.value,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "finite") {
          if (!Number.isFinite(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_finite,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    gte(value, message) {
      return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
      return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
      return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
      return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
      return new _ZodNumber({
        ...this._def,
        checks: [
          ...this._def.checks,
          {
            kind,
            value,
            inclusive,
            message: errorUtil.toString(message)
          }
        ]
      });
    }
    _addCheck(check) {
      return new _ZodNumber({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    int(message) {
      return this._addCheck({
        kind: "int",
        message: errorUtil.toString(message)
      });
    }
    positive(message) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    negative(message) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    nonpositive(message) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    nonnegative(message) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    multipleOf(value, message) {
      return this._addCheck({
        kind: "multipleOf",
        value,
        message: errorUtil.toString(message)
      });
    }
    finite(message) {
      return this._addCheck({
        kind: "finite",
        message: errorUtil.toString(message)
      });
    }
    safe(message) {
      return this._addCheck({
        kind: "min",
        inclusive: true,
        value: Number.MIN_SAFE_INTEGER,
        message: errorUtil.toString(message)
      })._addCheck({
        kind: "max",
        inclusive: true,
        value: Number.MAX_SAFE_INTEGER,
        message: errorUtil.toString(message)
      });
    }
    get minValue() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxValue() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
    get isInt() {
      return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
    }
    get isFinite() {
      let max = null;
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
          return true;
        } else if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        } else if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return Number.isFinite(min) && Number.isFinite(max);
    }
  };
  ZodNumber.create = (params) => {
    return new ZodNumber({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodNumber,
      coerce: params?.coerce || false,
      ...processCreateParams(params)
    });
  };
  var ZodBigInt = class _ZodBigInt extends ZodType {
    constructor() {
      super(...arguments);
      this.min = this.gte;
      this.max = this.lte;
    }
    _parse(input) {
      if (this._def.coerce) {
        try {
          input.data = BigInt(input.data);
        } catch {
          return this._getInvalidInput(input);
        }
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.bigint) {
        return this._getInvalidInput(input);
      }
      let ctx = void 0;
      const status = new ParseStatus();
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
          if (tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              type: "bigint",
              minimum: check.value,
              inclusive: check.inclusive,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
          if (tooBig) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              type: "bigint",
              maximum: check.value,
              inclusive: check.inclusive,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "multipleOf") {
          if (input.data % check.value !== BigInt(0)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_multiple_of,
              multipleOf: check.value,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    _getInvalidInput(input) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.bigint,
        received: ctx.parsedType
      });
      return INVALID;
    }
    gte(value, message) {
      return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
      return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
      return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
      return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
      return new _ZodBigInt({
        ...this._def,
        checks: [
          ...this._def.checks,
          {
            kind,
            value,
            inclusive,
            message: errorUtil.toString(message)
          }
        ]
      });
    }
    _addCheck(check) {
      return new _ZodBigInt({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    positive(message) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    negative(message) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    nonpositive(message) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    nonnegative(message) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    multipleOf(value, message) {
      return this._addCheck({
        kind: "multipleOf",
        value,
        message: errorUtil.toString(message)
      });
    }
    get minValue() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxValue() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
  };
  ZodBigInt.create = (params) => {
    return new ZodBigInt({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodBigInt,
      coerce: params?.coerce ?? false,
      ...processCreateParams(params)
    });
  };
  var ZodBoolean = class extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = Boolean(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.boolean) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.boolean,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodBoolean.create = (params) => {
    return new ZodBoolean({
      typeName: ZodFirstPartyTypeKind.ZodBoolean,
      coerce: params?.coerce || false,
      ...processCreateParams(params)
    });
  };
  var ZodDate = class _ZodDate extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = new Date(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.date) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.date,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      if (Number.isNaN(input.data.getTime())) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_date
        });
        return INVALID;
      }
      const status = new ParseStatus();
      let ctx = void 0;
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          if (input.data.getTime() < check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              message: check.message,
              inclusive: true,
              exact: false,
              minimum: check.value,
              type: "date"
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          if (input.data.getTime() > check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              message: check.message,
              inclusive: true,
              exact: false,
              maximum: check.value,
              type: "date"
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return {
        status: status.value,
        value: new Date(input.data.getTime())
      };
    }
    _addCheck(check) {
      return new _ZodDate({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    min(minDate, message) {
      return this._addCheck({
        kind: "min",
        value: minDate.getTime(),
        message: errorUtil.toString(message)
      });
    }
    max(maxDate, message) {
      return this._addCheck({
        kind: "max",
        value: maxDate.getTime(),
        message: errorUtil.toString(message)
      });
    }
    get minDate() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min != null ? new Date(min) : null;
    }
    get maxDate() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max != null ? new Date(max) : null;
    }
  };
  ZodDate.create = (params) => {
    return new ZodDate({
      checks: [],
      coerce: params?.coerce || false,
      typeName: ZodFirstPartyTypeKind.ZodDate,
      ...processCreateParams(params)
    });
  };
  var ZodSymbol = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.symbol) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.symbol,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodSymbol.create = (params) => {
    return new ZodSymbol({
      typeName: ZodFirstPartyTypeKind.ZodSymbol,
      ...processCreateParams(params)
    });
  };
  var ZodUndefined = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.undefined) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.undefined,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodUndefined.create = (params) => {
    return new ZodUndefined({
      typeName: ZodFirstPartyTypeKind.ZodUndefined,
      ...processCreateParams(params)
    });
  };
  var ZodNull = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.null) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.null,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodNull.create = (params) => {
    return new ZodNull({
      typeName: ZodFirstPartyTypeKind.ZodNull,
      ...processCreateParams(params)
    });
  };
  var ZodAny = class extends ZodType {
    constructor() {
      super(...arguments);
      this._any = true;
    }
    _parse(input) {
      return OK(input.data);
    }
  };
  ZodAny.create = (params) => {
    return new ZodAny({
      typeName: ZodFirstPartyTypeKind.ZodAny,
      ...processCreateParams(params)
    });
  };
  var ZodUnknown = class extends ZodType {
    constructor() {
      super(...arguments);
      this._unknown = true;
    }
    _parse(input) {
      return OK(input.data);
    }
  };
  ZodUnknown.create = (params) => {
    return new ZodUnknown({
      typeName: ZodFirstPartyTypeKind.ZodUnknown,
      ...processCreateParams(params)
    });
  };
  var ZodNever = class extends ZodType {
    _parse(input) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.never,
        received: ctx.parsedType
      });
      return INVALID;
    }
  };
  ZodNever.create = (params) => {
    return new ZodNever({
      typeName: ZodFirstPartyTypeKind.ZodNever,
      ...processCreateParams(params)
    });
  };
  var ZodVoid = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.undefined) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.void,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodVoid.create = (params) => {
    return new ZodVoid({
      typeName: ZodFirstPartyTypeKind.ZodVoid,
      ...processCreateParams(params)
    });
  };
  var ZodArray = class _ZodArray extends ZodType {
    _parse(input) {
      const { ctx, status } = this._processInputParams(input);
      const def = this._def;
      if (ctx.parsedType !== ZodParsedType.array) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.array,
          received: ctx.parsedType
        });
        return INVALID;
      }
      if (def.exactLength !== null) {
        const tooBig = ctx.data.length > def.exactLength.value;
        const tooSmall = ctx.data.length < def.exactLength.value;
        if (tooBig || tooSmall) {
          addIssueToContext(ctx, {
            code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
            minimum: tooSmall ? def.exactLength.value : void 0,
            maximum: tooBig ? def.exactLength.value : void 0,
            type: "array",
            inclusive: true,
            exact: true,
            message: def.exactLength.message
          });
          status.dirty();
        }
      }
      if (def.minLength !== null) {
        if (ctx.data.length < def.minLength.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: def.minLength.value,
            type: "array",
            inclusive: true,
            exact: false,
            message: def.minLength.message
          });
          status.dirty();
        }
      }
      if (def.maxLength !== null) {
        if (ctx.data.length > def.maxLength.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: def.maxLength.value,
            type: "array",
            inclusive: true,
            exact: false,
            message: def.maxLength.message
          });
          status.dirty();
        }
      }
      if (ctx.common.async) {
        return Promise.all([...ctx.data].map((item, i) => {
          return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        })).then((result2) => {
          return ParseStatus.mergeArray(status, result2);
        });
      }
      const result = [...ctx.data].map((item, i) => {
        return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      });
      return ParseStatus.mergeArray(status, result);
    }
    get element() {
      return this._def.type;
    }
    min(minLength, message) {
      return new _ZodArray({
        ...this._def,
        minLength: { value: minLength, message: errorUtil.toString(message) }
      });
    }
    max(maxLength, message) {
      return new _ZodArray({
        ...this._def,
        maxLength: { value: maxLength, message: errorUtil.toString(message) }
      });
    }
    length(len, message) {
      return new _ZodArray({
        ...this._def,
        exactLength: { value: len, message: errorUtil.toString(message) }
      });
    }
    nonempty(message) {
      return this.min(1, message);
    }
  };
  ZodArray.create = (schema, params) => {
    return new ZodArray({
      type: schema,
      minLength: null,
      maxLength: null,
      exactLength: null,
      typeName: ZodFirstPartyTypeKind.ZodArray,
      ...processCreateParams(params)
    });
  };
  function deepPartialify(schema) {
    if (schema instanceof ZodObject) {
      const newShape2 = {};
      for (const key in schema.shape) {
        const fieldSchema = schema.shape[key];
        newShape2[key] = ZodOptional.create(deepPartialify(fieldSchema));
      }
      return new ZodObject({
        ...schema._def,
        shape: () => newShape2
      });
    } else if (schema instanceof ZodArray) {
      return new ZodArray({
        ...schema._def,
        type: deepPartialify(schema.element)
      });
    } else if (schema instanceof ZodOptional) {
      return ZodOptional.create(deepPartialify(schema.unwrap()));
    } else if (schema instanceof ZodNullable) {
      return ZodNullable.create(deepPartialify(schema.unwrap()));
    } else if (schema instanceof ZodTuple) {
      return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
    } else {
      return schema;
    }
  }
  var ZodObject = class _ZodObject extends ZodType {
    constructor() {
      super(...arguments);
      this._cached = null;
      this.nonstrict = this.passthrough;
      this.augment = this.extend;
    }
    _getCached() {
      if (this._cached !== null)
        return this._cached;
      const shape = this._def.shape();
      const keys = util.objectKeys(shape);
      this._cached = { shape, keys };
      return this._cached;
    }
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.object) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      const { status, ctx } = this._processInputParams(input);
      const { shape, keys: shapeKeys } = this._getCached();
      const extraKeys = [];
      if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
        for (const key in ctx.data) {
          if (!shapeKeys.includes(key)) {
            extraKeys.push(key);
          }
        }
      }
      const pairs = [];
      for (const key of shapeKeys) {
        const keyValidator = shape[key];
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
      if (this._def.catchall instanceof ZodNever) {
        const unknownKeys = this._def.unknownKeys;
        if (unknownKeys === "passthrough") {
          for (const key of extraKeys) {
            pairs.push({
              key: { status: "valid", value: key },
              value: { status: "valid", value: ctx.data[key] }
            });
          }
        } else if (unknownKeys === "strict") {
          if (extraKeys.length > 0) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.unrecognized_keys,
              keys: extraKeys
            });
            status.dirty();
          }
        } else if (unknownKeys === "strip") {
        } else {
          throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
        }
      } else {
        const catchall = this._def.catchall;
        for (const key of extraKeys) {
          const value = ctx.data[key];
          pairs.push({
            key: { status: "valid", value: key },
            value: catchall._parse(
              new ParseInputLazyPath(ctx, value, ctx.path, key)
              //, ctx.child(key), value, getParsedType(value)
            ),
            alwaysSet: key in ctx.data
          });
        }
      }
      if (ctx.common.async) {
        return Promise.resolve().then(async () => {
          const syncPairs = [];
          for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            syncPairs.push({
              key,
              value,
              alwaysSet: pair.alwaysSet
            });
          }
          return syncPairs;
        }).then((syncPairs) => {
          return ParseStatus.mergeObjectSync(status, syncPairs);
        });
      } else {
        return ParseStatus.mergeObjectSync(status, pairs);
      }
    }
    get shape() {
      return this._def.shape();
    }
    strict(message) {
      errorUtil.errToObj;
      return new _ZodObject({
        ...this._def,
        unknownKeys: "strict",
        ...message !== void 0 ? {
          errorMap: (issue, ctx) => {
            const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
            if (issue.code === "unrecognized_keys")
              return {
                message: errorUtil.errToObj(message).message ?? defaultError
              };
            return {
              message: defaultError
            };
          }
        } : {}
      });
    }
    strip() {
      return new _ZodObject({
        ...this._def,
        unknownKeys: "strip"
      });
    }
    passthrough() {
      return new _ZodObject({
        ...this._def,
        unknownKeys: "passthrough"
      });
    }
    // const AugmentFactory =
    //   <Def extends ZodObjectDef>(def: Def) =>
    //   <Augmentation extends ZodRawShape>(
    //     augmentation: Augmentation
    //   ): ZodObject<
    //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
    //     Def["unknownKeys"],
    //     Def["catchall"]
    //   > => {
    //     return new ZodObject({
    //       ...def,
    //       shape: () => ({
    //         ...def.shape(),
    //         ...augmentation,
    //       }),
    //     }) as any;
    //   };
    extend(augmentation) {
      return new _ZodObject({
        ...this._def,
        shape: () => ({
          ...this._def.shape(),
          ...augmentation
        })
      });
    }
    /**
     * Prior to zod@1.0.12 there was a bug in the
     * inferred type of merged objects. Please
     * upgrade if you are experiencing issues.
     */
    merge(merging) {
      const merged = new _ZodObject({
        unknownKeys: merging._def.unknownKeys,
        catchall: merging._def.catchall,
        shape: () => ({
          ...this._def.shape(),
          ...merging._def.shape()
        }),
        typeName: ZodFirstPartyTypeKind.ZodObject
      });
      return merged;
    }
    // merge<
    //   Incoming extends AnyZodObject,
    //   Augmentation extends Incoming["shape"],
    //   NewOutput extends {
    //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
    //       ? Augmentation[k]["_output"]
    //       : k extends keyof Output
    //       ? Output[k]
    //       : never;
    //   },
    //   NewInput extends {
    //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
    //       ? Augmentation[k]["_input"]
    //       : k extends keyof Input
    //       ? Input[k]
    //       : never;
    //   }
    // >(
    //   merging: Incoming
    // ): ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"],
    //   NewOutput,
    //   NewInput
    // > {
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    setKey(key, schema) {
      return this.augment({ [key]: schema });
    }
    // merge<Incoming extends AnyZodObject>(
    //   merging: Incoming
    // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
    // ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"]
    // > {
    //   // const mergedShape = objectUtil.mergeShapes(
    //   //   this._def.shape(),
    //   //   merging._def.shape()
    //   // );
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    catchall(index) {
      return new _ZodObject({
        ...this._def,
        catchall: index
      });
    }
    pick(mask) {
      const shape = {};
      for (const key of util.objectKeys(mask)) {
        if (mask[key] && this.shape[key]) {
          shape[key] = this.shape[key];
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => shape
      });
    }
    omit(mask) {
      const shape = {};
      for (const key of util.objectKeys(this.shape)) {
        if (!mask[key]) {
          shape[key] = this.shape[key];
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => shape
      });
    }
    /**
     * @deprecated
     */
    deepPartial() {
      return deepPartialify(this);
    }
    partial(mask) {
      const newShape2 = {};
      for (const key of util.objectKeys(this.shape)) {
        const fieldSchema = this.shape[key];
        if (mask && !mask[key]) {
          newShape2[key] = fieldSchema;
        } else {
          newShape2[key] = fieldSchema.optional();
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => newShape2
      });
    }
    required(mask) {
      const newShape2 = {};
      for (const key of util.objectKeys(this.shape)) {
        if (mask && !mask[key]) {
          newShape2[key] = this.shape[key];
        } else {
          const fieldSchema = this.shape[key];
          let newField = fieldSchema;
          while (newField instanceof ZodOptional) {
            newField = newField._def.innerType;
          }
          newShape2[key] = newField;
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => newShape2
      });
    }
    keyof() {
      return createZodEnum(util.objectKeys(this.shape));
    }
  };
  ZodObject.create = (shape, params) => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  ZodObject.strictCreate = (shape, params) => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: "strict",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  ZodObject.lazycreate = (shape, params) => {
    return new ZodObject({
      shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  var ZodUnion = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const options = this._def.options;
      function handleResults(results) {
        for (const result of results) {
          if (result.result.status === "valid") {
            return result.result;
          }
        }
        for (const result of results) {
          if (result.result.status === "dirty") {
            ctx.common.issues.push(...result.ctx.common.issues);
            return result.result;
          }
        }
        const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors
        });
        return INVALID;
      }
      if (ctx.common.async) {
        return Promise.all(options.map(async (option) => {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: []
            },
            parent: null
          };
          return {
            result: await option._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            }),
            ctx: childCtx
          };
        })).then(handleResults);
      } else {
        let dirty = void 0;
        const issues = [];
        for (const option of options) {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: []
            },
            parent: null
          };
          const result = option._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          });
          if (result.status === "valid") {
            return result;
          } else if (result.status === "dirty" && !dirty) {
            dirty = { result, ctx: childCtx };
          }
          if (childCtx.common.issues.length) {
            issues.push(childCtx.common.issues);
          }
        }
        if (dirty) {
          ctx.common.issues.push(...dirty.ctx.common.issues);
          return dirty.result;
        }
        const unionErrors = issues.map((issues2) => new ZodError(issues2));
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors
        });
        return INVALID;
      }
    }
    get options() {
      return this._def.options;
    }
  };
  ZodUnion.create = (types, params) => {
    return new ZodUnion({
      options: types,
      typeName: ZodFirstPartyTypeKind.ZodUnion,
      ...processCreateParams(params)
    });
  };
  var getDiscriminator = (type) => {
    if (type instanceof ZodLazy) {
      return getDiscriminator(type.schema);
    } else if (type instanceof ZodEffects) {
      return getDiscriminator(type.innerType());
    } else if (type instanceof ZodLiteral) {
      return [type.value];
    } else if (type instanceof ZodEnum) {
      return type.options;
    } else if (type instanceof ZodNativeEnum) {
      return util.objectValues(type.enum);
    } else if (type instanceof ZodDefault) {
      return getDiscriminator(type._def.innerType);
    } else if (type instanceof ZodUndefined) {
      return [void 0];
    } else if (type instanceof ZodNull) {
      return [null];
    } else if (type instanceof ZodOptional) {
      return [void 0, ...getDiscriminator(type.unwrap())];
    } else if (type instanceof ZodNullable) {
      return [null, ...getDiscriminator(type.unwrap())];
    } else if (type instanceof ZodBranded) {
      return getDiscriminator(type.unwrap());
    } else if (type instanceof ZodReadonly) {
      return getDiscriminator(type.unwrap());
    } else if (type instanceof ZodCatch) {
      return getDiscriminator(type._def.innerType);
    } else {
      return [];
    }
  };
  var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const discriminator = this.discriminator;
      const discriminatorValue = ctx.data[discriminator];
      const option = this.optionsMap.get(discriminatorValue);
      if (!option) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union_discriminator,
          options: Array.from(this.optionsMap.keys()),
          path: [discriminator]
        });
        return INVALID;
      }
      if (ctx.common.async) {
        return option._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
      } else {
        return option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
      }
    }
    get discriminator() {
      return this._def.discriminator;
    }
    get options() {
      return this._def.options;
    }
    get optionsMap() {
      return this._def.optionsMap;
    }
    /**
     * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
     * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
     * have a different value for each object in the union.
     * @param discriminator the name of the discriminator property
     * @param types an array of object schemas
     * @param params
     */
    static create(discriminator, options, params) {
      const optionsMap = /* @__PURE__ */ new Map();
      for (const type of options) {
        const discriminatorValues = getDiscriminator(type.shape[discriminator]);
        if (!discriminatorValues.length) {
          throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
        }
        for (const value of discriminatorValues) {
          if (optionsMap.has(value)) {
            throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
          }
          optionsMap.set(value, type);
        }
      }
      return new _ZodDiscriminatedUnion({
        typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
        discriminator,
        options,
        optionsMap,
        ...processCreateParams(params)
      });
    }
  };
  function mergeValues(a, b) {
    const aType = getParsedType(a);
    const bType = getParsedType(b);
    if (a === b) {
      return { valid: true, data: a };
    } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
      const bKeys = util.objectKeys(b);
      const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
      const newObj = { ...a, ...b };
      for (const key of sharedKeys) {
        const sharedValue = mergeValues(a[key], b[key]);
        if (!sharedValue.valid) {
          return { valid: false };
        }
        newObj[key] = sharedValue.data;
      }
      return { valid: true, data: newObj };
    } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
      if (a.length !== b.length) {
        return { valid: false };
      }
      const newArray = [];
      for (let index = 0; index < a.length; index++) {
        const itemA = a[index];
        const itemB = b[index];
        const sharedValue = mergeValues(itemA, itemB);
        if (!sharedValue.valid) {
          return { valid: false };
        }
        newArray.push(sharedValue.data);
      }
      return { valid: true, data: newArray };
    } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
      return { valid: true, data: a };
    } else {
      return { valid: false };
    }
  }
  var ZodIntersection = class extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      const handleParsed = (parsedLeft, parsedRight) => {
        if (isAborted(parsedLeft) || isAborted(parsedRight)) {
          return INVALID;
        }
        const merged = mergeValues(parsedLeft.value, parsedRight.value);
        if (!merged.valid) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_intersection_types
          });
          return INVALID;
        }
        if (isDirty(parsedLeft) || isDirty(parsedRight)) {
          status.dirty();
        }
        return { status: status.value, value: merged.data };
      };
      if (ctx.common.async) {
        return Promise.all([
          this._def.left._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }),
          this._def.right._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          })
        ]).then(([left, right]) => handleParsed(left, right));
      } else {
        return handleParsed(this._def.left._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }), this._def.right._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }));
      }
    }
  };
  ZodIntersection.create = (left, right, params) => {
    return new ZodIntersection({
      left,
      right,
      typeName: ZodFirstPartyTypeKind.ZodIntersection,
      ...processCreateParams(params)
    });
  };
  var ZodTuple = class _ZodTuple extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.array) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.array,
          received: ctx.parsedType
        });
        return INVALID;
      }
      if (ctx.data.length < this._def.items.length) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: this._def.items.length,
          inclusive: true,
          exact: false,
          type: "array"
        });
        return INVALID;
      }
      const rest = this._def.rest;
      if (!rest && ctx.data.length > this._def.items.length) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: this._def.items.length,
          inclusive: true,
          exact: false,
          type: "array"
        });
        status.dirty();
      }
      const items = [...ctx.data].map((item, itemIndex) => {
        const schema = this._def.items[itemIndex] || this._def.rest;
        if (!schema)
          return null;
        return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
      }).filter((x) => !!x);
      if (ctx.common.async) {
        return Promise.all(items).then((results) => {
          return ParseStatus.mergeArray(status, results);
        });
      } else {
        return ParseStatus.mergeArray(status, items);
      }
    }
    get items() {
      return this._def.items;
    }
    rest(rest) {
      return new _ZodTuple({
        ...this._def,
        rest
      });
    }
  };
  ZodTuple.create = (schemas, params) => {
    if (!Array.isArray(schemas)) {
      throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
    }
    return new ZodTuple({
      items: schemas,
      typeName: ZodFirstPartyTypeKind.ZodTuple,
      rest: null,
      ...processCreateParams(params)
    });
  };
  var ZodRecord = class _ZodRecord extends ZodType {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const pairs = [];
      const keyType = this._def.keyType;
      const valueType = this._def.valueType;
      for (const key in ctx.data) {
        pairs.push({
          key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
          value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
      if (ctx.common.async) {
        return ParseStatus.mergeObjectAsync(status, pairs);
      } else {
        return ParseStatus.mergeObjectSync(status, pairs);
      }
    }
    get element() {
      return this._def.valueType;
    }
    static create(first, second, third) {
      if (second instanceof ZodType) {
        return new _ZodRecord({
          keyType: first,
          valueType: second,
          typeName: ZodFirstPartyTypeKind.ZodRecord,
          ...processCreateParams(third)
        });
      }
      return new _ZodRecord({
        keyType: ZodString.create(),
        valueType: first,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(second)
      });
    }
  };
  var ZodMap = class extends ZodType {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.map) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.map,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const keyType = this._def.keyType;
      const valueType = this._def.valueType;
      const pairs = [...ctx.data.entries()].map(([key, value], index) => {
        return {
          key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
          value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
        };
      });
      if (ctx.common.async) {
        const finalMap = /* @__PURE__ */ new Map();
        return Promise.resolve().then(async () => {
          for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            if (key.status === "aborted" || value.status === "aborted") {
              return INVALID;
            }
            if (key.status === "dirty" || value.status === "dirty") {
              status.dirty();
            }
            finalMap.set(key.value, value.value);
          }
          return { status: status.value, value: finalMap };
        });
      } else {
        const finalMap = /* @__PURE__ */ new Map();
        for (const pair of pairs) {
          const key = pair.key;
          const value = pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      }
    }
  };
  ZodMap.create = (keyType, valueType, params) => {
    return new ZodMap({
      valueType,
      keyType,
      typeName: ZodFirstPartyTypeKind.ZodMap,
      ...processCreateParams(params)
    });
  };
  var ZodSet = class _ZodSet extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.set) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.set,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const def = this._def;
      if (def.minSize !== null) {
        if (ctx.data.size < def.minSize.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: def.minSize.value,
            type: "set",
            inclusive: true,
            exact: false,
            message: def.minSize.message
          });
          status.dirty();
        }
      }
      if (def.maxSize !== null) {
        if (ctx.data.size > def.maxSize.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: def.maxSize.value,
            type: "set",
            inclusive: true,
            exact: false,
            message: def.maxSize.message
          });
          status.dirty();
        }
      }
      const valueType = this._def.valueType;
      function finalizeSet(elements2) {
        const parsedSet = /* @__PURE__ */ new Set();
        for (const element of elements2) {
          if (element.status === "aborted")
            return INVALID;
          if (element.status === "dirty")
            status.dirty();
          parsedSet.add(element.value);
        }
        return { status: status.value, value: parsedSet };
      }
      const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
      if (ctx.common.async) {
        return Promise.all(elements).then((elements2) => finalizeSet(elements2));
      } else {
        return finalizeSet(elements);
      }
    }
    min(minSize, message) {
      return new _ZodSet({
        ...this._def,
        minSize: { value: minSize, message: errorUtil.toString(message) }
      });
    }
    max(maxSize, message) {
      return new _ZodSet({
        ...this._def,
        maxSize: { value: maxSize, message: errorUtil.toString(message) }
      });
    }
    size(size, message) {
      return this.min(size, message).max(size, message);
    }
    nonempty(message) {
      return this.min(1, message);
    }
  };
  ZodSet.create = (valueType, params) => {
    return new ZodSet({
      valueType,
      minSize: null,
      maxSize: null,
      typeName: ZodFirstPartyTypeKind.ZodSet,
      ...processCreateParams(params)
    });
  };
  var ZodFunction = class _ZodFunction extends ZodType {
    constructor() {
      super(...arguments);
      this.validate = this.implement;
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.function) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.function,
          received: ctx.parsedType
        });
        return INVALID;
      }
      function makeArgsIssue(args, error) {
        return makeIssue({
          data: args,
          path: ctx.path,
          errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
          issueData: {
            code: ZodIssueCode.invalid_arguments,
            argumentsError: error
          }
        });
      }
      function makeReturnsIssue(returns, error) {
        return makeIssue({
          data: returns,
          path: ctx.path,
          errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
          issueData: {
            code: ZodIssueCode.invalid_return_type,
            returnTypeError: error
          }
        });
      }
      const params = { errorMap: ctx.common.contextualErrorMap };
      const fn = ctx.data;
      if (this._def.returns instanceof ZodPromise) {
        const me = this;
        return OK(async function(...args) {
          const error = new ZodError([]);
          const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
            error.addIssue(makeArgsIssue(args, e));
            throw error;
          });
          const result = await Reflect.apply(fn, this, parsedArgs);
          const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
            error.addIssue(makeReturnsIssue(result, e));
            throw error;
          });
          return parsedReturns;
        });
      } else {
        const me = this;
        return OK(function(...args) {
          const parsedArgs = me._def.args.safeParse(args, params);
          if (!parsedArgs.success) {
            throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
          }
          const result = Reflect.apply(fn, this, parsedArgs.data);
          const parsedReturns = me._def.returns.safeParse(result, params);
          if (!parsedReturns.success) {
            throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
          }
          return parsedReturns.data;
        });
      }
    }
    parameters() {
      return this._def.args;
    }
    returnType() {
      return this._def.returns;
    }
    args(...items) {
      return new _ZodFunction({
        ...this._def,
        args: ZodTuple.create(items).rest(ZodUnknown.create())
      });
    }
    returns(returnType) {
      return new _ZodFunction({
        ...this._def,
        returns: returnType
      });
    }
    implement(func) {
      const validatedFunc = this.parse(func);
      return validatedFunc;
    }
    strictImplement(func) {
      const validatedFunc = this.parse(func);
      return validatedFunc;
    }
    static create(args, returns, params) {
      return new _ZodFunction({
        args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
        returns: returns || ZodUnknown.create(),
        typeName: ZodFirstPartyTypeKind.ZodFunction,
        ...processCreateParams(params)
      });
    }
  };
  var ZodLazy = class extends ZodType {
    get schema() {
      return this._def.getter();
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const lazySchema = this._def.getter();
      return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
    }
  };
  ZodLazy.create = (getter, params) => {
    return new ZodLazy({
      getter,
      typeName: ZodFirstPartyTypeKind.ZodLazy,
      ...processCreateParams(params)
    });
  };
  var ZodLiteral = class extends ZodType {
    _parse(input) {
      if (input.data !== this._def.value) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_literal,
          expected: this._def.value
        });
        return INVALID;
      }
      return { status: "valid", value: input.data };
    }
    get value() {
      return this._def.value;
    }
  };
  ZodLiteral.create = (value, params) => {
    return new ZodLiteral({
      value,
      typeName: ZodFirstPartyTypeKind.ZodLiteral,
      ...processCreateParams(params)
    });
  };
  function createZodEnum(values, params) {
    return new ZodEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodEnum,
      ...processCreateParams(params)
    });
  }
  var ZodEnum = class _ZodEnum extends ZodType {
    _parse(input) {
      if (typeof input.data !== "string") {
        const ctx = this._getOrReturnCtx(input);
        const expectedValues = this._def.values;
        addIssueToContext(ctx, {
          expected: util.joinValues(expectedValues),
          received: ctx.parsedType,
          code: ZodIssueCode.invalid_type
        });
        return INVALID;
      }
      if (!this._cache) {
        this._cache = new Set(this._def.values);
      }
      if (!this._cache.has(input.data)) {
        const ctx = this._getOrReturnCtx(input);
        const expectedValues = this._def.values;
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_enum_value,
          options: expectedValues
        });
        return INVALID;
      }
      return OK(input.data);
    }
    get options() {
      return this._def.values;
    }
    get enum() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    get Values() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    get Enum() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    extract(values, newDef = this._def) {
      return _ZodEnum.create(values, {
        ...this._def,
        ...newDef
      });
    }
    exclude(values, newDef = this._def) {
      return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
        ...this._def,
        ...newDef
      });
    }
  };
  ZodEnum.create = createZodEnum;
  var ZodNativeEnum = class extends ZodType {
    _parse(input) {
      const nativeEnumValues = util.getValidEnumValues(this._def.values);
      const ctx = this._getOrReturnCtx(input);
      if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
        const expectedValues = util.objectValues(nativeEnumValues);
        addIssueToContext(ctx, {
          expected: util.joinValues(expectedValues),
          received: ctx.parsedType,
          code: ZodIssueCode.invalid_type
        });
        return INVALID;
      }
      if (!this._cache) {
        this._cache = new Set(util.getValidEnumValues(this._def.values));
      }
      if (!this._cache.has(input.data)) {
        const expectedValues = util.objectValues(nativeEnumValues);
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_enum_value,
          options: expectedValues
        });
        return INVALID;
      }
      return OK(input.data);
    }
    get enum() {
      return this._def.values;
    }
  };
  ZodNativeEnum.create = (values, params) => {
    return new ZodNativeEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
      ...processCreateParams(params)
    });
  };
  var ZodPromise = class extends ZodType {
    unwrap() {
      return this._def.type;
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.promise,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
      return OK(promisified.then((data) => {
        return this._def.type.parseAsync(data, {
          path: ctx.path,
          errorMap: ctx.common.contextualErrorMap
        });
      }));
    }
  };
  ZodPromise.create = (schema, params) => {
    return new ZodPromise({
      type: schema,
      typeName: ZodFirstPartyTypeKind.ZodPromise,
      ...processCreateParams(params)
    });
  };
  var ZodEffects = class extends ZodType {
    innerType() {
      return this._def.schema;
    }
    sourceType() {
      return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      const effect = this._def.effect || null;
      const checkCtx = {
        addIssue: (arg) => {
          addIssueToContext(ctx, arg);
          if (arg.fatal) {
            status.abort();
          } else {
            status.dirty();
          }
        },
        get path() {
          return ctx.path;
        }
      };
      checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
      if (effect.type === "preprocess") {
        const processed = effect.transform(ctx.data, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(processed).then(async (processed2) => {
            if (status.value === "aborted")
              return INVALID;
            const result = await this._def.schema._parseAsync({
              data: processed2,
              path: ctx.path,
              parent: ctx
            });
            if (result.status === "aborted")
              return INVALID;
            if (result.status === "dirty")
              return DIRTY(result.value);
            if (status.value === "dirty")
              return DIRTY(result.value);
            return result;
          });
        } else {
          if (status.value === "aborted")
            return INVALID;
          const result = this._def.schema._parseSync({
            data: processed,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        }
      }
      if (effect.type === "refinement") {
        const executeRefinement = (acc) => {
          const result = effect.refinement(acc, checkCtx);
          if (ctx.common.async) {
            return Promise.resolve(result);
          }
          if (result instanceof Promise) {
            throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
          }
          return acc;
        };
        if (ctx.common.async === false) {
          const inner = this._def.schema._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          executeRefinement(inner.value);
          return { status: status.value, value: inner.value };
        } else {
          return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
            if (inner.status === "aborted")
              return INVALID;
            if (inner.status === "dirty")
              status.dirty();
            return executeRefinement(inner.value).then(() => {
              return { status: status.value, value: inner.value };
            });
          });
        }
      }
      if (effect.type === "transform") {
        if (ctx.common.async === false) {
          const base = this._def.schema._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (!isValid(base))
            return INVALID;
          const result = effect.transform(base.value, checkCtx);
          if (result instanceof Promise) {
            throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
          }
          return { status: status.value, value: result };
        } else {
          return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
            if (!isValid(base))
              return INVALID;
            return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
              status: status.value,
              value: result
            }));
          });
        }
      }
      util.assertNever(effect);
    }
  };
  ZodEffects.create = (schema, effect, params) => {
    return new ZodEffects({
      schema,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect,
      ...processCreateParams(params)
    });
  };
  ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
    return new ZodEffects({
      schema,
      effect: { type: "preprocess", transform: preprocess },
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      ...processCreateParams(params)
    });
  };
  var ZodOptional = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType === ZodParsedType.undefined) {
        return OK(void 0);
      }
      return this._def.innerType._parse(input);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodOptional.create = (type, params) => {
    return new ZodOptional({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodOptional,
      ...processCreateParams(params)
    });
  };
  var ZodNullable = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType === ZodParsedType.null) {
        return OK(null);
      }
      return this._def.innerType._parse(input);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodNullable.create = (type, params) => {
    return new ZodNullable({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodNullable,
      ...processCreateParams(params)
    });
  };
  var ZodDefault = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      let data = ctx.data;
      if (ctx.parsedType === ZodParsedType.undefined) {
        data = this._def.defaultValue();
      }
      return this._def.innerType._parse({
        data,
        path: ctx.path,
        parent: ctx
      });
    }
    removeDefault() {
      return this._def.innerType;
    }
  };
  ZodDefault.create = (type, params) => {
    return new ZodDefault({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodDefault,
      defaultValue: typeof params.default === "function" ? params.default : () => params.default,
      ...processCreateParams(params)
    });
  };
  var ZodCatch = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const newCtx = {
        ...ctx,
        common: {
          ...ctx.common,
          issues: []
        }
      };
      const result = this._def.innerType._parse({
        data: newCtx.data,
        path: newCtx.path,
        parent: {
          ...newCtx
        }
      });
      if (isAsync(result)) {
        return result.then((result2) => {
          return {
            status: "valid",
            value: result2.status === "valid" ? result2.value : this._def.catchValue({
              get error() {
                return new ZodError(newCtx.common.issues);
              },
              input: newCtx.data
            })
          };
        });
      } else {
        return {
          status: "valid",
          value: result.status === "valid" ? result.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      }
    }
    removeCatch() {
      return this._def.innerType;
    }
  };
  ZodCatch.create = (type, params) => {
    return new ZodCatch({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodCatch,
      catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
      ...processCreateParams(params)
    });
  };
  var ZodNaN = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.nan) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.nan,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return { status: "valid", value: input.data };
    }
  };
  ZodNaN.create = (params) => {
    return new ZodNaN({
      typeName: ZodFirstPartyTypeKind.ZodNaN,
      ...processCreateParams(params)
    });
  };
  var BRAND = Symbol("zod_brand");
  var ZodBranded = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const data = ctx.data;
      return this._def.type._parse({
        data,
        path: ctx.path,
        parent: ctx
      });
    }
    unwrap() {
      return this._def.type;
    }
  };
  var ZodPipeline = class _ZodPipeline extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.common.async) {
        const handleAsync = async () => {
          const inResult = await this._def.in._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inResult.status === "aborted")
            return INVALID;
          if (inResult.status === "dirty") {
            status.dirty();
            return DIRTY(inResult.value);
          } else {
            return this._def.out._parseAsync({
              data: inResult.value,
              path: ctx.path,
              parent: ctx
            });
          }
        };
        return handleAsync();
      } else {
        const inResult = this._def.in._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return {
            status: "dirty",
            value: inResult.value
          };
        } else {
          return this._def.out._parseSync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      }
    }
    static create(a, b) {
      return new _ZodPipeline({
        in: a,
        out: b,
        typeName: ZodFirstPartyTypeKind.ZodPipeline
      });
    }
  };
  var ZodReadonly = class extends ZodType {
    _parse(input) {
      const result = this._def.innerType._parse(input);
      const freeze = (data) => {
        if (isValid(data)) {
          data.value = Object.freeze(data.value);
        }
        return data;
      };
      return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodReadonly.create = (type, params) => {
    return new ZodReadonly({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodReadonly,
      ...processCreateParams(params)
    });
  };
  function cleanParams(params, data) {
    const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
    const p2 = typeof p === "string" ? { message: p } : p;
    return p2;
  }
  function custom(check, _params = {}, fatal) {
    if (check)
      return ZodAny.create().superRefine((data, ctx) => {
        const r = check(data);
        if (r instanceof Promise) {
          return r.then((r2) => {
            if (!r2) {
              const params = cleanParams(_params, data);
              const _fatal = params.fatal ?? fatal ?? true;
              ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
            }
          });
        }
        if (!r) {
          const params = cleanParams(_params, data);
          const _fatal = params.fatal ?? fatal ?? true;
          ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
        }
        return;
      });
    return ZodAny.create();
  }
  var late = {
    object: ZodObject.lazycreate
  };
  var ZodFirstPartyTypeKind;
  (function(ZodFirstPartyTypeKind2) {
    ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
    ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
    ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
    ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
    ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
    ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
    ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
    ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
    ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
    ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
    ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
    ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
    ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
    ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
    ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
    ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
    ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
    ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
    ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
    ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
    ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
    ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
    ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
    ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
    ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
    ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
    ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
    ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
    ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
    ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
    ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
    ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
    ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
    ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
    ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
    ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
  })(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
  var instanceOfType = (cls, params = {
    message: `Input not instance of ${cls.name}`
  }) => custom((data) => data instanceof cls, params);
  var stringType = ZodString.create;
  var numberType = ZodNumber.create;
  var nanType = ZodNaN.create;
  var bigIntType = ZodBigInt.create;
  var booleanType = ZodBoolean.create;
  var dateType = ZodDate.create;
  var symbolType = ZodSymbol.create;
  var undefinedType = ZodUndefined.create;
  var nullType = ZodNull.create;
  var anyType = ZodAny.create;
  var unknownType = ZodUnknown.create;
  var neverType = ZodNever.create;
  var voidType = ZodVoid.create;
  var arrayType = ZodArray.create;
  var objectType = ZodObject.create;
  var strictObjectType = ZodObject.strictCreate;
  var unionType = ZodUnion.create;
  var discriminatedUnionType = ZodDiscriminatedUnion.create;
  var intersectionType = ZodIntersection.create;
  var tupleType = ZodTuple.create;
  var recordType = ZodRecord.create;
  var mapType = ZodMap.create;
  var setType = ZodSet.create;
  var functionType = ZodFunction.create;
  var lazyType = ZodLazy.create;
  var literalType = ZodLiteral.create;
  var enumType = ZodEnum.create;
  var nativeEnumType = ZodNativeEnum.create;
  var promiseType = ZodPromise.create;
  var effectsType = ZodEffects.create;
  var optionalType = ZodOptional.create;
  var nullableType = ZodNullable.create;
  var preprocessType = ZodEffects.createWithPreprocess;
  var pipelineType = ZodPipeline.create;
  var ostring = () => stringType().optional();
  var onumber = () => numberType().optional();
  var oboolean = () => booleanType().optional();
  var coerce = {
    string: (arg) => ZodString.create({ ...arg, coerce: true }),
    number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
    boolean: (arg) => ZodBoolean.create({
      ...arg,
      coerce: true
    }),
    bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
    date: (arg) => ZodDate.create({ ...arg, coerce: true })
  };
  var NEVER = INVALID;

  // packages/core/src/presets/overlay.ts
  var overlayPresets = [
    {
      id: "overlay.blur",
      category: "overlay",
      description: "blur",
      tags: ["filter"],
      continuous: true,
      params: { amount: { default: 8, min: 0, max: 40, unit: "px" } },
      defaultDuration: 5,
      apply: (_p, prm) => ({ css: { filter: `blur(${prm.amount}px)` } })
    },
    {
      id: "overlay.black-white",
      category: "overlay",
      description: "black & white",
      tags: ["filter", "mono"],
      continuous: true,
      params: { amount: { default: 1, min: 0, max: 1 } },
      defaultDuration: 5,
      apply: (_p, prm) => ({ css: { filter: `grayscale(${prm.amount})` } })
    },
    {
      id: "overlay.sepia",
      category: "overlay",
      description: "sepia",
      tags: ["filter", "warm"],
      continuous: true,
      params: { amount: { default: 0.8, min: 0, max: 1 } },
      defaultDuration: 5,
      apply: (_p, prm) => ({ css: { filter: `sepia(${prm.amount})` } })
    },
    {
      id: "overlay.brighten",
      category: "overlay",
      description: "brighten",
      tags: ["filter"],
      continuous: true,
      params: { amount: { default: 0.3, min: 0, max: 1 } },
      defaultDuration: 5,
      apply: (_p, prm) => ({ css: { filter: `brightness(${1 + prm.amount})` } })
    },
    {
      id: "overlay.darken",
      category: "overlay",
      description: "darken",
      tags: ["filter"],
      continuous: true,
      params: { amount: { default: 0.4, min: 0, max: 1 } },
      defaultDuration: 5,
      apply: (_p, prm) => ({ css: { filter: `brightness(${1 - prm.amount})` } })
    },
    {
      id: "overlay.contrast",
      category: "overlay",
      description: "contrast",
      tags: ["filter"],
      continuous: true,
      params: { amount: { default: 0.4, min: 0, max: 1.5 } },
      defaultDuration: 5,
      apply: (_p, prm) => ({ css: { filter: `contrast(${1 + prm.amount})` } })
    },
    {
      id: "overlay.saturate",
      category: "overlay",
      description: "saturate",
      tags: ["filter", "color"],
      continuous: true,
      params: { amount: { default: 1.6, min: 0, max: 3 } },
      defaultDuration: 5,
      apply: (_p, prm) => ({ css: { filter: `saturate(${prm.amount})` } })
    },
    {
      id: "overlay.fade",
      category: "overlay",
      description: "fade",
      tags: ["dim"],
      continuous: true,
      params: { amount: { default: 0.5, min: 0, max: 1 } },
      defaultDuration: 5,
      apply: (_p, prm) => ({ css: { background: `rgba(0,0,0,${prm.amount})` } })
    },
    {
      id: "overlay.vignette",
      category: "overlay",
      description: "vignette",
      tags: ["cinematic"],
      continuous: true,
      params: { amount: { default: 0.7, min: 0, max: 1 } },
      defaultDuration: 5,
      apply: (_p, prm) => ({ css: { boxShadow: `inset 0 0 140px ${40 * prm.amount}px rgba(0,0,0,${0.85 * prm.amount})` } })
    },
    {
      id: "overlay.invert",
      category: "overlay",
      description: "invert",
      tags: ["filter"],
      continuous: true,
      params: { amount: { default: 1, min: 0, max: 1 } },
      defaultDuration: 5,
      apply: (_p, prm) => ({ css: { filter: `invert(${prm.amount})` } })
    }
  ];

  // packages/core/src/schema.ts
  var presetInstance = external_exports.object({
    id: external_exports.string(),
    params: external_exports.record(external_exports.number()).optional(),
    start: external_exports.number().optional(),
    duration: external_exports.number().optional()
  });
  var easingName = external_exports.enum([
    "linear",
    "easeIn",
    "easeOut",
    "easeInOut",
    "easeOutBack",
    "easeOutExpo",
    "easeOutCubic",
    "easeInOutCubic"
  ]);
  var keyframe = external_exports.object({
    t: external_exports.number(),
    value: external_exports.number(),
    easing: easingName.optional()
  });
  var transform = external_exports.object({
    x: external_exports.number().optional(),
    y: external_exports.number().optional(),
    scale: external_exports.number().optional(),
    rotate: external_exports.number().optional(),
    opacity: external_exports.number().optional(),
    anchor: external_exports.tuple([external_exports.number(), external_exports.number()]).optional()
  }).optional();
  var rect = external_exports.object({ x: external_exports.number(), y: external_exports.number(), w: external_exports.number(), h: external_exports.number() }).optional();
  var overlayEffectValues = overlayPresets.map((p) => p.id.replace(/^overlay\./, ""));
  var overlayEffect = external_exports.enum(overlayEffectValues);
  var baseLayer = {
    id: external_exports.string().optional(),
    start: external_exports.number().optional(),
    duration: external_exports.number().optional(),
    rect,
    transform,
    presets: external_exports.array(presetInstance).optional(),
    keyframes: external_exports.record(external_exports.array(keyframe)).optional(),
    zIndex: external_exports.number().optional()
  };
  var layer = external_exports.discriminatedUnion("type", [
    external_exports.object({ ...baseLayer, type: external_exports.literal("text"), text: external_exports.string(), style: external_exports.record(external_exports.string()).optional() }),
    external_exports.object({ ...baseLayer, type: external_exports.literal("image"), src: external_exports.string(), fit: external_exports.enum(["cover", "contain"]).optional() }),
    external_exports.object({ ...baseLayer, type: external_exports.literal("video"), src: external_exports.string(), trimStart: external_exports.number().optional(), fit: external_exports.enum(["cover", "contain"]).optional() }),
    external_exports.object({ ...baseLayer, type: external_exports.literal("html"), html: external_exports.string() }),
    external_exports.object({ ...baseLayer, type: external_exports.literal("three"), scene: external_exports.string(), props: external_exports.record(external_exports.number()).optional() }),
    external_exports.object({ ...baseLayer, type: external_exports.literal("shape"), shape: external_exports.enum(["rect", "circle", "line"]), fill: external_exports.string().optional(), radius: external_exports.number().optional() }),
    external_exports.object({ ...baseLayer, type: external_exports.literal("overlay"), effect: overlayEffect, params: external_exports.record(external_exports.number()).optional() }),
    external_exports.object({ ...baseLayer, type: external_exports.literal("fx"), effect: external_exports.string(), params: external_exports.record(external_exports.number()).optional() })
  ]);
  var scene = external_exports.object({
    id: external_exports.string().optional(),
    duration: external_exports.number().positive(),
    background: external_exports.string().optional(),
    layers: external_exports.array(layer),
    transitionIn: presetInstance.optional()
  });
  var compositionSchema = external_exports.object({
    fps: external_exports.number().positive(),
    width: external_exports.number().positive(),
    height: external_exports.number().positive(),
    scenes: external_exports.array(scene).min(1),
    audio: external_exports.array(external_exports.object({
      src: external_exports.string(),
      start: external_exports.number().optional(),
      trimStart: external_exports.number().optional(),
      duration: external_exports.number().optional(),
      // clip length (seconds) — lets audio-clip trimming persist
      volume: external_exports.number().optional()
    })).optional(),
    defaultTransition: presetInstance.optional()
  });

  // packages/core/src/presets/text.ts
  var staggered = (p, ctx, staggerFrac) => {
    if (ctx.count <= 1 || staggerFrac <= 0) return clamp01(p);
    const total = 1 + (ctx.count - 1) * staggerFrac;
    const span = 1 / total;
    const startAt = ctx.index * staggerFrac * span;
    return clamp01((p - startAt) / span);
  };
  var textPresets = [
    {
      id: "text.fade-up",
      category: "text",
      description: "Text rises from below while fading in, with a soft ease-out.",
      tags: ["enter", "subtle", "vertical"],
      params: { distance: { default: 40, min: 0, max: 300, unit: "px" } },
      defaultDuration: 0.6,
      apply: (p, prm) => {
        const e = ease("easeOutCubic", p);
        return { y: (1 - e) * prm.distance, opacity: e };
      }
    },
    {
      id: "text.word-stagger",
      category: "text",
      description: "Words appear one after another, each fading up \u2014 great for headlines.",
      tags: ["enter", "stagger", "headline"],
      split: "word",
      params: {
        distance: { default: 30, min: 0, max: 200, unit: "px" },
        stagger: { default: 0.18, min: 0, max: 0.5, desc: "delay fraction per word" }
      },
      defaultDuration: 1,
      apply: (p, prm, ctx) => {
        const pe = staggered(p, ctx, prm.stagger);
        const e = ease("easeOutCubic", pe);
        return { y: (1 - e) * prm.distance, opacity: e };
      }
    },
    {
      id: "text.typewriter",
      category: "text",
      description: "Characters reveal left to right like typing.",
      tags: ["enter", "char", "retro"],
      split: "char",
      params: { stagger: { default: 0.04, min: 0, max: 0.3, desc: "delay fraction per char" } },
      defaultDuration: 1.2,
      apply: (p, prm, ctx) => {
        const pe = staggered(p, ctx, prm.stagger);
        return { opacity: pe > 0 ? 1 : 0 };
      }
    },
    {
      id: "text.pop",
      category: "text",
      description: "Text pops in from small with a springy overshoot.",
      tags: ["enter", "bouncy", "emphasis"],
      params: { from: { default: 0.6, min: 0, max: 1, desc: "starting scale" } },
      defaultDuration: 0.5,
      apply: (p, prm) => {
        const e = ease("easeOutBack", p);
        return { scale: prm.from + (1 - prm.from) * e, opacity: ease("easeOut", p) };
      }
    },
    {
      id: "text.blur-in",
      category: "text",
      description: "Text sharpens into focus from a soft blur while fading in.",
      tags: ["enter", "soft", "cinematic"],
      params: { blur: { default: 16, min: 0, max: 60, unit: "px" } },
      defaultDuration: 0.7,
      apply: (p, prm) => {
        const e = ease("easeOutCubic", p);
        return { blur: (1 - e) * prm.blur, opacity: e };
      }
    },
    {
      id: "text.drop",
      category: "text",
      description: "Text drops in from above and settles with a soft bounce.",
      tags: ["enter", "vertical", "bouncy"],
      params: { distance: { default: 80, min: 0, max: 400, unit: "px" } },
      defaultDuration: 0.6,
      apply: (p, prm) => {
        const e = ease("easeOutBack", p);
        return { y: -(1 - e) * prm.distance, opacity: ease("easeOut", p) };
      }
    },
    {
      id: "text.slam",
      category: "text",
      description: "Headline slams in from oversized with an impact blur \u2014 high energy.",
      tags: ["enter", "impact", "bold"],
      params: { from: { default: 1.8, min: 1, max: 4, desc: "start scale" } },
      defaultDuration: 0.5,
      apply: (p, prm) => {
        const e = ease("easeOutCubic", p);
        return { scale: prm.from - (prm.from - 1) * e, opacity: ease("easeOut", p), blur: (1 - e) * 12 };
      }
    },
    {
      id: "text.expand",
      category: "text",
      description: "Letters spread apart from tight tracking while fading in. NOTE: this preset drives the element's `letterSpacing` directly while animating, so it overrides any layer `style.letterSpacing` during the entrance; at rest it stops emitting letterSpacing so your own value applies.",
      tags: ["enter", "elegant", "tracking"],
      params: { spacing: { default: 24, min: 0, max: 80, unit: "px" } },
      defaultDuration: 0.7,
      apply: (p, prm) => {
        const e = ease("easeOutCubic", p);
        if (e >= 1) return { opacity: e };
        return { opacity: e, css: { letterSpacing: `${(1 - e) * -prm.spacing}px` } };
      }
    },
    {
      id: "text.glitch",
      category: "text",
      description: "Digital glitch with RGB split that snaps into clean text.",
      tags: ["enter", "glitch", "tech"],
      params: { amount: { default: 6, min: 0, max: 24, unit: "px" } },
      defaultDuration: 0.6,
      apply: (p, prm, ctx) => {
        const e = ease("easeOutCubic", p);
        const j = (1 - e) * prm.amount;
        return { x: Math.sin(ctx.time * 60) * j, opacity: ease("easeOut", p), css: { textShadow: `${j}px 0 #ff00d4, ${-j}px 0 #00e5ff` } };
      }
    },
    {
      id: "text.char-wave",
      category: "text",
      description: "Characters ripple up and down in a continuous wave.",
      split: "char",
      tags: ["ambient", "loop", "playful"],
      continuous: true,
      params: { amplitude: { default: 14, min: 0, max: 60, unit: "px" }, speed: { default: 3, min: 0.5, max: 10 } },
      defaultDuration: 5,
      apply: (_p, prm, ctx) => ({ y: Math.sin(ctx.time * prm.speed + ctx.index * 0.5) * prm.amplitude })
    },
    {
      id: "text.gradient-sweep",
      category: "text",
      description: "A color gradient sweeps continuously across the letters.",
      tags: ["ambient", "loop", "vibrant"],
      continuous: true,
      params: { speed: { default: 0.4, min: 0.1, max: 2 } },
      defaultDuration: 5,
      apply: (_p, prm, ctx) => ({
        css: {
          backgroundImage: "linear-gradient(90deg,#fff,#a78bfa,#6ea8fe,#34d399,#fff)",
          backgroundSize: "200% 100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: `${-(ctx.time * prm.speed) % 1 * 200}% 0`,
          webkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent"
        }
      })
    },
    {
      id: "text.neon-glow",
      category: "text",
      description: "Soft neon glow that pulses around the text.",
      tags: ["ambient", "loop", "neon"],
      continuous: true,
      params: { intensity: { default: 14, min: 0, max: 40, unit: "px" } },
      defaultDuration: 5,
      apply: (_p, prm, ctx) => ({ css: { textShadow: `0 0 ${prm.intensity * (0.6 + 0.4 * Math.sin(ctx.time * 3))}px currentColor` } })
    },
    {
      id: "text.highlight",
      category: "text",
      description: "A marker sweeps a highlight bar behind the text (best on a fitted box).",
      tags: ["emphasis", "marker"],
      params: { color: { default: 0, desc: "0=violet 1=lime 2=pink (visual)" } },
      defaultDuration: 0.8,
      apply: (p) => {
        const e = ease("easeInOutCubic", p);
        return { css: { backgroundImage: "linear-gradient(transparent 58%, rgba(167,139,250,.55) 58%)", backgroundRepeat: "no-repeat", backgroundSize: `${e * 100}% 100%` } };
      }
    }
  ];

  // packages/core/src/presets/image.ts
  var imagePresets = [
    {
      id: "image.ken-burns",
      category: "image",
      description: "Slow cinematic zoom and pan across the image (the classic documentary move).",
      tags: ["ambient", "cinematic", "crop"],
      continuous: true,
      params: {
        zoom: { default: 0.2, min: 0, max: 1, desc: "extra scale gained over the layer" },
        panX: { default: 0.06, min: -0.5, max: 0.5, desc: "horizontal drift (fraction)" },
        panY: { default: 0, min: -0.5, max: 0.5, desc: "vertical drift (fraction)" }
      },
      defaultDuration: 5,
      apply: (p, prm) => {
        const e = ease("easeInOut", p);
        return {
          scale: 1 + prm.zoom * e,
          x: prm.panX * 200 * e,
          y: prm.panY * 200 * e
        };
      }
    },
    {
      id: "image.float",
      category: "image",
      description: "Gentle continuous up-and-down bob, as if floating.",
      tags: ["ambient", "loop", "subtle"],
      continuous: true,
      params: {
        amplitude: { default: 12, min: 0, max: 80, unit: "px" },
        cycles: { default: 1.5, min: 0.25, max: 8, desc: "oscillations over the layer" }
      },
      defaultDuration: 5,
      apply: (p, prm) => ({ y: Math.sin(p * Math.PI * 2 * prm.cycles) * prm.amplitude })
    },
    {
      id: "image.reveal-wipe",
      category: "image",
      description: "Image is revealed by a wipe sliding in from a chosen edge. `from` picks the edge: 0=top, 1=right, 2=bottom, 3=left.",
      tags: ["enter", "reveal", "wipe"],
      params: {
        // Integer edge selector (rounded in apply). clipInset order is
        // [top, right, bottom, left], so the value maps 1:1 to that index.
        from: { default: 3, min: 0, max: 3, desc: "integer edge to wipe from: 0=top, 1=right, 2=bottom, 3=left" }
      },
      defaultDuration: 0.8,
      apply: (p, prm) => {
        const e = ease("easeInOutCubic", p);
        const hidden = (1 - e) * 100;
        const edge = Math.min(3, Math.max(0, Math.round(prm.from)));
        const inset = [0, 0, 0, 0];
        inset[edge] = hidden;
        return { clipInset: inset };
      }
    },
    {
      id: "image.zoom-in",
      category: "image",
      description: "Image scales up from slightly small while fading in \u2014 punchy entrance.",
      tags: ["enter", "punchy"],
      params: { from: { default: 0.8, min: 0, max: 1, desc: "starting scale" } },
      defaultDuration: 0.7,
      apply: (p, prm) => {
        const e = ease("easeOutCubic", p);
        return { scale: prm.from + (1 - prm.from) * e, opacity: e };
      }
    },
    {
      id: "image.sketch",
      category: "image",
      description: "Starts as a hand-drawn pencil sketch (edge-detected line art) and genuinely dissolves to the real photo: the sketch filter holds, then the line-art weight fades out as the photo's natural color/contrast blooms back in.",
      tags: ["stylize", "sketch", "line-art", "reveal"],
      continuous: true,
      params: { hold: { default: 0.6, min: 0, max: 1, desc: "fraction held as full sketch before dissolving (1 = stays a sketch forever)" } },
      defaultDuration: 4,
      apply: (p, prm) => {
        const fade = prm.hold >= 1 ? 0 : ease("easeInOutCubic", Math.max(0, (p - prm.hold) / (1 - prm.hold)));
        if (fade >= 1) return { css: { filter: "none" } };
        if (fade <= 0) return { css: { filter: "url(#vgp-sketch)" } };
        const sat = fade;
        const gray = 1 - fade;
        return {
          css: {
            filter: `url(#vgp-sketch) grayscale(${gray}) saturate(${0.2 + sat * 0.8}) contrast(${1 + gray * 0.25}) brightness(${1 - gray * 0.08})`
          }
        };
      }
    },
    {
      id: "image.tilt-3d",
      category: "image",
      description: "Gentle 3D perspective tilt that settles flat \u2014 gives a photo physical depth.",
      tags: ["3d", "depth", "cinematic"],
      params: { angle: { default: 12, min: 0, max: 40, unit: "deg" } },
      defaultDuration: 1.2,
      apply: (p, prm) => {
        const e = ease("easeOutCubic", p);
        return { css: { transform: `perspective(1200px) rotateY(${(1 - e) * prm.angle}deg)` }, opacity: ease("easeOut", p) };
      }
    },
    {
      id: "image.zoom-out",
      category: "image",
      description: "Slow continuous zoom OUT \u2014 starts close, pulls back.",
      tags: ["ambient", "cinematic"],
      continuous: true,
      params: { from: { default: 1.3, min: 1, max: 2, desc: "start scale" } },
      defaultDuration: 5,
      apply: (p, prm) => ({ scale: prm.from - (prm.from - 1) * ease("easeInOut", p) })
    },
    {
      id: "image.breathe",
      category: "image",
      description: "Gentle continuous scale pulse, like a slow breath.",
      tags: ["ambient", "loop", "subtle"],
      continuous: true,
      params: { amount: { default: 0.04, min: 0, max: 0.2 }, speed: { default: 1, min: 0.2, max: 4 } },
      defaultDuration: 5,
      apply: (_p, prm, ctx) => ({ scale: 1 + Math.sin(ctx.time * prm.speed) * prm.amount })
    },
    {
      id: "image.grayscale-reveal",
      category: "image",
      description: "Image starts grayscale and blooms into full color.",
      tags: ["stylize", "reveal", "color"],
      continuous: true,
      params: { hold: { default: 0.3, min: 0, max: 1, desc: "fraction held gray before color" } },
      defaultDuration: 4,
      apply: (p, prm) => {
        const e = ease("easeInOutCubic", prm.hold >= 1 ? 0 : Math.max(0, (p - prm.hold) / (1 - prm.hold)));
        return { css: { filter: `saturate(${e}) contrast(${1 + (1 - e) * 0.1})` } };
      }
    },
    {
      id: "image.blur-reveal",
      category: "image",
      description: "Image sharpens from a heavy blur while fading in.",
      tags: ["enter", "soft", "cinematic"],
      params: { blur: { default: 24, min: 0, max: 80, unit: "px" } },
      defaultDuration: 0.8,
      apply: (p, prm) => {
        const e = ease("easeOutCubic", p);
        return { blur: (1 - e) * prm.blur, opacity: e };
      }
    },
    {
      id: "image.swing",
      category: "image",
      description: "Image swings in on a slight tilt and settles upright.",
      tags: ["enter", "playful"],
      params: { angle: { default: 8, min: 0, max: 30, unit: "deg" } },
      defaultDuration: 0.7,
      apply: (p, prm) => {
        const e = ease("easeOutBack", p);
        return { rotate: -(1 - e) * prm.angle, scale: 0.85 + 0.15 * e, opacity: ease("easeOut", p) };
      }
    },
    {
      id: "image.duotone",
      category: "image",
      description: "Stylized duotone color grade applied to the image.",
      tags: ["stylize", "grade"],
      continuous: true,
      params: { hue: { default: 200, min: 0, max: 360, unit: "deg" } },
      defaultDuration: 4,
      apply: (_p, prm) => ({ css: { filter: `grayscale(1) contrast(1.1) sepia(.5) hue-rotate(${prm.hue}deg) saturate(2.2)` } })
    }
  ];

  // packages/core/src/presets/transition.ts
  var transitionPresets = [
    {
      id: "transition.crossfade",
      category: "transition",
      description: "Outgoing scene fades out as the incoming scene fades in.",
      tags: ["classic", "soft"],
      params: {},
      defaultDuration: 0.6,
      transition: (p) => {
        const e = ease("easeInOut", p);
        return { from: { opacity: 1 - e }, to: { opacity: e } };
      }
    },
    {
      id: "transition.slide",
      category: "transition",
      description: "Incoming scene pushes the old one off to the side.",
      tags: ["directional", "energetic"],
      params: { dir: { default: 0, min: 0, max: 1, desc: "0=left 1=right" } },
      defaultDuration: 0.7,
      transition: (p, prm) => {
        const e = ease("easeInOutCubic", p);
        const sign = prm.dir >= 0.5 ? 1 : -1;
        return {
          from: { css: { transform: `translateX(${-sign * e * 100}%)` }, opacity: 1 },
          to: { css: { transform: `translateX(${sign * (1 - e) * 100}%)` }, opacity: 1 }
        };
      }
    },
    {
      id: "transition.zoom",
      category: "transition",
      description: "Old scene zooms out while the new scene zooms in through it.",
      tags: ["punchy", "modern"],
      params: {},
      defaultDuration: 0.6,
      transition: (p) => {
        const e = ease("easeInOutCubic", p);
        return {
          from: { scale: 1 + 0.3 * e, opacity: 1 - e },
          to: { scale: 0.7 + 0.3 * e, opacity: e }
        };
      }
    },
    {
      id: "transition.wipe",
      category: "transition",
      description: "New scene is wiped in over the old one from the left edge.",
      tags: ["clean", "directional"],
      params: {},
      defaultDuration: 0.6,
      transition: (p) => {
        const e = ease("easeInOutCubic", p);
        return {
          from: { opacity: 1 },
          to: { clipInset: [0, (1 - e) * 100, 0, 0], opacity: 1 }
        };
      }
    },
    {
      id: "transition.dissolve",
      category: "transition",
      description: "Soft blurred crossfade \u2014 dreamy dissolve between scenes.",
      tags: ["soft", "blur"],
      params: { blur: { default: 12, min: 0, max: 40, unit: "px" } },
      defaultDuration: 0.7,
      transition: (p, prm) => {
        const e = ease("easeInOut", p);
        return { from: { opacity: 1 - e, blur: e * prm.blur }, to: { opacity: e, blur: (1 - e) * prm.blur } };
      }
    },
    {
      id: "transition.push-up",
      category: "transition",
      description: "Incoming scene pushes the old one upward off-screen.",
      tags: ["directional", "energetic"],
      params: {},
      defaultDuration: 0.6,
      transition: (p) => {
        const e = ease("easeInOutCubic", p);
        return { from: { css: { transform: `translateY(${-e * 100}%)` } }, to: { css: { transform: `translateY(${(1 - e) * 100}%)` } } };
      }
    },
    {
      id: "transition.circle-iris",
      category: "transition",
      description: "New scene irises open through an expanding circle.",
      tags: ["shape", "reveal"],
      params: {},
      defaultDuration: 0.7,
      transition: (p) => {
        const e = ease("easeInOutCubic", p);
        return { from: { opacity: 1 }, to: { opacity: 1, css: { clipPath: `circle(${e * 75}% at 50% 50%)` } } };
      }
    },
    {
      id: "transition.flip-3d",
      category: "transition",
      description: "Scenes flip like the two faces of a rotating card.",
      tags: ["3d", "modern"],
      params: {},
      defaultDuration: 0.7,
      transition: (p) => {
        const e = ease("easeInOutCubic", p);
        return {
          from: { opacity: e < 0.5 ? 1 : 0, css: { transform: `perspective(1400px) rotateY(${-e * 90}deg)` } },
          to: { opacity: e < 0.5 ? 0 : 1, css: { transform: `perspective(1400px) rotateY(${(1 - e) * 90}deg)` } }
        };
      }
    },
    {
      id: "transition.zoom-blur",
      category: "transition",
      description: "Old scene rushes forward with motion blur as the new one zooms in.",
      tags: ["punchy", "cinematic"],
      params: {},
      defaultDuration: 0.6,
      transition: (p) => {
        const e = ease("easeInOutCubic", p);
        return { from: { scale: 1 + 0.5 * e, opacity: 1 - e, blur: e * 14 }, to: { scale: 0.75 + 0.25 * e, opacity: e, blur: (1 - e) * 14 } };
      }
    },
    {
      id: "transition.dip-black",
      category: "transition",
      description: "Dips through black between scenes (classic film cut).",
      tags: ["classic", "dramatic"],
      params: {},
      defaultDuration: 0.7,
      transition: (p) => {
        const e = ease("easeInOut", p);
        return { from: { opacity: e < 0.5 ? 1 : 0, brightness: Math.max(0, 1 - 2 * e) }, to: { opacity: e < 0.5 ? 0 : 1, brightness: Math.max(0, 2 * e - 1) } };
      }
    },
    {
      id: "transition.glitch",
      category: "transition",
      description: "Glitchy digital tear between scenes.",
      tags: ["glitch", "tech"],
      params: { amount: { default: 16, min: 0, max: 60, unit: "px" } },
      defaultDuration: 0.5,
      transition: (p, prm) => {
        const e = ease("easeInOut", p);
        const j = Math.sin(p * 90) * prm.amount;
        return { from: { opacity: 1 - e, x: j * (1 - e), css: { filter: `hue-rotate(${(1 - e) * 60}deg)` } }, to: { opacity: e, x: j * e } };
      }
    },
    {
      id: "transition.spin",
      category: "transition",
      description: "Scenes whirl out and in with a rotating zoom.",
      tags: ["playful", "dynamic"],
      params: {},
      defaultDuration: 0.7,
      transition: (p) => {
        const e = ease("easeInOutCubic", p);
        return { from: { rotate: e * 35, scale: 1 - 0.5 * e, opacity: 1 - e }, to: { rotate: -(1 - e) * 35, scale: 0.5 + 0.5 * e, opacity: e } };
      }
    }
  ];

  // packages/core/src/presets/enter.ts
  var enterPresets = [
    {
      id: "in.fade",
      category: "in",
      description: "Simple fade in from transparent.",
      tags: ["enter", "subtle"],
      params: {},
      defaultDuration: 0.6,
      apply: (p) => ({ opacity: ease("easeOutCubic", p) })
    },
    {
      id: "in.slide-left",
      category: "in",
      description: "Slides in from the left while fading in.",
      tags: ["enter", "directional"],
      params: { distance: { default: 120, min: 0, max: 800, unit: "px" } },
      defaultDuration: 0.6,
      apply: (p, prm) => {
        const e = ease("easeOutCubic", p);
        return { x: -(1 - e) * prm.distance, opacity: e };
      }
    },
    {
      id: "in.slide-right",
      category: "in",
      description: "Slides in from the right while fading in.",
      tags: ["enter", "directional"],
      params: { distance: { default: 120, min: 0, max: 800, unit: "px" } },
      defaultDuration: 0.6,
      apply: (p, prm) => {
        const e = ease("easeOutCubic", p);
        return { x: (1 - e) * prm.distance, opacity: e };
      }
    },
    {
      id: "in.slide-up",
      category: "in",
      description: "Rises up into place while fading in.",
      tags: ["enter", "vertical"],
      params: { distance: { default: 80, min: 0, max: 600, unit: "px" } },
      defaultDuration: 0.6,
      apply: (p, prm) => {
        const e = ease("easeOutCubic", p);
        return { y: (1 - e) * prm.distance, opacity: e };
      }
    },
    {
      id: "in.scale",
      category: "in",
      description: "Grows in from small while fading in.",
      tags: ["enter", "punchy"],
      params: { from: { default: 0.7, min: 0, max: 1, desc: "start scale" } },
      defaultDuration: 0.6,
      apply: (p, prm) => {
        const e = ease("easeOutCubic", p);
        return { scale: prm.from + (1 - prm.from) * e, opacity: e };
      }
    },
    {
      id: "in.spin",
      category: "in",
      description: "Spins and scales into place.",
      tags: ["enter", "playful"],
      params: { turns: { default: 0.5, min: 0, max: 3, desc: "rotations" } },
      defaultDuration: 0.7,
      apply: (p, prm) => {
        const e = ease("easeOutBack", p);
        return { rotate: (1 - e) * prm.turns * 360, scale: 0.4 + 0.6 * e, opacity: ease("easeOut", p) };
      }
    },
    {
      id: "in.blur",
      category: "in",
      description: "Sharpens into focus from a soft blur while fading in.",
      tags: ["enter", "soft", "cinematic"],
      params: { blur: { default: 18, min: 0, max: 60, unit: "px" } },
      defaultDuration: 0.6,
      apply: (p, prm) => {
        const e = ease("easeOutCubic", p);
        return { blur: (1 - e) * prm.blur, opacity: e };
      }
    },
    {
      id: "in.zoom",
      category: "in",
      description: "Zooms in from larger than life and settles to size.",
      tags: ["enter", "punchy"],
      params: { from: { default: 1.4, min: 1, max: 3, desc: "start scale" } },
      defaultDuration: 0.6,
      apply: (p, prm) => {
        const e = ease("easeOutCubic", p);
        return { scale: prm.from - (prm.from - 1) * e, opacity: ease("easeOut", p) };
      }
    },
    {
      id: "in.drop",
      category: "in",
      description: "Drops in from above with a soft bounce.",
      tags: ["enter", "vertical", "bouncy"],
      params: { distance: { default: 120, min: 0, max: 600, unit: "px" } },
      defaultDuration: 0.6,
      apply: (p, prm) => {
        const e = ease("easeOutBack", p);
        return { y: -(1 - e) * prm.distance, opacity: ease("easeOut", p) };
      }
    },
    {
      id: "in.flip-x",
      category: "in",
      description: "Flips in around the horizontal axis (3D card flip).",
      tags: ["enter", "3d"],
      params: {},
      defaultDuration: 0.6,
      apply: (p) => {
        const e = ease("easeOutCubic", p);
        return { opacity: ease("easeOut", p), css: { transform: `perspective(1000px) rotateX(${(1 - e) * 90}deg)` } };
      }
    },
    {
      id: "in.flip-y",
      category: "in",
      description: "Flips in around the vertical axis (3D card flip).",
      tags: ["enter", "3d"],
      params: {},
      defaultDuration: 0.6,
      apply: (p) => {
        const e = ease("easeOutCubic", p);
        return { opacity: ease("easeOut", p), css: { transform: `perspective(1000px) rotateY(${(1 - e) * 90}deg)` } };
      }
    },
    {
      id: "in.skew",
      category: "in",
      description: "Slides in with a dynamic skew that straightens out.",
      tags: ["enter", "energetic"],
      params: { skew: { default: 20, min: 0, max: 60, unit: "deg" }, distance: { default: 80, min: 0, max: 400, unit: "px" } },
      defaultDuration: 0.55,
      apply: (p, prm) => {
        const e = ease("easeOutCubic", p);
        return { x: (1 - e) * prm.distance, opacity: ease("easeOut", p), css: { transform: `skewX(${(1 - e) * -prm.skew}deg)` } };
      }
    }
  ];

  // packages/core/src/presets/exit.ts
  var exitPresets = [
    {
      id: "out.fade",
      category: "out",
      description: "Simple fade out to transparent.",
      tags: ["exit", "subtle"],
      params: {},
      defaultDuration: 0.6,
      fromEnd: true,
      apply: (p) => ({ opacity: 1 - ease("easeIn", p) })
    },
    {
      id: "out.slide-right",
      category: "out",
      description: "Slides off to the right while fading out.",
      tags: ["exit", "directional"],
      params: { distance: { default: 120, min: 0, max: 800, unit: "px" } },
      defaultDuration: 0.6,
      fromEnd: true,
      apply: (p, prm) => {
        const e = ease("easeIn", p);
        return { x: e * prm.distance, opacity: 1 - e };
      }
    },
    {
      id: "out.slide-down",
      category: "out",
      description: "Drops down and out while fading.",
      tags: ["exit", "vertical"],
      params: { distance: { default: 80, min: 0, max: 600, unit: "px" } },
      defaultDuration: 0.6,
      fromEnd: true,
      apply: (p, prm) => {
        const e = ease("easeIn", p);
        return { y: e * prm.distance, opacity: 1 - e };
      }
    },
    {
      id: "out.scale-down",
      category: "out",
      description: "Shrinks away while fading out.",
      tags: ["exit", "punchy"],
      params: { to: { default: 0.7, min: 0, max: 1, desc: "end scale" } },
      defaultDuration: 0.6,
      fromEnd: true,
      apply: (p, prm) => {
        const e = ease("easeIn", p);
        return { scale: 1 - (1 - prm.to) * e, opacity: 1 - e };
      }
    },
    {
      id: "out.blur",
      category: "out",
      description: "Blurs out of focus while fading.",
      tags: ["exit", "soft"],
      params: { blur: { default: 16, min: 0, max: 60, unit: "px" } },
      defaultDuration: 0.6,
      fromEnd: true,
      apply: (p, prm) => {
        const e = ease("easeIn", p);
        return { blur: e * prm.blur, opacity: 1 - e };
      }
    },
    {
      id: "out.zoom-out",
      category: "out",
      description: "Pushes toward the viewer and fades away.",
      tags: ["exit", "punchy"],
      params: { to: { default: 1.4, min: 1, max: 3, desc: "end scale" } },
      defaultDuration: 0.5,
      fromEnd: true,
      apply: (p, prm) => {
        const e = ease("easeIn", p);
        return { scale: 1 + (prm.to - 1) * e, opacity: 1 - e };
      }
    },
    {
      id: "out.slide-left",
      category: "out",
      description: "Slides off to the left while fading out.",
      tags: ["exit", "directional"],
      params: { distance: { default: 120, min: 0, max: 800, unit: "px" } },
      defaultDuration: 0.6,
      fromEnd: true,
      apply: (p, prm) => {
        const e = ease("easeIn", p);
        return { x: -e * prm.distance, opacity: 1 - e };
      }
    },
    {
      id: "out.slide-up",
      category: "out",
      description: "Lifts up and out while fading.",
      tags: ["exit", "vertical"],
      params: { distance: { default: 90, min: 0, max: 600, unit: "px" } },
      defaultDuration: 0.6,
      fromEnd: true,
      apply: (p, prm) => {
        const e = ease("easeIn", p);
        return { y: -e * prm.distance, opacity: 1 - e };
      }
    },
    {
      id: "out.spin",
      category: "out",
      description: "Spins and shrinks away.",
      tags: ["exit", "playful"],
      params: { turns: { default: 0.6, min: 0, max: 3 } },
      defaultDuration: 0.6,
      fromEnd: true,
      apply: (p, prm) => {
        const e = ease("easeIn", p);
        return { rotate: e * prm.turns * 360, scale: 1 - 0.6 * e, opacity: 1 - e };
      }
    },
    {
      id: "out.pop",
      category: "out",
      description: "Quick scale-up flicker then vanishes.",
      tags: ["exit", "snappy"],
      params: {},
      defaultDuration: 0.4,
      fromEnd: true,
      apply: (p) => {
        const e = ease("easeIn", p);
        return { scale: 1 + 0.25 * Math.sin(e * Math.PI), opacity: 1 - e };
      }
    }
  ];

  // packages/core/src/presets/audio.ts
  var beat = (time, bpm) => {
    const phase = time * bpm / 60;
    const x = phase - Math.floor(phase);
    return Math.pow(1 - x, 2);
  };
  var audioPresets = [
    {
      id: "audio.beat-pulse",
      category: "audio",
      description: "Scales up on every beat \u2014 punches to the rhythm.",
      tags: ["reactive", "beat"],
      continuous: true,
      params: { bpm: { default: 120, min: 40, max: 220, desc: "beats per minute" }, amount: { default: 0.12, min: 0, max: 0.6, desc: "scale punch" } },
      defaultDuration: 5,
      apply: (_p, prm, ctx) => ({ scale: 1 + beat(ctx.time, prm.bpm) * prm.amount })
    },
    {
      id: "audio.bass-glow",
      category: "audio",
      description: "Brightness flashes on the beat \u2014 a bass-driven glow.",
      tags: ["reactive", "glow"],
      continuous: true,
      params: { bpm: { default: 120, min: 40, max: 220 }, amount: { default: 0.5, min: 0, max: 1.5 } },
      defaultDuration: 5,
      apply: (_p, prm, ctx) => ({ brightness: 1 + beat(ctx.time, prm.bpm) * prm.amount })
    },
    {
      id: "audio.bounce",
      category: "audio",
      description: "Bounces vertically in time with the beat.",
      tags: ["reactive", "bounce"],
      continuous: true,
      params: { bpm: { default: 120, min: 40, max: 220 }, height: { default: 24, min: 0, max: 200, unit: "px" } },
      defaultDuration: 5,
      apply: (_p, prm, ctx) => ({ y: -beat(ctx.time, prm.bpm) * prm.height })
    },
    {
      id: "audio.shake",
      category: "audio",
      description: "Jitters/shakes energetically on each beat.",
      tags: ["reactive", "energetic"],
      continuous: true,
      params: { bpm: { default: 120, min: 40, max: 220 }, amount: { default: 8, min: 0, max: 40, unit: "px" } },
      defaultDuration: 5,
      apply: (_p, prm, ctx) => {
        const b = beat(ctx.time, prm.bpm);
        return { x: Math.sin(ctx.time * 80) * b * prm.amount, rotate: Math.sin(ctx.time * 60) * b * 2 };
      }
    }
  ];

  // packages/core/src/presets/index.ts
  var ALL = [
    ...textPresets,
    ...imagePresets,
    ...enterPresets,
    ...exitPresets,
    ...audioPresets,
    ...overlayPresets,
    ...transitionPresets
  ];
  var REGISTRY = new Map(ALL.map((p) => [p.id, p]));
  var getPreset = (id) => REGISTRY.get(id);
  var allPresets = () => [...REGISTRY.values()];
  var buildManifest = () => allPresets().map((p) => ({
    id: p.id,
    category: p.category,
    description: p.description,
    tags: p.tags,
    params: p.params,
    defaultDuration: p.defaultDuration,
    ...p.continuous ? { continuous: true } : {},
    ...p.split ? { split: p.split } : {}
  }));

  // packages/editor/src/editor.ts
  var MANIFEST = buildManifest();
  var MAN = new Map(MANIFEST.map((e) => [e.id, e]));
  var LABELW = 104;
  var PX_MIN = 6;
  var PX_MAX = 800;
  var KF_EASINGS = ["linear", "easeIn", "easeOut", "easeInOut", "easeOutBack", "easeOutExpo", "easeOutCubic", "easeInOutCubic"];
  var I = {
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
    start: '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>',
    back: '<polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/>',
    fwd: '<polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/>',
    loop: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    text: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    video: '<rect x="2" y="2" width="20" height="20" rx="2"/><path d="M10 8l6 4-6 4V8z"/>',
    shape: '<rect x="4" y="4" width="16" height="16" rx="2"/>',
    line: '<line x1="4" y1="12" x2="20" y2="12"/>',
    undo: '<path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7L3 9"/>',
    redo: '<path d="M21 7v6h-6"/><path d="M21 13a9 9 0 1 1-3-7l3 3"/>',
    split: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    audio: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    fit: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    arrTop: '<polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/>',
    arrUp: '<polyline points="18 15 12 9 6 15"/>',
    arrDown: '<polyline points="6 9 12 15 18 9"/>',
    arrBot: '<polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/>',
    full: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
    cube: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><line x1="12" y1="13" x2="12" y2="21"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    spark: '<path d="M12 3l1.9 5.8L20 10.7l-5.1 1.9L12 18l-1.9-5.4L5 10.7l6.1-1.9z"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>'
  };
  var icon = (n) => `<svg viewBox="0 0 24 24">${I[n] ?? ""}</svg>`;
  var typeIco = { text: "text", image: "image", video: "video", shape: "shape", three: "cube", html: "text", overlay: "sliders", fx: "spark" };
  var clipColor = { text: "var(--clip-text)", image: "var(--clip-image)", three: "var(--clip-three)", shape: "var(--clip-shape)", html: "var(--clip-html)", video: "var(--clip-video)", overlay: "var(--clip-overlay)", fx: "var(--clip-fx)" };
  var typeTint = { text: "var(--t-text)", image: "var(--t-image)", video: "var(--t-video)", three: "var(--t-three)", shape: "var(--t-shape)", html: "var(--t-html)", audio: "var(--t-audio)", overlay: "var(--t-overlay)", fx: "var(--t-fx)" };
  var layerLabel = (l) => l.type === "text" ? String(l.text) : l.type === "fx" ? String(l.effect).split(".")[1].replace(/-/g, " ") : l.type === "overlay" ? "overlay " + String(l.effect).replace(/-/g, " ") : l.type;
  var tintIcon = (n, type) => `<span style="color:${typeTint[type] || "#fff"}">${icon(n)}</span>`;
  var CATS = [
    { key: "text", label: "Text", icon: "text" },
    { key: "image", label: "Video / Image", icon: "video" },
    { key: "audio", label: "Audio", icon: "spark" },
    { key: "in", label: "Fade In", icon: "plus" },
    { key: "out", label: "Fade Out", icon: "plus" },
    { key: "overlay", label: "Overlays", icon: "sliders" },
    { key: "transition", label: "Transitions", icon: "loop" }
  ];
  var S = {
    ir: null,
    assetBase: "/",
    assets: [],
    selected: null,
    selAudio: null,
    playhead: 0,
    playing: false,
    loop: true,
    pxPerSec: 120,
    scale: 1,
    offsets: [],
    total: 0,
    lastSyncJson: "",
    panel: "props",
    cat: "text",
    history: [],
    histIndex: -1,
    sceneBase: []
  };
  function captureSceneBase() {
    S.sceneBase = S.ir.scenes.map((sc) => sc.duration ?? 0.5);
  }
  var $ = (id) => document.getElementById(id);
  var el = (tag, cls) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  };
  var baseUrl = () => new URL(S.assetBase, location.origin).href;
  var assetUrl = (src) => new URL(src, baseUrl()).href;
  var fmtClock = (s) => {
    s = Math.max(0, s);
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };
  var fmtClockMs = (s) => {
    s = Math.max(0, s);
    return `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, "0")}`;
  };
  function derive() {
    if (S.sceneBase.length !== S.ir.scenes.length) captureSceneBase();
    S.ir.scenes.forEach((sc, i) => {
      let maxEnd = 0;
      for (const l of sc.layers) if (l.duration != null && l.type !== "fx") maxEnd = Math.max(maxEnd, (l.start ?? 0) + l.duration);
      const base = S.sceneBase[i] ?? 0.5;
      sc.duration = +Math.max(0.5, base, maxEnd).toFixed(2);
    });
    S.offsets = [];
    let a = 0;
    for (const sc of S.ir.scenes) {
      S.offsets.push(a);
      a += sc.duration;
    }
    S.total = a;
    if (S.playhead > S.total) S.playhead = 0;
  }
  function sceneAt(t) {
    let si = 0;
    for (let i = S.offsets.length - 1; i >= 0; i--) if (t >= S.offsets[i]) {
      si = i;
      break;
    }
    return si;
  }
  function effectiveTotal() {
    let t = S.total;
    const info = typeof VGP?.audioInfo === "function" ? VGP.audioInfo() : [];
    (S.ir?.audio ?? []).forEach((a, i) => {
      let dur = a.duration;
      if (dur == null) {
        const fileDur = info?.[i]?.duration ?? null;
        if (fileDur != null) dur = Math.max(0, fileDur - (a.trimStart ?? 0));
      }
      const end = (a.start ?? 0) + (dur ?? 0);
      if (end > t) t = end;
    });
    return t;
  }
  var EASE_FNS = {
    linear: (p) => p,
    easeIn: (p) => p * p,
    easeOut: (p) => 1 - (1 - p) * (1 - p),
    easeInOut: (p) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2,
    easeOutCubic: (p) => 1 - Math.pow(1 - p, 3),
    easeInOutCubic: (p) => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
    easeOutExpo: (p) => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p),
    easeOutBack: (p) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
    }
  };
  function keyframeValueAt(kfs, t, fallback) {
    if (!kfs || kfs.length === 0) return fallback;
    if (t <= kfs[0].t) return kfs[0].value;
    if (t >= kfs[kfs.length - 1].t) return kfs[kfs.length - 1].value;
    for (let i = 0; i < kfs.length - 1; i++) {
      const a = kfs[i], b = kfs[i + 1];
      if (t >= a.t && t <= b.t) {
        const local = (t - a.t) / (b.t - a.t);
        const e = (EASE_FNS[b.easing] ?? EASE_FNS.linear)(local);
        return a.value + (b.value - a.value) * e;
      }
    }
    return fallback;
  }
  function tfAt(layer2, sceneIdx, prop, fallback) {
    const off = S.offsets[sceneIdx] ?? 0;
    const localT = S.playhead - (off + (layer2.start ?? 0));
    return keyframeValueAt(layer2.keyframes?.[prop], localT, fallback);
  }
  var isKeyframed = (layer2, prop) => (layer2?.keyframes?.[prop]?.length ?? 0) > 0;
  var clamp012 = (v) => Math.max(0, Math.min(1, v));
  function presetProgressE(inst, layerLocalT, layerDur, continuous) {
    if (continuous) return clamp012(layerLocalT / Math.max(1e-4, layerDur));
    const preset = getPreset(inst.id);
    const dur = inst.duration ?? preset?.defaultDuration ?? 0.6;
    if (preset?.fromEnd) {
      const effDur = Math.min(dur, layerDur);
      return clamp012((layerLocalT - (layerDur - effDur)) / Math.max(1e-4, effDur));
    }
    const start = inst.start ?? 0;
    return clamp012((layerLocalT - start) / Math.max(1e-4, dur));
  }
  function renderedDelta(layer2, sceneIdx) {
    const scene2 = S.ir.scenes[sceneIdx];
    const off = S.offsets[sceneIdx] ?? 0;
    const sceneLocalT = S.playhead - off;
    const start = layer2.start ?? 0;
    const dur = layer2.duration ?? scene2.duration;
    const layerLocalT = sceneLocalT - start;
    const out = {
      x: tfAt(layer2, sceneIdx, "x", layer2.transform?.x ?? 0),
      y: tfAt(layer2, sceneIdx, "y", layer2.transform?.y ?? 0),
      scale: tfAt(layer2, sceneIdx, "scale", layer2.transform?.scale ?? 1),
      rotate: tfAt(layer2, sceneIdx, "rotate", layer2.transform?.rotate ?? 0),
      opacity: tfAt(layer2, sceneIdx, "opacity", layer2.transform?.opacity ?? 1)
    };
    const entries = (layer2.presets ?? []).map((inst) => ({ inst, localT: layerLocalT, dur }));
    const myIdx = scene2.layers.indexOf(layer2);
    scene2.layers.forEach((fx, j) => {
      if (fx.type !== "fx") return;
      const tgt = resolveFxTarget(scene2, j);
      if (!tgt || tgt.index !== myIdx) return;
      const fs = fx.start ?? 0, fd = fx.duration ?? scene2.duration;
      if (sceneLocalT >= fs - 1e-4 && sceneLocalT < fs + fd + 1e-4) entries.push({ inst: { id: fx.effect, params: fx.params }, localT: sceneLocalT - fs, dur: fd });
    });
    for (const e of entries) {
      const preset = getPreset(e.inst.id);
      if (!preset || !preset.apply || preset.split) continue;
      if (preset.category === "text" && layer2.type !== "text") continue;
      const p = presetProgressE(e.inst, e.localT, e.dur, !!preset.continuous);
      const d = preset.apply(p, resolveParams(preset, e.inst.params), { index: 0, count: 1, time: e.localT, dur: e.dur });
      if (d.x) out.x += d.x;
      if (d.y) out.y += d.y;
      if (d.scale !== void 0) out.scale *= d.scale;
      if (d.scaleX !== void 0) out.scale *= d.scaleX;
      if (d.scaleY !== void 0) out.scale *= d.scaleY;
      if (d.rotate) out.rotate += d.rotate;
      if (d.opacity !== void 0) out.opacity *= d.opacity;
    }
    return out;
  }
  function activeTransformPreset(layer2, sceneIdx) {
    const scene2 = S.ir.scenes[sceneIdx];
    const off = S.offsets[sceneIdx] ?? 0;
    const sceneLocalT = S.playhead - off;
    const start = layer2.start ?? 0;
    const dur = layer2.duration ?? scene2.duration;
    const layerLocalT = sceneLocalT - start;
    const entries = (layer2.presets ?? []).map((inst) => ({ inst, localT: layerLocalT, dur }));
    const myIdx = scene2.layers.indexOf(layer2);
    scene2.layers.forEach((fx, j) => {
      if (fx.type !== "fx") return;
      const tgt = resolveFxTarget(scene2, j);
      if (!tgt || tgt.index !== myIdx) return;
      const fs = fx.start ?? 0, fd = fx.duration ?? scene2.duration;
      if (sceneLocalT >= fs - 1e-4 && sceneLocalT < fs + fd + 1e-4) entries.push({ inst: { id: fx.effect, params: fx.params }, localT: sceneLocalT - fs, dur: fd });
    });
    for (const e of entries) {
      const preset = getPreset(e.inst.id);
      if (!preset || !preset.apply || preset.split || preset.continuous) continue;
      if (preset.category === "text" && layer2.type !== "text") continue;
      const p = presetProgressE(e.inst, e.localT, e.dur, false);
      if (p <= 1e-4 || p >= 0.9999) continue;
      const d = preset.apply(p, resolveParams(preset, e.inst.params), { index: 0, count: 1, time: e.localT, dur: e.dur });
      if (d.x || d.y || d.rotate || d.scale !== void 0 && d.scale !== 1 || d.scaleX !== void 0 && d.scaleX !== 1 || d.scaleY !== void 0 && d.scaleY !== 1) return true;
    }
    return false;
  }
  function videoSrcDuration(layer2) {
    if (layer2?.type !== "video" || !layer2.src) return null;
    const want = assetUrl(layer2.src);
    const vids = Array.from(document.querySelectorAll("#stage video"));
    for (const v of vids) {
      if ((v.currentSrc || v.src) === want && isFinite(v.duration) && v.duration > 0) return v.duration;
    }
    return null;
  }
  function resolveFxTarget(scene2, idx) {
    for (let j = idx - 1; j >= 0; j--) {
      const ty = scene2.layers[j]?.type;
      if (ty !== "fx" && ty !== "overlay") return { layer: scene2.layers[j], index: j };
    }
    return null;
  }
  function normalizeZ(sceneIdx) {
    const arr = S.ir.scenes[sceneIdx]?.layers;
    if (!arr) return;
    arr.forEach((L, i) => {
      L.zIndex = i;
    });
  }
  function timeAtClientX(clientX, rectLeft) {
    const left = rectLeft ?? $("tlInner").getBoundingClientRect().left;
    return (clientX - left - LABELW) / S.pxPerSec;
  }
  var clampStart = (s, max) => +Math.max(0, Math.min(max, s)).toFixed(3);
  var clampDuration = (d, min, max) => +Math.max(min, Math.min(max, d)).toFixed(3);
  var SNAP_PX = 8;
  function snapTime(absT, targets, bypass) {
    if (bypass) return absT;
    const tol = SNAP_PX / S.pxPerSec;
    let best = absT, bestD = tol;
    for (const t of targets) {
      const d = Math.abs(t - absT);
      if (d <= bestD) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }
  function sceneSnapTargets(si, scene2, exceptLi) {
    const out = [0, S.playhead, ...S.offsets];
    const sceneOff = S.offsets[si] ?? 0;
    scene2.layers.forEach((L, j) => {
      if (j === exceptLi) return;
      const st = sceneOff + (L.start ?? 0);
      const du = L.duration ?? scene2.duration;
      out.push(st, st + du);
    });
    return out;
  }
  function presetAppliesTo(presetId, layerType) {
    if (layerType === "overlay") return false;
    const e = MAN.get(presetId);
    if (e && (e.category === "text" || e.split) && layerType !== "text") return false;
    return true;
  }
  function fit() {
    const wrap = document.querySelector(".stagewrap") ?? $("scaler").parentElement;
    const cap = document.fullscreenElement ? 8 : 1;
    const pad = document.fullscreenElement ? 0 : 40;
    const s = Math.min((wrap.clientWidth - pad) / S.ir.width, (wrap.clientHeight - pad) / S.ir.height, cap);
    S.scale = s;
    const sc = $("scaler");
    sc.style.width = S.ir.width + "px";
    sc.style.height = S.ir.height + "px";
    sc.style.transform = `scale(${s})`;
  }
  function mountPreview() {
    VGP.mount(S.ir, { assetBase: baseUrl() });
    fit();
    VGP.seek(S.playhead, { playing: S.playing });
  }
  var liveSeek = () => VGP.seek(S.playhead, { playing: S.playing });
  var saveTimer;
  function setDot(state, text) {
    $("syncDot").className = "dot " + state;
    $("syncText").textContent = text ?? state;
  }
  var toastTimer;
  function showToast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2e3);
  }
  function scheduleSave() {
    setDot("edited", "editing");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const body = JSON.stringify(S.ir);
      S.lastSyncJson = body;
      pushHistory(body);
      setDot("saving", "saving");
      try {
        const r = await fetch("/api/composition", { method: "POST", headers: { "content-type": "application/json" }, body });
        setDot(r.ok ? "saved" : "edited", r.ok ? "synced" : "invalid");
      } catch {
        setDot("edited", "offline");
      }
    }, 250);
  }
  function pushHistory(json) {
    if (json === S.history[S.histIndex]) return;
    S.history = S.history.slice(0, S.histIndex + 1);
    S.history.push(json);
    if (S.history.length > 120) S.history.shift();
    S.histIndex = S.history.length - 1;
  }
  function applyHistory() {
    const json = S.history[S.histIndex];
    if (!json) return;
    const prevSel = S.selected;
    const prevAudio = S.selAudio;
    S.ir = JSON.parse(json);
    S.lastSyncJson = json;
    S.selected = prevSel && S.ir.scenes[prevSel.s]?.layers?.[prevSel.l] ? prevSel : null;
    S.selAudio = prevAudio != null && S.ir.audio?.[prevAudio] ? prevAudio : null;
    derive();
    mountPreview();
    buildTimeline();
    renderRight();
    updateTime();
    fetch("/api/composition", { method: "POST", headers: { "content-type": "application/json" }, body: json }).catch(() => {
    });
  }
  function undo() {
    if (S.histIndex > 0) {
      S.histIndex--;
      applyHistory();
      setDot("saved", "undo \u21B6");
    } else setDot("saved", "nothing to undo");
  }
  function redo() {
    if (S.histIndex < S.history.length - 1) {
      S.histIndex++;
      applyHistory();
      setDot("saved", "redo \u21B7");
    }
  }
  var liveEdit = () => {
    liveSeek();
    scheduleSave();
  };
  var timingEdit = () => {
    liveSeek();
    buildTimeline();
    scheduleSave();
  };
  var structuralEdit = () => {
    mountPreview();
    buildTimeline();
    renderRight();
    scheduleSave();
  };
  function setDoc(ir) {
    S.ir = ir;
    S.lastSyncJson = JSON.stringify(ir);
    S.selected = null;
    S.history = [S.lastSyncJson];
    S.histIndex = 0;
    captureSceneBase();
    ir.scenes.forEach((_, i) => normalizeZ(i));
    derive();
    autoFit();
    mountPreview();
    buildTimeline();
    renderRight();
    updateTime();
  }
  var newText = () => ({ type: "text", text: "New Text", style: { fontSize: "72px", color: "#ffffff" }, duration: 2, presets: [{ id: "in.fade" }], transform: {} });
  var newShape = () => ({ type: "shape", shape: "rect", fill: "#ffffff", rect: { x: 440, y: 290, w: 400, h: 140 }, duration: 2, presets: [{ id: "in.scale" }], transform: {} });
  var newLine = () => ({ type: "shape", shape: "line", fill: "#ffffff", rect: { x: 340, y: 360, w: 600, h: 6 }, duration: 2, presets: [{ id: "in.slide-left", params: { distance: 120 } }], transform: {} });
  var new3D = () => ({ type: "three", scene: "particles", props: { speed: 0.3 }, duration: 3, presets: [], transform: {} });
  var overlayLayerFromId = (id) => {
    const entry = MAN.get(id);
    const effect = id.split(".")[1];
    return { type: "overlay", effect, params: { amount: entry?.params?.amount?.default ?? 1 }, duration: entry?.defaultDuration ?? 5, presets: [{ id: "in.fade" }], transform: {} };
  };
  var newFxLayer = (target, sceneDur, presetId) => {
    const entry = MAN.get(presetId);
    const full = target.duration ?? sceneDur;
    const dur = entry?.split && !entry?.continuous && entry?.defaultDuration ? Math.min(full, entry.defaultDuration) : full;
    return { type: "fx", effect: presetId, params: {}, start: target.start ?? 0, duration: dur };
  };
  var newAssetLayer = (a) => ({ type: a.type, src: a.src, fit: "cover", duration: 2.5, presets: a.type === "image" ? [{ id: "image.ken-burns" }] : [], transform: {} });
  function addLayerAtPlayhead(layer2) {
    const si = sceneAt(S.playhead);
    const maxStart = Math.max(0, S.ir.scenes[si].duration - 0.2);
    layer2.start = Math.max(0, Math.min(maxStart, +(S.playhead - S.offsets[si]).toFixed(2)));
    S.ir.scenes[si].layers.push(layer2);
    normalizeZ(si);
    S.selected = { s: si, l: S.ir.scenes[si].layers.length - 1 };
    setTab("props");
    structuralEdit();
  }
  function dropLayerAt(clientX, layer2) {
    const t = Math.max(0, Math.min(S.total, timeAtClientX(clientX)));
    const si = sceneAt(t);
    const maxStart = Math.max(0, S.ir.scenes[si].duration - 0.2);
    layer2.start = Math.max(0, Math.min(maxStart, +(t - S.offsets[si]).toFixed(2)));
    S.ir.scenes[si].layers.push(layer2);
    normalizeZ(si);
    S.selected = { s: si, l: S.ir.scenes[si].layers.length - 1 };
    setTab("props");
    structuralEdit();
  }
  async function loadAssets() {
    try {
      S.assets = await (await fetch("/api/assets")).json();
    } catch {
      S.assets = [];
    }
    renderAssets();
  }
  var fileType = (f) => f.type.startsWith("video") ? "video" : f.type.startsWith("audio") ? "audio" : "image";
  async function uploadOne(f, type) {
    const ty = type ?? fileType(f);
    try {
      const a = await (await fetch("/api/upload?name=" + encodeURIComponent(f.name) + "&type=" + ty, { method: "POST", body: f })).json();
      if (a?.src) S.assets.unshift(a);
      return a;
    } catch {
      return null;
    }
  }
  async function uploadFiles(files) {
    for (const f of Array.from(files)) await uploadOne(f);
    renderAssets();
  }
  function addAudioTrack(src, clientX) {
    S.ir.audio = S.ir.audio || [];
    const maxStart = Math.max(0, S.total - 0.1);
    const start = clientX != null ? Math.min(maxStart, Math.max(0, +timeAtClientX(clientX).toFixed(2))) : 0;
    S.ir.audio.push({ src, start, volume: 1 });
    S.selAudio = S.ir.audio.length - 1;
    S.selected = null;
    setTab("props");
    structuralEdit();
    showToast("Audio track added: " + src.split("/").pop());
  }
  function renderAssets() {
    const g = $("assetGrid");
    g.innerHTML = "";
    if (!S.assets.length) {
      const e = el("div", "empty");
      e.style.cssText = "font-size:11px;padding:14px";
      e.textContent = "No assets yet";
      g.appendChild(e);
      return;
    }
    S.assets.forEach((a) => {
      const d = el("div", "asset");
      d.draggable = true;
      const u = assetUrl(a.src);
      if (a.type === "video") {
        const v = el("video");
        v.src = u;
        v.muted = true;
        d.appendChild(v);
      } else if (a.type === "audio") {
        const ph = el("div");
        ph.style.cssText = "display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--t-audio)";
        ph.innerHTML = icon("audio");
        d.appendChild(ph);
      } else {
        const im = el("img");
        im.src = u;
        d.appendChild(im);
      }
      const b = el("div", "badge");
      b.textContent = a.type;
      d.appendChild(b);
      const nm = el("div", "nm");
      nm.textContent = a.name;
      d.appendChild(nm);
      d.ondragstart = (e) => e.dataTransfer.setData("application/x-vgp-asset", JSON.stringify(a));
      g.appendChild(d);
    });
  }
  function buildTimeline() {
    derive();
    const inner = $("tlInner");
    inner.innerHTML = "";
    const eff = effectiveTotal();
    const width = LABELW + eff * S.pxPerSec + 40;
    inner.style.width = width + "px";
    const ruler = el("div", "ruler");
    ruler.style.width = width + "px";
    const STEPS = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
    const tickStep = STEPS.find((s) => s * S.pxPerSec >= 64) ?? 600;
    const fmtTick = (t) => tickStep < 1 ? `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}` : fmtClock(t);
    const minorStep = tickStep / 5;
    for (let t = minorStep; t < eff; t += minorStep) {
      if (Math.abs(t / tickStep - Math.round(t / tickStep)) < 1e-6) continue;
      const mk = el("div", "tick minor");
      mk.style.cssText = `left:${LABELW + t * S.pxPerSec}px;top:14px;height:12px;border-left:1px solid var(--border);opacity:.4;padding:0`;
      ruler.appendChild(mk);
    }
    if (eff > S.total + 1e-6) {
      const tailBand = el("div");
      tailBand.style.cssText = `position:absolute;top:0;bottom:0;left:${LABELW + S.total * S.pxPerSec}px;width:${(eff - S.total) * S.pxPerSec}px;background:repeating-linear-gradient(45deg,rgba(255,255,255,.04) 0 6px,transparent 6px 12px);pointer-events:none`;
      ruler.appendChild(tailBand);
      const mark = el("div");
      mark.style.cssText = `position:absolute;top:0;bottom:0;left:${LABELW + S.total * S.pxPerSec}px;width:0;border-left:1px dashed var(--t-audio);opacity:.6;pointer-events:none`;
      mark.title = `scenes end at ${fmtTick(S.total)} \u2014 audio tail beyond this point`;
      ruler.appendChild(mark);
    }
    let lastMajorT = 0;
    for (let t = 0; t <= eff + 1e-3; t += tickStep) {
      const tk = el("div", "tick");
      tk.style.left = LABELW + t * S.pxPerSec + "px";
      tk.textContent = fmtTick(t);
      ruler.appendChild(tk);
      lastMajorT = t;
    }
    if (eff - Math.floor(eff / tickStep) * tickStep > 0.01) {
      const endk = el("div", "tick");
      endk.style.left = LABELW + eff * S.pxPerSec + "px";
      const collides = (eff - lastMajorT) * S.pxPerSec < 64;
      if (collides) {
        endk.textContent = "";
        endk.style.borderColor = "var(--border)";
      } else endk.textContent = fmtTick(eff);
      ruler.appendChild(endk);
    }
    inner.appendChild(ruler);
    S.ir.scenes.forEach((scene2, si) => {
      const sr = el("div", "scene-row");
      const tag = el("div", "scene-tag");
      tag.innerHTML = icon("film" in I ? "film" : "video") + `Scene ${si + 1} \xB7 ${fmtClock(scene2.duration)}`;
      sr.appendChild(tag);
      inner.appendChild(sr);
      const effZ = (layer2, i) => layer2.zIndex ?? i;
      scene2.layers.map((layer2, li) => ({ layer: layer2, li, z: effZ(layer2, li) })).sort((a, b) => b.z - a.z).forEach(({ layer: layer2, li }) => {
        const track = el("div", "track");
        const label = el("div", "track-label");
        label.innerHTML = tintIcon(typeIco[layer2.type] ?? "shape", layer2.type) + `<span>${layerLabel(layer2).slice(0, 9)}</span>`;
        track.appendChild(label);
        const offset = S.offsets[si] + (layer2.start ?? 0);
        const dur = layer2.duration ?? scene2.duration;
        const clip = el("div", "clip");
        clip.style.left = LABELW + offset * S.pxPerSec + "px";
        clip.style.width = Math.max(24, dur * S.pxPerSec) + "px";
        clip.style.background = clipColor[layer2.type] ?? "#555";
        clip.innerHTML = tintIcon(typeIco[layer2.type] ?? "shape", layer2.type) + `<span>${layerLabel(layer2).slice(0, 16)}</span>`;
        if (S.selected && S.selected.s === si && S.selected.l === li) clip.classList.add("sel");
        if (layer2.type === "fx" && !resolveFxTarget(scene2, li)) {
          clip.style.opacity = ".5";
          clip.style.outline = "1px dashed var(--clip-fx)";
          clip.title = "effect has no target layer below it";
        }
        if (layer2.keyframes) {
          const KF_PROPS = ["x", "y", "scale", "rotate", "opacity"];
          const propRow = (prop) => {
            const ix = KF_PROPS.indexOf(prop);
            return ix < 0 ? KF_PROPS.length : ix;
          };
          for (const prop of Object.keys(layer2.keyframes)) {
            for (const k of layer2.keyframes[prop] || []) {
              const m = el("div", "kf-marker");
              m.style.cssText = `position:absolute;top:${1 + propRow(prop) * 8}px;width:7px;height:7px;background:var(--accent);border:1px solid #000;transform:rotate(45deg);left:${Math.max(0, k.t * S.pxPerSec - 3)}px;z-index:3;cursor:pointer`;
              m.title = `${prop} keyframe @ ${k.t.toFixed(2)}s (click=seek, right-click=delete)`;
              m.addEventListener("mousedown", (ev) => ev.stopPropagation());
              m.addEventListener("click", (ev) => {
                ev.stopPropagation();
                seekTo(S.offsets[si] + (layer2.start ?? 0) + k.t);
              });
              m.addEventListener("contextmenu", (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const arr = layer2.keyframes[prop];
                const ix = arr.indexOf(k);
                if (ix >= 0) arr.splice(ix, 1);
                if (!arr.length) delete layer2.keyframes[prop];
                structuralEdit();
              });
              clip.appendChild(m);
            }
          }
        }
        const handle = el("div", "handle");
        clip.appendChild(handle);
        clip.addEventListener("dragover", (e) => {
          const ty = e.dataTransfer?.types ?? [];
          const presetId = ty.includes("application/x-vgp-preset") ? "__p" : "";
          const overlayDrop = ty.includes("application/x-vgp-overlay");
          if (overlayDrop) {
            e.preventDefault();
            clip.style.outline = "2px solid #fff";
          } else if (presetId) {
            e.preventDefault();
            clip.style.outline = "2px solid #fff";
          }
        });
        clip.addEventListener("dragleave", () => {
          clip.style.outline = "";
        });
        clip.addEventListener("drop", (e) => {
          e.preventDefault();
          clip.style.outline = "";
          const ov = e.dataTransfer?.getData("application/x-vgp-overlay");
          if (ov) {
            dropLayerAt(e.clientX, overlayLayerFromId(ov));
            showToast("Overlay layer added: " + ov.split(".")[1].replace(/-/g, " "));
            return;
          }
          const id = e.dataTransfer?.getData("application/x-vgp-preset");
          if (!id) return;
          if (!presetAppliesTo(id, layer2.type)) {
            showToast(layer2.type === "overlay" ? "effects can't target an overlay layer" : "this effect only works on text layers");
            return;
          }
          scene2.layers.splice(li + 1, 0, newFxLayer(layer2, scene2.duration, id));
          normalizeZ(si);
          S.selected = { s: si, l: li + 1 };
          S.playhead = S.offsets[si] + (layer2.start ?? 0) + 0.05;
          structuralEdit();
          showToast("Added " + id.split(".")[1].replace(/-/g, " "));
        });
        clip.onmousedown = (e) => {
          if (e.target === handle || e.button !== 0) return;
          e.preventDefault();
          const rectLeft = $("tlInner").getBoundingClientRect().left;
          const tl = $("tlScroll");
          const sx = e.clientX, sy = e.clientY, os = layer2.start ?? 0, scrollStart = tl.scrollTop;
          let cand = os;
          let dyFinal = 0;
          let lastY = sy;
          let autoT = null;
          const refreshReorder = () => {
            dyFinal = lastY - sy + (tl.scrollTop - scrollStart);
            clip.style.transform = `translateY(${dyFinal}px)`;
            clip.style.zIndex = "60";
            clip.style.opacity = ".85";
          };
          const autoTick = () => {
            const r = tl.getBoundingClientRect();
            const EDGE = 32, max = tl.scrollHeight - tl.clientHeight;
            let d = 0;
            if (lastY < r.top + EDGE) d = -Math.ceil((r.top + EDGE - lastY) / 4);
            else if (lastY > r.bottom - EDGE) d = Math.ceil((lastY - (r.bottom - EDGE)) / 4);
            const next = Math.max(0, Math.min(max, tl.scrollTop + d));
            if (d && next !== tl.scrollTop) {
              tl.scrollTop = next;
              refreshReorder();
            }
          };
          let gesture = "";
          const trackH = clip.closest(".track")?.getBoundingClientRect().height || clip.getBoundingClientRect().height || 28;
          const isFullScene = layer2.duration == null && layer2.type !== "fx";
          let maxStart = isFullScene ? Math.max(0, scene2.duration - 0.2) : Math.max(scene2.duration, S.total) || scene2.duration;
          if (layer2.type === "fx") {
            const tgt = resolveFxTarget(scene2, li);
            const winMax = (tgt?.layer.start ?? 0) + (tgt?.layer.duration ?? scene2.duration);
            maxStart = Math.max(0, winMax - 0.1);
          }
          const sceneOff = S.offsets[si] ?? 0;
          const mv = (ev) => {
            lastY = ev.clientY;
            const dx = ev.clientX - sx, dy = ev.clientY - sy;
            if (!gesture && (Math.abs(dx) > 4 || Math.abs(dy) > 6)) {
              gesture = Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6 ? "reorder" : "time";
              if (gesture === "reorder" && !autoT) autoT = setInterval(autoTick, 16);
            }
            if (gesture === "time") {
              const rawAbs = sceneOff + os + dx / S.pxPerSec;
              const snappedAbs = snapTime(rawAbs, sceneSnapTargets(si, scene2, li), ev.altKey);
              cand = clampStart(snappedAbs - sceneOff, maxStart);
              clip.style.left = LABELW + (sceneOff + cand) * S.pxPerSec + "px";
            } else if (gesture === "reorder") {
              refreshReorder();
            }
          };
          const up = () => {
            window.removeEventListener("mousemove", mv);
            window.removeEventListener("mouseup", up);
            window.removeEventListener("blur", up);
            if (autoT) {
              clearInterval(autoT);
              autoT = null;
            }
            if (gesture === "time") {
              layer2.start = clampStart(cand, maxStart);
              timingEdit();
            } else if (gesture === "reorder") {
              select(si, li);
              const steps = Math.round(Math.abs(dyFinal) / trackH);
              const mode = dyFinal < 0 ? "up" : "down";
              for (let k = 0; k < steps; k++) arrangeLayer(mode);
            } else {
              select(si, li);
              seekTo(timeAtClientX(sx, rectLeft));
            }
          };
          window.addEventListener("mousemove", mv);
          window.addEventListener("mouseup", up);
          window.addEventListener("blur", up, { once: true });
        };
        clip.ondblclick = (e) => {
          e.stopPropagation();
          select(si, li);
        };
        handle.onmousedown = (e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          const sx = e.clientX, od = layer2.duration ?? scene2.duration;
          const isFx = layer2.type === "fx";
          const isFullSceneTrim = layer2.duration == null && layer2.type !== "fx";
          if (layer2.type === "video" && videoSrcDuration(layer2) == null) {
            showToast("media still loading\u2026");
            return;
          }
          const sceneCap = Math.max(0.1, scene2.duration - (layer2.start ?? 0));
          const growCap = Math.max(scene2.duration, S.total) || scene2.duration;
          let maxDur = isFx || isFullSceneTrim ? growCap : e.shiftKey ? growCap : sceneCap;
          if (layer2.type === "video") {
            const vd = videoSrcDuration(layer2);
            if (vd != null) maxDur = Math.min(maxDur, Math.max(0.1, vd - (layer2.trimStart ?? 0)));
          }
          if (isFx) {
            const tgt = resolveFxTarget(scene2, li);
            const winMax = (tgt?.layer.start ?? 0) + (tgt?.layer.duration ?? scene2.duration);
            maxDur = Math.max(0.1, winMax - (layer2.start ?? 0));
          }
          const sceneOff = S.offsets[si] ?? 0;
          const clipStartAbs = sceneOff + (layer2.start ?? 0);
          let moved = false;
          let pending = od;
          const mv = (ev) => {
            if (Math.abs(ev.clientX - sx) > 3) moved = true;
            if (!moved) return;
            const minDur = Math.max(0.1, 24 / S.pxPerSec);
            const rawEndAbs = clipStartAbs + od + (ev.clientX - sx) / S.pxPerSec;
            const snappedEndAbs = snapTime(rawEndAbs, sceneSnapTargets(si, scene2, li), ev.altKey);
            pending = clampDuration(snappedEndAbs - clipStartAbs, minDur, maxDur);
            layer2.duration = pending;
            clip.style.width = Math.max(24, layer2.duration * S.pxPerSec) + "px";
          };
          const up = () => {
            window.removeEventListener("mousemove", mv);
            window.removeEventListener("mouseup", up);
            if (!moved) return;
            layer2.duration = clampDuration(pending, Math.max(0.1, 24 / S.pxPerSec), maxDur);
            timingEdit();
          };
          window.addEventListener("mousemove", mv);
          window.addEventListener("mouseup", up);
        };
        track.appendChild(clip);
        inner.appendChild(track);
      });
    });
    const audio = S.ir.audio ?? [];
    if (audio.length) {
      const info = typeof VGP.audioInfo === "function" ? VGP.audioInfo() : [];
      const sr = el("div", "scene-row");
      const tag = el("div", "scene-tag");
      tag.innerHTML = tintIcon("audio", "audio") + "Audio";
      sr.appendChild(tag);
      inner.appendChild(sr);
      audio.forEach((a, ai) => {
        const track = el("div", "track");
        const name = String(a.src).split("/").pop() || "audio";
        const label = el("div", "track-label");
        label.innerHTML = tintIcon("audio", "audio") + `<span>${name.slice(0, 9)}</span>`;
        track.appendChild(label);
        const start = a.start ?? 0;
        const fileDur = info[ai]?.duration ?? null;
        const metaReady = fileDur != null;
        const dur = a.duration ?? fileDur ?? Math.max(2, S.total - start);
        const maxDur = metaReady ? Math.max(0.2, fileDur - (a.trimStart ?? 0)) : Infinity;
        const clip = el("div", "clip audio-clip");
        clip.style.left = LABELW + start * S.pxPerSec + "px";
        if (!metaReady && a.duration == null) {
          clip.style.width = "64px";
          clip.style.opacity = ".5";
          clip.style.backgroundImage = "repeating-linear-gradient(45deg,rgba(255,255,255,.08) 0 6px,transparent 6px 12px)";
        } else clip.style.width = Math.max(24, Math.min(dur, metaReady ? maxDur : dur) * S.pxPerSec) + "px";
        const vol = a.volume ?? 1;
        const volBadge = vol === 0 ? "\u{1F507}" : `${Math.round(vol * 100)}%`;
        clip.innerHTML = icon("audio") + `<span>${name}</span><span style="margin-left:auto;font-size:9px;opacity:${vol === 0 ? ".6" : ".85"}">${volBadge}</span>`;
        if (S.selAudio === ai) clip.classList.add("sel");
        const lh = el("div", "handle");
        lh.style.cssText = "right:auto;left:0";
        clip.appendChild(lh);
        const handle = el("div", "handle");
        clip.appendChild(handle);
        const audioRectLeft0 = () => $("tlInner").getBoundingClientRect().left;
        clip.onmousedown = (e) => {
          if (e.target === handle || e.target === lh || e.button !== 0) return;
          e.preventDefault();
          const rectLeft = audioRectLeft0();
          const sx = e.clientX, os = start;
          let moved = false;
          let cand = os;
          const maxStart = Math.max(0, effectiveTotal() - 0.1);
          const mv = (ev) => {
            const dx = ev.clientX - sx;
            if (Math.abs(dx) > 3) moved = true;
            const snapped = snapTime(os + dx / S.pxPerSec, [0, S.playhead, ...S.offsets, S.total], ev.altKey);
            cand = clampStart(snapped, maxStart);
            clip.style.left = LABELW + cand * S.pxPerSec + "px";
          };
          const up = () => {
            window.removeEventListener("mousemove", mv);
            window.removeEventListener("mouseup", up);
            if (moved) {
              a.start = clampStart(cand, maxStart);
              liveSeek();
              scheduleSave();
              buildTimeline();
              if (S.selAudio === ai) buildProps();
            } else if (e.shiftKey || e.metaKey || e.ctrlKey) selectAudio(ai);
            else seekTo(timeAtClientX(sx, rectLeft));
          };
          window.addEventListener("mousemove", mv);
          window.addEventListener("mouseup", up);
        };
        clip.ondblclick = (e) => {
          e.stopPropagation();
          selectAudio(ai);
        };
        handle.onmousedown = (e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          if (!metaReady && a.duration == null) {
            showToast("audio still loading\u2026");
            return;
          }
          const sx = e.clientX, od = metaReady ? Math.min(dur, maxDur) : dur;
          let moved = false;
          const mv = (ev) => {
            if (Math.abs(ev.clientX - sx) > 3) moved = true;
            if (!moved) return;
            const startAbs = a.start ?? 0;
            const rawEnd = startAbs + od + (ev.clientX - sx) / S.pxPerSec;
            const snappedEnd = snapTime(rawEnd, [S.playhead, ...S.offsets, S.total], ev.altKey);
            a.duration = +Math.max(0.2, Math.min(maxDur, snappedEnd - startAbs)).toFixed(2);
            clip.style.width = Math.max(24, a.duration * S.pxPerSec) + "px";
            liveSeek();
          };
          const up = () => {
            window.removeEventListener("mousemove", mv);
            window.removeEventListener("mouseup", up);
            if (!moved) return;
            scheduleSave();
            buildTimeline();
            if (S.selAudio === ai) buildProps();
          };
          window.addEventListener("mousemove", mv);
          window.addEventListener("mouseup", up);
        };
        lh.onmousedown = (e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          if (!metaReady && a.duration == null) {
            showToast("audio still loading\u2026");
            return;
          }
          const sx = e.clientX, os = start, ots = a.trimStart ?? 0, od = dur;
          const mv = (ev) => {
            let dt = (ev.clientX - sx) / S.pxPerSec;
            dt = Math.max(-ots, Math.min(od - 0.2, dt));
            if (os + dt < 0) dt = -os;
            a.trimStart = +Math.max(0, ots + dt).toFixed(3);
            a.start = +Math.max(0, os + dt).toFixed(3);
            a.duration = +Math.max(0.2, od - dt).toFixed(2);
            clip.style.left = LABELW + a.start * S.pxPerSec + "px";
            clip.style.width = Math.max(24, a.duration * S.pxPerSec) + "px";
            liveSeek();
          };
          const up = () => {
            window.removeEventListener("mousemove", mv);
            window.removeEventListener("mouseup", up);
            liveSeek();
            scheduleSave();
            buildTimeline();
            if (S.selAudio === ai) buildProps();
          };
          window.addEventListener("mousemove", mv);
          window.addEventListener("mouseup", up);
        };
        track.appendChild(clip);
        inner.appendChild(track);
      });
    }
    const ph = el("div", "playhead");
    ph.id = "playhead";
    inner.appendChild(ph);
    positionPlayhead();
    const defTrans = S.ir.defaultTransition;
    for (let i = 1; i < S.ir.scenes.length; i++) {
      const own = S.ir.scenes[i].transitionIn;
      const isCleared = !!own && own.id === "none";
      const effInst = isCleared ? null : own ?? defTrans;
      const has = !!effInst;
      const isDefault = !own && !!defTrans;
      const seam = el("div", "seam" + (has ? "" : " empty") + (isDefault ? " is-default" : "") + (isCleared ? " cleared" : ""));
      seam.style.left = LABELW + S.offsets[i] * S.pxPerSec - 7 + "px";
      seam.style.top = "28px";
      seam.style.height = "40px";
      if (isCleared) seam.style.opacity = ".45";
      seam.title = isCleared ? "transition disabled (click to restore default)" : own ? `transition: ${own.id} (click to remove)` : isDefault ? `default transition: ${defTrans.id} (click to override/clear on this boundary)` : "drop a transition here (click to browse)";
      const dot = el("div", "dot");
      seam.appendChild(dot);
      if (isDefault && !isCleared) {
        dot.style.background = "transparent";
        dot.style.border = "1.5px solid var(--accent)";
        dot.style.boxSizing = "border-box";
      }
      seam.addEventListener("mousedown", (e) => e.stopPropagation());
      seam.addEventListener("dragover", (e) => {
        if (e.dataTransfer?.types.includes("application/x-vgp-transition")) {
          e.preventDefault();
          seam.classList.add("droptgt");
        }
      });
      seam.addEventListener("dragleave", () => seam.classList.remove("droptgt"));
      seam.addEventListener("drop", (e) => {
        e.preventDefault();
        seam.classList.remove("droptgt");
        const id = e.dataTransfer?.getData("application/x-vgp-transition");
        if (id) {
          const wasOwn = !!own && own.id !== "none";
          const hadEffective = wasOwn || !own && !!defTrans;
          S.ir.scenes[i].transitionIn = { id };
          const tEntry = MAN.get(id);
          const defDur = tEntry?.defaultDuration ?? 0.6;
          const prevDur = S.ir.scenes[i - 1]?.duration ?? defDur;
          const tdur = Math.min(defDur, prevDur);
          S.playhead = S.offsets[i] + Math.min(tdur, defDur) / 2;
          structuralEdit();
          showToast((hadEffective ? "Transition overridden: " : "Transition added: ") + id.split(".")[1]);
        }
      });
      seam.addEventListener("click", () => {
        if (isCleared) {
          delete S.ir.scenes[i].transitionIn;
          structuralEdit();
          showToast("Default transition restored");
        } else if (own) {
          delete S.ir.scenes[i].transitionIn;
          structuralEdit();
          showToast("Transition removed");
        } else if (isDefault) {
          S.ir.scenes[i].transitionIn = { id: "none" };
          structuralEdit();
          showToast("Default transition disabled on this boundary");
        } else {
          S.cat = "transition";
          setTab("anim");
          showToast("Drop a transition here");
        }
      });
      inner.appendChild(seam);
    }
  }
  function selectAudio(ai) {
    S.selAudio = ai;
    S.selected = null;
    setTab("props");
    buildTimeline();
  }
  function positionPlayhead() {
    const ph = document.getElementById("playhead");
    if (ph) {
      ph.style.left = LABELW + S.playhead * S.pxPerSec + "px";
      ph.style.height = $("tlInner").scrollHeight + "px";
    }
    updateSelBox();
    const cs = document.getElementById("curScene");
    if (cs && S.ir) cs.innerHTML = icon("layers") + `Scene ${sceneAt(S.playhead) + 1} / ${S.ir.scenes.length}`;
  }
  function updateSelBox() {
    const box = document.getElementById("selbox");
    if (!box) return;
    const sel = S.selected;
    const layer2 = sel ? S.ir.scenes[sel.s]?.layers?.[sel.l] : null;
    if (!sel || !layer2) {
      box.style.display = "none";
      return;
    }
    if (layer2.type === "overlay" || layer2.type === "fx") {
      box.style.display = "none";
      return;
    }
    const off = S.offsets[sel.s] ?? 0;
    const st = off + (layer2.start ?? 0);
    const dur = layer2.duration ?? S.ir.scenes[sel.s].duration;
    if (S.playhead < st - 0.01 || S.playhead > st + dur + 0.01) {
      box.style.display = "none";
      return;
    }
    const r = layer2.rect ?? { x: Math.round(S.ir.width * 0.06), y: Math.round(S.ir.height * 0.06), w: Math.round(S.ir.width * 0.88), h: Math.round(S.ir.height * 0.88) };
    const d = renderedDelta(layer2, sel.s);
    const sc = d.scale;
    const cx = r.x + r.w / 2 + d.x;
    const cy = r.y + r.h / 2 + d.y;
    const w = r.w * sc, h = r.h * sc;
    box.style.display = "block";
    box.style.left = cx - w / 2 + "px";
    box.style.top = cy - h / 2 + "px";
    box.style.width = w + "px";
    box.style.height = h + "px";
    const rot = d.rotate;
    box.style.transform = rot ? `rotate(${rot}deg)` : "";
    box.style.transformOrigin = "center center";
    const inv = Math.min(2.4, 1 / (S.scale || 1));
    const presetActive = activeTransformPreset(layer2, sel.s);
    box.querySelectorAll(".sh").forEach((h2) => {
      const he = h2;
      he.style.transform = `scale(${inv})`;
      he.style.opacity = presetActive ? ".3" : "";
      he.style.cursor = presetActive ? "not-allowed" : "";
    });
  }
  function initSelHandles() {
    document.querySelectorAll("#selbox .sh").forEach((h) => {
      h.addEventListener("mousedown", (e) => {
        if (!S.selected) return;
        e.preventDefault();
        e.stopPropagation();
        const layer2 = S.ir.scenes[S.selected.s].layers[S.selected.l];
        if (activeTransformPreset(layer2, S.selected.s)) {
          showToast("Move the playhead past the entrance animation to resize.");
          return;
        }
        if (!layer2.rect) layer2.rect = { x: Math.round(S.ir.width * 0.06), y: Math.round(S.ir.height * 0.06), w: Math.round(S.ir.width * 0.88), h: Math.round(S.ir.height * 0.88) };
        const corner = h.getAttribute("data-h");
        const sx = e.clientX, sy = e.clientY;
        const r0 = { ...layer2.rect };
        const sc = S.scale || 1;
        const d0 = renderedDelta(layer2, S.selected.s);
        const tfs = d0.scale || 1;
        const rot = d0.rotate * Math.PI / 180;
        const offX = d0.x, offY = d0.y;
        const cosr = Math.cos(rot), sinr = Math.sin(rot);
        const sgnX = corner.includes("e") ? 1 : -1;
        const sgnY = corner.includes("s") ? 1 : -1;
        const anchorLX = -sgnX * r0.w / 2, anchorLY = -sgnY * r0.h / 2;
        const ax = anchorLX * tfs, ay = anchorLY * tfs;
        const anchorSX = ax * cosr - ay * sinr, anchorSY = ax * sinr + ay * cosr;
        const mv = (ev) => {
          let ldx = (ev.clientX - sx) / sc, ldy = (ev.clientY - sy) / sc;
          const localDX = (ldx * cosr + ldy * sinr) / tfs;
          const localDY = (-ldx * sinr + ldy * cosr) / tfs;
          let w = Math.max(20, r0.w + sgnX * localDX);
          let hh = Math.max(20, r0.h + sgnY * localDY);
          if (ev.shiftKey) {
            const sW = w / (r0.w || 1), sH = hh / (r0.h || 1);
            const k = Math.abs(sW - 1) >= Math.abs(sH - 1) ? sW : sH;
            w = Math.max(20, r0.w * k);
            hh = Math.max(20, r0.h * k);
          }
          const newAnchorLX = -sgnX * w / 2, newAnchorLY = -sgnY * hh / 2;
          const nax = newAnchorLX * tfs, nay = newAnchorLY * tfs;
          const naSX = nax * cosr - nay * sinr, naSY = nax * sinr + nay * cosr;
          const c0x = r0.x + r0.w / 2 + offX, c0y = r0.y + r0.h / 2 + offY;
          const ncx = c0x + anchorSX - naSX, ncy = c0y + anchorSY - naSY;
          layer2.rect = { x: Math.round(ncx - offX - w / 2), y: Math.round(ncy - offY - hh / 2), w: Math.round(w), h: Math.round(hh) };
          liveSeek();
          updateSelBox();
        };
        const up = () => {
          window.removeEventListener("mousemove", mv);
          window.removeEventListener("mouseup", up);
          scheduleSave();
          buildProps();
        };
        window.addEventListener("mousemove", mv);
        window.addEventListener("mouseup", up);
      });
    });
  }
  function setTab(t) {
    S.panel = t;
    $("tabProps").classList.toggle("on", t === "props");
    $("tabAnim").classList.toggle("on", t === "anim");
    renderRight();
  }
  function renderRight() {
    S.panel === "props" ? buildProps() : buildLibrary();
  }
  function select(s, l) {
    S.selected = { s, l };
    S.selAudio = null;
    setTab("props");
    buildTimeline();
  }
  function numField(label, value, min, max, step, onIn) {
    const f = el("div", "field");
    const lab = el("label");
    lab.textContent = label;
    f.appendChild(lab);
    const row = el("div", "row");
    const r = el("input");
    r.type = "range";
    r.min = String(min);
    r.max = String(max);
    r.step = String(step);
    r.value = String(value);
    const v = el("span", "val");
    v.textContent = (+value).toFixed(2);
    r.oninput = () => {
      const nv = parseFloat(r.value);
      v.textContent = nv.toFixed(2);
      onIn(nv);
    };
    row.appendChild(r);
    row.appendChild(v);
    f.appendChild(row);
    return f;
  }
  function kfField(label, prop, value, min, max, step, onIn) {
    const layer2 = S.selected ? S.ir.scenes[S.selected.s].layers[S.selected.l] : null;
    const keyed2 = !!layer2 && isKeyframed(layer2, prop);
    const shown = keyed2 && layer2 ? tfAt(layer2, S.selected.s, prop, value) : value;
    const f = numField(label, shown, min, max, step, (v) => {
      if (keyed2 && layer2) setKeyframeAtPlayhead(prop, v);
      else onIn(v);
    });
    const lab = f.querySelector("label");
    const arr = layer2?.keyframes?.[prop] ?? [];
    const n = arr.length;
    if (keyed2) lab.title = "keyframe-driven \u2014 editing sets the keyframe at the playhead";
    if (n > 0) {
      const eps = kfEpsilon();
      const prev = el("button", "icon-btn");
      prev.textContent = "\u2039";
      prev.title = "prev keyframe";
      prev.style.cssText = "float:right;padding:1px 6px;font-size:11px";
      prev.onclick = () => {
        const lt = playheadLocal();
        const before = [...arr].reverse().find((k) => k.t < lt - eps);
        if (before && layer2) seekTo(S.offsets[S.selected.s] + (layer2.start ?? 0) + before.t);
      };
      const next = el("button", "icon-btn");
      next.textContent = "\u203A";
      next.title = "next keyframe";
      next.style.cssText = "float:right;padding:1px 6px;font-size:11px";
      next.onclick = () => {
        const lt = playheadLocal();
        const after = arr.find((k) => k.t > lt + eps);
        if (after && layer2) seekTo(S.offsets[S.selected.s] + (layer2.start ?? 0) + after.t);
      };
      const clr = el("button", "icon-btn");
      clr.textContent = "\u2715";
      clr.title = "clear all keyframes for this property";
      clr.style.cssText = "float:right;padding:1px 6px;font-size:10px";
      clr.onclick = () => clearKeyframes(prop);
      lab.appendChild(clr);
      lab.appendChild(next);
      lab.appendChild(prev);
    }
    const key = el("button", "icon-btn");
    key.innerHTML = n ? `\u25C6 ${n}` : "\u25C6";
    key.title = "toggle keyframe at playhead (alt-click clears all)";
    key.style.cssText = "float:right;padding:1px 7px;font-size:10px" + (n ? ";color:var(--accent)" : "");
    key.onclick = (ev) => {
      if (ev.altKey) clearKeyframes(prop);
      else addKeyframe(prop);
    };
    lab.appendChild(key);
    if (n > 0) {
      const lt = playheadLocal();
      const at = arr.find((k) => Math.abs(k.t - lt) < kfEpsilon());
      if (at) {
        const ef = el("div", "field");
        ef.style.cssText = "margin-top:-2px";
        const sel = el("select");
        sel.style.cssText = "font-size:10px;padding:1px 3px";
        KF_EASINGS.forEach((nm) => {
          const op = el("option");
          op.value = nm;
          op.textContent = nm;
          if ((at.easing ?? "linear") === nm) op.selected = true;
          sel.appendChild(op);
        });
        sel.onchange = () => {
          at.easing = sel.value;
          liveEdit();
        };
        const elab = el("label");
        elab.textContent = "ease \u2190 (into)";
        elab.title = "easing of the segment arriving into this keyframe";
        elab.style.cssText = "font-size:9px;color:var(--dim)";
        const row = el("div", "row");
        row.appendChild(elab);
        row.appendChild(sel);
        ef.appendChild(row);
        f.appendChild(ef);
      }
    }
    return f;
  }
  var playheadLocal = () => {
    if (!S.selected) return 0;
    const { s, l } = S.selected;
    const layer2 = S.ir.scenes[s].layers[l];
    return Math.max(0, S.playhead - (S.offsets[s] + (layer2.start ?? 0)));
  };
  var kfEpsilon = () => Math.max(0.02, 0.5 / (S.ir?.fps ?? 30));
  function snapLocalT(layer2) {
    const { s } = S.selected;
    const ld = layer2.duration ?? S.ir.scenes[s].duration;
    let t = S.playhead - (S.offsets[s] + (layer2.start ?? 0));
    return +Math.max(0, Math.min(ld, t)).toFixed(3);
  }
  function setKeyframeAtPlayhead(prop, value) {
    if (!S.selected) return;
    const { s, l } = S.selected;
    const layer2 = S.ir.scenes[s].layers[l];
    const off = S.offsets[s] + (layer2.start ?? 0);
    const ld = layer2.duration ?? S.ir.scenes[s].duration;
    if (S.playhead < off - 1e-4 || S.playhead > off + ld + 1e-4) {
      showToast("Move the playhead over the clip to keyframe.");
      return;
    }
    layer2.keyframes = layer2.keyframes || {};
    const arr = layer2.keyframes[prop] || (layer2.keyframes[prop] = []);
    const localT = snapLocalT(layer2);
    const ex = arr.find((k) => Math.abs(k.t - localT) < kfEpsilon());
    if (ex) ex.value = value;
    else arr.push({ t: localT, value, easing: "linear" });
    arr.sort((a, b) => a.t - b.t);
    liveEdit();
  }
  function addKeyframe(prop) {
    if (!S.selected) return;
    const { s, l } = S.selected;
    const layer2 = S.ir.scenes[s].layers[l];
    const off = S.offsets[s] + (layer2.start ?? 0);
    const ld = layer2.duration ?? S.ir.scenes[s].duration;
    if (S.playhead < off - 1e-4 || S.playhead > off + ld + 1e-4) {
      showToast("Move the playhead over the clip to keyframe.");
      return;
    }
    const localT = snapLocalT(layer2);
    const cur = keyed(prop) ? tfAt(layer2, s, prop, defForProp(prop)) : layer2.transform?.[prop] ?? defForProp(prop);
    layer2.keyframes = layer2.keyframes || {};
    const arr = layer2.keyframes[prop] || (layer2.keyframes[prop] = []);
    const exIx = arr.findIndex((k) => Math.abs(k.t - localT) < kfEpsilon());
    if (exIx >= 0) {
      arr.splice(exIx, 1);
      if (!arr.length) delete layer2.keyframes[prop];
    } else arr.push({ t: localT, value: cur, easing: "linear" });
    if (arr.length) arr.sort((a, b) => a.t - b.t);
    liveEdit();
    buildTimeline();
    buildProps();
  }
  var defForProp = (prop) => prop === "scale" || prop === "opacity" ? 1 : 0;
  var keyed = (prop) => {
    if (!S.selected) return false;
    const layer2 = S.ir.scenes[S.selected.s].layers[S.selected.l];
    return isKeyframed(layer2, prop);
  };
  function clearKeyframes(prop) {
    if (!S.selected) return;
    const layer2 = S.ir.scenes[S.selected.s].layers[S.selected.l];
    if (layer2.keyframes) {
      delete layer2.keyframes[prop];
      structuralEdit();
    }
  }
  function splitSelected() {
    if (!S.selected) {
      showToast("Please select a layer to split.");
      return;
    }
    const { s, l } = S.selected;
    const scene2 = S.ir.scenes[s];
    const layer2 = scene2.layers[l];
    const ls = layer2.start ?? 0, ld = layer2.duration ?? scene2.duration;
    const local = S.playhead - (S.offsets[s] + ls);
    if (local <= 0.05 || local >= ld - 0.05) {
      showToast("Move the playhead over the clip to split.");
      return;
    }
    const second = JSON.parse(JSON.stringify(layer2));
    delete second.zIndex;
    layer2.duration = +local.toFixed(2);
    second.start = +(ls + local).toFixed(2);
    second.duration = +(ld - local).toFixed(2);
    if (second.keyframes) {
      for (const prop of Object.keys(second.keyframes)) {
        second.keyframes[prop] = second.keyframes[prop].map((k) => ({ ...k, t: +Math.max(0, k.t - local).toFixed(3) }));
      }
    }
    if (layer2.keyframes) {
      for (const prop of Object.keys(layer2.keyframes)) {
        const arr = layer2.keyframes[prop];
        const boundaryVal = keyframeValueAt(arr, local, arr[0]?.value ?? defForProp(prop));
        const kept = arr.filter((k) => k.t < local - 1e-4);
        const hadBeyond = kept.length !== arr.length;
        if (hadBeyond) {
          const lastEasing = kept[kept.length - 1]?.easing ?? "linear";
          kept.push({ t: +local.toFixed(3), value: +boundaryVal.toFixed(4), easing: lastEasing });
        }
        kept.sort((a, b) => a.t - b.t);
        layer2.keyframes[prop] = kept;
      }
    }
    const isExit = (id) => MAN.get(id)?.category === "out" || id.startsWith("out.");
    const isEnter = (id) => !isExit(id) && (MAN.get(id)?.category === "in" || id.startsWith("in."));
    if (Array.isArray(layer2.presets)) layer2.presets = layer2.presets.filter((pr) => !isExit(pr.id));
    if (Array.isArray(second.presets)) second.presets = second.presets.filter((pr) => !isEnter(pr.id));
    let insertAt = l + 1;
    while (insertAt < scene2.layers.length && scene2.layers[insertAt].type === "fx") insertAt++;
    scene2.layers.splice(insertAt, 0, second);
    normalizeZ(s);
    structuralEdit();
  }
  function duplicateSelected() {
    if (!S.selected) return;
    const { s, l } = S.selected;
    const scene2 = S.ir.scenes[s];
    const copy = JSON.parse(JSON.stringify(scene2.layers[l]));
    delete copy.zIndex;
    copy.start = (copy.start ?? 0) + 0.2;
    scene2.layers.splice(l + 1, 0, copy);
    normalizeZ(s);
    S.selected = { s, l: l + 1 };
    structuralEdit();
  }
  function arrangeLayer(mode) {
    if (!S.selected) {
      showToast("Select a layer to arrange.");
      return;
    }
    const { s, l } = S.selected;
    const arr = S.ir.scenes[s].layers;
    const moved = arr[l];
    if (!moved) return;
    const units = [];
    let cur = null;
    arr.forEach((L) => {
      if (L.type === "fx" && cur && cur[0].type !== "overlay") cur.push(L);
      else {
        cur = [L];
        units.push(cur);
      }
    });
    const ui = units.findIndex((u2) => u2.includes(moved));
    if (ui < 0) return;
    if (units.length < 2) {
      showToast("Nothing to reorder \u2014 only one layer in this scene.");
      return;
    }
    let ni = ui;
    if (mode === "top") ni = units.length - 1;
    else if (mode === "bottom") ni = 0;
    else if (mode === "up") ni = Math.min(units.length - 1, ui + 1);
    else ni = Math.max(0, ui - 1);
    if (ni === ui) return;
    const [u] = units.splice(ui, 1);
    units.splice(ni, 0, u);
    S.ir.scenes[s].layers = units.flat();
    normalizeZ(s);
    S.selected = { s, l: S.ir.scenes[s].layers.indexOf(moved) };
    structuralEdit();
  }
  var projTab = "comp";
  function openProj(tab) {
    projTab = tab;
    $("projModal").classList.add("show");
    renderProj();
  }
  function closeProj() {
    $("projModal").classList.remove("show");
  }
  function renderProj() {
    document.querySelectorAll(".proj-tab").forEach((t) => t.classList.toggle("on", t.getAttribute("data-v") === projTab));
    const body = $("projBody");
    body.innerHTML = "";
    if (projTab === "comp") {
      const cur = sceneAt(S.playhead);
      S.ir.scenes.forEach((sc, i) => {
        const d = el("div", "scene-item" + (i === cur ? " cur" : ""));
        d.innerHTML = `<div class="num">${i + 1}</div><div class="meta"><b>${sc.id || "Scene " + (i + 1)}</b><span>${fmtClock(sc.duration)} \xB7 ${sc.layers.length} layers${i === cur ? " \xB7 \u25B6 playing" : ""}</span></div>`;
        d.onclick = () => {
          seekTo(S.offsets[i] + 0.01);
          closeProj();
        };
        body.appendChild(d);
      });
    } else if (projTab === "assets") {
      const seen = /* @__PURE__ */ new Map();
      S.ir.scenes.forEach((sc) => sc.layers.forEach((l) => {
        if ((l.type === "image" || l.type === "video") && l.src && !seen.has(l.src)) seen.set(l.src, l.type);
      }));
      (S.ir.audio || []).forEach((a) => {
        if (a.src && !seen.has(a.src)) seen.set(a.src, "audio");
      });
      if (!seen.size) {
        body.innerHTML = '<div class="empty">No assets used in this project yet.</div>';
        return;
      }
      const g = el("div", "pa-grid");
      seen.forEach((type, src) => {
        const d = el("div", "pa");
        const u = assetUrl(src);
        const name = src.split("/").pop() || src;
        if (type === "video") {
          const v = el("video");
          v.src = u;
          v.muted = true;
          d.appendChild(v);
        } else if (type === "image") {
          const im = el("img");
          im.src = u;
          d.appendChild(im);
        } else {
          d.style.cssText += "display:flex;align-items:center;justify-content:center";
          d.innerHTML = icon("audio");
        }
        const b = el("div", "badge");
        b.textContent = type;
        d.appendChild(b);
        const lb = el("div", "lbl");
        lb.textContent = name;
        d.appendChild(lb);
        g.appendChild(d);
      });
      body.appendChild(g);
    } else {
      const pre = el("pre");
      pre.textContent = JSON.stringify(S.ir, null, 2);
      body.appendChild(pre);
    }
  }
  function buildProps() {
    const p = $("rightBody");
    p.innerHTML = "";
    if (S.selAudio != null) {
      const a = S.ir.audio?.[S.selAudio];
      if (!a) {
        S.selAudio = null;
        return buildProps();
      }
      const head2 = el("div", "sel-head");
      const pill2 = el("span", "pill");
      pill2.innerHTML = icon("audio") + "audio";
      pill2.style.background = "#2b2b2b";
      head2.appendChild(pill2);
      const title2 = el("span");
      title2.textContent = String(a.src).split("/").pop() ?? "audio";
      title2.style.cssText = "flex:1;font-weight:600;overflow:hidden;text-overflow:ellipsis";
      head2.appendChild(title2);
      const mute = el("button", "icon-btn");
      mute.textContent = (a.volume ?? 1) === 0 ? "\u{1F507}" : "\u{1F50A}";
      mute.title = "mute / unmute";
      mute.onclick = () => {
        a.volume = (a.volume ?? 1) === 0 ? 1 : 0;
        liveEdit();
        buildTimeline();
        buildProps();
      };
      head2.appendChild(mute);
      const ai = S.selAudio;
      const del2 = el("button", "icon-btn");
      del2.innerHTML = icon("trash");
      del2.title = "delete audio track";
      del2.onclick = () => {
        S.ir.audio.splice(ai, 1);
        S.selAudio = null;
        structuralEdit();
      };
      head2.appendChild(del2);
      p.appendChild(head2);
      const h3 = el("h3");
      h3.textContent = "audio";
      p.appendChild(h3);
      p.appendChild(numField("volume", a.volume ?? 1, 0, 1, 0.01, (v) => {
        a.volume = v;
        liveEdit();
        buildTimeline();
      }));
      p.appendChild(numField("start (s)", a.start ?? 0, 0, Math.max(1, S.total - 0.1, effectiveTotal() - 0.1), 0.05, (v) => {
        a.start = v;
        liveSeek();
        buildTimeline();
        scheduleSave();
      }));
      const info = (typeof VGP.audioInfo === "function" ? VGP.audioInfo() : [])[S.selAudio];
      const fileDur = info?.duration ?? null;
      const curDur = a.duration ?? fileDur ?? Math.max(1, S.total - (a.start ?? 0));
      const maxDur = fileDur != null ? Math.max(0.2, fileDur - (a.trimStart ?? 0)) : Math.max(curDur, S.total);
      p.appendChild(numField("duration (s)", Math.min(curDur, maxDur), 0.2, maxDur, 0.05, (v) => {
        a.duration = v;
        buildTimeline();
        scheduleSave();
      }));
      return;
    }
    if (!S.selected) {
      p.innerHTML = '<div class="empty">Select a clip in the timeline to edit it.<br/><br/>Or open the <b>Animations</b> tab to browse presets.</div>';
      return;
    }
    const { s, l } = S.selected;
    const scene2 = S.ir.scenes[s];
    const layer2 = scene2?.layers[l];
    if (!layer2) {
      S.selected = null;
      return buildProps();
    }
    const h = (t) => {
      const x = el("h3");
      x.textContent = t;
      p.appendChild(x);
    };
    if (layer2.type === "fx") {
      const entry = MAN.get(layer2.effect);
      const head2 = el("div", "sel-head");
      const pill2 = el("span", "pill");
      pill2.innerHTML = icon("spark") + "fx";
      pill2.style.background = "var(--clip-fx)";
      head2.appendChild(pill2);
      const title2 = el("span");
      title2.textContent = String(layer2.effect).split(".")[1].replace(/-/g, " ");
      title2.style.cssText = "flex:1;font-weight:600";
      head2.appendChild(title2);
      const del2 = el("button", "icon-btn");
      del2.innerHTML = icon("trash");
      del2.onclick = () => {
        scene2.layers.splice(l, 1);
        normalizeZ(s);
        S.selected = null;
        structuralEdit();
      };
      head2.appendChild(del2);
      p.appendChild(head2);
      const tgt = resolveFxTarget(scene2, l);
      const note = el("div");
      note.style.cssText = "font-size:11px;color:var(--dim);margin-bottom:8px";
      note.innerHTML = tgt ? `driving: <b>${layerLabel(tgt.layer)}</b>` : "\u26A0 no target layer below this fx \u2014 it renders nothing";
      p.appendChild(note);
      layer2.params = layer2.params || {};
      if (entry) {
        h("effect settings");
        for (const [pk, spec] of Object.entries(entry.params)) {
          const min = spec.min ?? 0, max = spec.max ?? (spec.default * 2 || 1);
          p.appendChild(numField(pk, layer2.params[pk] ?? spec.default, min, max, (max - min) / 100 || 0.01, (v) => {
            layer2.params[pk] = v;
            liveEdit();
          }));
        }
      }
      h("timing");
      const tgtStart = tgt?.layer.start ?? 0;
      const tgtDur = tgt?.layer.duration ?? scene2.duration;
      const winMax = tgtStart + tgtDur;
      p.appendChild(numField("start (s)", layer2.start ?? 0, 0, Math.max(0, winMax - 0.1), 0.05, (v) => {
        layer2.start = v;
        timingEdit();
      }));
      const fxDurMax = Math.max(0.1, winMax - (layer2.start ?? 0));
      p.appendChild(numField("duration (s)", Math.min(layer2.duration ?? fxDurMax, fxDurMax), 0.1, fxDurMax, 0.05, (v) => {
        layer2.duration = v;
        timingEdit();
      }));
      return;
    }
    const head = el("div", "sel-head");
    const pill = el("span", "pill");
    pill.innerHTML = icon(typeIco[layer2.type] ?? "shape") + layer2.type;
    pill.style.background = clipColor[layer2.type] ?? "#555";
    head.appendChild(pill);
    const title = el("span");
    title.textContent = layer2.type === "text" ? String(layer2.text).slice(0, 16) : layer2.src ? String(layer2.src).split("/").pop() : layer2.type;
    title.style.cssText = "flex:1;font-weight:600;overflow:hidden;text-overflow:ellipsis";
    head.appendChild(title);
    const del = el("button", "icon-btn");
    del.innerHTML = icon("trash");
    del.onclick = () => {
      scene2.layers.splice(l, 1);
      normalizeZ(s);
      S.selected = null;
      structuralEdit();
    };
    head.appendChild(del);
    p.appendChild(head);
    if (layer2.type === "overlay") {
      const note = el("div");
      note.style.cssText = "font-size:11px;color:var(--dim);margin-bottom:8px";
      note.textContent = "Adjustment layer \u2014 filters everything below it. Move it up/down to change which layers it affects.";
      p.appendChild(note);
    }
    const arrange = el("div", "arrange");
    [["arrTop", "To front", "top"], ["arrUp", "Forward", "up"], ["arrDown", "Backward", "down"], ["arrBot", "To back", "bottom"]].forEach(([ic, lbl, mode]) => {
      const bn = el("button");
      bn.innerHTML = icon(ic) + `<span>${lbl}</span>`;
      bn.onclick = () => arrangeLayer(mode);
      arrange.appendChild(bn);
    });
    p.appendChild(arrange);
    if (layer2.type === "text") {
      const f = el("div", "field");
      const lab = el("label");
      lab.textContent = "text";
      f.appendChild(lab);
      const ta = el("textarea");
      ta.value = layer2.text;
      ta.oninput = () => {
        layer2.text = ta.value;
        structuralEdit();
      };
      f.appendChild(ta);
      p.appendChild(f);
      layer2.style = layer2.style || {};
      p.appendChild(numField("font size", parseInt(layer2.style.fontSize || "72"), 12, 240, 1, (v) => {
        layer2.style.fontSize = Math.round(v) + "px";
        structuralEdit();
      }));
      const cf = el("div", "field");
      const cl = el("label");
      cl.textContent = "color";
      cf.appendChild(cl);
      const ci = el("input");
      ci.type = "text";
      ci.value = layer2.style.color || "#ffffff";
      ci.oninput = () => {
        layer2.style.color = ci.value;
        structuralEdit();
      };
      cf.appendChild(ci);
      p.appendChild(cf);
    }
    if (layer2.type === "image" || layer2.type === "video") {
      const cf = el("div", "field");
      const cl = el("label");
      cl.textContent = "fit";
      cf.appendChild(cl);
      const sel = el("select");
      ["cover", "contain"].forEach((o) => {
        const op = el("option");
        op.value = o;
        op.textContent = o;
        if ((layer2.fit ?? "cover") === o) op.selected = true;
        sel.appendChild(op);
      });
      sel.onchange = () => {
        layer2.fit = sel.value;
        structuralEdit();
      };
      cf.appendChild(sel);
      p.appendChild(cf);
    }
    if (layer2.type === "shape") {
      const cf = el("div", "field");
      const cl = el("label");
      cl.textContent = "fill color";
      cf.appendChild(cl);
      const ci = el("input");
      ci.type = "text";
      ci.value = layer2.fill || "#ffffff";
      ci.oninput = () => {
        layer2.fill = ci.value;
        structuralEdit();
      };
      cf.appendChild(ci);
      p.appendChild(cf);
    }
    if (layer2.type === "overlay") {
      const cf = el("div", "field");
      const cl = el("label");
      cl.textContent = "effect";
      cf.appendChild(cl);
      const ci = el("input");
      ci.type = "text";
      ci.value = String(layer2.effect).replace(/-/g, " ");
      ci.readOnly = true;
      cf.appendChild(ci);
      p.appendChild(cf);
      const spec = MAN.get("overlay." + layer2.effect)?.params?.amount;
      const min = spec?.min ?? 0, max = spec?.max ?? 1;
      layer2.params = layer2.params || {};
      p.appendChild(numField("amount", layer2.params.amount ?? (spec?.default ?? 1), min, max, (max - min) / 100 || 0.01, (v) => {
        layer2.params.amount = v;
        structuralEdit();
      }));
    }
    layer2.presets = layer2.presets || [];
    h("applied animations");
    if (!layer2.presets.length) {
      const e = el("div", "empty");
      e.style.cssText = "padding:8px 0;font-size:11px";
      e.textContent = "none yet";
      p.appendChild(e);
    }
    layer2.presets.forEach((inst, idx) => {
      const entry = MAN.get(inst.id);
      const card = el("div", "preset-card");
      const hd = el("div", "head");
      const b = el("b");
      b.textContent = inst.id;
      hd.appendChild(b);
      const rm = el("button", "icon-btn");
      rm.innerHTML = icon("trash");
      rm.onclick = () => {
        layer2.presets.splice(idx, 1);
        structuralEdit();
      };
      hd.appendChild(rm);
      card.appendChild(hd);
      if (entry) {
        inst.params = inst.params || {};
        for (const [pk, spec] of Object.entries(entry.params)) {
          const cur = inst.params[pk] ?? spec.default;
          const min = spec.min ?? 0, max = spec.max ?? (spec.default * 2 || 1);
          card.appendChild(numField(pk, cur, min, max, (max - min) / 100 || 0.01, (v) => {
            inst.params[pk] = v;
            liveEdit();
          }));
        }
      }
      p.appendChild(card);
    });
    const browse = el("button", "btn");
    browse.style.cssText = "width:100%;justify-content:center;margin-top:6px";
    browse.innerHTML = icon("spark") + "Browse animations";
    browse.onclick = () => setTab("anim");
    p.appendChild(browse);
    h("timing");
    p.appendChild(numField("start (s)", layer2.start ?? 0, 0, scene2.duration, 0.05, (v) => {
      layer2.start = v;
      timingEdit();
    }));
    p.appendChild(numField("duration (s)", layer2.duration ?? scene2.duration, 0.1, Math.max(scene2.duration, S.total), 0.05, (v) => {
      layer2.duration = v;
      timingEdit();
    }));
    h("transform  \xB7  \u25C6 = keyframe at playhead");
    layer2.transform = layer2.transform || {};
    const tf = layer2.transform;
    p.appendChild(kfField("x", "x", tf.x ?? 0, -800, 800, 1, (v) => {
      tf.x = v;
      liveEdit();
    }));
    p.appendChild(kfField("y", "y", tf.y ?? 0, -800, 800, 1, (v) => {
      tf.y = v;
      liveEdit();
    }));
    p.appendChild(kfField("scale (zoom)", "scale", tf.scale ?? 1, 0, 3, 0.01, (v) => {
      tf.scale = v;
      liveEdit();
    }));
    p.appendChild(kfField("rotate", "rotate", tf.rotate ?? 0, -180, 180, 1, (v) => {
      tf.rotate = v;
      liveEdit();
    }));
    p.appendChild(kfField("opacity", "opacity", tf.opacity ?? 1, 0, 1, 0.01, (v) => {
      tf.opacity = v;
      liveEdit();
    }));
    const tip = el("div");
    tip.style.cssText = "font-size:10px;color:var(--dim);margin-top:6px;line-height:1.5";
    tip.innerHTML = "drag on canvas to move \xB7 arrows nudge \xB7 <b>S</b> split \xB7 <b>\u2318D</b> duplicate \xB7 <b>Del</b> remove";
    p.appendChild(tip);
  }
  function buildLibrary() {
    const p = $("rightBody");
    p.innerHTML = "";
    const tabs = el("div", "cat-tabs");
    CATS.forEach((c) => {
      const t = el("div", "cat" + (S.cat === c.key ? " on" : ""));
      t.textContent = c.label;
      t.onclick = () => {
        S.cat = c.key;
        buildLibrary();
      };
      tabs.appendChild(t);
    });
    p.appendChild(tabs);
    const sel = S.selected ? S.ir.scenes[S.selected.s].layers[S.selected.l] : null;
    const note = el("div");
    note.style.cssText = "font-size:11px;color:var(--dim);margin-bottom:10px";
    if (S.cat === "transition") note.innerHTML = sel ? `applies to <b>Scene ${S.selected.s + 1}</b>` : "select a clip \u2014 transition applies to its scene";
    else note.innerHTML = sel ? `click to add to <b>${sel.type}</b> layer` : "\u26A0 select a clip first to apply";
    p.appendChild(note);
    const grid = el("div", "anim-grid");
    MANIFEST.filter((e) => e.category === S.cat).forEach((e) => {
      const card = el("div", "anim-card");
      const nm = el("div", "nm");
      nm.innerHTML = icon("spark") + e.id.split(".")[1].replace(/-/g, " ");
      card.appendChild(nm);
      card.onclick = () => applyFromLibrary(e);
      card.draggable = true;
      card.ondragstart = (ev) => {
        const t = e.category === "transition" ? "application/x-vgp-transition" : e.category === "overlay" ? "application/x-vgp-overlay" : "application/x-vgp-preset";
        ev.dataTransfer.setData(t, e.id);
      };
      grid.appendChild(card);
    });
    p.appendChild(grid);
  }
  function applyFromLibrary(entry) {
    if (entry.category === "transition") {
      const si = S.selected ? S.selected.s : sceneAt(S.playhead);
      if (si < 1) {
        showToast("Transitions apply between scenes \u2014 select scene 2 or later.");
        return;
      }
      S.ir.scenes[si].transitionIn = { id: entry.id };
      const tEntry = MAN.get(entry.id);
      const defDur = tEntry?.defaultDuration ?? 0.6;
      const prevDur = S.ir.scenes[si - 1]?.duration ?? defDur;
      const tdur = Math.min(defDur, prevDur);
      S.playhead = S.offsets[si] + tdur / 2;
      structuralEdit();
      return;
    }
    if (entry.category === "overlay") {
      addLayerAtPlayhead(overlayLayerFromId(entry.id));
      showToast("Overlay layer added: " + entry.id.split(".")[1].replace(/-/g, " "));
      return;
    }
    if (!S.selected) {
      showToast("Select a clip to apply the effect.");
      return;
    }
    const { s, l } = S.selected;
    const scene2 = S.ir.scenes[s];
    const target = scene2.layers[l];
    if (!presetAppliesTo(entry.id, target.type)) {
      showToast(target.type === "overlay" ? "effects can't target an overlay layer" : "this effect only works on text layers");
      return;
    }
    scene2.layers.splice(l + 1, 0, newFxLayer(target, scene2.duration, entry.id));
    normalizeZ(s);
    S.selected = { s, l: l + 1 };
    S.playhead = (S.offsets[s] ?? 0) + (target.start ?? 0) + 0.05;
    setTab("props");
    structuralEdit();
    positionPlayhead();
    showToast("Added " + entry.id.split(".")[1].replace(/-/g, " "));
  }
  function updateTime() {
    $("tpTime").textContent = fmtClockMs(S.playhead);
    $("tpTotal").textContent = " / " + fmtClockMs(effectiveTotal());
  }
  function setZoom(px, anchorClientX, persist = true) {
    const tl = $("tlScroll");
    const vrect = tl.getBoundingClientRect();
    const anchorView = anchorClientX != null ? anchorClientX - vrect.left : null;
    const curT = anchorView != null ? (anchorView + tl.scrollLeft - LABELW) / S.pxPerSec : 0;
    S.pxPerSec = Math.max(PX_MIN, Math.min(PX_MAX, px));
    buildTimeline();
    if (anchorView != null) tl.scrollLeft = LABELW + curT * S.pxPerSec - anchorView;
    if (persist) {
      try {
        localStorage.setItem("vgp.pxPerSec", String(S.pxPerSec));
      } catch {
      }
    }
  }
  function fitTimeline() {
    const w = $("tlScroll").clientWidth || 900;
    setZoom((w - LABELW - 40) / Math.max(1, effectiveTotal()));
    $("tlScroll").scrollLeft = 0;
  }
  function zoomBy(f) {
    const tl = $("tlScroll");
    const vr = tl.getBoundingClientRect();
    setZoom(S.pxPerSec * f, vr.left + vr.width / 2);
  }
  function seekTo(t) {
    S.playhead = Math.max(0, Math.min(effectiveTotal(), t));
    liveSeek();
    positionPlayhead();
    updateTime();
  }
  function setPlayIcon() {
    $("tpPlay").innerHTML = icon(S.playing ? "pause" : "play");
  }
  function togglePlay() {
    S.playing = !S.playing;
    setPlayIcon();
    last = performance.now();
    VGP.seek(S.playhead, { playing: S.playing });
  }
  var last = performance.now();
  function loop(now) {
    if (S.playing) {
      const tot = effectiveTotal();
      S.playhead += (now - last) / 1e3;
      if (S.playhead >= tot) {
        if (S.loop) S.playhead = 0;
        else {
          S.playhead = tot;
          togglePlay();
        }
      }
      VGP.seek(S.playhead, { playing: true });
      positionPlayhead();
      updateTime();
    }
    last = now;
    requestAnimationFrame(loop);
  }
  function autoFit() {
    let stored = NaN;
    try {
      stored = parseFloat(localStorage.getItem("vgp.pxPerSec") || "");
    } catch {
    }
    const w = $("tlScroll").clientWidth || 900;
    const px = isFinite(stored) && stored > 0 ? stored : (w - LABELW - 40) / Math.max(1, effectiveTotal());
    S.pxPerSec = Math.max(PX_MIN, Math.min(PX_MAX, px));
  }
  function buildFileMenu() {
    const m = $("fileMenu");
    m.innerHTML = "";
    const item = (ic, label, key, fn) => {
      const b = el("button", "menu-item");
      b.innerHTML = icon(ic) + `<span>${label}</span>` + (key ? `<span class="k">${key}</span>` : "");
      b.onclick = () => {
        closeMenu();
        fn();
      };
      m.appendChild(b);
    };
    item("file", "New", "", () => {
      setDoc({ fps: 30, width: 1920, height: 1080, scenes: [{ id: "scene-1", duration: 5, background: "#0a0a0a", layers: [] }] });
      scheduleSave();
    });
    item("folder", "Open\u2026", "", openProjects);
    m.appendChild(el("div", "menu-sep"));
    item("save", "Save project (.json)", "\u2318S", saveJson);
    item("download", "Export MP4", "", runExport);
  }
  var menuOpen = false;
  function closeMenu() {
    menuOpen = false;
    $("fileMenu").classList.remove("open");
  }
  function saveJson() {
    const blob = new Blob([JSON.stringify(S.ir, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "composition.json";
    a.click();
  }
  async function openProjects() {
    const list = await (await fetch("/api/projects")).json();
    const pl = $("projList");
    pl.innerHTML = "";
    list.forEach((pr) => {
      const d = el("div", "proj" + (pr.active ? " active" : ""));
      d.innerHTML = icon("file") + pr.name;
      d.onclick = async () => {
        const r = await (await fetch("/api/open", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: pr.path }) })).json();
        if (r.ok) {
          S.assetBase = r.assetBase;
          setDoc(r.ir);
          $("openModal").classList.remove("show");
        }
      };
      pl.appendChild(d);
    });
    $("openModal").classList.add("show");
  }
  function showRender(show) {
    $("renderBar").classList.toggle("show", show);
  }
  async function runExport() {
    showRender(true);
    $("renderFill").style.width = "0%";
    $("renderPct").textContent = "0%";
    $("renderLabel").textContent = "Starting render\u2026";
    clearTimeout(saveTimer);
    const body = JSON.stringify(S.ir);
    S.lastSyncJson = body;
    try {
      await fetch("/api/composition", { method: "POST", headers: { "content-type": "application/json" }, body });
    } catch {
    }
    fetch("/api/render", { method: "POST" }).catch(() => {
    });
  }
  async function init() {
    $("fileIcon").innerHTML = icon("file");
    $("expIcon").innerHTML = icon("download");
    $("i-text").innerHTML = icon("text");
    $("i-shape").innerHTML = icon("shape");
    $("i-3d").innerHTML = icon("cube");
    $("i-up").innerHTML = icon("upload");
    $("i-props").innerHTML = icon("sliders");
    $("i-anim").innerHTML = icon("spark");
    $("i-line").innerHTML = icon("line");
    $("i-undo").innerHTML = icon("undo");
    $("i-redo").innerHTML = icon("redo");
    $("i-split").innerHTML = icon("split");
    $("i-dup").innerHTML = icon("copy");
    $("i-del").innerHTML = icon("trash");
    $("i-fit").innerHTML = icon("fit");
    $("tpStart").innerHTML = icon("start");
    $("tpBack").innerHTML = icon("back");
    $("tpFwd").innerHTML = icon("fwd");
    $("tpLoop").innerHTML = icon("loop");
    setPlayIcon();
    buildFileMenu();
    const data = await (await fetch("/api/composition")).json();
    S.ir = data.ir;
    S.assetBase = data.assetBase;
    S.lastSyncJson = JSON.stringify(S.ir);
    S.history = [S.lastSyncJson];
    S.histIndex = 0;
    captureSceneBase();
    S.ir.scenes.forEach((_, i) => normalizeZ(i));
    derive();
    autoFit();
    mountPreview();
    await VGP.ready();
    buildTimeline();
    renderRight();
    updateTime();
    await loadAssets();
    window.__vgpAudioReady = () => buildTimeline();
    requestAnimationFrame((t) => {
      last = t;
      loop(t);
    });
    $("tpPlay").onclick = togglePlay;
    $("tpStart").onclick = () => seekTo(0);
    $("tpBack").onclick = () => seekTo(S.playhead - 1);
    $("tpFwd").onclick = () => seekTo(S.playhead + 1);
    $("tpLoop").onclick = () => {
      S.loop = !S.loop;
      $("tpLoop").classList.toggle("on", S.loop);
      $("tpLoop").style.opacity = S.loop ? "1" : ".5";
    };
    $("tabProps").onclick = () => setTab("props");
    $("tabAnim").onclick = () => setTab("anim");
    $("undoBtn").onclick = undo;
    $("redoBtn").onclick = redo;
    $("btnSplit").onclick = splitSelected;
    $("btnDup").onclick = duplicateSelected;
    $("btnFit").onclick = fitTimeline;
    $("btnZoomIn").onclick = () => zoomBy(1.3);
    $("btnZoomOut").onclick = () => zoomBy(1 / 1.3);
    $("i-text").style.color = "var(--t-text)";
    $("i-shape").style.color = "var(--t-shape)";
    $("i-line").style.color = "var(--t-video)";
    $("i-3d").style.color = "var(--t-three)";
    $("i-full").innerHTML = icon("full");
    $("btnFull").onclick = () => {
      const w = document.querySelector(".stagewrap");
      if (!document.fullscreenElement) w.requestFullscreen?.();
      else document.exitFullscreen?.();
    };
    document.addEventListener("fullscreenchange", () => setTimeout(fit, 80));
    $("i-comp").innerHTML = icon("layers");
    $("i-assets").innerHTML = icon("grid");
    $("i-code").innerHTML = icon("code");
    $("viewComp").onclick = () => openProj("comp");
    $("viewAssets").onclick = () => openProj("assets");
    $("viewCode").onclick = () => openProj("code");
    $("projClose").onclick = closeProj;
    document.querySelectorAll(".proj-tab").forEach((t) => {
      t.onclick = () => {
        projTab = t.getAttribute("data-v") || "comp";
        renderProj();
      };
    });
    $("projModal").addEventListener("mousedown", (e) => {
      if (e.target === $("projModal")) closeProj();
    });
    $("btnDel").onclick = () => {
      if (S.selected) {
        const { s, l } = S.selected;
        S.ir.scenes[s].layers.splice(l, 1);
        normalizeZ(s);
        S.selected = null;
        structuralEdit();
      }
    };
    initSelHandles();
    $("fileBtn").onclick = (e) => {
      e.stopPropagation();
      menuOpen = !menuOpen;
      $("fileMenu").classList.toggle("open", menuOpen);
    };
    document.addEventListener("click", closeMenu);
    $("export").onclick = runExport;
    $("openClose").onclick = () => $("openModal").classList.remove("show");
    $("importBtn").onclick = () => {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = ".json";
      inp.onchange = () => {
        const f = inp.files?.[0];
        if (!f) return;
        const rd = new FileReader();
        rd.onload = () => {
          try {
            setDoc(JSON.parse(String(rd.result)));
            scheduleSave();
            $("openModal").classList.remove("show");
          } catch {
          }
        };
        rd.readAsText(f);
      };
      inp.click();
    };
    $("addText").onclick = () => addLayerAtPlayhead(newText());
    $("addShape").onclick = () => addLayerAtPlayhead(newShape());
    $("addLine").onclick = () => addLayerAtPlayhead(newLine());
    $("add3D").onclick = () => addLayerAtPlayhead(new3D());
    const fi = $("fileInput");
    $("drop").onclick = () => fi.click();
    fi.onchange = () => fi.files && uploadFiles(fi.files);
    const drop = $("drop");
    drop.ondragover = (e) => {
      e.preventDefault();
      drop.classList.add("over");
    };
    drop.ondragleave = () => drop.classList.remove("over");
    drop.ondrop = (e) => {
      e.preventDefault();
      drop.classList.remove("over");
      if (e.dataTransfer?.files.length) uploadFiles(e.dataTransfer.files);
    };
    const tl = $("tlScroll");
    tl.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      const t = e.target;
      if (t.closest(".clip") || t.closest(".track-label") || t.closest(".scene-tag") || t.closest(".sh") || t.closest(".seam") || t.closest(".kf-marker")) return;
      e.preventDefault();
      const rectLeft = $("tlInner").getBoundingClientRect().left;
      const seekFrom = (ev) => seekTo(timeAtClientX(ev.clientX, rectLeft));
      seekFrom(e);
      const mv = (ev) => seekFrom(ev);
      const up = () => {
        window.removeEventListener("mousemove", mv);
        window.removeEventListener("mouseup", up);
      };
      window.addEventListener("mousemove", mv);
      window.addEventListener("mouseup", up);
    });
    tl.addEventListener("dragover", (e) => {
      e.preventDefault();
      tl.classList.add("over");
    });
    tl.addEventListener("dragleave", () => tl.classList.remove("over"));
    tl.addEventListener("drop", async (e) => {
      e.preventDefault();
      tl.classList.remove("over");
      const ov = e.dataTransfer?.getData("application/x-vgp-overlay");
      if (ov) {
        dropLayerAt(e.clientX, overlayLayerFromId(ov));
        showToast("Overlay layer added: " + ov.split(".")[1].replace(/-/g, " "));
        return;
      }
      const d = e.dataTransfer?.getData("application/x-vgp-asset");
      if (d) {
        const a = JSON.parse(d);
        if (a.type === "audio") {
          addAudioTrack(a.src, e.clientX);
          return;
        }
        dropLayerAt(e.clientX, newAssetLayer(a));
        return;
      }
      if (e.dataTransfer?.files.length) {
        const files = Array.from(e.dataTransfer.files);
        const audioFile = files.find((f) => f.type.startsWith("audio"));
        if (audioFile) {
          const up = await uploadOne(audioFile, "audio");
          if (up?.src) addAudioTrack(up.src, e.clientX);
          return;
        }
        const before = S.assets.length;
        await uploadFiles(files);
        if (S.assets.length > before) dropLayerAt(e.clientX, newAssetLayer(S.assets[0]));
      }
    });
    tl.addEventListener("wheel", (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      setZoom(S.pxPerSec * (e.deltaY < 0 ? 1.12 : 0.89), e.clientX);
    }, { passive: false });
    const stage = $("stage");
    stage.style.cursor = "move";
    stage.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      const rect2 = stage.getBoundingClientRect();
      const sc = S.scale || 1;
      const cx = (e.clientX - rect2.left) / sc, cy = (e.clientY - rect2.top) / sc;
      const si = sceneAt(S.playhead);
      const scene2 = S.ir.scenes[si];
      if (!scene2) return;
      const localT = S.playhead - S.offsets[si];
      let hit = -1;
      for (let li = scene2.layers.length - 1; li >= 0; li--) {
        const L = scene2.layers[li];
        const st = L.start ?? 0, du = L.duration ?? scene2.duration;
        if (L.type === "overlay" || L.type === "fx") continue;
        if (localT < st - 0.01 || localT > st + du + 0.01) continue;
        const r = L.rect ?? { x: 0, y: 0, w: S.ir.width, h: S.ir.height };
        const d = renderedDelta(L, si);
        const scl = d.scale;
        const ccx = r.x + r.w / 2 + d.x;
        const ccy = r.y + r.h / 2 + d.y;
        const rot = -d.rotate * Math.PI / 180;
        const dxp = cx - ccx, dyp = cy - ccy;
        const lx = dxp * Math.cos(rot) - dyp * Math.sin(rot), ly = dxp * Math.sin(rot) + dyp * Math.cos(rot);
        const hw = r.w * scl / 2, hh = r.h * scl / 2;
        if (Math.abs(lx) <= hw && Math.abs(ly) <= hh) {
          hit = li;
          break;
        }
      }
      if (hit < 0) return;
      e.preventDefault();
      if (!S.selected || S.selected.s !== si || S.selected.l !== hit) select(si, hit);
      const layer2 = scene2.layers[hit];
      layer2.transform = layer2.transform || {};
      const xKeyed = isKeyframed(layer2, "x"), yKeyed = isKeyframed(layer2, "y");
      const baseX = xKeyed ? tfAt(layer2, si, "x", 0) : layer2.transform.x ?? 0;
      const baseY = yKeyed ? tfAt(layer2, si, "y", 0) : layer2.transform.y ?? 0;
      const sx = e.clientX, sy = e.clientY;
      let moved = false;
      const mv = (ev) => {
        if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 2) moved = true;
        const nx = Math.round(baseX + (ev.clientX - sx) / sc), ny = Math.round(baseY + (ev.clientY - sy) / sc);
        if (xKeyed) setKeyframeAtPlayhead("x", nx);
        else layer2.transform.x = nx;
        if (yKeyed) setKeyframeAtPlayhead("y", ny);
        else layer2.transform.y = ny;
        liveSeek();
        updateSelBox();
      };
      const up = () => {
        window.removeEventListener("mousemove", mv);
        window.removeEventListener("mouseup", up);
        if (moved) {
          if (xKeyed || yKeyed) buildTimeline();
          scheduleSave();
          buildProps();
        }
      };
      window.addEventListener("mousemove", mv);
      window.addEventListener("mouseup", up);
    });
    window.addEventListener("keydown", (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const meta = e.metaKey || e.ctrlKey;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
        return;
      }
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (meta && (e.key.toLowerCase() === "y" || e.key.toLowerCase() === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
        return;
      }
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveJson();
        return;
      }
      if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }
      if (meta && e.key.toLowerCase() === "b") {
        e.preventDefault();
        splitSelected();
        return;
      }
      if (meta && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomBy(1.3);
        return;
      }
      if (meta && e.key === "-") {
        e.preventDefault();
        zoomBy(1 / 1.3);
        return;
      }
      if (meta && e.key === "0") {
        e.preventDefault();
        fitTimeline();
        return;
      }
      if (!meta && e.shiftKey && (e.key === "F" || e.key === "f")) {
        e.preventDefault();
        fitTimeline();
        return;
      }
      if (!meta && (e.key === "s" || e.key === "S")) {
        splitSelected();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && S.selAudio != null) {
        S.ir.audio.splice(S.selAudio, 1);
        S.selAudio = null;
        structuralEdit();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && S.selected) {
        const { s, l } = S.selected;
        S.ir.scenes[s].layers.splice(l, 1);
        normalizeZ(s);
        S.selected = null;
        structuralEdit();
        return;
      }
      if (S.selected && e.key.startsWith("Arrow")) {
        e.preventDefault();
        const { s, l } = S.selected;
        const layer2 = S.ir.scenes[s].layers[l];
        layer2.transform = layer2.transform || {};
        const step = e.shiftKey ? 1 : 10;
        const xKeyed = isKeyframed(layer2, "x"), yKeyed = isKeyframed(layer2, "y");
        const nx = (xKeyed ? tfAt(layer2, s, "x", 0) : layer2.transform.x ?? 0) + (e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0);
        const ny = (yKeyed ? tfAt(layer2, s, "y", 0) : layer2.transform.y ?? 0) + (e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0);
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          if (xKeyed) setKeyframeAtPlayhead("x", nx);
          else layer2.transform.x = nx;
        }
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          if (yKeyed) setKeyframeAtPlayhead("y", ny);
          else layer2.transform.y = ny;
        }
        liveSeek();
        scheduleSave();
        buildTimeline();
        buildProps();
      }
    });
    let resizeT;
    window.addEventListener("resize", () => {
      fit();
      clearTimeout(resizeT);
      resizeT = setTimeout(() => buildTimeline(), 120);
    });
    const kick = () => {
      if (S.playing) VGP.seek(S.playhead, { playing: true });
      window.removeEventListener("pointerdown", kick);
    };
    window.addEventListener("pointerdown", kick);
    const es = new EventSource("/api/events");
    es.onmessage = (ev) => {
      let m;
      try {
        m = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (m.t === "doc") {
        const j = JSON.stringify(m.ir);
        if (j === S.lastSyncJson) return;
        clearTimeout(saveTimer);
        S.ir = m.ir;
        S.lastSyncJson = j;
        pushHistory(j);
        captureSceneBase();
        S.ir.scenes.forEach((_, i) => normalizeZ(i));
        derive();
        mountPreview();
        buildTimeline();
        renderRight();
        setDot("edited", "agent edit \u2726");
        setTimeout(() => setDot("saved", "synced"), 1400);
      }
      if (m.t === "render") {
        showRender(true);
        if (m.state === "rendering") {
          $("renderFill").style.width = m.pct + "%";
          $("renderPct").textContent = m.pct + "%";
          $("renderLabel").textContent = `Rendering frame ${m.done}/${m.total}`;
        } else if (m.state === "done") {
          $("renderFill").style.width = "100%";
          $("renderPct").textContent = "100%";
          $("renderLabel").textContent = "\u2713 Export complete";
          setTimeout(() => {
            showRender(false);
            if (m.url) window.open(m.url, "_blank");
          }, 1e3);
        } else if (m.state === "error") {
          $("renderLabel").textContent = "\u2715 Render failed";
          setTimeout(() => showRender(false), 3e3);
        }
      }
    };
  }
  init();
})();
