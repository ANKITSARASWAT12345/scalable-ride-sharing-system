import { createRequire } from 'module';const require = createRequire(import.meta.url);
import {
  require_inherits,
  require_ms,
  require_supports_color
} from "./chunk-FWQ6OLEM.js";
import {
  __commonJS,
  __require
} from "./chunk-JJCEQHS6.js";

// node_modules/sockjs-client/lib/utils/random.js
var require_random = __commonJS({
  "node_modules/sockjs-client/lib/utils/random.js"(exports, module) {
    "use strict";
    var crypto = __require("crypto");
    var _randomStringChars = "abcdefghijklmnopqrstuvwxyz012345";
    module.exports = {
      string: function(length) {
        var max = _randomStringChars.length;
        var bytes = crypto.randomBytes(length);
        var ret = [];
        for (var i = 0; i < length; i++) {
          ret.push(_randomStringChars.substr(bytes[i] % max, 1));
        }
        return ret.join("");
      },
      number: function(max) {
        return Math.floor(Math.random() * max);
      },
      numberString: function(max) {
        var t = ("" + (max - 1)).length;
        var p = new Array(t + 1).join("0");
        return (p + this.number(max)).slice(-t);
      }
    };
  }
});

// node_modules/sockjs-client/lib/utils/event.js
var require_event = __commonJS({
  "node_modules/sockjs-client/lib/utils/event.js"(exports, module) {
    "use strict";
    var random = require_random();
    var onUnload = {};
    var afterUnload = false;
    var isChromePackagedApp = global.chrome && global.chrome.app && global.chrome.app.runtime;
    module.exports = {
      attachEvent: function(event, listener) {
        if (typeof global.addEventListener !== "undefined") {
          global.addEventListener(event, listener, false);
        } else if (global.document && global.attachEvent) {
          global.document.attachEvent("on" + event, listener);
          global.attachEvent("on" + event, listener);
        }
      },
      detachEvent: function(event, listener) {
        if (typeof global.addEventListener !== "undefined") {
          global.removeEventListener(event, listener, false);
        } else if (global.document && global.detachEvent) {
          global.document.detachEvent("on" + event, listener);
          global.detachEvent("on" + event, listener);
        }
      },
      unloadAdd: function(listener) {
        if (isChromePackagedApp) {
          return null;
        }
        var ref = random.string(8);
        onUnload[ref] = listener;
        if (afterUnload) {
          setTimeout(this.triggerUnloadCallbacks, 0);
        }
        return ref;
      },
      unloadDel: function(ref) {
        if (ref in onUnload) {
          delete onUnload[ref];
        }
      },
      triggerUnloadCallbacks: function() {
        for (var ref in onUnload) {
          onUnload[ref]();
          delete onUnload[ref];
        }
      }
    };
    var unloadTriggered = function() {
      if (afterUnload) {
        return;
      }
      afterUnload = true;
      module.exports.triggerUnloadCallbacks();
    };
    if (!isChromePackagedApp) {
      module.exports.attachEvent("unload", unloadTriggered);
    }
  }
});

// node_modules/requires-port/index.js
var require_requires_port = __commonJS({
  "node_modules/requires-port/index.js"(exports, module) {
    "use strict";
    module.exports = function required(port, protocol) {
      protocol = protocol.split(":")[0];
      port = +port;
      if (!port) return false;
      switch (protocol) {
        case "http":
        case "ws":
          return port !== 80;
        case "https":
        case "wss":
          return port !== 443;
        case "ftp":
          return port !== 21;
        case "gopher":
          return port !== 70;
        case "file":
          return false;
      }
      return port !== 0;
    };
  }
});

// node_modules/querystringify/index.js
var require_querystringify = __commonJS({
  "node_modules/querystringify/index.js"(exports) {
    "use strict";
    var has = Object.prototype.hasOwnProperty;
    var undef;
    function decode(input) {
      try {
        return decodeURIComponent(input.replace(/\+/g, " "));
      } catch (e) {
        return null;
      }
    }
    function encode(input) {
      try {
        return encodeURIComponent(input);
      } catch (e) {
        return null;
      }
    }
    function querystring(query) {
      var parser = /([^=?#&]+)=?([^&]*)/g, result = {}, part;
      while (part = parser.exec(query)) {
        var key = decode(part[1]), value = decode(part[2]);
        if (key === null || value === null || key in result) continue;
        result[key] = value;
      }
      return result;
    }
    function querystringify(obj, prefix) {
      prefix = prefix || "";
      var pairs = [], value, key;
      if ("string" !== typeof prefix) prefix = "?";
      for (key in obj) {
        if (has.call(obj, key)) {
          value = obj[key];
          if (!value && (value === null || value === undef || isNaN(value))) {
            value = "";
          }
          key = encode(key);
          value = encode(value);
          if (key === null || value === null) continue;
          pairs.push(key + "=" + value);
        }
      }
      return pairs.length ? prefix + pairs.join("&") : "";
    }
    exports.stringify = querystringify;
    exports.parse = querystring;
  }
});

// node_modules/url-parse/index.js
var require_url_parse = __commonJS({
  "node_modules/url-parse/index.js"(exports, module) {
    "use strict";
    var required = require_requires_port();
    var qs = require_querystringify();
    var controlOrWhitespace = /^[\x00-\x20\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/;
    var CRHTLF = /[\n\r\t]/g;
    var slashes = /^[A-Za-z][A-Za-z0-9+-.]*:\/\//;
    var port = /:\d+$/;
    var protocolre = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\\/]+)?([\S\s]*)/i;
    var windowsDriveLetter = /^[a-zA-Z]:/;
    function trimLeft(str) {
      return (str ? str : "").toString().replace(controlOrWhitespace, "");
    }
    var rules = [
      ["#", "hash"],
      // Extract from the back.
      ["?", "query"],
      // Extract from the back.
      function sanitize(address, url) {
        return isSpecial(url.protocol) ? address.replace(/\\/g, "/") : address;
      },
      ["/", "pathname"],
      // Extract from the back.
      ["@", "auth", 1],
      // Extract from the front.
      [NaN, "host", void 0, 1, 1],
      // Set left over value.
      [/:(\d*)$/, "port", void 0, 1],
      // RegExp the back.
      [NaN, "hostname", void 0, 1, 1]
      // Set left over.
    ];
    var ignore = { hash: 1, query: 1 };
    function lolcation(loc) {
      var globalVar;
      if (typeof window !== "undefined") globalVar = window;
      else if (typeof global !== "undefined") globalVar = global;
      else if (typeof self !== "undefined") globalVar = self;
      else globalVar = {};
      var location = globalVar.location || {};
      loc = loc || location;
      var finaldestination = {}, type = typeof loc, key;
      if ("blob:" === loc.protocol) {
        finaldestination = new Url(unescape(loc.pathname), {});
      } else if ("string" === type) {
        finaldestination = new Url(loc, {});
        for (key in ignore) delete finaldestination[key];
      } else if ("object" === type) {
        for (key in loc) {
          if (key in ignore) continue;
          finaldestination[key] = loc[key];
        }
        if (finaldestination.slashes === void 0) {
          finaldestination.slashes = slashes.test(loc.href);
        }
      }
      return finaldestination;
    }
    function isSpecial(scheme) {
      return scheme === "file:" || scheme === "ftp:" || scheme === "http:" || scheme === "https:" || scheme === "ws:" || scheme === "wss:";
    }
    function extractProtocol(address, location) {
      address = trimLeft(address);
      address = address.replace(CRHTLF, "");
      location = location || {};
      var match = protocolre.exec(address);
      var protocol = match[1] ? match[1].toLowerCase() : "";
      var forwardSlashes = !!match[2];
      var otherSlashes = !!match[3];
      var slashesCount = 0;
      var rest;
      if (forwardSlashes) {
        if (otherSlashes) {
          rest = match[2] + match[3] + match[4];
          slashesCount = match[2].length + match[3].length;
        } else {
          rest = match[2] + match[4];
          slashesCount = match[2].length;
        }
      } else {
        if (otherSlashes) {
          rest = match[3] + match[4];
          slashesCount = match[3].length;
        } else {
          rest = match[4];
        }
      }
      if (protocol === "file:") {
        if (slashesCount >= 2) {
          rest = rest.slice(2);
        }
      } else if (isSpecial(protocol)) {
        rest = match[4];
      } else if (protocol) {
        if (forwardSlashes) {
          rest = rest.slice(2);
        }
      } else if (slashesCount >= 2 && isSpecial(location.protocol)) {
        rest = match[4];
      }
      return {
        protocol,
        slashes: forwardSlashes || isSpecial(protocol),
        slashesCount,
        rest
      };
    }
    function resolve(relative, base) {
      if (relative === "") return base;
      var path = (base || "/").split("/").slice(0, -1).concat(relative.split("/")), i = path.length, last = path[i - 1], unshift = false, up = 0;
      while (i--) {
        if (path[i] === ".") {
          path.splice(i, 1);
        } else if (path[i] === "..") {
          path.splice(i, 1);
          up++;
        } else if (up) {
          if (i === 0) unshift = true;
          path.splice(i, 1);
          up--;
        }
      }
      if (unshift) path.unshift("");
      if (last === "." || last === "..") path.push("");
      return path.join("/");
    }
    function Url(address, location, parser) {
      address = trimLeft(address);
      address = address.replace(CRHTLF, "");
      if (!(this instanceof Url)) {
        return new Url(address, location, parser);
      }
      var relative, extracted, parse, instruction, index, key, instructions = rules.slice(), type = typeof location, url = this, i = 0;
      if ("object" !== type && "string" !== type) {
        parser = location;
        location = null;
      }
      if (parser && "function" !== typeof parser) parser = qs.parse;
      location = lolcation(location);
      extracted = extractProtocol(address || "", location);
      relative = !extracted.protocol && !extracted.slashes;
      url.slashes = extracted.slashes || relative && location.slashes;
      url.protocol = extracted.protocol || location.protocol || "";
      address = extracted.rest;
      if (extracted.protocol === "file:" && (extracted.slashesCount !== 2 || windowsDriveLetter.test(address)) || !extracted.slashes && (extracted.protocol || extracted.slashesCount < 2 || !isSpecial(url.protocol))) {
        instructions[3] = [/(.*)/, "pathname"];
      }
      for (; i < instructions.length; i++) {
        instruction = instructions[i];
        if (typeof instruction === "function") {
          address = instruction(address, url);
          continue;
        }
        parse = instruction[0];
        key = instruction[1];
        if (parse !== parse) {
          url[key] = address;
        } else if ("string" === typeof parse) {
          index = parse === "@" ? address.lastIndexOf(parse) : address.indexOf(parse);
          if (~index) {
            if ("number" === typeof instruction[2]) {
              url[key] = address.slice(0, index);
              address = address.slice(index + instruction[2]);
            } else {
              url[key] = address.slice(index);
              address = address.slice(0, index);
            }
          }
        } else if (index = parse.exec(address)) {
          url[key] = index[1];
          address = address.slice(0, index.index);
        }
        url[key] = url[key] || (relative && instruction[3] ? location[key] || "" : "");
        if (instruction[4]) url[key] = url[key].toLowerCase();
      }
      if (parser) url.query = parser(url.query);
      if (relative && location.slashes && url.pathname.charAt(0) !== "/" && (url.pathname !== "" || location.pathname !== "")) {
        url.pathname = resolve(url.pathname, location.pathname);
      }
      if (url.pathname.charAt(0) !== "/" && isSpecial(url.protocol)) {
        url.pathname = "/" + url.pathname;
      }
      if (!required(url.port, url.protocol)) {
        url.host = url.hostname;
        url.port = "";
      }
      url.username = url.password = "";
      if (url.auth) {
        index = url.auth.indexOf(":");
        if (~index) {
          url.username = url.auth.slice(0, index);
          url.username = encodeURIComponent(decodeURIComponent(url.username));
          url.password = url.auth.slice(index + 1);
          url.password = encodeURIComponent(decodeURIComponent(url.password));
        } else {
          url.username = encodeURIComponent(decodeURIComponent(url.auth));
        }
        url.auth = url.password ? url.username + ":" + url.password : url.username;
      }
      url.origin = url.protocol !== "file:" && isSpecial(url.protocol) && url.host ? url.protocol + "//" + url.host : "null";
      url.href = url.toString();
    }
    function set(part, value, fn) {
      var url = this;
      switch (part) {
        case "query":
          if ("string" === typeof value && value.length) {
            value = (fn || qs.parse)(value);
          }
          url[part] = value;
          break;
        case "port":
          url[part] = value;
          if (!required(value, url.protocol)) {
            url.host = url.hostname;
            url[part] = "";
          } else if (value) {
            url.host = url.hostname + ":" + value;
          }
          break;
        case "hostname":
          url[part] = value;
          if (url.port) value += ":" + url.port;
          url.host = value;
          break;
        case "host":
          url[part] = value;
          if (port.test(value)) {
            value = value.split(":");
            url.port = value.pop();
            url.hostname = value.join(":");
          } else {
            url.hostname = value;
            url.port = "";
          }
          break;
        case "protocol":
          url.protocol = value.toLowerCase();
          url.slashes = !fn;
          break;
        case "pathname":
        case "hash":
          if (value) {
            var char = part === "pathname" ? "/" : "#";
            url[part] = value.charAt(0) !== char ? char + value : value;
          } else {
            url[part] = value;
          }
          break;
        case "username":
        case "password":
          url[part] = encodeURIComponent(value);
          break;
        case "auth":
          var index = value.indexOf(":");
          if (~index) {
            url.username = value.slice(0, index);
            url.username = encodeURIComponent(decodeURIComponent(url.username));
            url.password = value.slice(index + 1);
            url.password = encodeURIComponent(decodeURIComponent(url.password));
          } else {
            url.username = encodeURIComponent(decodeURIComponent(value));
          }
      }
      for (var i = 0; i < rules.length; i++) {
        var ins = rules[i];
        if (ins[4]) url[ins[1]] = url[ins[1]].toLowerCase();
      }
      url.auth = url.password ? url.username + ":" + url.password : url.username;
      url.origin = url.protocol !== "file:" && isSpecial(url.protocol) && url.host ? url.protocol + "//" + url.host : "null";
      url.href = url.toString();
      return url;
    }
    function toString(stringify) {
      if (!stringify || "function" !== typeof stringify) stringify = qs.stringify;
      var query, url = this, host = url.host, protocol = url.protocol;
      if (protocol && protocol.charAt(protocol.length - 1) !== ":") protocol += ":";
      var result = protocol + (url.protocol && url.slashes || isSpecial(url.protocol) ? "//" : "");
      if (url.username) {
        result += url.username;
        if (url.password) result += ":" + url.password;
        result += "@";
      } else if (url.password) {
        result += ":" + url.password;
        result += "@";
      } else if (url.protocol !== "file:" && isSpecial(url.protocol) && !host && url.pathname !== "/") {
        result += "@";
      }
      if (host[host.length - 1] === ":" || port.test(url.hostname) && !url.port) {
        host += ":";
      }
      result += host + url.pathname;
      query = "object" === typeof url.query ? stringify(url.query) : url.query;
      if (query) result += "?" !== query.charAt(0) ? "?" + query : query;
      if (url.hash) result += url.hash;
      return result;
    }
    Url.prototype = { set, toString };
    Url.extractProtocol = extractProtocol;
    Url.location = lolcation;
    Url.trimLeft = trimLeft;
    Url.qs = qs;
    module.exports = Url;
  }
});

// node_modules/sockjs-client/node_modules/debug/src/common.js
var require_common = __commonJS({
  "node_modules/sockjs-client/node_modules/debug/src/common.js"(exports, module) {
    "use strict";
    function setup(env) {
      createDebug.debug = createDebug;
      createDebug.default = createDebug;
      createDebug.coerce = coerce;
      createDebug.disable = disable;
      createDebug.enable = enable;
      createDebug.enabled = enabled;
      createDebug.humanize = require_ms();
      Object.keys(env).forEach(function(key) {
        createDebug[key] = env[key];
      });
      createDebug.instances = [];
      createDebug.names = [];
      createDebug.skips = [];
      createDebug.formatters = {};
      function selectColor(namespace) {
        var hash = 0;
        for (var i = 0; i < namespace.length; i++) {
          hash = (hash << 5) - hash + namespace.charCodeAt(i);
          hash |= 0;
        }
        return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
      }
      createDebug.selectColor = selectColor;
      function createDebug(namespace) {
        var prevTime;
        function debug() {
          if (!debug.enabled) {
            return;
          }
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          var self2 = debug;
          var curr = Number(/* @__PURE__ */ new Date());
          var ms = curr - (prevTime || curr);
          self2.diff = ms;
          self2.prev = prevTime;
          self2.curr = curr;
          prevTime = curr;
          args[0] = createDebug.coerce(args[0]);
          if (typeof args[0] !== "string") {
            args.unshift("%O");
          }
          var index = 0;
          args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
            if (match === "%%") {
              return match;
            }
            index++;
            var formatter = createDebug.formatters[format];
            if (typeof formatter === "function") {
              var val = args[index];
              match = formatter.call(self2, val);
              args.splice(index, 1);
              index--;
            }
            return match;
          });
          createDebug.formatArgs.call(self2, args);
          var logFn = self2.log || createDebug.log;
          logFn.apply(self2, args);
        }
        debug.namespace = namespace;
        debug.enabled = createDebug.enabled(namespace);
        debug.useColors = createDebug.useColors();
        debug.color = selectColor(namespace);
        debug.destroy = destroy;
        debug.extend = extend;
        if (typeof createDebug.init === "function") {
          createDebug.init(debug);
        }
        createDebug.instances.push(debug);
        return debug;
      }
      function destroy() {
        var index = createDebug.instances.indexOf(this);
        if (index !== -1) {
          createDebug.instances.splice(index, 1);
          return true;
        }
        return false;
      }
      function extend(namespace, delimiter) {
        return createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
      }
      function enable(namespaces) {
        createDebug.save(namespaces);
        createDebug.names = [];
        createDebug.skips = [];
        var i;
        var split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
        var len = split.length;
        for (i = 0; i < len; i++) {
          if (!split[i]) {
            continue;
          }
          namespaces = split[i].replace(/\*/g, ".*?");
          if (namespaces[0] === "-") {
            createDebug.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
          } else {
            createDebug.names.push(new RegExp("^" + namespaces + "$"));
          }
        }
        for (i = 0; i < createDebug.instances.length; i++) {
          var instance = createDebug.instances[i];
          instance.enabled = createDebug.enabled(instance.namespace);
        }
      }
      function disable() {
        createDebug.enable("");
      }
      function enabled(name) {
        if (name[name.length - 1] === "*") {
          return true;
        }
        var i;
        var len;
        for (i = 0, len = createDebug.skips.length; i < len; i++) {
          if (createDebug.skips[i].test(name)) {
            return false;
          }
        }
        for (i = 0, len = createDebug.names.length; i < len; i++) {
          if (createDebug.names[i].test(name)) {
            return true;
          }
        }
        return false;
      }
      function coerce(val) {
        if (val instanceof Error) {
          return val.stack || val.message;
        }
        return val;
      }
      createDebug.enable(createDebug.load());
      return createDebug;
    }
    module.exports = setup;
  }
});

// node_modules/sockjs-client/node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "node_modules/sockjs-client/node_modules/debug/src/browser.js"(exports, module) {
    "use strict";
    function _typeof(obj) {
      if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = function _typeof2(obj2) {
          return typeof obj2;
        };
      } else {
        _typeof = function _typeof2(obj2) {
          return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
        };
      }
      return _typeof(obj);
    }
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.colors = ["#0000CC", "#0000FF", "#0033CC", "#0033FF", "#0066CC", "#0066FF", "#0099CC", "#0099FF", "#00CC00", "#00CC33", "#00CC66", "#00CC99", "#00CCCC", "#00CCFF", "#3300CC", "#3300FF", "#3333CC", "#3333FF", "#3366CC", "#3366FF", "#3399CC", "#3399FF", "#33CC00", "#33CC33", "#33CC66", "#33CC99", "#33CCCC", "#33CCFF", "#6600CC", "#6600FF", "#6633CC", "#6633FF", "#66CC00", "#66CC33", "#9900CC", "#9900FF", "#9933CC", "#9933FF", "#99CC00", "#99CC33", "#CC0000", "#CC0033", "#CC0066", "#CC0099", "#CC00CC", "#CC00FF", "#CC3300", "#CC3333", "#CC3366", "#CC3399", "#CC33CC", "#CC33FF", "#CC6600", "#CC6633", "#CC9900", "#CC9933", "#CCCC00", "#CCCC33", "#FF0000", "#FF0033", "#FF0066", "#FF0099", "#FF00CC", "#FF00FF", "#FF3300", "#FF3333", "#FF3366", "#FF3399", "#FF33CC", "#FF33FF", "#FF6600", "#FF6633", "#FF9900", "#FF9933", "#FFCC00", "#FFCC33"];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      var c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      var index = 0;
      var lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, function(match) {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    function log() {
      var _console;
      return (typeof console === "undefined" ? "undefined" : _typeof(console)) === "object" && console.log && (_console = console).log.apply(_console, arguments);
    }
    function save(namespaces) {
      try {
        if (namespaces) {
          exports.storage.setItem("debug", namespaces);
        } else {
          exports.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load() {
      var r;
      try {
        r = exports.storage.getItem("debug");
      } catch (error) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error) {
      }
    }
    module.exports = require_common()(exports);
    var formatters = module.exports.formatters;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  }
});

// node_modules/sockjs-client/node_modules/debug/src/node.js
var require_node = __commonJS({
  "node_modules/sockjs-client/node_modules/debug/src/node.js"(exports, module) {
    "use strict";
    var tty = __require("tty");
    var util = __require("util");
    exports.init = init;
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.colors = [6, 2, 3, 4, 5, 1];
    try {
      supportsColor = require_supports_color();
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports.colors = [20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62, 63, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99, 112, 113, 128, 129, 134, 135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 178, 179, 184, 185, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 214, 215, 220, 221];
      }
    } catch (error) {
    }
    var supportsColor;
    exports.inspectOpts = Object.keys(process.env).filter(function(key) {
      return /^debug_/i.test(key);
    }).reduce(function(obj, key) {
      var prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, function(_, k) {
        return k.toUpperCase();
      });
      var val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      var name = this.namespace, useColors2 = this.useColors;
      if (useColors2) {
        var c = this.color;
        var colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        var prefix = "  ".concat(colorCode, ";1m").concat(name, " \x1B[0m");
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log() {
      return process.stderr.write(util.format.apply(util, arguments) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function init(debug) {
      debug.inspectOpts = {};
      var keys = Object.keys(exports.inspectOpts);
      for (var i = 0; i < keys.length; i++) {
        debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
      }
    }
    module.exports = require_common()(exports);
    var formatters = module.exports.formatters;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts).split("\n").map(function(str) {
        return str.trim();
      }).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };
  }
});

// node_modules/sockjs-client/node_modules/debug/src/index.js
var require_src = __commonJS({
  "node_modules/sockjs-client/node_modules/debug/src/index.js"(exports, module) {
    "use strict";
    if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
      module.exports = require_browser();
    } else {
      module.exports = require_node();
    }
  }
});

// node_modules/sockjs-client/lib/utils/url.js
var require_url = __commonJS({
  "node_modules/sockjs-client/lib/utils/url.js"(exports, module) {
    "use strict";
    var URL2 = require_url_parse();
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:utils:url");
    }
    module.exports = {
      getOrigin: function(url) {
        if (!url) {
          return null;
        }
        var p = new URL2(url);
        if (p.protocol === "file:") {
          return null;
        }
        var port = p.port;
        if (!port) {
          port = p.protocol === "https:" ? "443" : "80";
        }
        return p.protocol + "//" + p.hostname + ":" + port;
      },
      isOriginEqual: function(a, b) {
        var res = this.getOrigin(a) === this.getOrigin(b);
        debug("same", a, b, res);
        return res;
      },
      isSchemeEqual: function(a, b) {
        return a.split(":")[0] === b.split(":")[0];
      },
      addPath: function(url, path) {
        var qs = url.split("?");
        return qs[0] + path + (qs[1] ? "?" + qs[1] : "");
      },
      addQuery: function(url, q) {
        return url + (url.indexOf("?") === -1 ? "?" + q : "&" + q);
      },
      isLoopbackAddr: function(addr) {
        return /^127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(addr) || /^\[::1\]$/.test(addr);
      }
    };
  }
});

// node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "node_modules/safe-buffer/index.js"(exports, module) {
    var buffer = __require("buffer");
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module.exports = buffer;
    } else {
      copyProps(buffer, exports);
      exports.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    SafeBuffer.prototype = Object.create(Buffer2.prototype);
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }
});

// node_modules/websocket-driver/lib/websocket/streams.js
var require_streams = __commonJS({
  "node_modules/websocket-driver/lib/websocket/streams.js"(exports) {
    "use strict";
    var Stream = __require("stream").Stream;
    var util = __require("util");
    var IO = function(driver) {
      this.readable = this.writable = true;
      this._paused = false;
      this._driver = driver;
    };
    util.inherits(IO, Stream);
    IO.prototype.pause = function() {
      this._paused = true;
      this._driver.messages._paused = true;
    };
    IO.prototype.resume = function() {
      this._paused = false;
      this.emit("drain");
      var messages = this._driver.messages;
      messages._paused = false;
      messages.emit("drain");
    };
    IO.prototype.write = function(chunk) {
      if (!this.writable) return false;
      this._driver.parse(chunk);
      return !this._paused;
    };
    IO.prototype.end = function(chunk) {
      if (!this.writable) return;
      if (chunk !== void 0) this.write(chunk);
      this.writable = false;
      var messages = this._driver.messages;
      if (messages.readable) {
        messages.readable = messages.writable = false;
        messages.emit("end");
      }
    };
    IO.prototype.destroy = function() {
      this.end();
    };
    var Messages = function(driver) {
      this.readable = this.writable = true;
      this._paused = false;
      this._driver = driver;
    };
    util.inherits(Messages, Stream);
    Messages.prototype.pause = function() {
      this._driver.io._paused = true;
    };
    Messages.prototype.resume = function() {
      this._driver.io._paused = false;
      this._driver.io.emit("drain");
    };
    Messages.prototype.write = function(message) {
      if (!this.writable) return false;
      if (typeof message === "string") this._driver.text(message);
      else this._driver.binary(message);
      return !this._paused;
    };
    Messages.prototype.end = function(message) {
      if (message !== void 0) this.write(message);
    };
    Messages.prototype.destroy = function() {
    };
    exports.IO = IO;
    exports.Messages = Messages;
  }
});

