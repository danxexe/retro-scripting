(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const { JSONRPCClient } = require('json-rpc-2.0')


const client = new JSONRPCClient((jsonRPCRequest) =>
  fetch("http://localhost:3030", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(jsonRPCRequest),
  }).then((response) => {
    if (response.status === 200) {
      // Use client.receive when you received a JSON-RPC response.
      return response
        .json()
        .then((jsonRPCResponse) => client.receive(jsonRPCResponse));
    } else if (jsonRPCRequest.id !== undefined) {
      return Promise.reject(new Error(response.statusText));
    }
  })
);

async function update () {
  const response = await client.request("read_memory", {
    u8: {
      happiness: 0x13848A,
      discipline: 0x138488,
    },
    u16le: {
      digimon: 0x1557b0,
      off: 0x1557e0,
      def: 0x1557e2,
      speed: 0x1557e4,
      brains: 0x1557e6,
      hp: 0x1557f0,
      mp: 0x1557f2,
    }
  });

  console.log(response);

  const stats = {...response["u8"], ...response["u16le"]}

  for (const property in stats) {
    const element = document.getElementById(property)

    if (element) {
      const old = element.innerText
      element.innerText = stats[property];
  
      if (old != element.innerText) {
        element.classList.add("flash-once");
        element.addEventListener("animationend", function() {
          element.classList.remove("flash-once");
        }, { once: true });
      }  
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

let run = true;

async function loop() {
  while (run) {
    try {
      await update();
    } catch (e) {
      run = false
    }
    
    await sleep(1000);
  }
}

loop()

},{"json-rpc-2.0":3}],2:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONRPCClient = void 0;
var models_1 = require("./models");
var internal_1 = require("./internal");
var JSONRPCClient = /** @class */ (function () {
    function JSONRPCClient(_send, createID) {
        this._send = _send;
        this.createID = createID;
        this.idToResolveMap = new Map();
        this.id = 0;
    }
    JSONRPCClient.prototype._createID = function () {
        if (this.createID) {
            return this.createID();
        }
        else {
            return ++this.id;
        }
    };
    JSONRPCClient.prototype.timeout = function (delay, overrideCreateJSONRPCErrorResponse) {
        var _this = this;
        if (overrideCreateJSONRPCErrorResponse === void 0) { overrideCreateJSONRPCErrorResponse = function (id) {
            return (0, models_1.createJSONRPCErrorResponse)(id, internal_1.DefaultErrorCode, "Request timeout");
        }; }
        var timeoutRequest = function (ids, request) {
            var timeoutID = setTimeout(function () {
                ids.forEach(function (id) {
                    var resolve = _this.idToResolveMap.get(id);
                    if (resolve) {
                        _this.idToResolveMap.delete(id);
                        resolve(overrideCreateJSONRPCErrorResponse(id));
                    }
                });
            }, delay);
            return request().then(function (result) {
                clearTimeout(timeoutID);
                return result;
            }, function (error) {
                clearTimeout(timeoutID);
                return Promise.reject(error);
            });
        };
        var requestAdvanced = function (request, clientParams) {
            var ids = (!Array.isArray(request) ? [request] : request)
                .map(function (request) { return request.id; })
                .filter(isDefinedAndNonNull);
            return timeoutRequest(ids, function () {
                return _this.requestAdvanced(request, clientParams);
            });
        };
        return {
            request: function (method, params, clientParams) {
                var id = _this._createID();
                return timeoutRequest([id], function () {
                    return _this.requestWithID(method, params, clientParams, id);
                });
            },
            requestAdvanced: function (request, clientParams) { return requestAdvanced(request, clientParams); },
        };
    };
    JSONRPCClient.prototype.request = function (method, params, clientParams) {
        return this.requestWithID(method, params, clientParams, this._createID());
    };
    JSONRPCClient.prototype.requestWithID = function (method, params, clientParams, id) {
        return __awaiter(this, void 0, void 0, function () {
            var request, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = (0, models_1.createJSONRPCRequest)(id, method, params);
                        return [4 /*yield*/, this.requestAdvanced(request, clientParams)];
                    case 1:
                        response = _a.sent();
                        if (response.result !== undefined && !response.error) {
                            return [2 /*return*/, response.result];
                        }
                        else if (response.result === undefined && response.error) {
                            return [2 /*return*/, Promise.reject(new models_1.JSONRPCErrorException(response.error.message, response.error.code, response.error.data))];
                        }
                        else {
                            return [2 /*return*/, Promise.reject(new Error("An unexpected error occurred"))];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    JSONRPCClient.prototype.requestAdvanced = function (requests, clientParams) {
        var _this = this;
        var areRequestsOriginallyArray = Array.isArray(requests);
        if (!Array.isArray(requests)) {
            requests = [requests];
        }
        var requestsWithID = requests.filter(function (request) {
            return isDefinedAndNonNull(request.id);
        });
        var promises = requestsWithID.map(function (request) {
            return new Promise(function (resolve) { return _this.idToResolveMap.set(request.id, resolve); });
        });
        var promise = Promise.all(promises).then(function (responses) {
            if (areRequestsOriginallyArray || !responses.length) {
                return responses;
            }
            else {
                return responses[0];
            }
        });
        return this.send(areRequestsOriginallyArray ? requests : requests[0], clientParams).then(function () { return promise; }, function (error) {
            requestsWithID.forEach(function (request) {
                _this.receive((0, models_1.createJSONRPCErrorResponse)(request.id, internal_1.DefaultErrorCode, (error && error.message) || "Failed to send a request"));
            });
            return promise;
        });
    };
    JSONRPCClient.prototype.notify = function (method, params, clientParams) {
        var request = (0, models_1.createJSONRPCNotification)(method, params);
        this.send(request, clientParams).then(undefined, function () { return undefined; });
    };
    JSONRPCClient.prototype.send = function (payload, clientParams) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._send(payload, clientParams)];
            });
        });
    };
    JSONRPCClient.prototype.rejectAllPendingRequests = function (message) {
        this.idToResolveMap.forEach(function (resolve, id) {
            return resolve((0, models_1.createJSONRPCErrorResponse)(id, internal_1.DefaultErrorCode, message));
        });
        this.idToResolveMap.clear();
    };
    JSONRPCClient.prototype.receive = function (responses) {
        var _this = this;
        if (!Array.isArray(responses)) {
            responses = [responses];
        }
        responses.forEach(function (response) {
            var resolve = _this.idToResolveMap.get(response.id);
            if (resolve) {
                _this.idToResolveMap.delete(response.id);
                resolve(response);
            }
        });
    };
    return JSONRPCClient;
}());
exports.JSONRPCClient = JSONRPCClient;
var isDefinedAndNonNull = function (value) {
    return value !== undefined && value !== null;
};

},{"./internal":5,"./models":6}],3:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./client"), exports);
__exportStar(require("./interfaces"), exports);
__exportStar(require("./models"), exports);
__exportStar(require("./server"), exports);
__exportStar(require("./server-and-client"), exports);

},{"./client":2,"./interfaces":4,"./models":6,"./server":8,"./server-and-client":7}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultErrorCode = void 0;
exports.DefaultErrorCode = 0;

},{}],6:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJSONRPCNotification = exports.createJSONRPCRequest = exports.createJSONRPCSuccessResponse = exports.createJSONRPCErrorResponse = exports.JSONRPCErrorCode = exports.JSONRPCErrorException = exports.isJSONRPCResponses = exports.isJSONRPCResponse = exports.isJSONRPCRequests = exports.isJSONRPCRequest = exports.isJSONRPCID = exports.JSONRPC = void 0;
exports.JSONRPC = "2.0";
var isJSONRPCID = function (id) {
    return typeof id === "string" || typeof id === "number" || id === null;
};
exports.isJSONRPCID = isJSONRPCID;
var isJSONRPCRequest = function (payload) {
    return (payload.jsonrpc === exports.JSONRPC &&
        payload.method !== undefined &&
        payload.result === undefined &&
        payload.error === undefined);
};
exports.isJSONRPCRequest = isJSONRPCRequest;
var isJSONRPCRequests = function (payload) {
    return Array.isArray(payload) && payload.every(exports.isJSONRPCRequest);
};
exports.isJSONRPCRequests = isJSONRPCRequests;
var isJSONRPCResponse = function (payload) {
    return (payload.jsonrpc === exports.JSONRPC &&
        payload.id !== undefined &&
        (payload.result !== undefined || payload.error !== undefined));
};
exports.isJSONRPCResponse = isJSONRPCResponse;
var isJSONRPCResponses = function (payload) {
    return Array.isArray(payload) && payload.every(exports.isJSONRPCResponse);
};
exports.isJSONRPCResponses = isJSONRPCResponses;
var createJSONRPCError = function (code, message, data) {
    var error = { code: code, message: message };
    if (data != null) {
        error.data = data;
    }
    return error;
};
var JSONRPCErrorException = /** @class */ (function (_super) {
    __extends(JSONRPCErrorException, _super);
    function JSONRPCErrorException(message, code, data) {
        var _this = _super.call(this, message) || this;
        // Manually set the prototype to fix TypeScript issue:
        // https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(_this, JSONRPCErrorException.prototype);
        _this.code = code;
        _this.data = data;
        return _this;
    }
    JSONRPCErrorException.prototype.toObject = function () {
        return createJSONRPCError(this.code, this.message, this.data);
    };
    return JSONRPCErrorException;
}(Error));
exports.JSONRPCErrorException = JSONRPCErrorException;
var JSONRPCErrorCode;
(function (JSONRPCErrorCode) {
    JSONRPCErrorCode[JSONRPCErrorCode["ParseError"] = -32700] = "ParseError";
    JSONRPCErrorCode[JSONRPCErrorCode["InvalidRequest"] = -32600] = "InvalidRequest";
    JSONRPCErrorCode[JSONRPCErrorCode["MethodNotFound"] = -32601] = "MethodNotFound";
    JSONRPCErrorCode[JSONRPCErrorCode["InvalidParams"] = -32602] = "InvalidParams";
    JSONRPCErrorCode[JSONRPCErrorCode["InternalError"] = -32603] = "InternalError";
})(JSONRPCErrorCode = exports.JSONRPCErrorCode || (exports.JSONRPCErrorCode = {}));
var createJSONRPCErrorResponse = function (id, code, message, data) {
    return {
        jsonrpc: exports.JSONRPC,
        id: id,
        error: createJSONRPCError(code, message, data),
    };
};
exports.createJSONRPCErrorResponse = createJSONRPCErrorResponse;
var createJSONRPCSuccessResponse = function (id, result) {
    return {
        jsonrpc: exports.JSONRPC,
        id: id,
        result: result !== null && result !== void 0 ? result : null,
    };
};
exports.createJSONRPCSuccessResponse = createJSONRPCSuccessResponse;
var createJSONRPCRequest = function (id, method, params) {
    return {
        jsonrpc: exports.JSONRPC,
        id: id,
        method: method,
        params: params,
    };
};
exports.createJSONRPCRequest = createJSONRPCRequest;
var createJSONRPCNotification = function (method, params) {
    return {
        jsonrpc: exports.JSONRPC,
        method: method,
        params: params,
    };
};
exports.createJSONRPCNotification = createJSONRPCNotification;

},{}],7:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONRPCServerAndClient = void 0;
var models_1 = require("./models");
var JSONRPCServerAndClient = /** @class */ (function () {
    function JSONRPCServerAndClient(server, client, options) {
        if (options === void 0) { options = {}; }
        var _a;
        this.server = server;
        this.client = client;
        this.errorListener = (_a = options.errorListener) !== null && _a !== void 0 ? _a : console.warn;
    }
    JSONRPCServerAndClient.prototype.applyServerMiddleware = function () {
        var _a;
        var middlewares = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            middlewares[_i] = arguments[_i];
        }
        (_a = this.server).applyMiddleware.apply(_a, middlewares);
    };
    JSONRPCServerAndClient.prototype.hasMethod = function (name) {
        return this.server.hasMethod(name);
    };
    JSONRPCServerAndClient.prototype.addMethod = function (name, method) {
        this.server.addMethod(name, method);
    };
    JSONRPCServerAndClient.prototype.addMethodAdvanced = function (name, method) {
        this.server.addMethodAdvanced(name, method);
    };
    JSONRPCServerAndClient.prototype.removeMethod = function (name) {
        this.server.removeMethod(name);
    };
    JSONRPCServerAndClient.prototype.timeout = function (delay) {
        return this.client.timeout(delay);
    };
    JSONRPCServerAndClient.prototype.request = function (method, params, clientParams) {
        return this.client.request(method, params, clientParams);
    };
    JSONRPCServerAndClient.prototype.requestAdvanced = function (jsonRPCRequest, clientParams) {
        return this.client.requestAdvanced(jsonRPCRequest, clientParams);
    };
    JSONRPCServerAndClient.prototype.notify = function (method, params, clientParams) {
        this.client.notify(method, params, clientParams);
    };
    JSONRPCServerAndClient.prototype.rejectAllPendingRequests = function (message) {
        this.client.rejectAllPendingRequests(message);
    };
    JSONRPCServerAndClient.prototype.receiveAndSend = function (payload, serverParams, clientParams) {
        return __awaiter(this, void 0, void 0, function () {
            var response, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!((0, models_1.isJSONRPCResponse)(payload) || (0, models_1.isJSONRPCResponses)(payload))) return [3 /*break*/, 1];
                        this.client.receive(payload);
                        return [3 /*break*/, 4];
                    case 1:
                        if (!((0, models_1.isJSONRPCRequest)(payload) || (0, models_1.isJSONRPCRequests)(payload))) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.server.receive(payload, serverParams)];
                    case 2:
                        response = _a.sent();
                        if (response) {
                            return [2 /*return*/, this.client.send(response, clientParams)];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        message = "Received an invalid JSON-RPC message";
                        this.errorListener(message, payload);
                        return [2 /*return*/, Promise.reject(new Error(message))];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return JSONRPCServerAndClient;
}());
exports.JSONRPCServerAndClient = JSONRPCServerAndClient;

},{"./models":6}],8:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONRPCServer = void 0;
var models_1 = require("./models");
var internal_1 = require("./internal");
var createParseErrorResponse = function () {
    return (0, models_1.createJSONRPCErrorResponse)(null, models_1.JSONRPCErrorCode.ParseError, "Parse error");
};
var createInvalidRequestResponse = function (request) {
    return (0, models_1.createJSONRPCErrorResponse)((0, models_1.isJSONRPCID)(request.id) ? request.id : null, models_1.JSONRPCErrorCode.InvalidRequest, "Invalid Request");
};
var createMethodNotFoundResponse = function (id) {
    return (0, models_1.createJSONRPCErrorResponse)(id, models_1.JSONRPCErrorCode.MethodNotFound, "Method not found");
};
var JSONRPCServer = /** @class */ (function () {
    function JSONRPCServer(options) {
        if (options === void 0) { options = {}; }
        var _a;
        this.mapErrorToJSONRPCErrorResponse = defaultMapErrorToJSONRPCErrorResponse;
        this.nameToMethodDictionary = {};
        this.middleware = null;
        this.errorListener = (_a = options.errorListener) !== null && _a !== void 0 ? _a : console.warn;
    }
    JSONRPCServer.prototype.hasMethod = function (name) {
        return !!this.nameToMethodDictionary[name];
    };
    JSONRPCServer.prototype.addMethod = function (name, method) {
        this.addMethodAdvanced(name, this.toJSONRPCMethod(method));
    };
    JSONRPCServer.prototype.removeMethod = function (name) {
        delete this.nameToMethodDictionary[name];
    };
    JSONRPCServer.prototype.toJSONRPCMethod = function (method) {
        return function (request, serverParams) {
            var response = method(request.params, serverParams);
            return Promise.resolve(response).then(function (result) {
                return mapResultToJSONRPCResponse(request.id, result);
            });
        };
    };
    JSONRPCServer.prototype.addMethodAdvanced = function (name, method) {
        var _a;
        this.nameToMethodDictionary = __assign(__assign({}, this.nameToMethodDictionary), (_a = {}, _a[name] = method, _a));
    };
    JSONRPCServer.prototype.receiveJSON = function (json, serverParams) {
        var request = this.tryParseRequestJSON(json);
        if (request) {
            return this.receive(request, serverParams);
        }
        else {
            return Promise.resolve(createParseErrorResponse());
        }
    };
    JSONRPCServer.prototype.tryParseRequestJSON = function (json) {
        try {
            return JSON.parse(json);
        }
        catch (_a) {
            return null;
        }
    };
    JSONRPCServer.prototype.receive = function (request, serverParams) {
        if (Array.isArray(request)) {
            return this.receiveMultiple(request, serverParams);
        }
        else {
            return this.receiveSingle(request, serverParams);
        }
    };
    JSONRPCServer.prototype.receiveMultiple = function (requests, serverParams) {
        return __awaiter(this, void 0, void 0, function () {
            var responses;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(requests.map(function (request) { return _this.receiveSingle(request, serverParams); }))];
                    case 1:
                        responses = (_a.sent()).filter(isNonNull);
                        if (responses.length === 1) {
                            return [2 /*return*/, responses[0]];
                        }
                        else if (responses.length) {
                            return [2 /*return*/, responses];
                        }
                        else {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    JSONRPCServer.prototype.receiveSingle = function (request, serverParams) {
        return __awaiter(this, void 0, void 0, function () {
            var method, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        method = this.nameToMethodDictionary[request.method];
                        if (!!(0, models_1.isJSONRPCRequest)(request)) return [3 /*break*/, 1];
                        return [2 /*return*/, createInvalidRequestResponse(request)];
                    case 1: return [4 /*yield*/, this.callMethod(method, request, serverParams)];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, mapResponse(request, response)];
                }
            });
        });
    };
    JSONRPCServer.prototype.applyMiddleware = function () {
        var middlewares = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            middlewares[_i] = arguments[_i];
        }
        if (this.middleware) {
            this.middleware = this.combineMiddlewares(__spreadArray([
                this.middleware
            ], middlewares, true));
        }
        else {
            this.middleware = this.combineMiddlewares(middlewares);
        }
    };
    JSONRPCServer.prototype.combineMiddlewares = function (middlewares) {
        if (!middlewares.length) {
            return null;
        }
        else {
            return middlewares.reduce(this.middlewareReducer);
        }
    };
    JSONRPCServer.prototype.middlewareReducer = function (prevMiddleware, nextMiddleware) {
        return function (next, request, serverParams) {
            return prevMiddleware(function (request, serverParams) { return nextMiddleware(next, request, serverParams); }, request, serverParams);
        };
    };
    JSONRPCServer.prototype.callMethod = function (method, request, serverParams) {
        var _this = this;
        var callMethod = function (request, serverParams) {
            if (method) {
                return method(request, serverParams);
            }
            else if (request.id !== undefined) {
                return Promise.resolve(createMethodNotFoundResponse(request.id));
            }
            else {
                return Promise.resolve(null);
            }
        };
        var onError = function (error) {
            _this.errorListener("An unexpected error occurred while executing \"".concat(request.method, "\" JSON-RPC method:"), error);
            return Promise.resolve(_this.mapErrorToJSONRPCErrorResponseIfNecessary(request.id, error));
        };
        try {
            return (this.middleware || noopMiddleware)(callMethod, request, serverParams).then(undefined, onError);
        }
        catch (error) {
            return onError(error);
        }
    };
    JSONRPCServer.prototype.mapErrorToJSONRPCErrorResponseIfNecessary = function (id, error) {
        if (id !== undefined) {
            return this.mapErrorToJSONRPCErrorResponse(id, error);
        }
        else {
            return null;
        }
    };
    return JSONRPCServer;
}());
exports.JSONRPCServer = JSONRPCServer;
var isNonNull = function (value) { return value !== null; };
var noopMiddleware = function (next, request, serverParams) { return next(request, serverParams); };
var mapResultToJSONRPCResponse = function (id, result) {
    if (id !== undefined) {
        return (0, models_1.createJSONRPCSuccessResponse)(id, result);
    }
    else {
        return null;
    }
};
var defaultMapErrorToJSONRPCErrorResponse = function (id, error) {
    var _a;
    var message = (_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : "An unexpected error occurred";
    var code = internal_1.DefaultErrorCode;
    var data;
    if (error instanceof models_1.JSONRPCErrorException) {
        code = error.code;
        data = error.data;
    }
    return (0, models_1.createJSONRPCErrorResponse)(id, code, message, data);
};
var mapResponse = function (request, response) {
    if (response) {
        return response;
    }
    else if (request.id !== undefined) {
        return (0, models_1.createJSONRPCErrorResponse)(request.id, models_1.JSONRPCErrorCode.InternalError, "Internal error");
    }
    else {
        return null;
    }
};

},{"./internal":5,"./models":6}]},{},[1]);