// node_modules/websocket-driver/lib/websocket/driver/headers.js
var require_headers = __commonJS({
  "node_modules/websocket-driver/lib/websocket/driver/headers.js"(exports, module) {
    "use strict";
    var Headers = function() {
      this.clear();
    };
    Headers.prototype.ALLOWED_DUPLICATES = ["set-cookie", "set-cookie2", "warning", "www-authenticate"];
    Headers.prototype.clear = function() {
      this._sent = {};
      this._lines = [];
    };
    Headers.prototype.set = function(name, value) {
      if (value === void 0) return;
      name = this._strip(name);
      value = this._strip(value);
      var key = name.toLowerCase();
      if (!this._sent.hasOwnProperty(key) || this.ALLOWED_DUPLICATES.indexOf(key) >= 0) {
        this._sent[key] = true;
        this._lines.push(name + ": " + value + "\r\n");
      }
    };
    Headers.prototype.toString = function() {
      return this._lines.join("");
    };
    Headers.prototype._strip = function(string) {
      return string.toString().replace(/^ */, "").replace(/ *$/, "");
    };
    module.exports = Headers;
  }
});

// node_modules/websocket-driver/lib/websocket/driver/stream_reader.js
var require_stream_reader = __commonJS({
  "node_modules/websocket-driver/lib/websocket/driver/stream_reader.js"(exports, module) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var StreamReader = function() {
      this._queue = [];
      this._queueSize = 0;
      this._offset = 0;
    };
    StreamReader.prototype.put = function(buffer) {
      if (!buffer || buffer.length === 0) return;
      if (!Buffer2.isBuffer(buffer)) buffer = Buffer2.from(buffer);
      this._queue.push(buffer);
      this._queueSize += buffer.length;
    };
    StreamReader.prototype.read = function(length) {
      if (length > this._queueSize) return null;
      if (length === 0) return Buffer2.alloc(0);
      this._queueSize -= length;
      var queue = this._queue, remain = length, first = queue[0], buffers, buffer;
      if (first.length >= length) {
        if (first.length === length) {
          return queue.shift();
        } else {
          buffer = first.slice(0, length);
          queue[0] = first.slice(length);
          return buffer;
        }
      }
      for (var i = 0, n = queue.length; i < n; i++) {
        if (remain < queue[i].length) break;
        remain -= queue[i].length;
      }
      buffers = queue.splice(0, i);
      if (remain > 0 && queue.length > 0) {
        buffers.push(queue[0].slice(0, remain));
        queue[0] = queue[0].slice(remain);
      }
      return Buffer2.concat(buffers, length);
    };
    StreamReader.prototype.eachByte = function(callback, context) {
      var buffer, n, index;
      while (this._queue.length > 0) {
        buffer = this._queue[0];
        n = buffer.length;
        while (this._offset < n) {
          index = this._offset;
          this._offset += 1;
          callback.call(context, buffer[index]);
        }
        this._offset = 0;
        this._queue.shift();
      }
    };
    module.exports = StreamReader;
  }
});

// node_modules/websocket-driver/lib/websocket/driver/base.js
var require_base = __commonJS({
  "node_modules/websocket-driver/lib/websocket/driver/base.js"(exports, module) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var Emitter = __require("events").EventEmitter;
    var util = __require("util");
    var streams = require_streams();
    var Headers = require_headers();
    var Reader = require_stream_reader();
    var Base = function(request, url, options) {
      Emitter.call(this);
      Base.validateOptions(options || {}, ["maxLength", "masking", "requireMasking", "protocols"]);
      this._request = request;
      this._reader = new Reader();
      this._options = options || {};
      this._maxLength = this._options.maxLength || this.MAX_LENGTH;
      this._headers = new Headers();
      this.__queue = [];
      this.readyState = 0;
      this.url = url;
      this.io = new streams.IO(this);
      this.messages = new streams.Messages(this);
      this._bindEventListeners();
    };
    util.inherits(Base, Emitter);
    Base.isWebSocket = function(request) {
      var connection = request.headers.connection || "", upgrade = request.headers.upgrade || "";
      return request.method === "GET" && connection.toLowerCase().split(/ *, */).indexOf("upgrade") >= 0 && upgrade.toLowerCase() === "websocket";
    };
    Base.validateOptions = function(options, validKeys) {
      for (var key2 in options) {
        if (validKeys.indexOf(key2) < 0)
          throw new Error("Unrecognized option: " + key2);
      }
    };
    var instance = {
      // This is 64MB, small enough for an average VPS to handle without
      // crashing from process out of memory
      MAX_LENGTH: 67108863,
      STATES: ["connecting", "open", "closing", "closed"],
      _bindEventListeners: function() {
        var self2 = this;
        this.messages.on("error", function() {
        });
        this.on("message", function(event) {
          var messages = self2.messages;
          if (messages.readable) messages.emit("data", event.data);
        });
        this.on("error", function(error) {
          var messages = self2.messages;
          if (messages.readable) messages.emit("error", error);
        });
        this.on("close", function() {
          var messages = self2.messages;
          if (!messages.readable) return;
          messages.readable = messages.writable = false;
          messages.emit("end");
        });
      },
      getState: function() {
        return this.STATES[this.readyState] || null;
      },
      addExtension: function(extension) {
        return false;
      },
      setHeader: function(name, value) {
        if (this.readyState > 0) return false;
        this._headers.set(name, value);
        return true;
      },
      start: function() {
        if (this.readyState !== 0) return false;
        if (!Base.isWebSocket(this._request))
          return this._failHandshake(new Error("Not a WebSocket request"));
        var response;
        try {
          response = this._handshakeResponse();
        } catch (error) {
          return this._failHandshake(error);
        }
        this._write(response);
        if (this._stage !== -1) this._open();
        return true;
      },
      _failHandshake: function(error) {
        var headers = new Headers();
        headers.set("Content-Type", "text/plain");
        headers.set("Content-Length", Buffer2.byteLength(error.message, "utf8"));
        headers = ["HTTP/1.1 400 Bad Request", headers.toString(), error.message];
        this._write(Buffer2.from(headers.join("\r\n"), "utf8"));
        this._fail("protocol_error", error.message);
        return false;
      },
      text: function(message) {
        return this.frame(message);
      },
      binary: function(message) {
        return false;
      },
      ping: function() {
        return false;
      },
      pong: function() {
        return false;
      },
      close: function(reason, code) {
        if (this.readyState !== 1) return false;
        this.readyState = 3;
        this.emit("close", new Base.CloseEvent(null, null));
        return true;
      },
      _open: function() {
        this.readyState = 1;
        this.__queue.forEach(function(args) {
          this.frame.apply(this, args);
        }, this);
        this.__queue = [];
        this.emit("open", new Base.OpenEvent());
      },
      _queue: function(message) {
        this.__queue.push(message);
        return true;
      },
      _write: function(chunk) {
        var io = this.io;
        if (io.readable) io.emit("data", chunk);
      },
      _fail: function(type, message) {
        this.readyState = 2;
        this.emit("error", new Error(message));
        this.close();
      }
    };
    for (key in instance)
      Base.prototype[key] = instance[key];
    var key;
    Base.ConnectEvent = function() {
    };
    Base.OpenEvent = function() {
    };
    Base.CloseEvent = function(code, reason) {
      this.code = code;
      this.reason = reason;
    };
    Base.MessageEvent = function(data) {
      this.data = data;
    };
    Base.PingEvent = function(data) {
      this.data = data;
    };
    Base.PongEvent = function(data) {
      this.data = data;
    };
    module.exports = Base;
  }
});

// node_modules/http-parser-js/http-parser.js
var require_http_parser = __commonJS({
  "node_modules/http-parser-js/http-parser.js"(exports) {
    exports.HTTPParser = HTTPParser;
    function HTTPParser(type) {
      if (type !== void 0 && type !== HTTPParser.REQUEST && type !== HTTPParser.RESPONSE) {
        throw new Error("type must be REQUEST or RESPONSE");
      }
      if (type === void 0) {
      } else {
        this.initialize(type);
      }
      this.maxHeaderSize = HTTPParser.maxHeaderSize;
    }
    HTTPParser.prototype.initialize = function(type, async_resource) {
      if (type !== HTTPParser.REQUEST && type !== HTTPParser.RESPONSE) {
        throw new Error("type must be REQUEST or RESPONSE");
      }
      this.type = type;
      this.state = type + "_LINE";
      this.info = {
        headers: [],
        upgrade: false
      };
      this.trailers = [];
      this.line = "";
      this.isChunked = false;
      this.connection = "";
      this.headerSize = 0;
      this.body_bytes = null;
      this.isUserCall = false;
      this.hadError = false;
    };
    HTTPParser.encoding = "ascii";
    HTTPParser.maxHeaderSize = 80 * 1024;
    HTTPParser.REQUEST = "REQUEST";
    HTTPParser.RESPONSE = "RESPONSE";
    var kOnHeaders = HTTPParser.kOnHeaders = 1;
    var kOnHeadersComplete = HTTPParser.kOnHeadersComplete = 2;
    var kOnBody = HTTPParser.kOnBody = 3;
    var kOnMessageComplete = HTTPParser.kOnMessageComplete = 4;
    HTTPParser.prototype[kOnHeaders] = HTTPParser.prototype[kOnHeadersComplete] = HTTPParser.prototype[kOnBody] = HTTPParser.prototype[kOnMessageComplete] = function() {
    };
    var compatMode0_12 = true;
    Object.defineProperty(HTTPParser, "kOnExecute", {
      get: function() {
        compatMode0_12 = false;
        return 99;
      }
    });
    var methods = exports.methods = HTTPParser.methods = [
      "DELETE",
      "GET",
      "HEAD",
      "POST",
      "PUT",
      "CONNECT",
      "OPTIONS",
      "TRACE",
      "COPY",
      "LOCK",
      "MKCOL",
      "MOVE",
      "PROPFIND",
      "PROPPATCH",
      "SEARCH",
      "UNLOCK",
      "BIND",
      "REBIND",
      "UNBIND",
      "ACL",
      "REPORT",
      "MKACTIVITY",
      "CHECKOUT",
      "MERGE",
      "M-SEARCH",
      "NOTIFY",
      "SUBSCRIBE",
      "UNSUBSCRIBE",
      "PATCH",
      "PURGE",
      "MKCALENDAR",
      "LINK",
      "UNLINK",
      "SOURCE"
    ];
    var method_connect = methods.indexOf("CONNECT");
    HTTPParser.prototype.reinitialize = HTTPParser;
    HTTPParser.prototype.close = HTTPParser.prototype.pause = HTTPParser.prototype.resume = HTTPParser.prototype.remove = HTTPParser.prototype.free = function() {
    };
    HTTPParser.prototype._compatMode0_11 = false;
    HTTPParser.prototype.getAsyncId = function() {
      return 0;
    };
    var headerState = {
      REQUEST_LINE: true,
      RESPONSE_LINE: true,
      HEADER: true
    };
    HTTPParser.prototype.execute = function(chunk, start, length) {
      if (!(this instanceof HTTPParser)) {
        throw new TypeError("not a HTTPParser");
      }
      start = start || 0;
      length = typeof length === "number" ? length : chunk.length;
      this.chunk = chunk;
      this.offset = start;
      var end = this.end = start + length;
      try {
        while (this.offset < end) {
          if (this[this.state]()) {
            break;
          }
        }
      } catch (err) {
        if (this.isUserCall) {
          throw err;
        }
        this.hadError = true;
        return err;
      }
      this.chunk = null;
      length = this.offset - start;
      if (headerState[this.state]) {
        this.headerSize += length;
        if (this.headerSize > (this.maxHeaderSize || HTTPParser.maxHeaderSize)) {
          return new Error("max header size exceeded");
        }
      }
      return length;
    };
    var stateFinishAllowed = {
      REQUEST_LINE: true,
      RESPONSE_LINE: true,
      BODY_RAW: true
    };
    HTTPParser.prototype.finish = function() {
      if (this.hadError) {
        return;
      }
      if (!stateFinishAllowed[this.state]) {
        return new Error("invalid state for EOF");
      }
      if (this.state === "BODY_RAW") {
        this.userCall()(this[kOnMessageComplete]());
      }
    };
    HTTPParser.prototype.consume = HTTPParser.prototype.unconsume = HTTPParser.prototype.getCurrentBuffer = function() {
    };
    HTTPParser.prototype.userCall = function() {
      this.isUserCall = true;
      var self2 = this;
      return function(ret) {
        self2.isUserCall = false;
        return ret;
      };
    };
    HTTPParser.prototype.nextRequest = function() {
      this.userCall()(this[kOnMessageComplete]());
      this.reinitialize(this.type);
    };
    HTTPParser.prototype.consumeLine = function() {
      var end = this.end, chunk = this.chunk;
      for (var i = this.offset; i < end; i++) {
        if (chunk[i] === 10) {
          var line = this.line + chunk.toString(HTTPParser.encoding, this.offset, i);
          if (line.charAt(line.length - 1) === "\r") {
            line = line.substr(0, line.length - 1);
          }
          this.line = "";
          this.offset = i + 1;
          return line;
        }
      }
      this.line += chunk.toString(HTTPParser.encoding, this.offset, this.end);
      this.offset = this.end;
    };
    var headerExp = /^([^: \t]+):[ \t]*((?:.*[^ \t])|)/;
    var headerContinueExp = /^[ \t]+(.*[^ \t])/;
    HTTPParser.prototype.parseHeader = function(line, headers) {
      if (line.indexOf("\r") !== -1) {
        throw parseErrorCode("HPE_LF_EXPECTED");
      }
      var match = headerExp.exec(line);
      var k = match && match[1];
      if (k) {
        headers.push(k);
        headers.push(match[2]);
      } else {
        var matchContinue = headerContinueExp.exec(line);
        if (matchContinue && headers.length) {
          if (headers[headers.length - 1]) {
            headers[headers.length - 1] += " ";
          }
          headers[headers.length - 1] += matchContinue[1];
        }
      }
    };
    var requestExp = /^([A-Z-]+) ([^ ]+) HTTP\/(\d)\.(\d)$/;
    HTTPParser.prototype.REQUEST_LINE = function() {
      var line = this.consumeLine();
      if (!line) {
        return;
      }
      var match = requestExp.exec(line);
      if (match === null) {
        throw parseErrorCode("HPE_INVALID_CONSTANT");
      }
      this.info.method = this._compatMode0_11 ? match[1] : methods.indexOf(match[1]);
      if (this.info.method === -1) {
        throw new Error("invalid request method");
      }
      this.info.url = match[2];
      this.info.versionMajor = +match[3];
      this.info.versionMinor = +match[4];
      this.body_bytes = 0;
      this.state = "HEADER";
    };
    var responseExp = /^HTTP\/(\d)\.(\d) (\d{3}) ?(.*)$/;
    HTTPParser.prototype.RESPONSE_LINE = function() {
      var line = this.consumeLine();
      if (!line) {
        return;
      }
      var match = responseExp.exec(line);
      if (match === null) {
        throw parseErrorCode("HPE_INVALID_CONSTANT");
      }
      this.info.versionMajor = +match[1];
      this.info.versionMinor = +match[2];
      var statusCode = this.info.statusCode = +match[3];
      this.info.statusMessage = match[4];
      if ((statusCode / 100 | 0) === 1 || statusCode === 204 || statusCode === 304) {
        this.body_bytes = 0;
      }
      this.state = "HEADER";
    };
    HTTPParser.prototype.shouldKeepAlive = function() {
      if (this.info.versionMajor > 0 && this.info.versionMinor > 0) {
        if (this.connection.indexOf("close") !== -1) {
          return false;
        }
      } else if (this.connection.indexOf("keep-alive") === -1) {
        return false;
      }
      if (this.body_bytes !== null || this.isChunked) {
        return true;
      }
      return false;
    };
    HTTPParser.prototype.HEADER = function() {
      var line = this.consumeLine();
      if (line === void 0) {
        return;
      }
      var info = this.info;
      if (line) {
        this.parseHeader(line, info.headers);
      } else {
        var headers = info.headers;
        var hasContentLength = false;
        var currentContentLengthValue;
        var hasUpgradeHeader = false;
        for (var i = 0; i < headers.length; i += 2) {
          switch (headers[i].toLowerCase()) {
            case "transfer-encoding":
              this.isChunked = headers[i + 1].toLowerCase() === "chunked";
              break;
            case "content-length":
              currentContentLengthValue = +headers[i + 1];
              if (hasContentLength) {
                if (currentContentLengthValue !== this.body_bytes) {
                  throw parseErrorCode("HPE_UNEXPECTED_CONTENT_LENGTH");
                }
              } else {
                hasContentLength = true;
                this.body_bytes = currentContentLengthValue;
              }
              break;
            case "connection":
              this.connection += headers[i + 1].toLowerCase();
              break;
            case "upgrade":
              hasUpgradeHeader = true;
              break;
          }
        }
        if (this.isChunked && hasContentLength) {
          hasContentLength = false;
          this.body_bytes = null;
        }
        if (hasUpgradeHeader && this.connection.indexOf("upgrade") != -1) {
          info.upgrade = this.type === HTTPParser.REQUEST || info.statusCode === 101;
        } else {
          info.upgrade = info.method === method_connect;
        }
        if (this.isChunked && info.upgrade) {
          this.isChunked = false;
        }
        info.shouldKeepAlive = this.shouldKeepAlive();
        var skipBody;
        if (compatMode0_12) {
          skipBody = this.userCall()(this[kOnHeadersComplete](info));
        } else {
          skipBody = this.userCall()(this[kOnHeadersComplete](
            info.versionMajor,
            info.versionMinor,
            info.headers,
            info.method,
            info.url,
            info.statusCode,
            info.statusMessage,
            info.upgrade,
            info.shouldKeepAlive
          ));
        }
        if (skipBody === 2) {
          this.nextRequest();
          return true;
        } else if (this.isChunked && !skipBody) {
          this.state = "BODY_CHUNKHEAD";
        } else if (skipBody || this.body_bytes === 0) {
          this.nextRequest();
          return info.upgrade;
        } else if (this.body_bytes === null) {
          this.state = "BODY_RAW";
        } else {
          this.state = "BODY_SIZED";
        }
      }
    };
    HTTPParser.prototype.BODY_CHUNKHEAD = function() {
      var line = this.consumeLine();
      if (line === void 0) {
        return;
      }
      this.body_bytes = parseInt(line, 16);
      if (!this.body_bytes) {
        this.state = "BODY_CHUNKTRAILERS";
      } else {
        this.state = "BODY_CHUNK";
      }
    };
    HTTPParser.prototype.BODY_CHUNK = function() {
      var length = Math.min(this.end - this.offset, this.body_bytes);
      this.userCall()(this[kOnBody](this.chunk.slice(this.offset, this.offset + length), 0, length));
      this.offset += length;
      this.body_bytes -= length;
      if (!this.body_bytes) {
        this.state = "BODY_CHUNKEMPTYLINE";
      }
    };
    HTTPParser.prototype.BODY_CHUNKEMPTYLINE = function() {
      var line = this.consumeLine();
      if (line === void 0) {
        return;
      }
      if (line !== "") {
        throw new Error("Expected empty line");
      }
      this.state = "BODY_CHUNKHEAD";
    };
    HTTPParser.prototype.BODY_CHUNKTRAILERS = function() {
      var line = this.consumeLine();
      if (line === void 0) {
        return;
      }
      if (line) {
        this.parseHeader(line, this.trailers);
      } else {
        if (this.trailers.length) {
          this.userCall()(this[kOnHeaders](this.trailers, ""));
        }
        this.nextRequest();
      }
    };
    HTTPParser.prototype.BODY_RAW = function() {
      this.userCall()(this[kOnBody](this.chunk.slice(this.offset, this.end), 0, this.end - this.offset));
      this.offset = this.end;
    };
    HTTPParser.prototype.BODY_SIZED = function() {
      var length = Math.min(this.end - this.offset, this.body_bytes);
      this.userCall()(this[kOnBody](this.chunk.slice(this.offset, this.offset + length), 0, length));
      this.offset += length;
      this.body_bytes -= length;
      if (!this.body_bytes) {
        this.nextRequest();
      }
    };
    ["Headers", "HeadersComplete", "Body", "MessageComplete"].forEach(function(name) {
      var k = HTTPParser["kOn" + name];
      Object.defineProperty(HTTPParser.prototype, "on" + name, {
        get: function() {
          return this[k];
        },
        set: function(to) {
          this._compatMode0_11 = true;
          method_connect = "CONNECT";
          return this[k] = to;
        }
      });
    });
    function parseErrorCode(code) {
      var err = new Error("Parse Error");
      err.code = code;
      return err;
    }
  }
});

// node_modules/websocket-driver/lib/websocket/http_parser.js
var require_http_parser2 = __commonJS({
  "node_modules/websocket-driver/lib/websocket/http_parser.js"(exports, module) {
    "use strict";
    var NodeHTTPParser = require_http_parser().HTTPParser;
    var Buffer2 = require_safe_buffer().Buffer;
    var TYPES = {
      request: NodeHTTPParser.REQUEST || "request",
      response: NodeHTTPParser.RESPONSE || "response"
    };
    var HttpParser = function(type) {
      this._type = type;
      this._parser = new NodeHTTPParser(TYPES[type]);
      this._complete = false;
      this.headers = {};
      var current = null, self2 = this;
      this._parser.onHeaderField = function(b, start, length) {
        current = b.toString("utf8", start, start + length).toLowerCase();
      };
      this._parser.onHeaderValue = function(b, start, length) {
        var value = b.toString("utf8", start, start + length);
        if (self2.headers.hasOwnProperty(current))
          self2.headers[current] += ", " + value;
        else
          self2.headers[current] = value;
      };
      this._parser.onHeadersComplete = this._parser[NodeHTTPParser.kOnHeadersComplete] = function(majorVersion, minorVersion, headers, method, pathname, statusCode) {
        var info = arguments[0];
        if (typeof info === "object") {
          method = info.method;
          pathname = info.url;
          statusCode = info.statusCode;
          headers = info.headers;
        }
        self2.method = typeof method === "number" ? HttpParser.METHODS[method] : method;
        self2.statusCode = statusCode;
        self2.url = pathname;
        if (!headers) return;
        for (var i = 0, n = headers.length, key, value; i < n; i += 2) {
          key = headers[i].toLowerCase();
          value = headers[i + 1];
          if (self2.headers.hasOwnProperty(key))
            self2.headers[key] += ", " + value;
          else
            self2.headers[key] = value;
        }
        self2._complete = true;
      };
    };
    HttpParser.METHODS = {
      0: "DELETE",
      1: "GET",
      2: "HEAD",
      3: "POST",
      4: "PUT",
      5: "CONNECT",
      6: "OPTIONS",
      7: "TRACE",
      8: "COPY",
      9: "LOCK",
      10: "MKCOL",
      11: "MOVE",
      12: "PROPFIND",
      13: "PROPPATCH",
      14: "SEARCH",
      15: "UNLOCK",
      16: "BIND",
      17: "REBIND",
      18: "UNBIND",
      19: "ACL",
      20: "REPORT",
      21: "MKACTIVITY",
      22: "CHECKOUT",
      23: "MERGE",
      24: "M-SEARCH",
      25: "NOTIFY",
      26: "SUBSCRIBE",
      27: "UNSUBSCRIBE",
      28: "PATCH",
      29: "PURGE",
      30: "MKCALENDAR",
      31: "LINK",
      32: "UNLINK"
    };
    var VERSION = process.version ? process.version.match(/[0-9]+/g).map(function(n) {
      return parseInt(n, 10);
    }) : [];
    if (VERSION[0] === 0 && VERSION[1] === 12) {
      HttpParser.METHODS[16] = "REPORT";
      HttpParser.METHODS[17] = "MKACTIVITY";
      HttpParser.METHODS[18] = "CHECKOUT";
      HttpParser.METHODS[19] = "MERGE";
      HttpParser.METHODS[20] = "M-SEARCH";
      HttpParser.METHODS[21] = "NOTIFY";
      HttpParser.METHODS[22] = "SUBSCRIBE";
      HttpParser.METHODS[23] = "UNSUBSCRIBE";
      HttpParser.METHODS[24] = "PATCH";
      HttpParser.METHODS[25] = "PURGE";
    }
    HttpParser.prototype.isComplete = function() {
      return this._complete;
    };
    HttpParser.prototype.parse = function(chunk) {
      var consumed = this._parser.execute(chunk, 0, chunk.length);
      if (typeof consumed !== "number") {
        this.error = consumed;
        this._complete = true;
        return;
      }
      if (this._complete)
        this.body = consumed < chunk.length ? chunk.slice(consumed) : Buffer2.alloc(0);
    };
    module.exports = HttpParser;
  }
});

// node_modules/websocket-extensions/lib/parser.js
var require_parser = __commonJS({
  "node_modules/websocket-extensions/lib/parser.js"(exports, module) {
    "use strict";
    var TOKEN = /([!#\$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+)/;
    var NOTOKEN = /([^!#\$%&'\*\+\-\.\^_`\|~0-9A-Za-z])/g;
    var QUOTED = /"((?:\\[\x00-\x7f]|[^\x00-\x08\x0a-\x1f\x7f"\\])*)"/;
    var PARAM = new RegExp(TOKEN.source + "(?:=(?:" + TOKEN.source + "|" + QUOTED.source + "))?");
    var EXT = new RegExp(TOKEN.source + "(?: *; *" + PARAM.source + ")*", "g");
    var EXT_LIST = new RegExp("^" + EXT.source + "(?: *, *" + EXT.source + ")*$");
    var NUMBER = /^-?(0|[1-9][0-9]*)(\.[0-9]+)?$/;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var Parser = {
      parseHeader: function(header) {
        var offers = new Offers();
        if (header === "" || header === void 0) return offers;
        if (!EXT_LIST.test(header))
          throw new SyntaxError("Invalid Sec-WebSocket-Extensions header: " + header);
        var values = header.match(EXT);
        values.forEach(function(value) {
          var params = value.match(new RegExp(PARAM.source, "g")), name = params.shift(), offer = {};
          params.forEach(function(param) {
            var args = param.match(PARAM), key = args[1], data;
            if (args[2] !== void 0) {
              data = args[2];
            } else if (args[3] !== void 0) {
              data = args[3].replace(/\\/g, "");
            } else {
              data = true;
            }
            if (NUMBER.test(data)) data = parseFloat(data);
            if (hasOwnProperty.call(offer, key)) {
              offer[key] = [].concat(offer[key]);
              offer[key].push(data);
            } else {
              offer[key] = data;
            }
          }, this);
          offers.push(name, offer);
        }, this);
        return offers;
      },
      serializeParams: function(name, params) {
        var values = [];
        var print = function(key2, value) {
          if (value instanceof Array) {
            value.forEach(function(v) {
              print(key2, v);
            });
          } else if (value === true) {
            values.push(key2);
          } else if (typeof value === "number") {
            values.push(key2 + "=" + value);
          } else if (NOTOKEN.test(value)) {
            values.push(key2 + '="' + value.replace(/"/g, '\\"') + '"');
          } else {
            values.push(key2 + "=" + value);
          }
        };
        for (var key in params) print(key, params[key]);
        return [name].concat(values).join("; ");
      }
    };
    var Offers = function() {
      this._byName = {};
      this._inOrder = [];
    };
    Offers.prototype.push = function(name, params) {
      if (!hasOwnProperty.call(this._byName, name))
        this._byName[name] = [];
      this._byName[name].push(params);
      this._inOrder.push({ name, params });
    };
    Offers.prototype.eachOffer = function(callback, context) {
      var list = this._inOrder;
      for (var i = 0, n = list.length; i < n; i++)
        callback.call(context, list[i].name, list[i].params);
    };
    Offers.prototype.byName = function(name) {
      return this._byName[name] || [];
    };
    Offers.prototype.toArray = function() {
      return this._inOrder.slice();
    };
    module.exports = Parser;
  }
});

// node_modules/websocket-extensions/lib/pipeline/ring_buffer.js
var require_ring_buffer = __commonJS({
  "node_modules/websocket-extensions/lib/pipeline/ring_buffer.js"(exports, module) {
    "use strict";
    var RingBuffer = function(bufferSize) {
      this._bufferSize = bufferSize;
      this.clear();
    };
    RingBuffer.prototype.clear = function() {
      this._buffer = new Array(this._bufferSize);
      this._ringOffset = 0;
      this._ringSize = this._bufferSize;
      this._head = 0;
      this._tail = 0;
      this.length = 0;
    };
    RingBuffer.prototype.push = function(value) {
      var expandBuffer = false, expandRing = false;
      if (this._ringSize < this._bufferSize) {
        expandBuffer = this._tail === 0;
      } else if (this._ringOffset === this._ringSize) {
        expandBuffer = true;
        expandRing = this._tail === 0;
      }
      if (expandBuffer) {
        this._tail = this._bufferSize;
        this._buffer = this._buffer.concat(new Array(this._bufferSize));
        this._bufferSize = this._buffer.length;
        if (expandRing)
          this._ringSize = this._bufferSize;
      }
      this._buffer[this._tail] = value;
      this.length += 1;
      if (this._tail < this._ringSize) this._ringOffset += 1;
      this._tail = (this._tail + 1) % this._bufferSize;
    };
    RingBuffer.prototype.peek = function() {
      if (this.length === 0) return void 0;
      return this._buffer[this._head];
    };
    RingBuffer.prototype.shift = function() {
      if (this.length === 0) return void 0;
      var value = this._buffer[this._head];
      this._buffer[this._head] = void 0;
      this.length -= 1;
      this._ringOffset -= 1;
      if (this._ringOffset === 0 && this.length > 0) {
        this._head = this._ringSize;
        this._ringOffset = this.length;
        this._ringSize = this._bufferSize;
      } else {
        this._head = (this._head + 1) % this._ringSize;
      }
      return value;
    };
    module.exports = RingBuffer;
  }
});

// node_modules/websocket-extensions/lib/pipeline/functor.js
var require_functor = __commonJS({
  "node_modules/websocket-extensions/lib/pipeline/functor.js"(exports, module) {
    "use strict";
    var RingBuffer = require_ring_buffer();
    var Functor = function(session, method) {
      this._session = session;
      this._method = method;
      this._queue = new RingBuffer(Functor.QUEUE_SIZE);
      this._stopped = false;
      this.pending = 0;
    };
    Functor.QUEUE_SIZE = 8;
    Functor.prototype.call = function(error, message, callback, context) {
      if (this._stopped) return;
      var record = { error, message, callback, context, done: false }, called = false, self2 = this;
      this._queue.push(record);
      if (record.error) {
        record.done = true;
        this._stop();
        return this._flushQueue();
      }
      var handler = function(err, msg) {
        if (!(called ^ (called = true))) return;
        if (err) {
          self2._stop();
          record.error = err;
          record.message = null;
        } else {
          record.message = msg;
        }
        record.done = true;
        self2._flushQueue();
      };
      try {
        this._session[this._method](message, handler);
      } catch (err) {
        handler(err);
      }
    };
    Functor.prototype._stop = function() {
      this.pending = this._queue.length;
      this._stopped = true;
    };
    Functor.prototype._flushQueue = function() {
      var queue = this._queue, record;
      while (queue.length > 0 && queue.peek().done) {
        record = queue.shift();
        if (record.error) {
          this.pending = 0;
          queue.clear();
        } else {
          this.pending -= 1;
        }
        record.callback.call(record.context, record.error, record.message);
      }
    };
    module.exports = Functor;
  }
});

// node_modules/websocket-extensions/lib/pipeline/pledge.js
var require_pledge = __commonJS({
  "node_modules/websocket-extensions/lib/pipeline/pledge.js"(exports, module) {
    "use strict";
    var RingBuffer = require_ring_buffer();
    var Pledge = function() {
      this._complete = false;
      this._callbacks = new RingBuffer(Pledge.QUEUE_SIZE);
    };
    Pledge.QUEUE_SIZE = 4;
    Pledge.all = function(list) {
      var pledge = new Pledge(), pending = list.length, n = pending;
      if (pending === 0) pledge.done();
      while (n--) list[n].then(function() {
        pending -= 1;
        if (pending === 0) pledge.done();
      });
      return pledge;
    };
    Pledge.prototype.then = function(callback) {
      if (this._complete) callback();
      else this._callbacks.push(callback);
    };
    Pledge.prototype.done = function() {
      this._complete = true;
      var callbacks = this._callbacks, callback;
      while (callback = callbacks.shift()) callback();
    };
    module.exports = Pledge;
  }
});

// node_modules/websocket-extensions/lib/pipeline/cell.js
var require_cell = __commonJS({
  "node_modules/websocket-extensions/lib/pipeline/cell.js"(exports, module) {
    "use strict";
    var Functor = require_functor();
    var Pledge = require_pledge();
    var Cell = function(tuple) {
      this._ext = tuple[0];
      this._session = tuple[1];
      this._functors = {
        incoming: new Functor(this._session, "processIncomingMessage"),
        outgoing: new Functor(this._session, "processOutgoingMessage")
      };
    };
    Cell.prototype.pending = function(direction) {
      var functor = this._functors[direction];
      if (!functor._stopped) functor.pending += 1;
    };
    Cell.prototype.incoming = function(error, message, callback, context) {
      this._exec("incoming", error, message, callback, context);
    };
    Cell.prototype.outgoing = function(error, message, callback, context) {
      this._exec("outgoing", error, message, callback, context);
    };
    Cell.prototype.close = function() {
      this._closed = this._closed || new Pledge();
      this._doClose();
      return this._closed;
    };
    Cell.prototype._exec = function(direction, error, message, callback, context) {
      this._functors[direction].call(error, message, function(err, msg) {
        if (err) err.message = this._ext.name + ": " + err.message;
        callback.call(context, err, msg);
        this._doClose();
      }, this);
    };
    Cell.prototype._doClose = function() {
      var fin = this._functors.incoming, fout = this._functors.outgoing;
      if (!this._closed || fin.pending + fout.pending !== 0) return;
      if (this._session) this._session.close();
      this._session = null;
      this._closed.done();
    };
    module.exports = Cell;
  }
});

// node_modules/websocket-extensions/lib/pipeline/index.js
var require_pipeline = __commonJS({
  "node_modules/websocket-extensions/lib/pipeline/index.js"(exports, module) {
    "use strict";
    var Cell = require_cell();
    var Pledge = require_pledge();
    var Pipeline = function(sessions) {
      this._cells = sessions.map(function(session) {
        return new Cell(session);
      });
      this._stopped = { incoming: false, outgoing: false };
    };
    Pipeline.prototype.processIncomingMessage = function(message, callback, context) {
      if (this._stopped.incoming) return;
      this._loop("incoming", this._cells.length - 1, -1, -1, message, callback, context);
    };
    Pipeline.prototype.processOutgoingMessage = function(message, callback, context) {
      if (this._stopped.outgoing) return;
      this._loop("outgoing", 0, this._cells.length, 1, message, callback, context);
    };
    Pipeline.prototype.close = function(callback, context) {
      this._stopped = { incoming: true, outgoing: true };
      var closed = this._cells.map(function(a) {
        return a.close();
      });
      if (callback)
        Pledge.all(closed).then(function() {
          callback.call(context);
        });
    };
    Pipeline.prototype._loop = function(direction, start, end, step, message, callback, context) {
      var cells = this._cells, n = cells.length, self2 = this;
      while (n--) cells[n].pending(direction);
      var pipe = function(index, error, msg) {
        if (index === end) return callback.call(context, error, msg);
        cells[index][direction](error, msg, function(err, m) {
          if (err) self2._stopped[direction] = true;
          pipe(index + step, err, m);
        });
      };
      pipe(start, null, message);
    };
    module.exports = Pipeline;
  }
});

// node_modules/websocket-extensions/lib/websocket_extensions.js
var require_websocket_extensions = __commonJS({
  "node_modules/websocket-extensions/lib/websocket_extensions.js"(exports, module) {
    "use strict";
    var Parser = require_parser();
    var Pipeline = require_pipeline();
    var Extensions = function() {
      this._rsv1 = this._rsv2 = this._rsv3 = null;
      this._byName = {};
      this._inOrder = [];
      this._sessions = [];
      this._index = {};
    };
    Extensions.MESSAGE_OPCODES = [1, 2];
    var instance = {
      add: function(ext) {
        if (typeof ext.name !== "string") throw new TypeError("extension.name must be a string");
        if (ext.type !== "permessage") throw new TypeError('extension.type must be "permessage"');
        if (typeof ext.rsv1 !== "boolean") throw new TypeError("extension.rsv1 must be true or false");
        if (typeof ext.rsv2 !== "boolean") throw new TypeError("extension.rsv2 must be true or false");
        if (typeof ext.rsv3 !== "boolean") throw new TypeError("extension.rsv3 must be true or false");
        if (this._byName.hasOwnProperty(ext.name))
          throw new TypeError('An extension with name "' + ext.name + '" is already registered');
        this._byName[ext.name] = ext;
        this._inOrder.push(ext);
      },
      generateOffer: function() {
        var sessions = [], offer = [], index = {};
        this._inOrder.forEach(function(ext) {
          var session = ext.createClientSession();
          if (!session) return;
          var record = [ext, session];
          sessions.push(record);
          index[ext.name] = record;
          var offers = session.generateOffer();
          offers = offers ? [].concat(offers) : [];
          offers.forEach(function(off) {
            offer.push(Parser.serializeParams(ext.name, off));
          }, this);
        }, this);
        this._sessions = sessions;
        this._index = index;
        return offer.length > 0 ? offer.join(", ") : null;
      },
      activate: function(header) {
        var responses = Parser.parseHeader(header), sessions = [];
        responses.eachOffer(function(name, params) {
          var record = this._index[name];
          if (!record)
            throw new Error('Server sent an extension response for unknown extension "' + name + '"');
          var ext = record[0], session = record[1], reserved = this._reserved(ext);
          if (reserved)
            throw new Error("Server sent two extension responses that use the RSV" + reserved[0] + ' bit: "' + reserved[1] + '" and "' + ext.name + '"');
          if (session.activate(params) !== true)
            throw new Error("Server sent unacceptable extension parameters: " + Parser.serializeParams(name, params));
          this._reserve(ext);
          sessions.push(record);
        }, this);
        this._sessions = sessions;
        this._pipeline = new Pipeline(sessions);
      },
      generateResponse: function(header) {
        var sessions = [], response = [], offers = Parser.parseHeader(header);
        this._inOrder.forEach(function(ext) {
          var offer = offers.byName(ext.name);
          if (offer.length === 0 || this._reserved(ext)) return;
          var session = ext.createServerSession(offer);
          if (!session) return;
          this._reserve(ext);
          sessions.push([ext, session]);
          response.push(Parser.serializeParams(ext.name, session.generateResponse()));
        }, this);
        this._sessions = sessions;
        this._pipeline = new Pipeline(sessions);
        return response.length > 0 ? response.join(", ") : null;
      },
      validFrameRsv: function(frame) {
        var allowed = { rsv1: false, rsv2: false, rsv3: false }, ext;
        if (Extensions.MESSAGE_OPCODES.indexOf(frame.opcode) >= 0) {
          for (var i = 0, n = this._sessions.length; i < n; i++) {
            ext = this._sessions[i][0];
            allowed.rsv1 = allowed.rsv1 || ext.rsv1;
            allowed.rsv2 = allowed.rsv2 || ext.rsv2;
            allowed.rsv3 = allowed.rsv3 || ext.rsv3;
          }
        }
        return (allowed.rsv1 || !frame.rsv1) && (allowed.rsv2 || !frame.rsv2) && (allowed.rsv3 || !frame.rsv3);
      },
      processIncomingMessage: function(message, callback, context) {
        this._pipeline.processIncomingMessage(message, callback, context);
      },
      processOutgoingMessage: function(message, callback, context) {
        this._pipeline.processOutgoingMessage(message, callback, context);
      },
      close: function(callback, context) {
        if (!this._pipeline) return callback.call(context);
        this._pipeline.close(callback, context);
      },
      _reserve: function(ext) {
        this._rsv1 = this._rsv1 || ext.rsv1 && ext.name;
        this._rsv2 = this._rsv2 || ext.rsv2 && ext.name;
        this._rsv3 = this._rsv3 || ext.rsv3 && ext.name;
      },
      _reserved: function(ext) {
        if (this._rsv1 && ext.rsv1) return [1, this._rsv1];
        if (this._rsv2 && ext.rsv2) return [2, this._rsv2];
        if (this._rsv3 && ext.rsv3) return [3, this._rsv3];
        return false;
      }
    };
    for (key in instance)
      Extensions.prototype[key] = instance[key];
    var key;
    module.exports = Extensions;
  }
});

// node_modules/websocket-driver/lib/websocket/driver/hybi/frame.js
var require_frame = __commonJS({
  "node_modules/websocket-driver/lib/websocket/driver/hybi/frame.js"(exports, module) {
    "use strict";
    var Frame = function() {
    };
    var instance = {
      final: false,
      rsv1: false,
      rsv2: false,
      rsv3: false,
      opcode: null,
      masked: false,
      maskingKey: null,
      lengthBytes: 1,
      length: 0,
      payload: null
    };
    for (key in instance)
      Frame.prototype[key] = instance[key];
    var key;
    module.exports = Frame;
  }
});

// node_modules/websocket-driver/lib/websocket/driver/hybi/message.js
var require_message = __commonJS({
  "node_modules/websocket-driver/lib/websocket/driver/hybi/message.js"(exports, module) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var Message = function() {
      this.rsv1 = false;
      this.rsv2 = false;
      this.rsv3 = false;
      this.opcode = null;
      this.length = 0;
      this._chunks = [];
    };
    var instance = {
      read: function() {
        return this.data = this.data || Buffer2.concat(this._chunks, this.length);
      },
      pushFrame: function(frame) {
        this.rsv1 = this.rsv1 || frame.rsv1;
        this.rsv2 = this.rsv2 || frame.rsv2;
        this.rsv3 = this.rsv3 || frame.rsv3;
        if (this.opcode === null) this.opcode = frame.opcode;
        this._chunks.push(frame.payload);
        this.length += frame.length;
      }
    };
    for (key in instance)
      Message.prototype[key] = instance[key];
    var key;
    module.exports = Message;
  }
});

// node_modules/websocket-driver/lib/websocket/driver/hybi.js
var require_hybi = __commonJS({
  "node_modules/websocket-driver/lib/websocket/driver/hybi.js"(exports, module) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var crypto = __require("crypto");
    var util = __require("util");
    var Extensions = require_websocket_extensions();
    var Base = require_base();
    var Frame = require_frame();
    var Message = require_message();
    var Hybi = function(request, url, options) {
      Base.apply(this, arguments);
      this._extensions = new Extensions();
      this._stage = 0;
      this._masking = this._options.masking;
      this._protocols = this._options.protocols || [];
      this._requireMasking = this._options.requireMasking;
      this._pingCallbacks = {};
      if (typeof this._protocols === "string")
        this._protocols = this._protocols.split(/ *, */);
      if (!this._request) return;
      var protos = this._request.headers["sec-websocket-protocol"], supported = this._protocols;
      if (protos !== void 0) {
        if (typeof protos === "string") protos = protos.split(/ *, */);
        this.protocol = protos.filter(function(p) {
          return supported.indexOf(p) >= 0;
        })[0];
      }
      this.version = "hybi-" + Hybi.VERSION;
    };
    util.inherits(Hybi, Base);
    Hybi.VERSION = "13";
    Hybi.mask = function(payload, mask, offset) {
      if (!mask || mask.length === 0) return payload;
      offset = offset || 0;
      for (var i = 0, n = payload.length - offset; i < n; i++) {
        payload[offset + i] = payload[offset + i] ^ mask[i % 4];
      }
      return payload;
    };
    Hybi.generateAccept = function(key2) {
      var sha1 = crypto.createHash("sha1");
      sha1.update(key2 + Hybi.GUID);
      return sha1.digest("base64");
    };
    Hybi.GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    var instance = {
      FIN: 128,
      MASK: 128,
      RSV1: 64,
      RSV2: 32,
      RSV3: 16,
      OPCODE: 15,
      LENGTH: 127,
      OPCODES: {
        continuation: 0,
        text: 1,
        binary: 2,
        close: 8,
        ping: 9,
        pong: 10
      },
      OPCODE_CODES: [0, 1, 2, 8, 9, 10],
      MESSAGE_OPCODES: [0, 1, 2],
      OPENING_OPCODES: [1, 2],
      ERRORS: {
        normal_closure: 1e3,
        going_away: 1001,
        protocol_error: 1002,
        unacceptable: 1003,
        encoding_error: 1007,
        policy_violation: 1008,
        too_large: 1009,
        extension_error: 1010,
        unexpected_condition: 1011
      },
      ERROR_CODES: [1e3, 1001, 1002, 1003, 1007, 1008, 1009, 1010, 1011],
      DEFAULT_ERROR_CODE: 1e3,
      MIN_RESERVED_ERROR: 3e3,
      MAX_RESERVED_ERROR: 4999,
      // http://www.w3.org/International/questions/qa-forms-utf-8.en.php
      UTF8_MATCH: /^([\x00-\x7F]|[\xC2-\xDF][\x80-\xBF]|\xE0[\xA0-\xBF][\x80-\xBF]|[\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}|\xED[\x80-\x9F][\x80-\xBF]|\xF0[\x90-\xBF][\x80-\xBF]{2}|[\xF1-\xF3][\x80-\xBF]{3}|\xF4[\x80-\x8F][\x80-\xBF]{2})*$/,
      addExtension: function(extension) {
        this._extensions.add(extension);
        return true;
      },
      parse: function(chunk) {
        this._reader.put(chunk);
        var buffer = true;
        while (buffer) {
          switch (this._stage) {
            case 0:
              buffer = this._reader.read(1);
              if (buffer) this._parseOpcode(buffer[0]);
              break;
            case 1:
              buffer = this._reader.read(1);
              if (buffer) this._parseLength(buffer[0]);
              break;
            case 2:
              buffer = this._reader.read(this._frame.lengthBytes);
              if (buffer) this._parseExtendedLength(buffer);
              break;
            case 3:
              buffer = this._reader.read(4);
              if (buffer) {
                this._stage = 4;
                this._frame.maskingKey = buffer;
              }
              break;
            case 4:
              buffer = this._reader.read(this._frame.length);
              if (buffer) {
                this._stage = 0;
                this._emitFrame(buffer);
              }
              break;
            default:
              buffer = null;
          }
        }
      },
      text: function(message) {
        if (this.readyState > 1) return false;
        return this.frame(message, "text");
      },
      binary: function(message) {
        if (this.readyState > 1) return false;
        return this.frame(message, "binary");
      },
      ping: function(message, callback) {
        if (this.readyState > 1) return false;
        message = message || "";
        if (callback) this._pingCallbacks[message] = callback;
        return this.frame(message, "ping");
      },
      pong: function(message) {
        if (this.readyState > 1) return false;
        message = message || "";
        return this.frame(message, "pong");
      },
      close: function(reason, code) {
        reason = reason || "";
        code = code || this.ERRORS.normal_closure;
        if (this.readyState <= 0) {
          this.readyState = 3;
          this.emit("close", new Base.CloseEvent(code, reason));
          return true;
        } else if (this.readyState === 1) {
          this.readyState = 2;
          this._extensions.close(function() {
            this.frame(reason, "close", code);
          }, this);
          return true;
        } else {
          return false;
        }
      },
      frame: function(buffer, type, code) {
        if (this.readyState <= 0) return this._queue([buffer, type, code]);
        if (this.readyState > 2) return false;
        if (buffer instanceof Array) buffer = Buffer2.from(buffer);
        if (typeof buffer === "number") buffer = buffer.toString();
        var message = new Message(), isText = typeof buffer === "string", payload, copy;
        message.rsv1 = message.rsv2 = message.rsv3 = false;
        message.opcode = this.OPCODES[type || (isText ? "text" : "binary")];
        payload = isText ? Buffer2.from(buffer, "utf8") : buffer;
        if (code) {
          copy = payload;
          payload = Buffer2.allocUnsafe(2 + copy.length);
          payload.writeUInt16BE(code, 0);
          copy.copy(payload, 2);
        }
        message.data = payload;
        var onMessageReady = function(message2) {
          var frame = new Frame();
          frame.final = true;
          frame.rsv1 = message2.rsv1;
          frame.rsv2 = message2.rsv2;
          frame.rsv3 = message2.rsv3;
          frame.opcode = message2.opcode;
          frame.masked = !!this._masking;
          frame.length = message2.data.length;
          frame.payload = message2.data;
          if (frame.masked) frame.maskingKey = crypto.randomBytes(4);
          this._sendFrame(frame);
        };
        if (this.MESSAGE_OPCODES.indexOf(message.opcode) >= 0)
          this._extensions.processOutgoingMessage(message, function(error, message2) {
            if (error) return this._fail("extension_error", error.message);
            onMessageReady.call(this, message2);
          }, this);
        else
          onMessageReady.call(this, message);
        return true;
      },
      _sendFrame: function(frame) {
        var length = frame.length, header = length <= 125 ? 2 : length <= 65535 ? 4 : 10, offset = header + (frame.masked ? 4 : 0), buffer = Buffer2.allocUnsafe(offset + length), masked = frame.masked ? this.MASK : 0;
        buffer[0] = (frame.final ? this.FIN : 0) | (frame.rsv1 ? this.RSV1 : 0) | (frame.rsv2 ? this.RSV2 : 0) | (frame.rsv3 ? this.RSV3 : 0) | frame.opcode;
        if (length <= 125) {
          buffer[1] = masked | length;
        } else if (length <= 65535) {
          buffer[1] = masked | 126;
          buffer.writeUInt16BE(length, 2);
        } else {
          buffer[1] = masked | 127;
          buffer.writeUInt32BE(Math.floor(length / 4294967296), 2);
          buffer.writeUInt32BE(length % 4294967296, 6);
        }
        frame.payload.copy(buffer, offset);
        if (frame.masked) {
          frame.maskingKey.copy(buffer, header);
          Hybi.mask(buffer, frame.maskingKey, offset);
        }
        this._write(buffer);
      },
      _handshakeResponse: function() {
        var secKey = this._request.headers["sec-websocket-key"], version = this._request.headers["sec-websocket-version"];
        if (version !== Hybi.VERSION)
          throw new Error("Unsupported WebSocket version: " + version);
        if (typeof secKey !== "string")
          throw new Error("Missing handshake request header: Sec-WebSocket-Key");
        this._headers.set("Upgrade", "websocket");
        this._headers.set("Connection", "Upgrade");
        this._headers.set("Sec-WebSocket-Accept", Hybi.generateAccept(secKey));
        if (this.protocol) this._headers.set("Sec-WebSocket-Protocol", this.protocol);
        var extensions = this._extensions.generateResponse(this._request.headers["sec-websocket-extensions"]);
        if (extensions) this._headers.set("Sec-WebSocket-Extensions", extensions);
        var start = "HTTP/1.1 101 Switching Protocols", headers = [start, this._headers.toString(), ""];
        return Buffer2.from(headers.join("\r\n"), "utf8");
      },
      _shutdown: function(code, reason, error) {
        delete this._frame;
        delete this._message;
        this._stage = 5;
        var sendCloseFrame = this.readyState === 1;
        this.readyState = 2;
        this._extensions.close(function() {
          if (sendCloseFrame) this.frame(reason, "close", code);
          this.readyState = 3;
          if (error) this.emit("error", new Error(reason));
          this.emit("close", new Base.CloseEvent(code, reason));
        }, this);
      },
      _fail: function(type, message) {
        if (this.readyState > 1) return;
        this._shutdown(this.ERRORS[type], message, true);
      },
      _parseOpcode: function(octet) {
        var rsvs = [this.RSV1, this.RSV2, this.RSV3].map(function(rsv) {
          return (octet & rsv) === rsv;
        });
        var frame = this._frame = new Frame();
        frame.final = (octet & this.FIN) === this.FIN;
        frame.rsv1 = rsvs[0];
        frame.rsv2 = rsvs[1];
        frame.rsv3 = rsvs[2];
        frame.opcode = octet & this.OPCODE;
        this._stage = 1;
        if (!this._extensions.validFrameRsv(frame))
          return this._fail(
            "protocol_error",
            "One or more reserved bits are on: reserved1 = " + (frame.rsv1 ? 1 : 0) + ", reserved2 = " + (frame.rsv2 ? 1 : 0) + ", reserved3 = " + (frame.rsv3 ? 1 : 0)
          );
        if (this.OPCODE_CODES.indexOf(frame.opcode) < 0)
          return this._fail("protocol_error", "Unrecognized frame opcode: " + frame.opcode);
        if (this.MESSAGE_OPCODES.indexOf(frame.opcode) < 0 && !frame.final)
          return this._fail("protocol_error", "Received fragmented control frame: opcode = " + frame.opcode);
        if (this._message && this.OPENING_OPCODES.indexOf(frame.opcode) >= 0)
          return this._fail("protocol_error", "Received new data frame but previous continuous frame is unfinished");
      },
      _parseLength: function(octet) {
        var frame = this._frame;
        frame.masked = (octet & this.MASK) === this.MASK;
        frame.length = octet & this.LENGTH;
        if (frame.length >= 0 && frame.length <= 125) {
          this._stage = frame.masked ? 3 : 4;
          if (!this._checkFrameLength()) return;
        } else {
          this._stage = 2;
          frame.lengthBytes = frame.length === 126 ? 2 : 8;
        }
        if (this._requireMasking && !frame.masked)
          return this._fail("unacceptable", "Received unmasked frame but masking is required");
      },
      _parseExtendedLength: function(buffer) {
        var frame = this._frame;
        frame.length = this._readUInt(buffer);
        this._stage = frame.masked ? 3 : 4;
        if (this.MESSAGE_OPCODES.indexOf(frame.opcode) < 0 && frame.length > 125)
          return this._fail("protocol_error", "Received control frame having too long payload: " + frame.length);
        if (!this._checkFrameLength()) return;
      },
      _checkFrameLength: function() {
        var length = this._message ? this._message.length : 0;
        if (length + this._frame.length > this._maxLength) {
          this._fail("too_large", "WebSocket frame length too large");
          return false;
        } else {
          return true;
        }
      },
      _emitFrame: function(buffer) {
        var frame = this._frame, payload = frame.payload = Hybi.mask(buffer, frame.maskingKey), opcode = frame.opcode, message, code, reason, callbacks, callback;
        delete this._frame;
        if (opcode === this.OPCODES.continuation) {
          if (!this._message) return this._fail("protocol_error", "Received unexpected continuation frame");
          this._message.pushFrame(frame);
        }
        if (opcode === this.OPCODES.text || opcode === this.OPCODES.binary) {
          this._message = new Message();
          this._message.pushFrame(frame);
        }
        if (frame.final && this.MESSAGE_OPCODES.indexOf(opcode) >= 0)
          return this._emitMessage(this._message);
        if (opcode === this.OPCODES.close) {
          code = payload.length >= 2 ? payload.readUInt16BE(0) : null;
          reason = payload.length > 2 ? this._encode(payload.slice(2)) : null;
          if (!(payload.length === 0) && !(code !== null && code >= this.MIN_RESERVED_ERROR && code <= this.MAX_RESERVED_ERROR) && this.ERROR_CODES.indexOf(code) < 0)
            code = this.ERRORS.protocol_error;
          if (payload.length > 125 || payload.length > 2 && !reason)
            code = this.ERRORS.protocol_error;
          this._shutdown(code || this.DEFAULT_ERROR_CODE, reason || "");
        }
        if (opcode === this.OPCODES.ping) {
          this.frame(payload, "pong");
          this.emit("ping", new Base.PingEvent(payload.toString()));
        }
        if (opcode === this.OPCODES.pong) {
          callbacks = this._pingCallbacks;
          message = this._encode(payload);
          callback = callbacks[message];
          delete callbacks[message];
          if (callback) callback();
          this.emit("pong", new Base.PongEvent(payload.toString()));
        }
      },
      _emitMessage: function(message) {
        var message = this._message;
        message.read();
        delete this._message;
        this._extensions.processIncomingMessage(message, function(error, message2) {
          if (error) return this._fail("extension_error", error.message);
          var payload = message2.data;
          if (message2.opcode === this.OPCODES.text) payload = this._encode(payload);
          if (payload === null)
            return this._fail("encoding_error", "Could not decode a text frame as UTF-8");
          else
            this.emit("message", new Base.MessageEvent(payload));
        }, this);
      },
      _encode: function(buffer) {
        try {
          var string = buffer.toString("binary", 0, buffer.length);
          if (!this.UTF8_MATCH.test(string)) return null;
        } catch (e) {
        }
        return buffer.toString("utf8", 0, buffer.length);
      },
      _readUInt: function(buffer) {
        if (buffer.length === 2) return buffer.readUInt16BE(0);
        return buffer.readUInt32BE(0) * 4294967296 + buffer.readUInt32BE(4);
      }
    };
    for (key in instance)
      Hybi.prototype[key] = instance[key];
    var key;
    module.exports = Hybi;
  }
});

// node_modules/websocket-driver/lib/websocket/driver/proxy.js
var require_proxy = __commonJS({
  "node_modules/websocket-driver/lib/websocket/driver/proxy.js"(exports, module) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var Stream = __require("stream").Stream;
    var url = __require("url");
    var util = __require("util");
    var Base = require_base();
    var Headers = require_headers();
    var HttpParser = require_http_parser2();
    var PORTS = { "ws:": 80, "wss:": 443 };
    var Proxy = function(client, origin, options) {
      this._client = client;
      this._http = new HttpParser("response");
      this._origin = typeof client.url === "object" ? client.url : url.parse(client.url);
      this._url = typeof origin === "object" ? origin : url.parse(origin);
      this._options = options || {};
      this._state = 0;
      this.readable = this.writable = true;
      this._paused = false;
      this._headers = new Headers();
      this._headers.set("Host", this._origin.host);
      this._headers.set("Connection", "keep-alive");
      this._headers.set("Proxy-Connection", "keep-alive");
      var auth = this._url.auth && Buffer2.from(this._url.auth, "utf8").toString("base64");
      if (auth) this._headers.set("Proxy-Authorization", "Basic " + auth);
    };
    util.inherits(Proxy, Stream);
    var instance = {
      setHeader: function(name, value) {
        if (this._state !== 0) return false;
        this._headers.set(name, value);
        return true;
      },
      start: function() {
        if (this._state !== 0) return false;
        this._state = 1;
        var origin = this._origin, port = origin.port || PORTS[origin.protocol], start = "CONNECT " + origin.hostname + ":" + port + " HTTP/1.1";
        var headers = [start, this._headers.toString(), ""];
        this.emit("data", Buffer2.from(headers.join("\r\n"), "utf8"));
        return true;
      },
      pause: function() {
        this._paused = true;
      },
      resume: function() {
        this._paused = false;
        this.emit("drain");
      },
      write: function(chunk) {
        if (!this.writable) return false;
        this._http.parse(chunk);
        if (!this._http.isComplete()) return !this._paused;
        this.statusCode = this._http.statusCode;
        this.headers = this._http.headers;
        if (this.statusCode === 200) {
          this.emit("connect", new Base.ConnectEvent());
        } else {
          var message = "Can't establish a connection to the server at " + this._origin.href;
          this.emit("error", new Error(message));
        }
        this.end();
        return !this._paused;
      },
      end: function(chunk) {
        if (!this.writable) return;
        if (chunk !== void 0) this.write(chunk);
        this.readable = this.writable = false;
        this.emit("close");
        this.emit("end");
      },
      destroy: function() {
        this.end();
      }
    };
    for (key in instance)
      Proxy.prototype[key] = instance[key];
    var key;
    module.exports = Proxy;
  }
});

// node_modules/websocket-driver/lib/websocket/driver/client.js
var require_client = __commonJS({
  "node_modules/websocket-driver/lib/websocket/driver/client.js"(exports, module) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var crypto = __require("crypto");
    var url = __require("url");
    var util = __require("util");
    var HttpParser = require_http_parser2();
    var Base = require_base();
    var Hybi = require_hybi();
    var Proxy = require_proxy();
    var Client = function(_url, options) {
      this.version = "hybi-" + Hybi.VERSION;
      Hybi.call(this, null, _url, options);
      this.readyState = -1;
      this._key = Client.generateKey();
      this._accept = Hybi.generateAccept(this._key);
      this._http = new HttpParser("response");
      var uri = url.parse(this.url), auth = uri.auth && Buffer2.from(uri.auth, "utf8").toString("base64");
      if (this.VALID_PROTOCOLS.indexOf(uri.protocol) < 0)
        throw new Error(this.url + " is not a valid WebSocket URL");
      this._pathname = (uri.pathname || "/") + (uri.search || "");
      this._headers.set("Host", uri.host);
      this._headers.set("Upgrade", "websocket");
      this._headers.set("Connection", "Upgrade");
      this._headers.set("Sec-WebSocket-Key", this._key);
      this._headers.set("Sec-WebSocket-Version", Hybi.VERSION);
      if (this._protocols.length > 0)
        this._headers.set("Sec-WebSocket-Protocol", this._protocols.join(", "));
      if (auth)
        this._headers.set("Authorization", "Basic " + auth);
    };
    util.inherits(Client, Hybi);
    Client.generateKey = function() {
      return crypto.randomBytes(16).toString("base64");
    };
    var instance = {
      VALID_PROTOCOLS: ["ws:", "wss:"],
      proxy: function(origin, options) {
        return new Proxy(this, origin, options);
      },
      start: function() {
        if (this.readyState !== -1) return false;
        this._write(this._handshakeRequest());
        this.readyState = 0;
        return true;
      },
      parse: function(chunk) {
        if (this.readyState === 3) return;
        if (this.readyState > 0) return Hybi.prototype.parse.call(this, chunk);
        this._http.parse(chunk);
        if (!this._http.isComplete()) return;
        this._validateHandshake();
        if (this.readyState === 3) return;
        this._open();
        this.parse(this._http.body);
      },
      _handshakeRequest: function() {
        var extensions = this._extensions.generateOffer();
        if (extensions)
          this._headers.set("Sec-WebSocket-Extensions", extensions);
        var start = "GET " + this._pathname + " HTTP/1.1", headers = [start, this._headers.toString(), ""];
        return Buffer2.from(headers.join("\r\n"), "utf8");
      },
      _failHandshake: function(message) {
        message = "Error during WebSocket handshake: " + message;
        this.readyState = 3;
        this.emit("error", new Error(message));
        this.emit("close", new Base.CloseEvent(this.ERRORS.protocol_error, message));
      },
      _validateHandshake: function() {
        this.statusCode = this._http.statusCode;
        this.headers = this._http.headers;
        if (this._http.error)
          return this._failHandshake(this._http.error.message);
        if (this._http.statusCode !== 101)
          return this._failHandshake("Unexpected response code: " + this._http.statusCode);
        var headers = this._http.headers, upgrade = headers["upgrade"] || "", connection = headers["connection"] || "", accept = headers["sec-websocket-accept"] || "", protocol = headers["sec-websocket-protocol"] || "";
        if (upgrade === "")
          return this._failHandshake("'Upgrade' header is missing");
        if (upgrade.toLowerCase() !== "websocket")
          return this._failHandshake("'Upgrade' header value is not 'WebSocket'");
        if (connection === "")
          return this._failHandshake("'Connection' header is missing");
        if (connection.toLowerCase() !== "upgrade")
          return this._failHandshake("'Connection' header value is not 'Upgrade'");
        if (accept !== this._accept)
          return this._failHandshake("Sec-WebSocket-Accept mismatch");
        this.protocol = null;
        if (protocol !== "") {
          if (this._protocols.indexOf(protocol) < 0)
            return this._failHandshake("Sec-WebSocket-Protocol mismatch");
          else
            this.protocol = protocol;
        }
        try {
          this._extensions.activate(this.headers["sec-websocket-extensions"]);
        } catch (e) {
          return this._failHandshake(e.message);
        }
      }
    };
    for (key in instance)
      Client.prototype[key] = instance[key];
    var key;
    module.exports = Client;
  }
});

// node_modules/websocket-driver/lib/websocket/driver/draft75.js
var require_draft75 = __commonJS({
  "node_modules/websocket-driver/lib/websocket/driver/draft75.js"(exports, module) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var Base = require_base();
    var util = __require("util");
    var Draft75 = function(request, url, options) {
      Base.apply(this, arguments);
      this._stage = 0;
      this.version = "hixie-75";
      this._headers.set("Upgrade", "WebSocket");
      this._headers.set("Connection", "Upgrade");
      this._headers.set("WebSocket-Origin", this._request.headers.origin);
      this._headers.set("WebSocket-Location", this.url);
    };
    util.inherits(Draft75, Base);
    var instance = {
      close: function() {
        if (this.readyState === 3) return false;
        this.readyState = 3;
        this.emit("close", new Base.CloseEvent(null, null));
        return true;
      },
      parse: function(chunk) {
        if (this.readyState > 1) return;
        this._reader.put(chunk);
        this._reader.eachByte(function(octet) {
          var message;
          switch (this._stage) {
            case -1:
              this._body.push(octet);
              this._sendHandshakeBody();
              break;
            case 0:
              this._parseLeadingByte(octet);
              break;
            case 1:
              this._length = (octet & 127) + 128 * this._length;
              if (this._closing && this._length === 0) {
                return this.close();
              } else if ((octet & 128) !== 128) {
                if (this._length === 0) {
                  this._stage = 0;
                } else {
                  this._skipped = 0;
                  this._stage = 2;
                }
              }
              break;
            case 2:
              if (octet === 255) {
                this._stage = 0;
                message = Buffer2.from(this._buffer).toString("utf8", 0, this._buffer.length);
                this.emit("message", new Base.MessageEvent(message));
              } else {
                if (this._length) {
                  this._skipped += 1;
                  if (this._skipped === this._length)
                    this._stage = 0;
                } else {
                  this._buffer.push(octet);
                  if (this._buffer.length > this._maxLength) return this.close();
                }
              }
              break;
          }
        }, this);
      },
      frame: function(buffer) {
        if (this.readyState === 0) return this._queue([buffer]);
        if (this.readyState > 1) return false;
        if (typeof buffer !== "string") buffer = buffer.toString();
        var length = Buffer2.byteLength(buffer), frame = Buffer2.allocUnsafe(length + 2);
        frame[0] = 0;
        frame.write(buffer, 1);
        frame[frame.length - 1] = 255;
        this._write(frame);
        return true;
      },
      _handshakeResponse: function() {
        var start = "HTTP/1.1 101 Web Socket Protocol Handshake", headers = [start, this._headers.toString(), ""];
        return Buffer2.from(headers.join("\r\n"), "utf8");
      },
      _parseLeadingByte: function(octet) {
        if ((octet & 128) === 128) {
          this._length = 0;
          this._stage = 1;
        } else {
          delete this._length;
          delete this._skipped;
          this._buffer = [];
          this._stage = 2;
        }
      }
    };
    for (key in instance)
      Draft75.prototype[key] = instance[key];
    var key;
    module.exports = Draft75;
  }
});

// node_modules/websocket-driver/lib/websocket/driver/draft76.js
var require_draft76 = __commonJS({
  "node_modules/websocket-driver/lib/websocket/driver/draft76.js"(exports, module) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var Base = require_base();
    var Draft75 = require_draft75();
    var crypto = __require("crypto");
    var util = __require("util");
    var numberFromKey = function(key2) {
      return parseInt((key2.match(/[0-9]/g) || []).join(""), 10);
    };
    var spacesInKey = function(key2) {
      return (key2.match(/ /g) || []).length;
    };
    var Draft76 = function(request, url, options) {
      Draft75.apply(this, arguments);
      this._stage = -1;
      this._body = [];
      this.version = "hixie-76";
      this._headers.clear();
      this._headers.set("Upgrade", "WebSocket");
      this._headers.set("Connection", "Upgrade");
      this._headers.set("Sec-WebSocket-Origin", this._request.headers.origin);
      this._headers.set("Sec-WebSocket-Location", this.url);
    };
    util.inherits(Draft76, Draft75);
    var instance = {
      BODY_SIZE: 8,
      start: function() {
        if (!Draft75.prototype.start.call(this)) return false;
        this._started = true;
        this._sendHandshakeBody();
        return true;
      },
      close: function() {
        if (this.readyState === 3) return false;
        if (this.readyState === 1) this._write(Buffer2.from([255, 0]));
        this.readyState = 3;
        this.emit("close", new Base.CloseEvent(null, null));
        return true;
      },
      _handshakeResponse: function() {
        var headers = this._request.headers, key1 = headers["sec-websocket-key1"], key2 = headers["sec-websocket-key2"];
        if (!key1) throw new Error("Missing required header: Sec-WebSocket-Key1");
        if (!key2) throw new Error("Missing required header: Sec-WebSocket-Key2");
        var number1 = numberFromKey(key1), spaces1 = spacesInKey(key1), number2 = numberFromKey(key2), spaces2 = spacesInKey(key2);
        if (number1 % spaces1 !== 0 || number2 % spaces2 !== 0)
          throw new Error("Client sent invalid Sec-WebSocket-Key headers");
        this._keyValues = [number1 / spaces1, number2 / spaces2];
        var start = "HTTP/1.1 101 WebSocket Protocol Handshake", headers = [start, this._headers.toString(), ""];
        return Buffer2.from(headers.join("\r\n"), "binary");
      },
      _handshakeSignature: function() {
        if (this._body.length < this.BODY_SIZE) return null;
        var md5 = crypto.createHash("md5"), buffer = Buffer2.allocUnsafe(8 + this.BODY_SIZE);
        buffer.writeUInt32BE(this._keyValues[0], 0);
        buffer.writeUInt32BE(this._keyValues[1], 4);
        Buffer2.from(this._body).copy(buffer, 8, 0, this.BODY_SIZE);
        md5.update(buffer);
        return Buffer2.from(md5.digest("binary"), "binary");
      },
      _sendHandshakeBody: function() {
        if (!this._started) return;
        var signature = this._handshakeSignature();
        if (!signature) return;
        this._write(signature);
        this._stage = 0;
        this._open();
        if (this._body.length > this.BODY_SIZE)
          this.parse(this._body.slice(this.BODY_SIZE));
      },
      _parseLeadingByte: function(octet) {
        if (octet !== 255)
          return Draft75.prototype._parseLeadingByte.call(this, octet);
        this._closing = true;
        this._length = 0;
        this._stage = 1;
      }
    };
    for (key in instance)
      Draft76.prototype[key] = instance[key];
    var key;
    module.exports = Draft76;
  }
});

// node_modules/websocket-driver/lib/websocket/driver/server.js
var require_server = __commonJS({
  "node_modules/websocket-driver/lib/websocket/driver/server.js"(exports, module) {
    "use strict";
    var util = __require("util");
    var HttpParser = require_http_parser2();
    var Base = require_base();
    var Draft75 = require_draft75();
    var Draft76 = require_draft76();
    var Hybi = require_hybi();
    var Server = function(options) {
      Base.call(this, null, null, options);
      this._http = new HttpParser("request");
    };
    util.inherits(Server, Base);
    var instance = {
      EVENTS: ["open", "message", "error", "close", "ping", "pong"],
      _bindEventListeners: function() {
        this.messages.on("error", function() {
        });
        this.on("error", function() {
        });
      },
      parse: function(chunk) {
        if (this._delegate) return this._delegate.parse(chunk);
        this._http.parse(chunk);
        if (!this._http.isComplete()) return;
        this.method = this._http.method;
        this.url = this._http.url;
        this.headers = this._http.headers;
        this.body = this._http.body;
        var self2 = this;
        this._delegate = Server.http(this, this._options);
        this._delegate.messages = this.messages;
        this._delegate.io = this.io;
        this._open();
        this.EVENTS.forEach(function(event) {
          this._delegate.on(event, function(e) {
            self2.emit(event, e);
          });
        }, this);
        this.protocol = this._delegate.protocol;
        this.version = this._delegate.version;
        this.parse(this._http.body);
        this.emit("connect", new Base.ConnectEvent());
      },
      _open: function() {
        this.__queue.forEach(function(msg) {
          this._delegate[msg[0]].apply(this._delegate, msg[1]);
        }, this);
        this.__queue = [];
      }
    };
    ["addExtension", "setHeader", "start", "frame", "text", "binary", "ping", "close"].forEach(function(method) {
      instance[method] = function() {
        if (this._delegate) {
          return this._delegate[method].apply(this._delegate, arguments);
        } else {
          this.__queue.push([method, arguments]);
          return true;
        }
      };
    });
    for (key in instance)
      Server.prototype[key] = instance[key];
    var key;
    Server.isSecureRequest = function(request) {
      if (request.connection && request.connection.authorized !== void 0) return true;
      if (request.socket && request.socket.secure) return true;
      var headers = request.headers;
      if (!headers) return false;
      if (headers["https"] === "on") return true;
      if (headers["x-forwarded-ssl"] === "on") return true;
      if (headers["x-forwarded-scheme"] === "https") return true;
      if (headers["x-forwarded-proto"] === "https") return true;
      return false;
    };
    Server.determineUrl = function(request) {
      var scheme = this.isSecureRequest(request) ? "wss:" : "ws:";
      return scheme + "//" + request.headers.host + request.url;
    };
    Server.http = function(request, options) {
      options = options || {};
      if (options.requireMasking === void 0) options.requireMasking = true;
      var headers = request.headers, version = headers["sec-websocket-version"], key2 = headers["sec-websocket-key"], key1 = headers["sec-websocket-key1"], key22 = headers["sec-websocket-key2"], url = this.determineUrl(request);
      if (version || key2)
        return new Hybi(request, url, options);
      else if (key1 || key22)
        return new Draft76(request, url, options);
      else
        return new Draft75(request, url, options);
    };
    module.exports = Server;
  }
});

// node_modules/websocket-driver/lib/websocket/driver.js
var require_driver = __commonJS({
  "node_modules/websocket-driver/lib/websocket/driver.js"(exports, module) {
    "use strict";
    var Base = require_base();
    var Client = require_client();
    var Server = require_server();
    var Driver = {
      client: function(url, options) {
        options = options || {};
        if (options.masking === void 0) options.masking = true;
        return new Client(url, options);
      },
      server: function(options) {
        options = options || {};
        if (options.requireMasking === void 0) options.requireMasking = true;
        return new Server(options);
      },
      http: function() {
        return Server.http.apply(Server, arguments);
      },
      isSecureRequest: function(request) {
        return Server.isSecureRequest(request);
      },
      isWebSocket: function(request) {
        return Base.isWebSocket(request);
      },
      validateOptions: function(options, validKeys) {
        Base.validateOptions(options, validKeys);
      }
    };
    module.exports = Driver;
  }
});

// node_modules/faye-websocket/lib/faye/websocket/api/event.js
var require_event2 = __commonJS({
  "node_modules/faye-websocket/lib/faye/websocket/api/event.js"(exports, module) {
    "use strict";
    var Event = function(eventType, options) {
      this.type = eventType;
      for (var key in options)
        this[key] = options[key];
    };
    Event.prototype.initEvent = function(eventType, canBubble, cancelable) {
      this.type = eventType;
      this.bubbles = canBubble;
      this.cancelable = cancelable;
    };
    Event.prototype.stopPropagation = function() {
    };
    Event.prototype.preventDefault = function() {
    };
    Event.CAPTURING_PHASE = 1;
    Event.AT_TARGET = 2;
    Event.BUBBLING_PHASE = 3;
    module.exports = Event;
  }
});

// node_modules/faye-websocket/lib/faye/websocket/api/event_target.js
var require_event_target = __commonJS({
  "node_modules/faye-websocket/lib/faye/websocket/api/event_target.js"(exports, module) {
    "use strict";
    var Event = require_event2();
    var EventTarget = {
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null,
      addEventListener: function(eventType, listener, useCapture) {
        this.on(eventType, listener);
      },
      removeEventListener: function(eventType, listener, useCapture) {
        this.removeListener(eventType, listener);
      },
      dispatchEvent: function(event) {
        event.target = event.currentTarget = this;
        event.eventPhase = Event.AT_TARGET;
        if (this["on" + event.type])
          this["on" + event.type](event);
        this.emit(event.type, event);
      }
    };
    module.exports = EventTarget;
  }
});

// node_modules/faye-websocket/lib/faye/websocket/api.js
var require_api = __commonJS({
  "node_modules/faye-websocket/lib/faye/websocket/api.js"(exports, module) {
    "use strict";
    var Stream = __require("stream").Stream;
    var util = __require("util");
    var driver = require_driver();
    var EventTarget = require_event_target();
    var Event = require_event2();
    var API = function(options) {
      options = options || {};
      driver.validateOptions(options, ["headers", "extensions", "maxLength", "ping", "proxy", "tls", "ca"]);
      this.readable = this.writable = true;
      var headers = options.headers;
      if (headers) {
        for (var name in headers) this._driver.setHeader(name, headers[name]);
      }
      var extensions = options.extensions;
      if (extensions) {
        [].concat(extensions).forEach(this._driver.addExtension, this._driver);
      }
      this._ping = options.ping;
      this._pingId = 0;
      this.readyState = API.CONNECTING;
      this.bufferedAmount = 0;
      this.protocol = "";
      this.url = this._driver.url;
      this.version = this._driver.version;
      var self2 = this;
      this._driver.on("open", function(e) {
        self2._open();
      });
      this._driver.on("message", function(e) {
        self2._receiveMessage(e.data);
      });
      this._driver.on("close", function(e) {
        self2._beginClose(e.reason, e.code);
      });
      this._driver.on("error", function(error) {
        self2._emitError(error.message);
      });
      this.on("error", function() {
      });
      this._driver.messages.on("drain", function() {
        self2.emit("drain");
      });
      if (this._ping)
        this._pingTimer = setInterval(function() {
          self2._pingId += 1;
          self2.ping(self2._pingId.toString());
        }, this._ping * 1e3);
      this._configureStream();
      if (!this._proxy) {
        this._stream.pipe(this._driver.io);
        this._driver.io.pipe(this._stream);
      }
    };
    util.inherits(API, Stream);
    API.CONNECTING = 0;
    API.OPEN = 1;
    API.CLOSING = 2;
    API.CLOSED = 3;
    API.CLOSE_TIMEOUT = 3e4;
    var instance = {
      write: function(data) {
        return this.send(data);
      },
      end: function(data) {
        if (data !== void 0) this.send(data);
        this.close();
      },
      pause: function() {
        return this._driver.messages.pause();
      },
      resume: function() {
        return this._driver.messages.resume();
      },
      send: function(data) {
        if (this.readyState > API.OPEN) return false;
        if (!(data instanceof Buffer)) data = String(data);
        return this._driver.messages.write(data);
      },
      ping: function(message, callback) {
        if (this.readyState > API.OPEN) return false;
        return this._driver.ping(message, callback);
      },
      close: function(code, reason) {
        if (code === void 0) code = 1e3;
        if (reason === void 0) reason = "";
        if (code !== 1e3 && (code < 3e3 || code > 4999))
          throw new Error("Failed to execute 'close' on WebSocket: The code must be either 1000, or between 3000 and 4999. " + code + " is neither.");
        if (this.readyState < API.CLOSING) {
          var self2 = this;
          this._closeTimer = setTimeout(function() {
            self2._beginClose("", 1006);
          }, API.CLOSE_TIMEOUT);
        }
        if (this.readyState !== API.CLOSED) this.readyState = API.CLOSING;
        this._driver.close(reason, code);
      },
      _configureStream: function() {
        var self2 = this;
        this._stream.setTimeout(0);
        this._stream.setNoDelay(true);
        ["close", "end"].forEach(function(event) {
          this._stream.on(event, function() {
            self2._finalizeClose();
          });
        }, this);
        this._stream.on("error", function(error) {
          self2._emitError("Network error: " + self2.url + ": " + error.message);
          self2._finalizeClose();
        });
      },
      _open: function() {
        if (this.readyState !== API.CONNECTING) return;
        this.readyState = API.OPEN;
        this.protocol = this._driver.protocol || "";
        var event = new Event("open");
        event.initEvent("open", false, false);
        this.dispatchEvent(event);
      },
      _receiveMessage: function(data) {
        if (this.readyState > API.OPEN) return false;
        if (this.readable) this.emit("data", data);
        var event = new Event("message", { data });
        event.initEvent("message", false, false);
        this.dispatchEvent(event);
      },
      _emitError: function(message) {
        if (this.readyState >= API.CLOSING) return;
        var event = new Event("error", { message });
        event.initEvent("error", false, false);
        this.dispatchEvent(event);
      },
      _beginClose: function(reason, code) {
        if (this.readyState === API.CLOSED) return;
        this.readyState = API.CLOSING;
        this._closeParams = [reason, code];
        if (this._stream) {
          this._stream.destroy();
          if (!this._stream.readable) this._finalizeClose();
        }
      },
      _finalizeClose: function() {
        if (this.readyState === API.CLOSED) return;
        this.readyState = API.CLOSED;
        if (this._closeTimer) clearTimeout(this._closeTimer);
        if (this._pingTimer) clearInterval(this._pingTimer);
        if (this._stream) this._stream.end();
        if (this.readable) this.emit("end");
        this.readable = this.writable = false;
        var reason = this._closeParams ? this._closeParams[0] : "", code = this._closeParams ? this._closeParams[1] : 1006;
        var event = new Event("close", { code, reason });
        event.initEvent("close", false, false);
        this.dispatchEvent(event);
      }
    };
    for (method in instance) API.prototype[method] = instance[method];
    var method;
    for (key in EventTarget) API.prototype[key] = EventTarget[key];
    var key;
    module.exports = API;
  }
});

// node_modules/faye-websocket/lib/faye/websocket/client.js
var require_client2 = __commonJS({
  "node_modules/faye-websocket/lib/faye/websocket/client.js"(exports, module) {
    "use strict";
    var util = __require("util");
    var net = __require("net");
    var tls = __require("tls");
    var url = __require("url");
    var driver = require_driver();
    var API = require_api();
    var Event = require_event2();
    var DEFAULT_PORTS = { "http:": 80, "https:": 443, "ws:": 80, "wss:": 443 };
    var SECURE_PROTOCOLS = ["https:", "wss:"];
    var Client = function(_url, protocols, options) {
      options = options || {};
      this.url = _url;
      this._driver = driver.client(this.url, { maxLength: options.maxLength, protocols });
      ["open", "error"].forEach(function(event) {
        this._driver.on(event, function() {
          self2.headers = self2._driver.headers;
          self2.statusCode = self2._driver.statusCode;
        });
      }, this);
      var proxy = options.proxy || {}, endpoint = url.parse(proxy.origin || this.url), port = endpoint.port || DEFAULT_PORTS[endpoint.protocol], secure = SECURE_PROTOCOLS.indexOf(endpoint.protocol) >= 0, onConnect = function() {
        self2._onConnect();
      }, netOptions = options.net || {}, originTLS = options.tls || {}, socketTLS = proxy.origin ? proxy.tls || {} : originTLS, self2 = this;
      netOptions.host = socketTLS.host = endpoint.hostname;
      netOptions.port = socketTLS.port = port;
      originTLS.ca = originTLS.ca || options.ca;
      socketTLS.servername = socketTLS.servername || endpoint.hostname;
      this._stream = secure ? tls.connect(socketTLS, onConnect) : net.connect(netOptions, onConnect);
      if (proxy.origin) this._configureProxy(proxy, originTLS);
      API.call(this, options);
    };
    util.inherits(Client, API);
    Client.prototype._onConnect = function() {
      var worker = this._proxy || this._driver;
      worker.start();
    };
    Client.prototype._configureProxy = function(proxy, originTLS) {
      var uri = url.parse(this.url), secure = SECURE_PROTOCOLS.indexOf(uri.protocol) >= 0, self2 = this, name;
      this._proxy = this._driver.proxy(proxy.origin);
      if (proxy.headers) {
        for (name in proxy.headers) this._proxy.setHeader(name, proxy.headers[name]);
      }
      this._proxy.pipe(this._stream, { end: false });
      this._stream.pipe(this._proxy);
      this._proxy.on("connect", function() {
        if (secure) {
          var options = { socket: self2._stream, servername: uri.hostname };
          for (name in originTLS) options[name] = originTLS[name];
          self2._stream = tls.connect(options);
          self2._configureStream();
        }
        self2._driver.io.pipe(self2._stream);
        self2._stream.pipe(self2._driver.io);
        self2._driver.start();
      });
      this._proxy.on("error", function(error) {
        self2._driver.emit("error", error);
      });
    };
    module.exports = Client;
  }
});

// node_modules/faye-websocket/lib/faye/eventsource.js
var require_eventsource = __commonJS({
  "node_modules/faye-websocket/lib/faye/eventsource.js"(exports, module) {
    "use strict";
    var Stream = __require("stream").Stream;
    var util = __require("util");
    var driver = require_driver();
    var Headers = require_headers();
    var API = require_api();
    var EventTarget = require_event_target();
    var Event = require_event2();
    var EventSource = function(request, response, options) {
      this.writable = true;
      options = options || {};
      this._stream = response.socket;
      this._ping = options.ping || this.DEFAULT_PING;
      this._retry = options.retry || this.DEFAULT_RETRY;
      var scheme = driver.isSecureRequest(request) ? "https:" : "http:";
      this.url = scheme + "//" + request.headers.host + request.url;
      this.lastEventId = request.headers["last-event-id"] || "";
      this.readyState = API.CONNECTING;
      var headers = new Headers(), self2 = this;
      if (options.headers) {
        for (var key2 in options.headers) headers.set(key2, options.headers[key2]);
      }
      if (!this._stream || !this._stream.writable) return;
      process.nextTick(function() {
        self2._open();
      });
      this._stream.setTimeout(0);
      this._stream.setNoDelay(true);
      var handshake = "HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nCache-Control: no-cache, no-store\r\nConnection: close\r\n" + headers.toString() + "\r\nretry: " + Math.floor(this._retry * 1e3) + "\r\n\r\n";
      this._write(handshake);
      this._stream.on("drain", function() {
        self2.emit("drain");
      });
      if (this._ping)
        this._pingTimer = setInterval(function() {
          self2.ping();
        }, this._ping * 1e3);
      ["error", "end"].forEach(function(event) {
        self2._stream.on(event, function() {
          self2.close();
        });
      });
    };
    util.inherits(EventSource, Stream);
    EventSource.isEventSource = function(request) {
      if (request.method !== "GET") return false;
      var accept = (request.headers.accept || "").split(/\s*,\s*/);
      return accept.indexOf("text/event-stream") >= 0;
    };
    var instance = {
      DEFAULT_PING: 10,
      DEFAULT_RETRY: 5,
      _write: function(chunk) {
        if (!this.writable) return false;
        try {
          return this._stream.write(chunk, "utf8");
        } catch (e) {
          return false;
        }
      },
      _open: function() {
        if (this.readyState !== API.CONNECTING) return;
        this.readyState = API.OPEN;
        var event = new Event("open");
        event.initEvent("open", false, false);
        this.dispatchEvent(event);
      },
      write: function(message) {
        return this.send(message);
      },
      end: function(message) {
        if (message !== void 0) this.write(message);
        this.close();
      },
      send: function(message, options) {
        if (this.readyState > API.OPEN) return false;
        message = String(message).replace(/(\r\n|\r|\n)/g, "$1data: ");
        options = options || {};
        var frame = "";
        if (options.event) frame += "event: " + options.event + "\r\n";
        if (options.id) frame += "id: " + options.id + "\r\n";
        frame += "data: " + message + "\r\n\r\n";
        return this._write(frame);
      },
      ping: function() {
        return this._write(":\r\n\r\n");
      },
      close: function() {
        if (this.readyState > API.OPEN) return false;
        this.readyState = API.CLOSED;
        this.writable = false;
        if (this._pingTimer) clearInterval(this._pingTimer);
        if (this._stream) this._stream.end();
        var event = new Event("close");
        event.initEvent("close", false, false);
        this.dispatchEvent(event);
        return true;
      }
    };
    for (method in instance) EventSource.prototype[method] = instance[method];
    var method;
    for (key in EventTarget) EventSource.prototype[key] = EventTarget[key];
    var key;
    module.exports = EventSource;
  }
});

// node_modules/faye-websocket/lib/faye/websocket.js
var require_websocket = __commonJS({
  "node_modules/faye-websocket/lib/faye/websocket.js"(exports, module) {
    "use strict";
    var util = __require("util");
    var driver = require_driver();
    var API = require_api();
    var WebSocket = function(request, socket, body, protocols, options) {
      options = options || {};
      this._stream = socket;
      this._driver = driver.http(request, { maxLength: options.maxLength, protocols });
      var self2 = this;
      if (!this._stream || !this._stream.writable) return;
      if (!this._stream.readable) return this._stream.end();
      var catchup = function() {
        self2._stream.removeListener("data", catchup);
      };
      this._stream.on("data", catchup);
      API.call(this, options);
      process.nextTick(function() {
        self2._driver.start();
        self2._driver.io.write(body);
      });
    };
    util.inherits(WebSocket, API);
    WebSocket.isWebSocket = function(request) {
      return driver.isWebSocket(request);
    };
    WebSocket.validateOptions = function(options, validKeys) {
      driver.validateOptions(options, validKeys);
    };
    WebSocket.WebSocket = WebSocket;
    WebSocket.Client = require_client2();
    WebSocket.EventSource = require_eventsource();
    module.exports = WebSocket;
  }
});

// node_modules/sockjs-client/lib/transport/driver/websocket.js
var require_websocket2 = __commonJS({
  "node_modules/sockjs-client/lib/transport/driver/websocket.js"(exports, module) {
    module.exports = require_websocket().Client;
  }
});

// node_modules/sockjs-client/lib/transport/websocket.js
var require_websocket3 = __commonJS({
  "node_modules/sockjs-client/lib/transport/websocket.js"(exports, module) {
    "use strict";
    var utils = require_event();
    var urlUtils = require_url();
    var inherits = require_inherits();
    var EventEmitter = __require("events").EventEmitter;
    var WebsocketDriver = require_websocket2();
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:websocket");
    }
    function WebSocketTransport(transUrl, ignore, options) {
      if (!WebSocketTransport.enabled()) {
        throw new Error("Transport created when disabled");
      }
      EventEmitter.call(this);
      debug("constructor", transUrl);
      var self2 = this;
      var url = urlUtils.addPath(transUrl, "/websocket");
      if (url.slice(0, 5) === "https") {
        url = "wss" + url.slice(5);
      } else {
        url = "ws" + url.slice(4);
      }
      this.url = url;
      this.ws = new WebsocketDriver(this.url, [], options);
      this.ws.onmessage = function(e) {
        debug("message event", e.data);
        self2.emit("message", e.data);
      };
      this.unloadRef = utils.unloadAdd(function() {
        debug("unload");
        self2.ws.close();
      });
      this.ws.onclose = function(e) {
        debug("close event", e.code, e.reason);
        self2.emit("close", e.code, e.reason);
        self2._cleanup();
      };
      this.ws.onerror = function(e) {
        debug("error event", e);
        self2.emit("close", 1006, "WebSocket connection broken");
        self2._cleanup();
      };
    }
    inherits(WebSocketTransport, EventEmitter);
    WebSocketTransport.prototype.send = function(data) {
      var msg = "[" + data + "]";
      debug("send", msg);
      this.ws.send(msg);
    };
    WebSocketTransport.prototype.close = function() {
      debug("close");
      var ws = this.ws;
      this._cleanup();
      if (ws) {
        ws.close();
      }
    };
    WebSocketTransport.prototype._cleanup = function() {
      debug("_cleanup");
      var ws = this.ws;
      if (ws) {
        ws.onmessage = ws.onclose = ws.onerror = null;
      }
      utils.unloadDel(this.unloadRef);
      this.unloadRef = this.ws = null;
      this.removeAllListeners();
    };
    WebSocketTransport.enabled = function() {
      debug("enabled");
      return !!WebsocketDriver;
    };
    WebSocketTransport.transportName = "websocket";
    WebSocketTransport.roundTrips = 2;
    module.exports = WebSocketTransport;
  }
});

// node_modules/sockjs-client/lib/transport/lib/buffered-sender.js
var require_buffered_sender = __commonJS({
  "node_modules/sockjs-client/lib/transport/lib/buffered-sender.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var EventEmitter = __require("events").EventEmitter;
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:buffered-sender");
    }
    function BufferedSender(url, sender) {
      debug(url);
      EventEmitter.call(this);
      this.sendBuffer = [];
      this.sender = sender;
      this.url = url;
    }
    inherits(BufferedSender, EventEmitter);
    BufferedSender.prototype.send = function(message) {
      debug("send", message);
      this.sendBuffer.push(message);
      if (!this.sendStop) {
        this.sendSchedule();
      }
    };
    BufferedSender.prototype.sendScheduleWait = function() {
      debug("sendScheduleWait");
      var self2 = this;
      var tref;
      this.sendStop = function() {
        debug("sendStop");
        self2.sendStop = null;
        clearTimeout(tref);
      };
      tref = setTimeout(function() {
        debug("timeout");
        self2.sendStop = null;
        self2.sendSchedule();
      }, 25);
    };
    BufferedSender.prototype.sendSchedule = function() {
      debug("sendSchedule", this.sendBuffer.length);
      var self2 = this;
      if (this.sendBuffer.length > 0) {
        var payload = "[" + this.sendBuffer.join(",") + "]";
        this.sendStop = this.sender(this.url, payload, function(err) {
          self2.sendStop = null;
          if (err) {
            debug("error", err);
            self2.emit("close", err.code || 1006, "Sending error: " + err);
            self2.close();
          } else {
            self2.sendScheduleWait();
          }
        });
        this.sendBuffer = [];
      }
    };
    BufferedSender.prototype._cleanup = function() {
      debug("_cleanup");
      this.removeAllListeners();
    };
    BufferedSender.prototype.close = function() {
      debug("close");
      this._cleanup();
      if (this.sendStop) {
        this.sendStop();
        this.sendStop = null;
      }
    };
    module.exports = BufferedSender;
  }
});

// node_modules/sockjs-client/lib/transport/lib/polling.js
var require_polling = __commonJS({
  "node_modules/sockjs-client/lib/transport/lib/polling.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var EventEmitter = __require("events").EventEmitter;
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:polling");
    }
    function Polling(Receiver, receiveUrl, AjaxObject) {
      debug(receiveUrl);
      EventEmitter.call(this);
      this.Receiver = Receiver;
      this.receiveUrl = receiveUrl;
      this.AjaxObject = AjaxObject;
      this._scheduleReceiver();
    }
    inherits(Polling, EventEmitter);
    Polling.prototype._scheduleReceiver = function() {
      debug("_scheduleReceiver");
      var self2 = this;
      var poll = this.poll = new this.Receiver(this.receiveUrl, this.AjaxObject);
      poll.on("message", function(msg) {
        debug("message", msg);
        self2.emit("message", msg);
      });
      poll.once("close", function(code, reason) {
        debug("close", code, reason, self2.pollIsClosing);
        self2.poll = poll = null;
        if (!self2.pollIsClosing) {
          if (reason === "network") {
            self2._scheduleReceiver();
          } else {
            self2.emit("close", code || 1006, reason);
            self2.removeAllListeners();
          }
        }
      });
    };
    Polling.prototype.abort = function() {
      debug("abort");
      this.removeAllListeners();
      this.pollIsClosing = true;
      if (this.poll) {
        this.poll.abort();
      }
    };
    module.exports = Polling;
  }
});

// node_modules/sockjs-client/lib/transport/lib/sender-receiver.js
var require_sender_receiver = __commonJS({
  "node_modules/sockjs-client/lib/transport/lib/sender-receiver.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var urlUtils = require_url();
    var BufferedSender = require_buffered_sender();
    var Polling = require_polling();
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:sender-receiver");
    }
    function SenderReceiver(transUrl, urlSuffix, senderFunc, Receiver, AjaxObject) {
      var pollUrl = urlUtils.addPath(transUrl, urlSuffix);
      debug(pollUrl);
      var self2 = this;
      BufferedSender.call(this, transUrl, senderFunc);
      this.poll = new Polling(Receiver, pollUrl, AjaxObject);
      this.poll.on("message", function(msg) {
        debug("poll message", msg);
        self2.emit("message", msg);
      });
      this.poll.once("close", function(code, reason) {
        debug("poll close", code, reason);
        self2.poll = null;
        self2.emit("close", code, reason);
        self2.close();
      });
    }
    inherits(SenderReceiver, BufferedSender);
    SenderReceiver.prototype.close = function() {
      BufferedSender.prototype.close.call(this);
      debug("close");
      this.removeAllListeners();
      if (this.poll) {
        this.poll.abort();
        this.poll = null;
      }
    };
    module.exports = SenderReceiver;
  }
});

// node_modules/sockjs-client/lib/transport/lib/ajax-based.js
var require_ajax_based = __commonJS({
  "node_modules/sockjs-client/lib/transport/lib/ajax-based.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var urlUtils = require_url();
    var SenderReceiver = require_sender_receiver();
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:ajax-based");
    }
    function createAjaxSender(AjaxObject) {
      return function(url, payload, callback) {
        debug("create ajax sender", url, payload);
        var opt = {};
        if (typeof payload === "string") {
          opt.headers = { "Content-type": "text/plain" };
        }
        var ajaxUrl = urlUtils.addPath(url, "/xhr_send");
        var xo = new AjaxObject("POST", ajaxUrl, payload, opt);
        xo.once("finish", function(status) {
          debug("finish", status);
          xo = null;
          if (status !== 200 && status !== 204) {
            return callback(new Error("http status " + status));
          }
          callback();
        });
        return function() {
          debug("abort");
          xo.close();
          xo = null;
          var err = new Error("Aborted");
          err.code = 1e3;
          callback(err);
        };
      };
    }
    function AjaxBasedTransport(transUrl, urlSuffix, Receiver, AjaxObject) {
      SenderReceiver.call(this, transUrl, urlSuffix, createAjaxSender(AjaxObject), Receiver, AjaxObject);
    }
    inherits(AjaxBasedTransport, SenderReceiver);
    module.exports = AjaxBasedTransport;
  }
});

// node_modules/sockjs-client/lib/transport/receiver/xhr.js
var require_xhr = __commonJS({
  "node_modules/sockjs-client/lib/transport/receiver/xhr.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var EventEmitter = __require("events").EventEmitter;
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:receiver:xhr");
    }
    function XhrReceiver(url, AjaxObject) {
      debug(url);
      EventEmitter.call(this);
      var self2 = this;
      this.bufferPosition = 0;
      this.xo = new AjaxObject("POST", url, null);
      this.xo.on("chunk", this._chunkHandler.bind(this));
      this.xo.once("finish", function(status, text) {
        debug("finish", status, text);
        self2._chunkHandler(status, text);
        self2.xo = null;
        var reason = status === 200 ? "network" : "permanent";
        debug("close", reason);
        self2.emit("close", null, reason);
        self2._cleanup();
      });
    }
    inherits(XhrReceiver, EventEmitter);
    XhrReceiver.prototype._chunkHandler = function(status, text) {
      debug("_chunkHandler", status);
      if (status !== 200 || !text) {
        return;
      }
      for (var idx = -1; ; this.bufferPosition += idx + 1) {
        var buf = text.slice(this.bufferPosition);
        idx = buf.indexOf("\n");
        if (idx === -1) {
          break;
        }
        var msg = buf.slice(0, idx);
        if (msg) {
          debug("message", msg);
          this.emit("message", msg);
        }
      }
    };
    XhrReceiver.prototype._cleanup = function() {
      debug("_cleanup");
      this.removeAllListeners();
    };
    XhrReceiver.prototype.abort = function() {
      debug("abort");
      if (this.xo) {
        this.xo.close();
        debug("close");
        this.emit("close", null, "user");
        this.xo = null;
      }
      this._cleanup();
    };
    module.exports = XhrReceiver;
  }
});

// node_modules/sockjs-client/lib/transport/driver/xhr.js
var require_xhr2 = __commonJS({
  "node_modules/sockjs-client/lib/transport/driver/xhr.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var inherits = require_inherits();
    var http = __require("http");
    var https = __require("https");
    var URL2 = require_url_parse();
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:driver:xhr");
    }
    function XhrDriver(method, url, payload, opts) {
      debug(method, url, payload);
      var self2 = this;
      EventEmitter.call(this);
      var parsedUrl = new URL2(url);
      var options = {
        method,
        hostname: parsedUrl.hostname.replace(/\[|\]/g, ""),
        port: parsedUrl.port,
        path: parsedUrl.pathname + (parsedUrl.query || ""),
        headers: opts && opts.headers
      };
      var protocol = parsedUrl.protocol === "https:" ? https : http;
      this.req = protocol.request(options, function(res) {
        res.setEncoding("utf8");
        var responseText = "";
        res.on("data", function(chunk) {
          debug("data", chunk);
          responseText += chunk;
          self2.emit("chunk", 200, responseText);
        });
        res.once("end", function() {
          debug("end");
          self2.emit("finish", res.statusCode, responseText);
          self2.req = null;
        });
      });
      this.req.on("error", function(e) {
        debug("error", e);
        self2.emit("finish", 0, e.message);
      });
      if (payload) {
        this.req.write(payload);
      }
      this.req.end();
    }
    inherits(XhrDriver, EventEmitter);
    XhrDriver.prototype.close = function() {
      debug("close");
      this.removeAllListeners();
      if (this.req) {
        this.req.abort();
        this.req = null;
      }
    };
    XhrDriver.enabled = true;
    XhrDriver.supportsCORS = true;
    module.exports = XhrDriver;
  }
});

// node_modules/sockjs-client/lib/transport/sender/xhr-cors.js
var require_xhr_cors = __commonJS({
  "node_modules/sockjs-client/lib/transport/sender/xhr-cors.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var XhrDriver = require_xhr2();
    function XHRCorsObject(method, url, payload, opts) {
      XhrDriver.call(this, method, url, payload, opts);
    }
    inherits(XHRCorsObject, XhrDriver);
    XHRCorsObject.enabled = XhrDriver.enabled && XhrDriver.supportsCORS;
    module.exports = XHRCorsObject;
  }
});

// node_modules/sockjs-client/lib/transport/sender/xhr-local.js
var require_xhr_local = __commonJS({
  "node_modules/sockjs-client/lib/transport/sender/xhr-local.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var XhrDriver = require_xhr2();
    function XHRLocalObject(method, url, payload) {
      XhrDriver.call(this, method, url, payload, {
        noCredentials: true
      });
    }
    inherits(XHRLocalObject, XhrDriver);
    XHRLocalObject.enabled = XhrDriver.enabled;
    module.exports = XHRLocalObject;
  }
});

// node_modules/sockjs-client/lib/utils/browser.js
var require_browser2 = __commonJS({
  "node_modules/sockjs-client/lib/utils/browser.js"(exports, module) {
    "use strict";
    module.exports = {
      isOpera: function() {
        return global.navigator && /opera/i.test(global.navigator.userAgent);
      },
      isKonqueror: function() {
        return global.navigator && /konqueror/i.test(global.navigator.userAgent);
      },
      hasDomain: function() {
        if (!global.document) {
          return true;
        }
        try {
          return !!global.document.domain;
        } catch (e) {
          return false;
        }
      }
    };
  }
});

// node_modules/sockjs-client/lib/transport/xhr-streaming.js
var require_xhr_streaming = __commonJS({
  "node_modules/sockjs-client/lib/transport/xhr-streaming.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var AjaxBasedTransport = require_ajax_based();
    var XhrReceiver = require_xhr();
    var XHRCorsObject = require_xhr_cors();
    var XHRLocalObject = require_xhr_local();
    var browser = require_browser2();
    function XhrStreamingTransport(transUrl) {
      if (!XHRLocalObject.enabled && !XHRCorsObject.enabled) {
        throw new Error("Transport created when disabled");
      }
      AjaxBasedTransport.call(this, transUrl, "/xhr_streaming", XhrReceiver, XHRCorsObject);
    }
    inherits(XhrStreamingTransport, AjaxBasedTransport);
    XhrStreamingTransport.enabled = function(info) {
      if (info.nullOrigin) {
        return false;
      }
      if (browser.isOpera()) {
        return false;
      }
      return XHRCorsObject.enabled;
    };
    XhrStreamingTransport.transportName = "xhr-streaming";
    XhrStreamingTransport.roundTrips = 2;
    XhrStreamingTransport.needBody = !!global.document;
    module.exports = XhrStreamingTransport;
  }
});

// node_modules/sockjs-client/lib/transport/sender/xdr.js
var require_xdr = __commonJS({
  "node_modules/sockjs-client/lib/transport/sender/xdr.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var inherits = require_inherits();
    var eventUtils = require_event();
    var browser = require_browser2();
    var urlUtils = require_url();
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:sender:xdr");
    }
    function XDRObject(method, url, payload) {
      debug(method, url);
      var self2 = this;
      EventEmitter.call(this);
      setTimeout(function() {
        self2._start(method, url, payload);
      }, 0);
    }
    inherits(XDRObject, EventEmitter);
    XDRObject.prototype._start = function(method, url, payload) {
      debug("_start");
      var self2 = this;
      var xdr = new global.XDomainRequest();
      url = urlUtils.addQuery(url, "t=" + +/* @__PURE__ */ new Date());
      xdr.onerror = function() {
        debug("onerror");
        self2._error();
      };
      xdr.ontimeout = function() {
        debug("ontimeout");
        self2._error();
      };
      xdr.onprogress = function() {
        debug("progress", xdr.responseText);
        self2.emit("chunk", 200, xdr.responseText);
      };
      xdr.onload = function() {
        debug("load");
        self2.emit("finish", 200, xdr.responseText);
        self2._cleanup(false);
      };
      this.xdr = xdr;
      this.unloadRef = eventUtils.unloadAdd(function() {
        self2._cleanup(true);
      });
      try {
        this.xdr.open(method, url);
        if (this.timeout) {
          this.xdr.timeout = this.timeout;
        }
        this.xdr.send(payload);
      } catch (x) {
        this._error();
      }
    };
    XDRObject.prototype._error = function() {
      this.emit("finish", 0, "");
      this._cleanup(false);
    };
    XDRObject.prototype._cleanup = function(abort) {
      debug("cleanup", abort);
      if (!this.xdr) {
        return;
      }
      this.removeAllListeners();
      eventUtils.unloadDel(this.unloadRef);
      this.xdr.ontimeout = this.xdr.onerror = this.xdr.onprogress = this.xdr.onload = null;
      if (abort) {
        try {
          this.xdr.abort();
        } catch (x) {
        }
      }
      this.unloadRef = this.xdr = null;
    };
    XDRObject.prototype.close = function() {
      debug("close");
      this._cleanup(true);
    };
    XDRObject.enabled = !!(global.XDomainRequest && browser.hasDomain());
    module.exports = XDRObject;
  }
});

// node_modules/sockjs-client/lib/transport/xdr-streaming.js
var require_xdr_streaming = __commonJS({
  "node_modules/sockjs-client/lib/transport/xdr-streaming.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var AjaxBasedTransport = require_ajax_based();
    var XhrReceiver = require_xhr();
    var XDRObject = require_xdr();
    function XdrStreamingTransport(transUrl) {
      if (!XDRObject.enabled) {
        throw new Error("Transport created when disabled");
      }
      AjaxBasedTransport.call(this, transUrl, "/xhr_streaming", XhrReceiver, XDRObject);
    }
    inherits(XdrStreamingTransport, AjaxBasedTransport);
    XdrStreamingTransport.enabled = function(info) {
      if (info.cookie_needed || info.nullOrigin) {
        return false;
      }
      return XDRObject.enabled && info.sameScheme;
    };
    XdrStreamingTransport.transportName = "xdr-streaming";
    XdrStreamingTransport.roundTrips = 2;
    module.exports = XdrStreamingTransport;
  }
});

// node_modules/sockjs-client/node_modules/eventsource/lib/eventsource.js
var require_eventsource2 = __commonJS({
  "node_modules/sockjs-client/node_modules/eventsource/lib/eventsource.js"(exports, module) {
    var parse = __require("url").parse;
    var events = __require("events");
    var https = __require("https");
    var http = __require("http");
    var util = __require("util");
    var httpsOptions = [
      "pfx",
      "key",
      "passphrase",
      "cert",
      "ca",
      "ciphers",
      "rejectUnauthorized",
      "secureProtocol",
      "servername",
      "checkServerIdentity"
    ];
    var bom = [239, 187, 191];
    var colon = 58;
    var space = 32;
    var lineFeed = 10;
    var carriageReturn = 13;
    var maxBufferAheadAllocation = 1024 * 256;
    var reUnsafeHeader = /^(cookie|authorization)$/i;
    function hasBom(buf) {
      return bom.every(function(charCode, index) {
        return buf[index] === charCode;
      });
    }
    function EventSource(url, eventSourceInitDict) {
      var readyState = EventSource.CONNECTING;
      var headers = eventSourceInitDict && eventSourceInitDict.headers;
      var hasNewOrigin = false;
      Object.defineProperty(this, "readyState", {
        get: function() {
          return readyState;
        }
      });
      Object.defineProperty(this, "url", {
        get: function() {
          return url;
        }
      });
      var self2 = this;
      self2.reconnectInterval = 1e3;
      self2.connectionInProgress = false;
      function onConnectionClosed(message) {
        if (readyState === EventSource.CLOSED) return;
        readyState = EventSource.CONNECTING;
        _emit("error", new Event("error", { message }));
        if (reconnectUrl) {
          url = reconnectUrl;
          reconnectUrl = null;
          hasNewOrigin = false;
        }
        setTimeout(function() {
          if (readyState !== EventSource.CONNECTING || self2.connectionInProgress) {
            return;
          }
          self2.connectionInProgress = true;
          connect();
        }, self2.reconnectInterval);
      }
      var req;
      var lastEventId = "";
      if (headers && headers["Last-Event-ID"]) {
        lastEventId = headers["Last-Event-ID"];
        delete headers["Last-Event-ID"];
      }
      var discardTrailingNewline = false;
      var data = "";
      var eventName = "";
      var reconnectUrl = null;
      function connect() {
        var options = parse(url);
        var isSecure = options.protocol === "https:";
        options.headers = { "Cache-Control": "no-cache", "Accept": "text/event-stream" };
        if (lastEventId) options.headers["Last-Event-ID"] = lastEventId;
        if (headers) {
          var reqHeaders = hasNewOrigin ? removeUnsafeHeaders(headers) : headers;
          for (var i in reqHeaders) {
            var header = reqHeaders[i];
            if (header) {
              options.headers[i] = header;
            }
          }
        }
        options.rejectUnauthorized = !(eventSourceInitDict && !eventSourceInitDict.rejectUnauthorized);
        if (eventSourceInitDict && eventSourceInitDict.createConnection !== void 0) {
          options.createConnection = eventSourceInitDict.createConnection;
        }
        var useProxy = eventSourceInitDict && eventSourceInitDict.proxy;
        if (useProxy) {
          var proxy = parse(eventSourceInitDict.proxy);
          isSecure = proxy.protocol === "https:";
          options.protocol = isSecure ? "https:" : "http:";
          options.path = url;
          options.headers.Host = options.host;
          options.hostname = proxy.hostname;
          options.host = proxy.host;
          options.port = proxy.port;
        }
        if (eventSourceInitDict && eventSourceInitDict.https) {
          for (var optName in eventSourceInitDict.https) {
            if (httpsOptions.indexOf(optName) === -1) {
              continue;
            }
            var option = eventSourceInitDict.https[optName];
            if (option !== void 0) {
              options[optName] = option;
            }
          }
        }
        if (eventSourceInitDict && eventSourceInitDict.withCredentials !== void 0) {
          options.withCredentials = eventSourceInitDict.withCredentials;
        }
        req = (isSecure ? https : http).request(options, function(res) {
          self2.connectionInProgress = false;
          if (res.statusCode === 500 || res.statusCode === 502 || res.statusCode === 503 || res.statusCode === 504) {
            _emit("error", new Event("error", { status: res.statusCode, message: res.statusMessage }));
            onConnectionClosed();
            return;
          }
          if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
            var location = res.headers.location;
            if (!location) {
              _emit("error", new Event("error", { status: res.statusCode, message: res.statusMessage }));
              return;
            }
            var prevOrigin = new URL(url).origin;
            var nextOrigin = new URL(location).origin;
            hasNewOrigin = prevOrigin !== nextOrigin;
            if (res.statusCode === 307) reconnectUrl = url;
            url = location;
            process.nextTick(connect);
            return;
          }
          if (res.statusCode !== 200) {
            _emit("error", new Event("error", { status: res.statusCode, message: res.statusMessage }));
            return self2.close();
          }
          readyState = EventSource.OPEN;
          res.on("close", function() {
            res.removeAllListeners("close");
            res.removeAllListeners("end");
            onConnectionClosed();
          });
          res.on("end", function() {
            res.removeAllListeners("close");
            res.removeAllListeners("end");
            onConnectionClosed();
          });
          _emit("open", new Event("open"));
          var buf;
          var newBuffer;
          var startingPos = 0;
          var startingFieldLength = -1;
          var newBufferSize = 0;
          var bytesUsed = 0;
          res.on("data", function(chunk) {
            if (!buf) {
              buf = chunk;
              if (hasBom(buf)) {
                buf = buf.slice(bom.length);
              }
              bytesUsed = buf.length;
            } else {
              if (chunk.length > buf.length - bytesUsed) {
                newBufferSize = buf.length * 2 + chunk.length;
                if (newBufferSize > maxBufferAheadAllocation) {
                  newBufferSize = buf.length + chunk.length + maxBufferAheadAllocation;
                }
                newBuffer = Buffer.alloc(newBufferSize);
                buf.copy(newBuffer, 0, 0, bytesUsed);
                buf = newBuffer;
              }
              chunk.copy(buf, bytesUsed);
              bytesUsed += chunk.length;
            }
            var pos = 0;
            var length = bytesUsed;
            while (pos < length) {
              if (discardTrailingNewline) {
                if (buf[pos] === lineFeed) {
                  ++pos;
                }
                discardTrailingNewline = false;
              }
              var lineLength = -1;
              var fieldLength = startingFieldLength;
              var c;
              for (var i2 = startingPos; lineLength < 0 && i2 < length; ++i2) {
                c = buf[i2];
                if (c === colon) {
                  if (fieldLength < 0) {
                    fieldLength = i2 - pos;
                  }
                } else if (c === carriageReturn) {
                  discardTrailingNewline = true;
                  lineLength = i2 - pos;
                } else if (c === lineFeed) {
                  lineLength = i2 - pos;
                }
              }
              if (lineLength < 0) {
                startingPos = length - pos;
                startingFieldLength = fieldLength;
                break;
              } else {
                startingPos = 0;
                startingFieldLength = -1;
              }
              parseEventStreamLine(buf, pos, fieldLength, lineLength);
              pos += lineLength + 1;
            }
            if (pos === length) {
              buf = void 0;
              bytesUsed = 0;
            } else if (pos > 0) {
              buf = buf.slice(pos, bytesUsed);
              bytesUsed = buf.length;
            }
          });
        });
        req.on("error", function(err) {
          self2.connectionInProgress = false;
          onConnectionClosed(err.message);
        });
        if (req.setNoDelay) req.setNoDelay(true);
        req.end();
      }
      connect();
      function _emit() {
        if (self2.listeners(arguments[0]).length > 0) {
          self2.emit.apply(self2, arguments);
        }
      }
      this._close = function() {
        if (readyState === EventSource.CLOSED) return;
        readyState = EventSource.CLOSED;
        if (req.abort) req.abort();
        if (req.xhr && req.xhr.abort) req.xhr.abort();
      };
      function parseEventStreamLine(buf, pos, fieldLength, lineLength) {
        if (lineLength === 0) {
          if (data.length > 0) {
            var type = eventName || "message";
            _emit(type, new MessageEvent(type, {
              data: data.slice(0, -1),
              // remove trailing newline
              lastEventId,
              origin: new URL(url).origin
            }));
            data = "";
          }
          eventName = void 0;
        } else if (fieldLength > 0) {
          var noValue = fieldLength < 0;
          var step = 0;
          var field = buf.slice(pos, pos + (noValue ? lineLength : fieldLength)).toString();
          if (noValue) {
            step = lineLength;
          } else if (buf[pos + fieldLength + 1] !== space) {
            step = fieldLength + 1;
          } else {
            step = fieldLength + 2;
          }
          pos += step;
          var valueLength = lineLength - step;
          var value = buf.slice(pos, pos + valueLength).toString();
          if (field === "data") {
            data += value + "\n";
          } else if (field === "event") {
            eventName = value;
          } else if (field === "id") {
            lastEventId = value;
          } else if (field === "retry") {
            var retry = parseInt(value, 10);
            if (!Number.isNaN(retry)) {
              self2.reconnectInterval = retry;
            }
          }
        }
      }
    }
    module.exports = EventSource;
    util.inherits(EventSource, events.EventEmitter);
    EventSource.prototype.constructor = EventSource;
    ["open", "error", "message"].forEach(function(method) {
      Object.defineProperty(EventSource.prototype, "on" + method, {
        /**
         * Returns the current listener
         *
         * @return {Mixed} the set function or undefined
         * @api private
         */
        get: function get() {
          var listener = this.listeners(method)[0];
          return listener ? listener._listener ? listener._listener : listener : void 0;
        },
        /**
         * Start listening for events
         *
         * @param {Function} listener the listener
         * @return {Mixed} the set function or undefined
         * @api private
         */
        set: function set(listener) {
          this.removeAllListeners(method);
          this.addEventListener(method, listener);
        }
      });
    });
    Object.defineProperty(EventSource, "CONNECTING", { enumerable: true, value: 0 });
    Object.defineProperty(EventSource, "OPEN", { enumerable: true, value: 1 });
    Object.defineProperty(EventSource, "CLOSED", { enumerable: true, value: 2 });
    EventSource.prototype.CONNECTING = 0;
    EventSource.prototype.OPEN = 1;
    EventSource.prototype.CLOSED = 2;
    EventSource.prototype.close = function() {
      this._close();
    };
    EventSource.prototype.addEventListener = function addEventListener(type, listener) {
      if (typeof listener === "function") {
        listener._listener = listener;
        this.on(type, listener);
      }
    };
    EventSource.prototype.dispatchEvent = function dispatchEvent(event) {
      if (!event.type) {
        throw new Error("UNSPECIFIED_EVENT_TYPE_ERR");
      }
      this.emit(event.type, event.detail);
    };
    EventSource.prototype.removeEventListener = function removeEventListener(type, listener) {
      if (typeof listener === "function") {
        listener._listener = void 0;
        this.removeListener(type, listener);
      }
    };
    function Event(type, optionalProperties) {
      Object.defineProperty(this, "type", { writable: false, value: type, enumerable: true });
      if (optionalProperties) {
        for (var f in optionalProperties) {
          if (optionalProperties.hasOwnProperty(f)) {
            Object.defineProperty(this, f, { writable: false, value: optionalProperties[f], enumerable: true });
          }
        }
      }
    }
    function MessageEvent(type, eventInitDict) {
      Object.defineProperty(this, "type", { writable: false, value: type, enumerable: true });
      for (var f in eventInitDict) {
        if (eventInitDict.hasOwnProperty(f)) {
          Object.defineProperty(this, f, { writable: false, value: eventInitDict[f], enumerable: true });
        }
      }
    }
    function removeUnsafeHeaders(headers) {
      var safe = {};
      for (var key in headers) {
        if (reUnsafeHeader.test(key)) {
          continue;
        }
        safe[key] = headers[key];
      }
      return safe;
    }
  }
});

// node_modules/sockjs-client/lib/transport/receiver/eventsource.js
var require_eventsource3 = __commonJS({
  "node_modules/sockjs-client/lib/transport/receiver/eventsource.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var EventEmitter = __require("events").EventEmitter;
    var EventSourceDriver = require_eventsource2();
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:receiver:eventsource");
    }
    function EventSourceReceiver(url) {
      debug(url);
      EventEmitter.call(this);
      var self2 = this;
      var es = this.es = new EventSourceDriver(url);
      es.onmessage = function(e) {
        debug("message", e.data);
        self2.emit("message", decodeURI(e.data));
      };
      es.onerror = function(e) {
        debug("error", es.readyState, e);
        var reason = es.readyState !== 2 ? "network" : "permanent";
        self2._cleanup();
        self2._close(reason);
      };
    }
    inherits(EventSourceReceiver, EventEmitter);
    EventSourceReceiver.prototype.abort = function() {
      debug("abort");
      this._cleanup();
      this._close("user");
    };
    EventSourceReceiver.prototype._cleanup = function() {
      debug("cleanup");
      var es = this.es;
      if (es) {
        es.onmessage = es.onerror = null;
        es.close();
        this.es = null;
      }
    };
    EventSourceReceiver.prototype._close = function(reason) {
      debug("close", reason);
      var self2 = this;
      setTimeout(function() {
        self2.emit("close", null, reason);
        self2.removeAllListeners();
      }, 200);
    };
    module.exports = EventSourceReceiver;
  }
});

// node_modules/sockjs-client/lib/transport/eventsource.js
var require_eventsource4 = __commonJS({
  "node_modules/sockjs-client/lib/transport/eventsource.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var AjaxBasedTransport = require_ajax_based();
    var EventSourceReceiver = require_eventsource3();
    var XHRCorsObject = require_xhr_cors();
    var EventSourceDriver = require_eventsource2();
    function EventSourceTransport(transUrl) {
      if (!EventSourceTransport.enabled()) {
        throw new Error("Transport created when disabled");
      }
      AjaxBasedTransport.call(this, transUrl, "/eventsource", EventSourceReceiver, XHRCorsObject);
    }
    inherits(EventSourceTransport, AjaxBasedTransport);
    EventSourceTransport.enabled = function() {
      return !!EventSourceDriver;
    };
    EventSourceTransport.transportName = "eventsource";
    EventSourceTransport.roundTrips = 2;
    module.exports = EventSourceTransport;
  }
});

// node_modules/sockjs-client/lib/version.js
var require_version = __commonJS({
  "node_modules/sockjs-client/lib/version.js"(exports, module) {
    module.exports = "1.6.1";
  }
});

// node_modules/sockjs-client/lib/utils/iframe.js
var require_iframe = __commonJS({
  "node_modules/sockjs-client/lib/utils/iframe.js"(exports, module) {
    "use strict";
    var eventUtils = require_event();
    var browser = require_browser2();
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:utils:iframe");
    }
    module.exports = {
      WPrefix: "_jp",
      currentWindowId: null,
      polluteGlobalNamespace: function() {
        if (!(module.exports.WPrefix in global)) {
          global[module.exports.WPrefix] = {};
        }
      },
      postMessage: function(type, data) {
        if (global.parent !== global) {
          global.parent.postMessage(JSON.stringify({
            windowId: module.exports.currentWindowId,
            type,
            data: data || ""
          }), "*");
        } else {
          debug("Cannot postMessage, no parent window.", type, data);
        }
      },
      createIframe: function(iframeUrl, errorCallback) {
        var iframe = global.document.createElement("iframe");
        var tref, unloadRef;
        var unattach = function() {
          debug("unattach");
          clearTimeout(tref);
          try {
            iframe.onload = null;
          } catch (x) {
          }
          iframe.onerror = null;
        };
        var cleanup = function() {
          debug("cleanup");
          if (iframe) {
            unattach();
            setTimeout(function() {
              if (iframe) {
                iframe.parentNode.removeChild(iframe);
              }
              iframe = null;
            }, 0);
            eventUtils.unloadDel(unloadRef);
          }
        };
        var onerror = function(err) {
          debug("onerror", err);
          if (iframe) {
            cleanup();
            errorCallback(err);
          }
        };
        var post = function(msg, origin) {
          debug("post", msg, origin);
          setTimeout(function() {
            try {
              if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(msg, origin);
              }
            } catch (x) {
            }
          }, 0);
        };
        iframe.src = iframeUrl;
        iframe.style.display = "none";
        iframe.style.position = "absolute";
        iframe.onerror = function() {
          onerror("onerror");
        };
        iframe.onload = function() {
          debug("onload");
          clearTimeout(tref);
          tref = setTimeout(function() {
            onerror("onload timeout");
          }, 2e3);
        };
        global.document.body.appendChild(iframe);
        tref = setTimeout(function() {
          onerror("timeout");
        }, 15e3);
        unloadRef = eventUtils.unloadAdd(cleanup);
        return {
          post,
          cleanup,
          loaded: unattach
        };
      },
      createHtmlfile: function(iframeUrl, errorCallback) {
        var axo = ["Active"].concat("Object").join("X");
        var doc = new global[axo]("htmlfile");
        var tref, unloadRef;
        var iframe;
        var unattach = function() {
          clearTimeout(tref);
          iframe.onerror = null;
        };
        var cleanup = function() {
          if (doc) {
            unattach();
            eventUtils.unloadDel(unloadRef);
            iframe.parentNode.removeChild(iframe);
            iframe = doc = null;
            CollectGarbage();
          }
        };
        var onerror = function(r) {
          debug("onerror", r);
          if (doc) {
            cleanup();
            errorCallback(r);
          }
        };
        var post = function(msg, origin) {
          try {
            setTimeout(function() {
              if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(msg, origin);
              }
            }, 0);
          } catch (x) {
          }
        };
        doc.open();
        doc.write('<html><script>document.domain="' + global.document.domain + '";</script></html>');
        doc.close();
        doc.parentWindow[module.exports.WPrefix] = global[module.exports.WPrefix];
        var c = doc.createElement("div");
        doc.body.appendChild(c);
        iframe = doc.createElement("iframe");
        c.appendChild(iframe);
        iframe.src = iframeUrl;
        iframe.onerror = function() {
          onerror("onerror");
        };
        tref = setTimeout(function() {
          onerror("timeout");
        }, 15e3);
        unloadRef = eventUtils.unloadAdd(cleanup);
        return {
          post,
          cleanup,
          loaded: unattach
        };
      }
    };
    module.exports.iframeEnabled = false;
    if (global.document) {
      module.exports.iframeEnabled = (typeof global.postMessage === "function" || typeof global.postMessage === "object") && !browser.isKonqueror();
    }
  }
});

// node_modules/sockjs-client/lib/transport/iframe.js
var require_iframe2 = __commonJS({
  "node_modules/sockjs-client/lib/transport/iframe.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var EventEmitter = __require("events").EventEmitter;
    var version = require_version();
    var urlUtils = require_url();
    var iframeUtils = require_iframe();
    var eventUtils = require_event();
    var random = require_random();
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:transport:iframe");
    }
    function IframeTransport(transport, transUrl, baseUrl) {
      if (!IframeTransport.enabled()) {
        throw new Error("Transport created when disabled");
      }
      EventEmitter.call(this);
      var self2 = this;
      this.origin = urlUtils.getOrigin(baseUrl);
      this.baseUrl = baseUrl;
      this.transUrl = transUrl;
      this.transport = transport;
      this.windowId = random.string(8);
      var iframeUrl = urlUtils.addPath(baseUrl, "/iframe.html") + "#" + this.windowId;
      debug(transport, transUrl, iframeUrl);
      this.iframeObj = iframeUtils.createIframe(iframeUrl, function(r) {
        debug("err callback");
        self2.emit("close", 1006, "Unable to load an iframe (" + r + ")");
        self2.close();
      });
      this.onmessageCallback = this._message.bind(this);
      eventUtils.attachEvent("message", this.onmessageCallback);
    }
    inherits(IframeTransport, EventEmitter);
    IframeTransport.prototype.close = function() {
      debug("close");
      this.removeAllListeners();
      if (this.iframeObj) {
        eventUtils.detachEvent("message", this.onmessageCallback);
        try {
          this.postMessage("c");
        } catch (x) {
        }
        this.iframeObj.cleanup();
        this.iframeObj = null;
        this.onmessageCallback = this.iframeObj = null;
      }
    };
    IframeTransport.prototype._message = function(e) {
      debug("message", e.data);
      if (!urlUtils.isOriginEqual(e.origin, this.origin)) {
        debug("not same origin", e.origin, this.origin);
        return;
      }
      var iframeMessage;
      try {
        iframeMessage = JSON.parse(e.data);
      } catch (ignored) {
        debug("bad json", e.data);
        return;
      }
      if (iframeMessage.windowId !== this.windowId) {
        debug("mismatched window id", iframeMessage.windowId, this.windowId);
        return;
      }
      switch (iframeMessage.type) {
        case "s":
          this.iframeObj.loaded();
          this.postMessage("s", JSON.stringify([
            version,
            this.transport,
            this.transUrl,
            this.baseUrl
          ]));
          break;
        case "t":
          this.emit("message", iframeMessage.data);
          break;
        case "c":
          var cdata;
          try {
            cdata = JSON.parse(iframeMessage.data);
          } catch (ignored) {
            debug("bad json", iframeMessage.data);
            return;
          }
          this.emit("close", cdata[0], cdata[1]);
          this.close();
          break;
      }
    };
    IframeTransport.prototype.postMessage = function(type, data) {
      debug("postMessage", type, data);
      this.iframeObj.post(JSON.stringify({
        windowId: this.windowId,
        type,
        data: data || ""
      }), this.origin);
    };
    IframeTransport.prototype.send = function(message) {
      debug("send", message);
      this.postMessage("m", message);
    };
    IframeTransport.enabled = function() {
      return iframeUtils.iframeEnabled;
    };
    IframeTransport.transportName = "iframe";
    IframeTransport.roundTrips = 2;
    module.exports = IframeTransport;
  }
});

// node_modules/sockjs-client/lib/utils/object.js
var require_object = __commonJS({
  "node_modules/sockjs-client/lib/utils/object.js"(exports, module) {
    "use strict";
    module.exports = {
      isObject: function(obj) {
        var type = typeof obj;
        return type === "function" || type === "object" && !!obj;
      },
      extend: function(obj) {
        if (!this.isObject(obj)) {
          return obj;
        }
        var source, prop;
        for (var i = 1, length = arguments.length; i < length; i++) {
          source = arguments[i];
          for (prop in source) {
            if (Object.prototype.hasOwnProperty.call(source, prop)) {
              obj[prop] = source[prop];
            }
          }
        }
        return obj;
      }
    };
  }
});

// node_modules/sockjs-client/lib/transport/lib/iframe-wrap.js
var require_iframe_wrap = __commonJS({
  "node_modules/sockjs-client/lib/transport/lib/iframe-wrap.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var IframeTransport = require_iframe2();
    var objectUtils = require_object();
    module.exports = function(transport) {
      function IframeWrapTransport(transUrl, baseUrl) {
        IframeTransport.call(this, transport.transportName, transUrl, baseUrl);
      }
      inherits(IframeWrapTransport, IframeTransport);
      IframeWrapTransport.enabled = function(url, info) {
        if (!global.document) {
          return false;
        }
        var iframeInfo = objectUtils.extend({}, info);
        iframeInfo.sameOrigin = true;
        return transport.enabled(iframeInfo) && IframeTransport.enabled();
      };
      IframeWrapTransport.transportName = "iframe-" + transport.transportName;
      IframeWrapTransport.needBody = true;
      IframeWrapTransport.roundTrips = IframeTransport.roundTrips + transport.roundTrips - 1;
      IframeWrapTransport.facadeTransport = transport;
      return IframeWrapTransport;
    };
  }
});

// node_modules/sockjs-client/lib/transport/receiver/htmlfile.js
var require_htmlfile = __commonJS({
  "node_modules/sockjs-client/lib/transport/receiver/htmlfile.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var iframeUtils = require_iframe();
    var urlUtils = require_url();
    var EventEmitter = __require("events").EventEmitter;
    var random = require_random();
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:receiver:htmlfile");
    }
    function HtmlfileReceiver(url) {
      debug(url);
      EventEmitter.call(this);
      var self2 = this;
      iframeUtils.polluteGlobalNamespace();
      this.id = "a" + random.string(6);
      url = urlUtils.addQuery(url, "c=" + decodeURIComponent(iframeUtils.WPrefix + "." + this.id));
      debug("using htmlfile", HtmlfileReceiver.htmlfileEnabled);
      var constructFunc = HtmlfileReceiver.htmlfileEnabled ? iframeUtils.createHtmlfile : iframeUtils.createIframe;
      global[iframeUtils.WPrefix][this.id] = {
        start: function() {
          debug("start");
          self2.iframeObj.loaded();
        },
        message: function(data) {
          debug("message", data);
          self2.emit("message", data);
        },
        stop: function() {
          debug("stop");
          self2._cleanup();
          self2._close("network");
        }
      };
      this.iframeObj = constructFunc(url, function() {
        debug("callback");
        self2._cleanup();
        self2._close("permanent");
      });
    }
    inherits(HtmlfileReceiver, EventEmitter);
    HtmlfileReceiver.prototype.abort = function() {
      debug("abort");
      this._cleanup();
      this._close("user");
    };
    HtmlfileReceiver.prototype._cleanup = function() {
      debug("_cleanup");
      if (this.iframeObj) {
        this.iframeObj.cleanup();
        this.iframeObj = null;
      }
      delete global[iframeUtils.WPrefix][this.id];
    };
    HtmlfileReceiver.prototype._close = function(reason) {
      debug("_close", reason);
      this.emit("close", null, reason);
      this.removeAllListeners();
    };
    HtmlfileReceiver.htmlfileEnabled = false;
    var axo = ["Active"].concat("Object").join("X");
    if (axo in global) {
      try {
        HtmlfileReceiver.htmlfileEnabled = !!new global[axo]("htmlfile");
      } catch (x) {
      }
    }
    HtmlfileReceiver.enabled = HtmlfileReceiver.htmlfileEnabled || iframeUtils.iframeEnabled;
    module.exports = HtmlfileReceiver;
  }
});

// node_modules/sockjs-client/lib/transport/htmlfile.js
var require_htmlfile2 = __commonJS({
  "node_modules/sockjs-client/lib/transport/htmlfile.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var HtmlfileReceiver = require_htmlfile();
    var XHRLocalObject = require_xhr_local();
    var AjaxBasedTransport = require_ajax_based();
    function HtmlFileTransport(transUrl) {
      if (!HtmlfileReceiver.enabled) {
        throw new Error("Transport created when disabled");
      }
      AjaxBasedTransport.call(this, transUrl, "/htmlfile", HtmlfileReceiver, XHRLocalObject);
    }
    inherits(HtmlFileTransport, AjaxBasedTransport);
    HtmlFileTransport.enabled = function(info) {
      return HtmlfileReceiver.enabled && info.sameOrigin;
    };
    HtmlFileTransport.transportName = "htmlfile";
    HtmlFileTransport.roundTrips = 2;
    module.exports = HtmlFileTransport;
  }
});

// node_modules/sockjs-client/lib/transport/xhr-polling.js
var require_xhr_polling = __commonJS({
  "node_modules/sockjs-client/lib/transport/xhr-polling.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var AjaxBasedTransport = require_ajax_based();
    var XhrReceiver = require_xhr();
    var XHRCorsObject = require_xhr_cors();
    var XHRLocalObject = require_xhr_local();
    function XhrPollingTransport(transUrl) {
      if (!XHRLocalObject.enabled && !XHRCorsObject.enabled) {
        throw new Error("Transport created when disabled");
      }
      AjaxBasedTransport.call(this, transUrl, "/xhr", XhrReceiver, XHRCorsObject);
    }
    inherits(XhrPollingTransport, AjaxBasedTransport);
    XhrPollingTransport.enabled = function(info) {
      if (info.nullOrigin) {
        return false;
      }
      if (XHRLocalObject.enabled && info.sameOrigin) {
        return true;
      }
      return XHRCorsObject.enabled;
    };
    XhrPollingTransport.transportName = "xhr-polling";
    XhrPollingTransport.roundTrips = 2;
    module.exports = XhrPollingTransport;
  }
});

// node_modules/sockjs-client/lib/transport/xdr-polling.js
var require_xdr_polling = __commonJS({
  "node_modules/sockjs-client/lib/transport/xdr-polling.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var AjaxBasedTransport = require_ajax_based();
    var XdrStreamingTransport = require_xdr_streaming();
    var XhrReceiver = require_xhr();
    var XDRObject = require_xdr();
    function XdrPollingTransport(transUrl) {
      if (!XDRObject.enabled) {
        throw new Error("Transport created when disabled");
      }
      AjaxBasedTransport.call(this, transUrl, "/xhr", XhrReceiver, XDRObject);
    }
    inherits(XdrPollingTransport, AjaxBasedTransport);
    XdrPollingTransport.enabled = XdrStreamingTransport.enabled;
    XdrPollingTransport.transportName = "xdr-polling";
    XdrPollingTransport.roundTrips = 2;
    module.exports = XdrPollingTransport;
  }
});

// node_modules/sockjs-client/lib/transport/receiver/jsonp.js
var require_jsonp = __commonJS({
  "node_modules/sockjs-client/lib/transport/receiver/jsonp.js"(exports, module) {
    "use strict";
    var utils = require_iframe();
    var random = require_random();
    var browser = require_browser2();
    var urlUtils = require_url();
    var inherits = require_inherits();
    var EventEmitter = __require("events").EventEmitter;
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:receiver:jsonp");
    }
    function JsonpReceiver(url) {
      debug(url);
      var self2 = this;
      EventEmitter.call(this);
      utils.polluteGlobalNamespace();
      this.id = "a" + random.string(6);
      var urlWithId = urlUtils.addQuery(url, "c=" + encodeURIComponent(utils.WPrefix + "." + this.id));
      global[utils.WPrefix][this.id] = this._callback.bind(this);
      this._createScript(urlWithId);
      this.timeoutId = setTimeout(function() {
        debug("timeout");
        self2._abort(new Error("JSONP script loaded abnormally (timeout)"));
      }, JsonpReceiver.timeout);
    }
    inherits(JsonpReceiver, EventEmitter);
    JsonpReceiver.prototype.abort = function() {
      debug("abort");
      if (global[utils.WPrefix][this.id]) {
        var err = new Error("JSONP user aborted read");
        err.code = 1e3;
        this._abort(err);
      }
    };
    JsonpReceiver.timeout = 35e3;
    JsonpReceiver.scriptErrorTimeout = 1e3;
    JsonpReceiver.prototype._callback = function(data) {
      debug("_callback", data);
      this._cleanup();
      if (this.aborting) {
        return;
      }
      if (data) {
        debug("message", data);
        this.emit("message", data);
      }
      this.emit("close", null, "network");
      this.removeAllListeners();
    };
    JsonpReceiver.prototype._abort = function(err) {
      debug("_abort", err);
      this._cleanup();
      this.aborting = true;
      this.emit("close", err.code, err.message);
      this.removeAllListeners();
    };
    JsonpReceiver.prototype._cleanup = function() {
      debug("_cleanup");
      clearTimeout(this.timeoutId);
      if (this.script2) {
        this.script2.parentNode.removeChild(this.script2);
        this.script2 = null;
      }
      if (this.script) {
        var script = this.script;
        script.parentNode.removeChild(script);
        script.onreadystatechange = script.onerror = script.onload = script.onclick = null;
        this.script = null;
      }
      delete global[utils.WPrefix][this.id];
    };
    JsonpReceiver.prototype._scriptError = function() {
      debug("_scriptError");
      var self2 = this;
      if (this.errorTimer) {
        return;
      }
      this.errorTimer = setTimeout(function() {
        if (!self2.loadedOkay) {
          self2._abort(new Error("JSONP script loaded abnormally (onerror)"));
        }
      }, JsonpReceiver.scriptErrorTimeout);
    };
    JsonpReceiver.prototype._createScript = function(url) {
      debug("_createScript", url);
      var self2 = this;
      var script = this.script = global.document.createElement("script");
      var script2;
      script.id = "a" + random.string(8);
      script.src = url;
      script.type = "text/javascript";
      script.charset = "UTF-8";
      script.onerror = this._scriptError.bind(this);
      script.onload = function() {
        debug("onload");
        self2._abort(new Error("JSONP script loaded abnormally (onload)"));
      };
      script.onreadystatechange = function() {
        debug("onreadystatechange", script.readyState);
        if (/loaded|closed/.test(script.readyState)) {
          if (script && script.htmlFor && script.onclick) {
            self2.loadedOkay = true;
            try {
              script.onclick();
            } catch (x) {
            }
          }
          if (script) {
            self2._abort(new Error("JSONP script loaded abnormally (onreadystatechange)"));
          }
        }
      };
      if (typeof script.async === "undefined" && global.document.attachEvent) {
        if (!browser.isOpera()) {
          try {
            script.htmlFor = script.id;
            script.event = "onclick";
          } catch (x) {
          }
          script.async = true;
        } else {
          script2 = this.script2 = global.document.createElement("script");
          script2.text = "try{var a = document.getElementById('" + script.id + "'); if(a)a.onerror();}catch(x){};";
          script.async = script2.async = false;
        }
      }
      if (typeof script.async !== "undefined") {
        script.async = true;
      }
      var head = global.document.getElementsByTagName("head")[0];
      head.insertBefore(script, head.firstChild);
      if (script2) {
        head.insertBefore(script2, head.firstChild);
      }
    };
    module.exports = JsonpReceiver;
  }
});

// node_modules/sockjs-client/lib/transport/sender/jsonp.js
var require_jsonp2 = __commonJS({
  "node_modules/sockjs-client/lib/transport/sender/jsonp.js"(exports, module) {
    "use strict";
    var random = require_random();
    var urlUtils = require_url();
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:sender:jsonp");
    }
    var form;
    var area;
    function createIframe(id) {
      debug("createIframe", id);
      try {
        return global.document.createElement('<iframe name="' + id + '">');
      } catch (x) {
        var iframe = global.document.createElement("iframe");
        iframe.name = id;
        return iframe;
      }
    }
    function createForm() {
      debug("createForm");
      form = global.document.createElement("form");
      form.style.display = "none";
      form.style.position = "absolute";
      form.method = "POST";
      form.enctype = "application/x-www-form-urlencoded";
      form.acceptCharset = "UTF-8";
      area = global.document.createElement("textarea");
      area.name = "d";
      form.appendChild(area);
      global.document.body.appendChild(form);
    }
    module.exports = function(url, payload, callback) {
      debug(url, payload);
      if (!form) {
        createForm();
      }
      var id = "a" + random.string(8);
      form.target = id;
      form.action = urlUtils.addQuery(urlUtils.addPath(url, "/jsonp_send"), "i=" + id);
      var iframe = createIframe(id);
      iframe.id = id;
      iframe.style.display = "none";
      form.appendChild(iframe);
      try {
        area.value = payload;
      } catch (e) {
      }
      form.submit();
      var completed = function(err) {
        debug("completed", id, err);
        if (!iframe.onerror) {
          return;
        }
        iframe.onreadystatechange = iframe.onerror = iframe.onload = null;
        setTimeout(function() {
          debug("cleaning up", id);
          iframe.parentNode.removeChild(iframe);
          iframe = null;
        }, 500);
        area.value = "";
        callback(err);
      };
      iframe.onerror = function() {
        debug("onerror", id);
        completed();
      };
      iframe.onload = function() {
        debug("onload", id);
        completed();
      };
      iframe.onreadystatechange = function(e) {
        debug("onreadystatechange", id, iframe.readyState, e);
        if (iframe.readyState === "complete") {
          completed();
        }
      };
      return function() {
        debug("aborted", id);
        completed(new Error("Aborted"));
      };
    };
  }
});

// node_modules/sockjs-client/lib/transport/jsonp-polling.js
var require_jsonp_polling = __commonJS({
  "node_modules/sockjs-client/lib/transport/jsonp-polling.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var SenderReceiver = require_sender_receiver();
    var JsonpReceiver = require_jsonp();
    var jsonpSender = require_jsonp2();
    function JsonPTransport(transUrl) {
      if (!JsonPTransport.enabled()) {
        throw new Error("Transport created when disabled");
      }
      SenderReceiver.call(this, transUrl, "/jsonp", jsonpSender, JsonpReceiver);
    }
    inherits(JsonPTransport, SenderReceiver);
    JsonPTransport.enabled = function() {
      return !!global.document;
    };
    JsonPTransport.transportName = "jsonp-polling";
    JsonPTransport.roundTrips = 1;
    JsonPTransport.needBody = true;
    module.exports = JsonPTransport;
  }
});

// node_modules/sockjs-client/lib/transport-list.js
var require_transport_list = __commonJS({
  "node_modules/sockjs-client/lib/transport-list.js"(exports, module) {
    "use strict";
    module.exports = [
      // streaming transports
      require_websocket3(),
      require_xhr_streaming(),
      require_xdr_streaming(),
      require_eventsource4(),
      require_iframe_wrap()(require_eventsource4()),
      require_htmlfile2(),
      require_iframe_wrap()(require_htmlfile2()),
      require_xhr_polling(),
      require_xdr_polling(),
      require_iframe_wrap()(require_xhr_polling()),
      require_jsonp_polling()
    ];
  }
});

// node_modules/sockjs-client/lib/shims.js
var require_shims = __commonJS({
  "node_modules/sockjs-client/lib/shims.js"() {
    "use strict";
    var ArrayPrototype = Array.prototype;
    var ObjectPrototype = Object.prototype;
    var FunctionPrototype = Function.prototype;
    var StringPrototype = String.prototype;
    var array_slice = ArrayPrototype.slice;
    var _toString = ObjectPrototype.toString;
    var isFunction = function(val) {
      return ObjectPrototype.toString.call(val) === "[object Function]";
    };
    var isArray = function isArray2(obj) {
      return _toString.call(obj) === "[object Array]";
    };
    var isString = function isString2(obj) {
      return _toString.call(obj) === "[object String]";
    };
    var supportsDescriptors = Object.defineProperty && (function() {
      try {
        Object.defineProperty({}, "x", {});
        return true;
      } catch (e) {
        return false;
      }
    })();
    var defineProperty;
    if (supportsDescriptors) {
      defineProperty = function(object, name, method, forceAssign) {
        if (!forceAssign && name in object) {
          return;
        }
        Object.defineProperty(object, name, {
          configurable: true,
          enumerable: false,
          writable: true,
          value: method
        });
      };
    } else {
      defineProperty = function(object, name, method, forceAssign) {
        if (!forceAssign && name in object) {
          return;
        }
        object[name] = method;
      };
    }
    var defineProperties = function(object, map, forceAssign) {
      for (var name in map) {
        if (ObjectPrototype.hasOwnProperty.call(map, name)) {
          defineProperty(object, name, map[name], forceAssign);
        }
      }
    };
    var toObject = function(o) {
      if (o == null) {
        throw new TypeError("can't convert " + o + " to object");
      }
      return Object(o);
    };
    function toInteger(num) {
      var n = +num;
      if (n !== n) {
        n = 0;
      } else if (n !== 0 && n !== 1 / 0 && n !== -(1 / 0)) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
      }
      return n;
    }
    function ToUint32(x) {
      return x >>> 0;
    }
    function Empty() {
    }
    defineProperties(FunctionPrototype, {
      bind: function bind(that) {
        var target = this;
        if (!isFunction(target)) {
          throw new TypeError("Function.prototype.bind called on incompatible " + target);
        }
        var args = array_slice.call(arguments, 1);
        var binder = function() {
          if (this instanceof bound) {
            var result = target.apply(
              this,
              args.concat(array_slice.call(arguments))
            );
            if (Object(result) === result) {
              return result;
            }
            return this;
          } else {
            return target.apply(
              that,
              args.concat(array_slice.call(arguments))
            );
          }
        };
        var boundLength = Math.max(0, target.length - args.length);
        var boundArgs = [];
        for (var i = 0; i < boundLength; i++) {
          boundArgs.push("$" + i);
        }
        var bound = Function("binder", "return function (" + boundArgs.join(",") + "){ return binder.apply(this, arguments); }")(binder);
        if (target.prototype) {
          Empty.prototype = target.prototype;
          bound.prototype = new Empty();
          Empty.prototype = null;
        }
        return bound;
      }
    });
    defineProperties(Array, { isArray });
    var boxedString = Object("a");
    var splitString = boxedString[0] !== "a" || !(0 in boxedString);
    var properlyBoxesContext = function properlyBoxed(method) {
      var properlyBoxesNonStrict = true;
      var properlyBoxesStrict = true;
      if (method) {
        method.call("foo", function(_, __, context) {
          if (typeof context !== "object") {
            properlyBoxesNonStrict = false;
          }
        });
        method.call([1], function() {
          "use strict";
          properlyBoxesStrict = typeof this === "string";
        }, "x");
      }
      return !!method && properlyBoxesNonStrict && properlyBoxesStrict;
    };
    defineProperties(ArrayPrototype, {
      forEach: function forEach(fun) {
        var object = toObject(this), self2 = splitString && isString(this) ? this.split("") : object, thisp = arguments[1], i = -1, length = self2.length >>> 0;
        if (!isFunction(fun)) {
          throw new TypeError();
        }
        while (++i < length) {
          if (i in self2) {
            fun.call(thisp, self2[i], i, object);
          }
        }
      }
    }, !properlyBoxesContext(ArrayPrototype.forEach));
    var hasFirefox2IndexOfBug = Array.prototype.indexOf && [0, 1].indexOf(1, 2) !== -1;
    defineProperties(ArrayPrototype, {
      indexOf: function indexOf(sought) {
        var self2 = splitString && isString(this) ? this.split("") : toObject(this), length = self2.length >>> 0;
        if (!length) {
          return -1;
        }
        var i = 0;
        if (arguments.length > 1) {
          i = toInteger(arguments[1]);
        }
        i = i >= 0 ? i : Math.max(0, length + i);
        for (; i < length; i++) {
          if (i in self2 && self2[i] === sought) {
            return i;
          }
        }
        return -1;
      }
    }, hasFirefox2IndexOfBug);
    var string_split = StringPrototype.split;
    if ("ab".split(/(?:ab)*/).length !== 2 || ".".split(/(.?)(.?)/).length !== 4 || "tesst".split(/(s)*/)[1] === "t" || "test".split(/(?:)/, -1).length !== 4 || "".split(/.?/).length || ".".split(/()()/).length > 1) {
      (function() {
        var compliantExecNpcg = /()??/.exec("")[1] === void 0;
        StringPrototype.split = function(separator, limit) {
          var string = this;
          if (separator === void 0 && limit === 0) {
            return [];
          }
          if (_toString.call(separator) !== "[object RegExp]") {
            return string_split.call(this, separator, limit);
          }
          var output = [], flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + // Proposed for ES6
          (separator.sticky ? "y" : ""), lastLastIndex = 0, separator2, match, lastIndex, lastLength;
          separator = new RegExp(separator.source, flags + "g");
          string += "";
          if (!compliantExecNpcg) {
            separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
          }
          limit = limit === void 0 ? -1 >>> 0 : (
            // Math.pow(2, 32) - 1
            ToUint32(limit)
          );
          while (match = separator.exec(string)) {
            lastIndex = match.index + match[0].length;
            if (lastIndex > lastLastIndex) {
              output.push(string.slice(lastLastIndex, match.index));
              if (!compliantExecNpcg && match.length > 1) {
                match[0].replace(separator2, function() {
                  for (var i = 1; i < arguments.length - 2; i++) {
                    if (arguments[i] === void 0) {
                      match[i] = void 0;
                    }
                  }
                });
              }
              if (match.length > 1 && match.index < string.length) {
                ArrayPrototype.push.apply(output, match.slice(1));
              }
              lastLength = match[0].length;
              lastLastIndex = lastIndex;
              if (output.length >= limit) {
                break;
              }
            }
            if (separator.lastIndex === match.index) {
              separator.lastIndex++;
            }
          }
          if (lastLastIndex === string.length) {
            if (lastLength || !separator.test("")) {
              output.push("");
            }
          } else {
            output.push(string.slice(lastLastIndex));
          }
          return output.length > limit ? output.slice(0, limit) : output;
        };
      })();
    } else if ("0".split(void 0, 0).length) {
      StringPrototype.split = function split(separator, limit) {
        if (separator === void 0 && limit === 0) {
          return [];
        }
        return string_split.call(this, separator, limit);
      };
    }
    var string_substr = StringPrototype.substr;
    var hasNegativeSubstrBug = "".substr && "0b".substr(-1) !== "b";
    defineProperties(StringPrototype, {
      substr: function substr(start, length) {
        return string_substr.call(
          this,
          start < 0 ? (start = this.length + start) < 0 ? 0 : start : start,
          length
        );
      }
    }, hasNegativeSubstrBug);
  }
});

// node_modules/sockjs-client/lib/utils/escape.js
var require_escape = __commonJS({
  "node_modules/sockjs-client/lib/utils/escape.js"(exports, module) {
    "use strict";
    var extraEscapable = /[\x00-\x1f\ud800-\udfff\ufffe\uffff\u0300-\u0333\u033d-\u0346\u034a-\u034c\u0350-\u0352\u0357-\u0358\u035c-\u0362\u0374\u037e\u0387\u0591-\u05af\u05c4\u0610-\u0617\u0653-\u0654\u0657-\u065b\u065d-\u065e\u06df-\u06e2\u06eb-\u06ec\u0730\u0732-\u0733\u0735-\u0736\u073a\u073d\u073f-\u0741\u0743\u0745\u0747\u07eb-\u07f1\u0951\u0958-\u095f\u09dc-\u09dd\u09df\u0a33\u0a36\u0a59-\u0a5b\u0a5e\u0b5c-\u0b5d\u0e38-\u0e39\u0f43\u0f4d\u0f52\u0f57\u0f5c\u0f69\u0f72-\u0f76\u0f78\u0f80-\u0f83\u0f93\u0f9d\u0fa2\u0fa7\u0fac\u0fb9\u1939-\u193a\u1a17\u1b6b\u1cda-\u1cdb\u1dc0-\u1dcf\u1dfc\u1dfe\u1f71\u1f73\u1f75\u1f77\u1f79\u1f7b\u1f7d\u1fbb\u1fbe\u1fc9\u1fcb\u1fd3\u1fdb\u1fe3\u1feb\u1fee-\u1fef\u1ff9\u1ffb\u1ffd\u2000-\u2001\u20d0-\u20d1\u20d4-\u20d7\u20e7-\u20e9\u2126\u212a-\u212b\u2329-\u232a\u2adc\u302b-\u302c\uaab2-\uaab3\uf900-\ufa0d\ufa10\ufa12\ufa15-\ufa1e\ufa20\ufa22\ufa25-\ufa26\ufa2a-\ufa2d\ufa30-\ufa6d\ufa70-\ufad9\ufb1d\ufb1f\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufb4e\ufff0-\uffff]/g;
    var extraLookup;
    var unrollLookup = function(escapable) {
      var i;
      var unrolled = {};
      var c = [];
      for (i = 0; i < 65536; i++) {
        c.push(String.fromCharCode(i));
      }
      escapable.lastIndex = 0;
      c.join("").replace(escapable, function(a) {
        unrolled[a] = "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        return "";
      });
      escapable.lastIndex = 0;
      return unrolled;
    };
    module.exports = {
      quote: function(string) {
        var quoted = JSON.stringify(string);
        extraEscapable.lastIndex = 0;
        if (!extraEscapable.test(quoted)) {
          return quoted;
        }
        if (!extraLookup) {
          extraLookup = unrollLookup(extraEscapable);
        }
        return quoted.replace(extraEscapable, function(a) {
          return extraLookup[a];
        });
      }
    };
  }
});

// node_modules/sockjs-client/lib/utils/transport.js
var require_transport = __commonJS({
  "node_modules/sockjs-client/lib/utils/transport.js"(exports, module) {
    "use strict";
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:utils:transport");
    }
    module.exports = function(availableTransports) {
      return {
        filterToEnabled: function(transportsWhitelist, info) {
          var transports = {
            main: [],
            facade: []
          };
          if (!transportsWhitelist) {
            transportsWhitelist = [];
          } else if (typeof transportsWhitelist === "string") {
            transportsWhitelist = [transportsWhitelist];
          }
          availableTransports.forEach(function(trans) {
            if (!trans) {
              return;
            }
            if (trans.transportName === "websocket" && info.websocket === false) {
              debug("disabled from server", "websocket");
              return;
            }
            if (transportsWhitelist.length && transportsWhitelist.indexOf(trans.transportName) === -1) {
              debug("not in whitelist", trans.transportName);
              return;
            }
            if (trans.enabled(info)) {
              debug("enabled", trans.transportName);
              transports.main.push(trans);
              if (trans.facadeTransport) {
                transports.facade.push(trans.facadeTransport);
              }
            } else {
              debug("disabled", trans.transportName);
            }
          });
          return transports;
        }
      };
    };
  }
});

// node_modules/sockjs-client/lib/utils/log.js
var require_log = __commonJS({
  "node_modules/sockjs-client/lib/utils/log.js"(exports, module) {
    "use strict";
    var logObject = {};
    ["log", "debug", "warn"].forEach(function(level) {
      var levelExists;
      try {
        levelExists = global.console && global.console[level] && global.console[level].apply;
      } catch (e) {
      }
      logObject[level] = levelExists ? function() {
        return global.console[level].apply(global.console, arguments);
      } : level === "log" ? function() {
      } : logObject.log;
    });
    module.exports = logObject;
  }
});

// node_modules/sockjs-client/lib/event/event.js
var require_event3 = __commonJS({
  "node_modules/sockjs-client/lib/event/event.js"(exports, module) {
    "use strict";
    function Event(eventType) {
      this.type = eventType;
    }
    Event.prototype.initEvent = function(eventType, canBubble, cancelable) {
      this.type = eventType;
      this.bubbles = canBubble;
      this.cancelable = cancelable;
      this.timeStamp = +/* @__PURE__ */ new Date();
      return this;
    };
    Event.prototype.stopPropagation = function() {
    };
    Event.prototype.preventDefault = function() {
    };
    Event.CAPTURING_PHASE = 1;
    Event.AT_TARGET = 2;
    Event.BUBBLING_PHASE = 3;
    module.exports = Event;
  }
});

// node_modules/sockjs-client/lib/event/eventtarget.js
var require_eventtarget = __commonJS({
  "node_modules/sockjs-client/lib/event/eventtarget.js"(exports, module) {
    "use strict";
    function EventTarget() {
      this._listeners = {};
    }
    EventTarget.prototype.addEventListener = function(eventType, listener) {
      if (!(eventType in this._listeners)) {
        this._listeners[eventType] = [];
      }
      var arr = this._listeners[eventType];
      if (arr.indexOf(listener) === -1) {
        arr = arr.concat([listener]);
      }
      this._listeners[eventType] = arr;
    };
    EventTarget.prototype.removeEventListener = function(eventType, listener) {
      var arr = this._listeners[eventType];
      if (!arr) {
        return;
      }
      var idx = arr.indexOf(listener);
      if (idx !== -1) {
        if (arr.length > 1) {
          this._listeners[eventType] = arr.slice(0, idx).concat(arr.slice(idx + 1));
        } else {
          delete this._listeners[eventType];
        }
        return;
      }
    };
    EventTarget.prototype.dispatchEvent = function() {
      var event = arguments[0];
      var t = event.type;
      var args = arguments.length === 1 ? [event] : Array.apply(null, arguments);
      if (this["on" + t]) {
        this["on" + t].apply(this, args);
      }
      if (t in this._listeners) {
        var listeners = this._listeners[t];
        for (var i = 0; i < listeners.length; i++) {
          listeners[i].apply(this, args);
        }
      }
    };
    module.exports = EventTarget;
  }
});

// node_modules/sockjs-client/lib/location.js
var require_location = __commonJS({
  "node_modules/sockjs-client/lib/location.js"(exports, module) {
    "use strict";
    module.exports = global.location || {
      origin: "http://localhost:80",
      protocol: "http:",
      host: "localhost",
      port: 80,
      href: "http://localhost/",
      hash: ""
    };
  }
});

// node_modules/sockjs-client/lib/event/close.js
var require_close = __commonJS({
  "node_modules/sockjs-client/lib/event/close.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var Event = require_event3();
    function CloseEvent() {
      Event.call(this);
      this.initEvent("close", false, false);
      this.wasClean = false;
      this.code = 0;
      this.reason = "";
    }
    inherits(CloseEvent, Event);
    module.exports = CloseEvent;
  }
});

// node_modules/sockjs-client/lib/event/trans-message.js
var require_trans_message = __commonJS({
  "node_modules/sockjs-client/lib/event/trans-message.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var Event = require_event3();
    function TransportMessageEvent(data) {
      Event.call(this);
      this.initEvent("message", false, false);
      this.data = data;
    }
    inherits(TransportMessageEvent, Event);
    module.exports = TransportMessageEvent;
  }
});

// node_modules/sockjs-client/lib/transport/sender/xhr-fake.js
var require_xhr_fake = __commonJS({
  "node_modules/sockjs-client/lib/transport/sender/xhr-fake.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var inherits = require_inherits();
    function XHRFake() {
      var self2 = this;
      EventEmitter.call(this);
      this.to = setTimeout(function() {
        self2.emit("finish", 200, "{}");
      }, XHRFake.timeout);
    }
    inherits(XHRFake, EventEmitter);
    XHRFake.prototype.close = function() {
      clearTimeout(this.to);
    };
    XHRFake.timeout = 2e3;
    module.exports = XHRFake;
  }
});

// node_modules/sockjs-client/lib/info-ajax.js
var require_info_ajax = __commonJS({
  "node_modules/sockjs-client/lib/info-ajax.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var inherits = require_inherits();
    var objectUtils = require_object();
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:info-ajax");
    }
    function InfoAjax(url, AjaxObject) {
      EventEmitter.call(this);
      var self2 = this;
      var t0 = +/* @__PURE__ */ new Date();
      this.xo = new AjaxObject("GET", url);
      this.xo.once("finish", function(status, text) {
        var info, rtt;
        if (status === 200) {
          rtt = +/* @__PURE__ */ new Date() - t0;
          if (text) {
            try {
              info = JSON.parse(text);
            } catch (e) {
              debug("bad json", text);
            }
          }
          if (!objectUtils.isObject(info)) {
            info = {};
          }
        }
        self2.emit("finish", info, rtt);
        self2.removeAllListeners();
      });
    }
    inherits(InfoAjax, EventEmitter);
    InfoAjax.prototype.close = function() {
      this.removeAllListeners();
      this.xo.close();
    };
    module.exports = InfoAjax;
  }
});

// node_modules/sockjs-client/lib/info-iframe-receiver.js
var require_info_iframe_receiver = __commonJS({
  "node_modules/sockjs-client/lib/info-iframe-receiver.js"(exports, module) {
    "use strict";
    var inherits = require_inherits();
    var EventEmitter = __require("events").EventEmitter;
    var XHRLocalObject = require_xhr_local();
    var InfoAjax = require_info_ajax();
    function InfoReceiverIframe(transUrl) {
      var self2 = this;
      EventEmitter.call(this);
      this.ir = new InfoAjax(transUrl, XHRLocalObject);
      this.ir.once("finish", function(info, rtt) {
        self2.ir = null;
        self2.emit("message", JSON.stringify([info, rtt]));
      });
    }
    inherits(InfoReceiverIframe, EventEmitter);
    InfoReceiverIframe.transportName = "iframe-info-receiver";
    InfoReceiverIframe.prototype.close = function() {
      if (this.ir) {
        this.ir.close();
        this.ir = null;
      }
      this.removeAllListeners();
    };
    module.exports = InfoReceiverIframe;
  }
});

// node_modules/sockjs-client/lib/info-iframe.js
var require_info_iframe = __commonJS({
  "node_modules/sockjs-client/lib/info-iframe.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var inherits = require_inherits();
    var utils = require_event();
    var IframeTransport = require_iframe2();
    var InfoReceiverIframe = require_info_iframe_receiver();
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:info-iframe");
    }
    function InfoIframe(baseUrl, url) {
      var self2 = this;
      EventEmitter.call(this);
      var go = function() {
        var ifr = self2.ifr = new IframeTransport(InfoReceiverIframe.transportName, url, baseUrl);
        ifr.once("message", function(msg) {
          if (msg) {
            var d;
            try {
              d = JSON.parse(msg);
            } catch (e) {
              debug("bad json", msg);
              self2.emit("finish");
              self2.close();
              return;
            }
            var info = d[0], rtt = d[1];
            self2.emit("finish", info, rtt);
          }
          self2.close();
        });
        ifr.once("close", function() {
          self2.emit("finish");
          self2.close();
        });
      };
      if (!global.document.body) {
        utils.attachEvent("load", go);
      } else {
        go();
      }
    }
    inherits(InfoIframe, EventEmitter);
    InfoIframe.enabled = function() {
      return IframeTransport.enabled();
    };
    InfoIframe.prototype.close = function() {
      if (this.ifr) {
        this.ifr.close();
      }
      this.removeAllListeners();
      this.ifr = null;
    };
    module.exports = InfoIframe;
  }
});

// node_modules/sockjs-client/lib/info-receiver.js
var require_info_receiver = __commonJS({
  "node_modules/sockjs-client/lib/info-receiver.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events").EventEmitter;
    var inherits = require_inherits();
    var urlUtils = require_url();
    var XDR = require_xdr();
    var XHRCors = require_xhr_cors();
    var XHRLocal = require_xhr_local();
    var XHRFake = require_xhr_fake();
    var InfoIframe = require_info_iframe();
    var InfoAjax = require_info_ajax();
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:info-receiver");
    }
    function InfoReceiver(baseUrl, urlInfo) {
      debug(baseUrl);
      var self2 = this;
      EventEmitter.call(this);
      setTimeout(function() {
        self2.doXhr(baseUrl, urlInfo);
      }, 0);
    }
    inherits(InfoReceiver, EventEmitter);
    InfoReceiver._getReceiver = function(baseUrl, url, urlInfo) {
      if (urlInfo.sameOrigin) {
        return new InfoAjax(url, XHRLocal);
      }
      if (XHRCors.enabled) {
        return new InfoAjax(url, XHRCors);
      }
      if (XDR.enabled && urlInfo.sameScheme) {
        return new InfoAjax(url, XDR);
      }
      if (InfoIframe.enabled()) {
        return new InfoIframe(baseUrl, url);
      }
      return new InfoAjax(url, XHRFake);
    };
    InfoReceiver.prototype.doXhr = function(baseUrl, urlInfo) {
      var self2 = this, url = urlUtils.addPath(baseUrl, "/info");
      debug("doXhr", url);
      this.xo = InfoReceiver._getReceiver(baseUrl, url, urlInfo);
      this.timeoutRef = setTimeout(function() {
        debug("timeout");
        self2._cleanup(false);
        self2.emit("finish");
      }, InfoReceiver.timeout);
      this.xo.once("finish", function(info, rtt) {
        debug("finish", info, rtt);
        self2._cleanup(true);
        self2.emit("finish", info, rtt);
      });
    };
    InfoReceiver.prototype._cleanup = function(wasClean) {
      debug("_cleanup");
      clearTimeout(this.timeoutRef);
      this.timeoutRef = null;
      if (!wasClean && this.xo) {
        this.xo.close();
      }
      this.xo = null;
    };
    InfoReceiver.prototype.close = function() {
      debug("close");
      this.removeAllListeners();
      this._cleanup(false);
    };
    InfoReceiver.timeout = 8e3;
    module.exports = InfoReceiver;
  }
});

// node_modules/sockjs-client/lib/facade.js
var require_facade = __commonJS({
  "node_modules/sockjs-client/lib/facade.js"(exports, module) {
    "use strict";
    var iframeUtils = require_iframe();
    function FacadeJS(transport) {
      this._transport = transport;
      transport.on("message", this._transportMessage.bind(this));
      transport.on("close", this._transportClose.bind(this));
    }
    FacadeJS.prototype._transportClose = function(code, reason) {
      iframeUtils.postMessage("c", JSON.stringify([code, reason]));
    };
    FacadeJS.prototype._transportMessage = function(frame) {
      iframeUtils.postMessage("t", frame);
    };
    FacadeJS.prototype._send = function(data) {
      this._transport.send(data);
    };
    FacadeJS.prototype._close = function() {
      this._transport.close();
      this._transport.removeAllListeners();
    };
    module.exports = FacadeJS;
  }
});

// node_modules/sockjs-client/lib/iframe-bootstrap.js
var require_iframe_bootstrap = __commonJS({
  "node_modules/sockjs-client/lib/iframe-bootstrap.js"(exports, module) {
    "use strict";
    var urlUtils = require_url();
    var eventUtils = require_event();
    var FacadeJS = require_facade();
    var InfoIframeReceiver = require_info_iframe_receiver();
    var iframeUtils = require_iframe();
    var loc = require_location();
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:iframe-bootstrap");
    }
    module.exports = function(SockJS, availableTransports) {
      var transportMap = {};
      availableTransports.forEach(function(at) {
        if (at.facadeTransport) {
          transportMap[at.facadeTransport.transportName] = at.facadeTransport;
        }
      });
      transportMap[InfoIframeReceiver.transportName] = InfoIframeReceiver;
      var parentOrigin;
      SockJS.bootstrap_iframe = function() {
        var facade;
        iframeUtils.currentWindowId = loc.hash.slice(1);
        var onMessage = function(e) {
          if (e.source !== parent) {
            return;
          }
          if (typeof parentOrigin === "undefined") {
            parentOrigin = e.origin;
          }
          if (e.origin !== parentOrigin) {
            return;
          }
          var iframeMessage;
          try {
            iframeMessage = JSON.parse(e.data);
          } catch (ignored) {
            debug("bad json", e.data);
            return;
          }
          if (iframeMessage.windowId !== iframeUtils.currentWindowId) {
            return;
          }
          switch (iframeMessage.type) {
            case "s":
              var p;
              try {
                p = JSON.parse(iframeMessage.data);
              } catch (ignored) {
                debug("bad json", iframeMessage.data);
                break;
              }
              var version = p[0];
              var transport = p[1];
              var transUrl = p[2];
              var baseUrl = p[3];
              debug(version, transport, transUrl, baseUrl);
              if (version !== SockJS.version) {
                throw new Error('Incompatible SockJS! Main site uses: "' + version + '", the iframe: "' + SockJS.version + '".');
              }
              if (!urlUtils.isOriginEqual(transUrl, loc.href) || !urlUtils.isOriginEqual(baseUrl, loc.href)) {
                throw new Error("Can't connect to different domain from within an iframe. (" + loc.href + ", " + transUrl + ", " + baseUrl + ")");
              }
              facade = new FacadeJS(new transportMap[transport](transUrl, baseUrl));
              break;
            case "m":
              facade._send(iframeMessage.data);
              break;
            case "c":
              if (facade) {
                facade._close();
              }
              facade = null;
              break;
          }
        };
        eventUtils.attachEvent("message", onMessage);
        iframeUtils.postMessage("s");
      };
    };
  }
});

// node_modules/sockjs-client/lib/main.js
var require_main = __commonJS({
  "node_modules/sockjs-client/lib/main.js"(exports, module) {
    "use strict";
    require_shims();
    var URL2 = require_url_parse();
    var inherits = require_inherits();
    var random = require_random();
    var escape = require_escape();
    var urlUtils = require_url();
    var eventUtils = require_event();
    var transport = require_transport();
    var objectUtils = require_object();
    var browser = require_browser2();
    var log = require_log();
    var Event = require_event3();
    var EventTarget = require_eventtarget();
    var loc = require_location();
    var CloseEvent = require_close();
    var TransportMessageEvent = require_trans_message();
    var InfoReceiver = require_info_receiver();
    var debug = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      debug = require_src()("sockjs-client:main");
    }
    var transports;
    function SockJS(url, protocols, options) {
      if (!(this instanceof SockJS)) {
        return new SockJS(url, protocols, options);
      }
      if (arguments.length < 1) {
        throw new TypeError("Failed to construct 'SockJS: 1 argument required, but only 0 present");
      }
      EventTarget.call(this);
      this.readyState = SockJS.CONNECTING;
      this.extensions = "";
      this.protocol = "";
      options = options || {};
      if (options.protocols_whitelist) {
        log.warn("'protocols_whitelist' is DEPRECATED. Use 'transports' instead.");
      }
      this._transportsWhitelist = options.transports;
      this._transportOptions = options.transportOptions || {};
      this._timeout = options.timeout || 0;
      var sessionId = options.sessionId || 8;
      if (typeof sessionId === "function") {
        this._generateSessionId = sessionId;
      } else if (typeof sessionId === "number") {
        this._generateSessionId = function() {
          return random.string(sessionId);
        };
      } else {
        throw new TypeError("If sessionId is used in the options, it needs to be a number or a function.");
      }
      this._server = options.server || random.numberString(1e3);
      var parsedUrl = new URL2(url);
      if (!parsedUrl.host || !parsedUrl.protocol) {
        throw new SyntaxError("The URL '" + url + "' is invalid");
      } else if (parsedUrl.hash) {
        throw new SyntaxError("The URL must not contain a fragment");
      } else if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new SyntaxError("The URL's scheme must be either 'http:' or 'https:'. '" + parsedUrl.protocol + "' is not allowed.");
      }
      var secure = parsedUrl.protocol === "https:";
      if (loc.protocol === "https:" && !secure) {
        if (!urlUtils.isLoopbackAddr(parsedUrl.hostname)) {
          throw new Error("SecurityError: An insecure SockJS connection may not be initiated from a page loaded over HTTPS");
        }
      }
      if (!protocols) {
        protocols = [];
      } else if (!Array.isArray(protocols)) {
        protocols = [protocols];
      }
      var sortedProtocols = protocols.sort();
      sortedProtocols.forEach(function(proto, i) {
        if (!proto) {
          throw new SyntaxError("The protocols entry '" + proto + "' is invalid.");
        }
        if (i < sortedProtocols.length - 1 && proto === sortedProtocols[i + 1]) {
          throw new SyntaxError("The protocols entry '" + proto + "' is duplicated.");
        }
      });
      var o = urlUtils.getOrigin(loc.href);
      this._origin = o ? o.toLowerCase() : null;
      parsedUrl.set("pathname", parsedUrl.pathname.replace(/\/+$/, ""));
      this.url = parsedUrl.href;
      debug("using url", this.url);
      this._urlInfo = {
        nullOrigin: !browser.hasDomain(),
        sameOrigin: urlUtils.isOriginEqual(this.url, loc.href),
        sameScheme: urlUtils.isSchemeEqual(this.url, loc.href)
      };
      this._ir = new InfoReceiver(this.url, this._urlInfo);
      this._ir.once("finish", this._receiveInfo.bind(this));
    }
    inherits(SockJS, EventTarget);
    function userSetCode(code) {
      return code === 1e3 || code >= 3e3 && code <= 4999;
    }
    SockJS.prototype.close = function(code, reason) {
      if (code && !userSetCode(code)) {
        throw new Error("InvalidAccessError: Invalid code");
      }
      if (reason && reason.length > 123) {
        throw new SyntaxError("reason argument has an invalid length");
      }
      if (this.readyState === SockJS.CLOSING || this.readyState === SockJS.CLOSED) {
        return;
      }
      var wasClean = true;
      this._close(code || 1e3, reason || "Normal closure", wasClean);
    };
    SockJS.prototype.send = function(data) {
      if (typeof data !== "string") {
        data = "" + data;
      }
      if (this.readyState === SockJS.CONNECTING) {
        throw new Error("InvalidStateError: The connection has not been established yet");
      }
      if (this.readyState !== SockJS.OPEN) {
        return;
      }
      this._transport.send(escape.quote(data));
    };
    SockJS.version = require_version();
    SockJS.CONNECTING = 0;
    SockJS.OPEN = 1;
    SockJS.CLOSING = 2;
    SockJS.CLOSED = 3;
    SockJS.prototype._receiveInfo = function(info, rtt) {
      debug("_receiveInfo", rtt);
      this._ir = null;
      if (!info) {
        this._close(1002, "Cannot connect to server");
        return;
      }
      this._rto = this.countRTO(rtt);
      this._transUrl = info.base_url ? info.base_url : this.url;
      info = objectUtils.extend(info, this._urlInfo);
      debug("info", info);
      var enabledTransports = transports.filterToEnabled(this._transportsWhitelist, info);
      this._transports = enabledTransports.main;
      debug(this._transports.length + " enabled transports");
      this._connect();
    };
    SockJS.prototype._connect = function() {
      for (var Transport = this._transports.shift(); Transport; Transport = this._transports.shift()) {
        debug("attempt", Transport.transportName);
        if (Transport.needBody) {
          if (!global.document.body || typeof global.document.readyState !== "undefined" && global.document.readyState !== "complete" && global.document.readyState !== "interactive") {
            debug("waiting for body");
            this._transports.unshift(Transport);
            eventUtils.attachEvent("load", this._connect.bind(this));
            return;
          }
        }
        var timeoutMs = Math.max(this._timeout, this._rto * Transport.roundTrips || 5e3);
        this._transportTimeoutId = setTimeout(this._transportTimeout.bind(this), timeoutMs);
        debug("using timeout", timeoutMs);
        var transportUrl = urlUtils.addPath(this._transUrl, "/" + this._server + "/" + this._generateSessionId());
        var options = this._transportOptions[Transport.transportName];
        debug("transport url", transportUrl);
        var transportObj = new Transport(transportUrl, this._transUrl, options);
        transportObj.on("message", this._transportMessage.bind(this));
        transportObj.once("close", this._transportClose.bind(this));
        transportObj.transportName = Transport.transportName;
        this._transport = transportObj;
        return;
      }
      this._close(2e3, "All transports failed", false);
    };
    SockJS.prototype._transportTimeout = function() {
      debug("_transportTimeout");
      if (this.readyState === SockJS.CONNECTING) {
        if (this._transport) {
          this._transport.close();
        }
        this._transportClose(2007, "Transport timed out");
      }
    };
    SockJS.prototype._transportMessage = function(msg) {
      debug("_transportMessage", msg);
      var self2 = this, type = msg.slice(0, 1), content = msg.slice(1), payload;
      switch (type) {
        case "o":
          this._open();
          return;
        case "h":
          this.dispatchEvent(new Event("heartbeat"));
          debug("heartbeat", this.transport);
          return;
      }
      if (content) {
        try {
          payload = JSON.parse(content);
        } catch (e) {
          debug("bad json", content);
        }
      }
      if (typeof payload === "undefined") {
        debug("empty payload", content);
        return;
      }
      switch (type) {
        case "a":
          if (Array.isArray(payload)) {
            payload.forEach(function(p) {
              debug("message", self2.transport, p);
              self2.dispatchEvent(new TransportMessageEvent(p));
            });
          }
          break;
        case "m":
          debug("message", this.transport, payload);
          this.dispatchEvent(new TransportMessageEvent(payload));
          break;
        case "c":
          if (Array.isArray(payload) && payload.length === 2) {
            this._close(payload[0], payload[1], true);
          }
          break;
      }
    };
    SockJS.prototype._transportClose = function(code, reason) {
      debug("_transportClose", this.transport, code, reason);
      if (this._transport) {
        this._transport.removeAllListeners();
        this._transport = null;
        this.transport = null;
      }
      if (!userSetCode(code) && code !== 2e3 && this.readyState === SockJS.CONNECTING) {
        this._connect();
        return;
      }
      this._close(code, reason);
    };
    SockJS.prototype._open = function() {
      debug("_open", this._transport && this._transport.transportName, this.readyState);
      if (this.readyState === SockJS.CONNECTING) {
        if (this._transportTimeoutId) {
          clearTimeout(this._transportTimeoutId);
          this._transportTimeoutId = null;
        }
        this.readyState = SockJS.OPEN;
        this.transport = this._transport.transportName;
        this.dispatchEvent(new Event("open"));
        debug("connected", this.transport);
      } else {
        this._close(1006, "Server lost session");
      }
    };
    SockJS.prototype._close = function(code, reason, wasClean) {
      debug("_close", this.transport, code, reason, wasClean, this.readyState);
      var forceFail = false;
      if (this._ir) {
        forceFail = true;
        this._ir.close();
        this._ir = null;
      }
      if (this._transport) {
        this._transport.close();
        this._transport = null;
        this.transport = null;
      }
      if (this.readyState === SockJS.CLOSED) {
        throw new Error("InvalidStateError: SockJS has already been closed");
      }
      this.readyState = SockJS.CLOSING;
      setTimeout((function() {
        this.readyState = SockJS.CLOSED;
        if (forceFail) {
          this.dispatchEvent(new Event("error"));
        }
        var e = new CloseEvent("close");
        e.wasClean = wasClean || false;
        e.code = code || 1e3;
        e.reason = reason;
        this.dispatchEvent(e);
        this.onmessage = this.onclose = this.onerror = null;
        debug("disconnected");
      }).bind(this), 0);
    };
    SockJS.prototype.countRTO = function(rtt) {
      if (rtt > 100) {
        return 4 * rtt;
      }
      return 300 + rtt;
    };
    module.exports = function(availableTransports) {
      transports = transport(availableTransports);
      require_iframe_bootstrap()(SockJS, availableTransports);
      return SockJS;
    };
  }
});

// node_modules/sockjs-client/lib/entry.js
var require_entry = __commonJS({
  "node_modules/sockjs-client/lib/entry.js"(exports, module) {
    var transportList = require_transport_list();
    module.exports = require_main()(transportList);
    if ("_sockjs_onload" in global) {
      setTimeout(global._sockjs_onload, 1);
    }
  }
});
export default require_entry();
//# sourceMappingURL=sockjs-client.js.map
