/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var SPRandomListItemsCreation = __webpack_require__(1);

	var getQueryStringParameter = function (param) {
	    var params = document.URL.split("?")[1].split("&");
	    var strParams = "";

	    for (var i = 0; i < params.length; i = i + 1) {
	        var singleParam = params[i].split("=");

	        if (singleParam[0] == param) {
	            return decodeURIComponent(singleParam[1]);
	        }
	    }
	};

	var appWebUrl = getQueryStringParameter('SPAppWebUrl');
	var randomListItemsCreation = new SPRandomListItemsCreation(appWebUrl, 'TestList');

	randomListItemsCreation.create({
	    'Title': /great|good|bad|excellent/,
	    'Score': /\d{3}/
	}, 20, function (sender, args) {
	    $('#message').html('List items are createdly successfully. <a href=\'' + appWebUrl + '/Lists/TestList\'>Check it</a>.');
	}, function (sender, args) {
	    $('#message').text(args.get_message());
	});


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var RandExp = __webpack_require__(2);
	var contextHelper = __webpack_require__(9);

	function SPRandomListItemsCreation(webUrl, listTitle, useAppContextSite) {
	    var contextWrapper = contextHelper(webUrl, useAppContextSite);
	    var web = contextWrapper.web;
	    this.clientContext = contextWrapper.clientContext;
	    this.list = web.get_lists().getByTitle(listTitle);
	}

	SPRandomListItemsCreation.prototype.create = function (fieldValuesRegularExpression, count, successHandler, errorHandler) {
	    for (var i = 0; i < count; i++) {
	        var listItemCreateInfo = new SP.ListItemCreationInformation();
	        var listItem = this.list.addItem(listItemCreateInfo);

	        for (var fieldName in fieldValuesRegularExpression) {
	            if (fieldValuesRegularExpression.hasOwnProperty(fieldName)) {
	                listItem.set_item(fieldName, new RandExp(fieldValuesRegularExpression[fieldName]).gen());
	            }
	        }

	        listItem.update();
	        this.clientContext.load(listItem);
	    }

	    this.clientContext.executeQueryAsync(successHandler, errorHandler);
	};

	module.exports = SPRandomListItemsCreation;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var ret = __webpack_require__(3);
	var DRange = __webpack_require__(8);
	var types = ret.types;


	/**
	 * If code is alphabetic, converts to other case.
	 * If not alphabetic, returns back code.
	 *
	 * @param {Number} code
	 * @return {Number}
	 */
	function toOtherCase(code) {
	  return code + (97 <= code && code <= 122 ? -32 :
	                 65 <= code && code <= 90  ?  32 : 0);
	}


	/**
	 * Randomly returns a true or false value.
	 *
	 * @return {Boolean}
	 */
	function randBool() {
	  return !this.randInt(0, 1);
	};


	/**
	 * Randomly selects and returns a value from the array.
	 *
	 * @param {Array.<Object>} arr
	 * @return {Object}
	 */
	function randSelect(arr) {
	  if (arr instanceof DRange) {
	    return arr.index(this.randInt(0, arr.length - 1));
	  }
	  return arr[this.randInt(0, arr.length - 1)];
	};


	/**
	 * Determines if a character code is alphabetic and decide
	 * to switch case randomly.
	 *
	 * @param {Number} code
	 * @param {Boolean} ignoreCase
	 * @return {String}
	 */
	function char(code, ignoreCase) {
	  code = ignoreCase && randBool.call(this) ? toOtherCase(code) : code;
	  return String.fromCharCode(code);
	};


	/**
	 * expands a token to a DiscontinuousRange of characters which has a 
	 * length and an index function (for random selecting)
	 *
	 * @param {Object} token
	 * @return {DiscontinuousRange}
	 */
	function expand(token) {
	  if (token.type === ret.types.CHAR) return new DRange(token.value);
	  if (token.type === ret.types.RANGE) return new DRange(token.from, token.to);
	  if (token.type === ret.types.SET) {
	    var drange = new DRange();
	    for (var i = 0; i < token.set.length; i++) {
	      drange.add(expand.call(this, token.set[i]));
	    }
	    if (token.not) {
	      return this.defaultRange.clone().subtract(drange);
	    } else {
	      return drange;
	    }
	  }
	  throw new Error('unexpandable token type: ' + token.type);
	};


	/**
	 * @constructor
	 * @param {RegExp|String} regexp
	 * @param {String} m
	 */
	var RandExp = module.exports = function(regexp, m) {
	  this.defaultRange = this.defaultRange.clone();
	  if (regexp instanceof RegExp) {
	    this.ignoreCase = regexp.ignoreCase;
	    this.multiline = regexp.multiline;
	    if (typeof regexp.max === 'number') {
	      this.max = regexp.max;
	    }
	    regexp = regexp.source;

	  } else if (typeof regexp === 'string') {
	    this.ignoreCase = m && m.indexOf('i') !== -1;
	    this.multiline = m && m.indexOf('m') !== -1;
	  } else {
	    throw new Error('Expected a regexp or string');
	  }

	  this.tokens = ret(regexp);
	};


	// When a repetitional token has its max set to Infinite,
	// randexp won't actually generate a random amount between min and Infinite
	// instead it will see Infinite as min + 100.
	RandExp.prototype.max = 100;


	// Generates the random string.
	RandExp.prototype.gen = function() {
	  return gen.call(this, this.tokens, []);
	};


	// Enables use of randexp with a shorter call.
	RandExp.randexp = function(regexp, m) {
	  var randexp;

	  if (regexp._randexp === undefined) {
	    randexp = new RandExp(regexp, m);
	    regexp._randexp = randexp;
	  } else {
	    randexp = regexp._randexp;
	    if (typeof regexp.max === 'number') {
	      randexp.max = regexp.max;
	    }
	    if (regexp.defaultRange instanceof DRange) {
	      randexp.defaultRange = regexp.defaultRange;
	    }
	    if (typeof regexp.randInt === 'function') {
	      randexp.randInt = regexp.randInt;
	    }
	  }

	  return randexp.gen();
	};


	// This enables sugary /regexp/.gen syntax.
	RandExp.sugar = function() {
	  /* jshint freeze:false */
	  RegExp.prototype.gen = function() {
	    return RandExp.randexp(this);
	  };
	};

	// This allows expanding to include additional characters
	// for instance: RandExp.defaultRange.add(0, 65535);
	RandExp.prototype.defaultRange = new DRange(32, 126);






	/**
	 * Randomly generates and returns a number between a and b (inclusive).
	 *
	 * @param {Number} a
	 * @param {Number} b
	 * @return {Number}
	 */
	RandExp.prototype.randInt = function(a, b) {
	  return a + Math.floor(Math.random() * (1 + b - a));
	};


	/**
	 * Generate random string modeled after given tokens.
	 *
	 * @param {Object} token
	 * @param {Array.<String>} groups
	 * @return {String}
	 */
	function gen(token, groups) {
	  var stack, str, n, i, l;

	  switch (token.type) {


	    case types.ROOT:
	    case types.GROUP:
	      if (token.notFollowedBy) { return ''; }

	      // Insert placeholder until group string is generated.
	      if (token.remember && token.groupNumber === undefined) {
	        token.groupNumber = groups.push(null) - 1;
	      }

	      stack = token.options ? randSelect.call(this, token.options) : token.stack;

	      str = '';
	      for (i = 0, l = stack.length; i < l; i++) {
	        str += gen.call(this, stack[i], groups);
	      }

	      if (token.remember) {
	        groups[token.groupNumber] = str;
	      }
	      return str;


	    case types.POSITION:
	      // Do nothing for now.
	      return '';


	    case types.SET:

	      var expanded_set = expand.call(this, token);
	      if (!expanded_set.length) return '';
	      return char.call(this, randSelect.call(this, expanded_set), this.ignoreCase);

	    case types.RANGE:
	      return char.call(this, this.randInt(token.from, token.to), this.ignoreCase);


	    case types.REPETITION:
	      // Randomly generate number between min and max.
	      n = this.randInt(token.min,
	              token.max === Infinity ? token.min + this.max : token.max);

	      str = '';
	      for (i = 0; i < n; i++) {
	        str += gen.call(this, token.value, groups);
	      }

	      return str;


	    case types.REFERENCE:
	      return groups[token.value - 1] || '';


	    case types.CHAR:
	      return char.call(this, token.value, this.ignoreCase);
	  }
	}




/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var util      = __webpack_require__(4);
	var types     = __webpack_require__(5);
	var sets      = __webpack_require__(6);
	var positions = __webpack_require__(7);


	module.exports = function(regexpStr) {
	  var i = 0, l, c,
	      start = { type: types.ROOT, stack: []},

	      // Keep track of last clause/group and stack.
	      lastGroup = start,
	      last = start.stack,
	      groupStack = [];


	  var repeatErr = function(i) {
	    util.error(regexpStr, 'Nothing to repeat at column ' + (i - 1));
	  };

	  // Decode a few escaped characters.
	  var str = util.strToChars(regexpStr);
	  l = str.length;

	  // Iterate through each character in string.
	  while (i < l) {
	    c = str[i++];

	    switch (c) {
	      // Handle escaped characters, inclues a few sets.
	      case '\\':
	        c = str[i++];

	        switch (c) {
	          case 'b':
	            last.push(positions.wordBoundary());
	            break;

	          case 'B':
	            last.push(positions.nonWordBoundary());
	            break;

	          case 'w':
	            last.push(sets.words());
	            break;

	          case 'W':
	            last.push(sets.notWords());
	            break;

	          case 'd':
	            last.push(sets.ints());
	            break;

	          case 'D':
	            last.push(sets.notInts());
	            break;

	          case 's':
	            last.push(sets.whitespace());
	            break;

	          case 'S':
	            last.push(sets.notWhitespace());
	            break;

	          default:
	            // Check if c is integer.
	            // In which case it's a reference.
	            if (/\d/.test(c)) {
	              last.push({ type: types.REFERENCE, value: parseInt(c, 10) });

	            // Escaped character.
	            } else {
	              last.push({ type: types.CHAR, value: c.charCodeAt(0) });
	            }
	        }

	        break;


	      // Positionals.
	      case '^':
	          last.push(positions.begin());
	        break;

	      case '$':
	          last.push(positions.end());
	        break;


	      // Handle custom sets.
	      case '[':
	        // Check if this class is 'anti' i.e. [^abc].
	        var not;
	        if (str[i] === '^') {
	          not = true;
	          i++;
	        } else {
	          not = false;
	        }

	        // Get all the characters in class.
	        var classTokens = util.tokenizeClass(str.slice(i), regexpStr);

	        // Increase index by length of class.
	        i += classTokens[1];
	        last.push({
	            type: types.SET
	          , set: classTokens[0]
	          , not: not
	        });

	        break;


	      // Class of any character except \n.
	      case '.':
	        last.push(sets.anyChar());
	        break;


	      // Push group onto stack.
	      case '(':
	        // Create group.
	        var group = {
	            type: types.GROUP
	          , stack: []
	          , remember: true
	        };

	        c = str[i];

	        // if if this is a special kind of group.
	        if (c === '?') {
	          c = str[i + 1];
	          i += 2;

	          // Match if followed by.
	          if (c === '=') {
	            group.followedBy = true;

	          // Match if not followed by.
	          } else if (c === '!') {
	            group.notFollowedBy = true;

	          } else if (c !== ':') {
	            util.error(regexpStr,
	                'Invalid group, character \'' + c + '\' after \'?\' at column ' +
	                (i - 1));
	          }

	          group.remember = false;
	        }

	        // Insert subgroup into current group stack.
	        last.push(group);

	        // Remember the current group for when the group closes.
	        groupStack.push(lastGroup);

	        // Make this new group the current group.
	        lastGroup = group;
	        last = group.stack;
	        break;


	      // Pop group out of stack.
	      case ')':
	        if (groupStack.length === 0) {
	          util.error(regexpStr, 'Unmatched ) at column ' + (i - 1));
	        }
	        lastGroup = groupStack.pop();

	        // Check if this group has a PIPE.
	        // To get back the correct last stack.
	        last = lastGroup.options ? lastGroup.options[lastGroup.options.length - 1] : lastGroup.stack;
	        break;


	      // Use pipe character to give more choices.
	      case '|':
	        // Create array where options are if this is the first PIPE
	        // in this clause.
	        if (!lastGroup.options) {
	          lastGroup.options = [lastGroup.stack];
	          delete lastGroup.stack;
	        }

	        // Create a new stack and add to options for rest of clause.
	        var stack = [];
	        lastGroup.options.push(stack);
	        last = stack;
	        break;


	      // Repetition.
	      // For every repetition, remove last element from last stack
	      // then insert back a RANGE object.
	      // This design is chosen because there could be more than
	      // one repetition symbols in a regex i.e. `a?+{2,3}`.
	      case '{':
	        var rs = /^(\d+)(,(\d+)?)?\}/.exec(str.slice(i)), min, max;
	        if (rs !== null) {
	          min = parseInt(rs[1], 10);
	          max = rs[2] ? rs[3] ? parseInt(rs[3], 10) : Infinity : min;
	          i += rs[0].length;

	          last.push({
	              type: types.REPETITION
	            , min: min
	            , max: max
	            , value: last.pop()
	          });
	        } else {
	          last.push({
	              type: types.CHAR
	            , value: 123
	          });
	        }
	        break;

	      case '?':
	        if (last.length === 0) {
	          repeatErr(i);
	        }
	        last.push({
	            type: types.REPETITION
	          , min: 0
	          , max: 1
	          , value: last.pop()
	        });
	        break;

	      case '+':
	        if (last.length === 0) {
	          repeatErr(i);
	        }
	        last.push({
	            type: types.REPETITION
	          , min: 1
	          , max: Infinity
	          , value: last.pop()
	        });
	        break;

	      case '*':
	        if (last.length === 0) {
	          repeatErr(i);
	        }
	        last.push({
	            type: types.REPETITION
	          , min: 0
	          , max: Infinity
	          , value: last.pop()
	        });
	        break;


	      // Default is a character that is not `\[](){}?+*^$`.
	      default:
	        last.push({
	            type: types.CHAR
	          , value: c.charCodeAt(0)
	        });
	    }

	  }

	  // Check if any groups have not been closed.
	  if (groupStack.length !== 0) {
	    util.error(regexpStr, 'Unterminated group');
	  }

	  return start;
	};

	module.exports.types = types;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var types = __webpack_require__(5);
	var sets  = __webpack_require__(6);


	// All of these are private and only used by randexp.
	// It's assumed that they will always be called with the correct input.

	var CTRL = '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^ ?';
	var SLSH = { '0': 0, 't': 9, 'n': 10, 'v': 11, 'f': 12, 'r': 13 };

	/**
	 * Finds character representations in str and convert all to
	 * their respective characters
	 *
	 * @param {String} str
	 * @return {String}
	 */
	exports.strToChars = function(str) {
	  var chars_regex = /(\[\\b\])|\\(?:u([A-F0-9]{4})|x([A-F0-9]{2})|(0?[0-7]{2})|c([@A-Z\[\\\]\^?])|([0tnvfr]))/g;
	  str = str.replace(chars_regex, function(s, b, a16, b16, c8, dctrl, eslsh) {
	    var code = b     ? 8 :
	               a16   ? parseInt(a16, 16) :
	               b16   ? parseInt(b16, 16) :
	               c8    ? parseInt(c8,   8) :
	               dctrl ? CTRL.indexOf(dctrl) :
	               eslsh ? SLSH[eslsh] : undefined;
	    
	    var c = String.fromCharCode(code);

	    // Escape special regex characters.
	    if (/[\[\]{}\^$.|?*+()]/.test(c)) {
	      c = '\\' + c;
	    }

	    return c;
	  });

	  return str;
	};


	/**
	 * turns class into tokens
	 * reads str until it encounters a ] not preceeded by a \
	 *
	 * @param {String} str
	 * @param {String} regexpStr
	 * @return {Array.<Array.<Object>, Number>}
	 */
	exports.tokenizeClass = function(str, regexpStr) {
	  var tokens = []
	    , regexp = /\\(?:(w)|(d)|(s)|(W)|(D)|(S))|((?:(?:\\)(.)|([^\]\\]))-(?:\\)?([^\]]))|(\])|(?:\\)?(.)/g
	    , rs, c
	    ;


	  while ((rs = regexp.exec(str)) != null) {
	    if (rs[1]) {
	      tokens.push(sets.words());

	    } else if (rs[2]) {
	      tokens.push(sets.ints());

	    } else if (rs[3]) {
	      tokens.push(sets.whitespace());

	    } else if (rs[4]) {
	      tokens.push(sets.notWords());

	    } else if (rs[5]) {
	      tokens.push(sets.notInts());

	    } else if (rs[6]) {
	      tokens.push(sets.notWhitespace());

	    } else if (rs[7]) {
	      tokens.push({
	          type: types.RANGE
	        , from: (rs[8] || rs[9]).charCodeAt(0)
	        ,   to: rs[10].charCodeAt(0)
	      });

	    } else if (c = rs[12]) {
	      tokens.push({
	          type: types.CHAR
	        , value: c.charCodeAt(0)
	      });

	    } else {
	      return [tokens, regexp.lastIndex];
	    }
	  }

	  exports.error(regexpStr, 'Unterminated character class');
	};


	/**
	 * Shortcut to throw errors.
	 *
	 * @param {String} regexp
	 * @param {String} msg
	 */
	exports.error = function(regexp, msg) {
	  throw new SyntaxError('Invalid regular expression: /' + regexp + '/: ' + msg);
	};


/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = {
	    ROOT       : 0
	  , GROUP      : 1
	  , POSITION   : 2
	  , SET        : 3
	  , RANGE      : 4
	  , REPETITION : 5
	  , REFERENCE  : 6
	  , CHAR       : 7
	};


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var types = __webpack_require__(5);

	var INTS = function() {
	 return [{ type: types.RANGE , from: 48, to: 57 }];
	};

	var WORDS = function() {
	 return [
	      { type: types.CHAR, value: 95 }
	    , { type: types.RANGE, from: 97, to: 122 }
	    , { type: types.RANGE, from: 65, to: 90 }
	  ].concat(INTS());
	};

	var WHITESPACE = function() {
	 return [
	      { type: types.CHAR, value: 9 }
	    , { type: types.CHAR, value: 10 }
	    , { type: types.CHAR, value: 11 }
	    , { type: types.CHAR, value: 12 }
	    , { type: types.CHAR, value: 13 }
	    , { type: types.CHAR, value: 32 }
	    , { type: types.CHAR, value: 160 }
	    , { type: types.CHAR, value: 5760 }
	    , { type: types.CHAR, value: 6158 }
	    , { type: types.CHAR, value: 8192 }
	    , { type: types.CHAR, value: 8193 }
	    , { type: types.CHAR, value: 8194 }
	    , { type: types.CHAR, value: 8195 }
	    , { type: types.CHAR, value: 8196 }
	    , { type: types.CHAR, value: 8197 }
	    , { type: types.CHAR, value: 8198 }
	    , { type: types.CHAR, value: 8199 }
	    , { type: types.CHAR, value: 8200 }
	    , { type: types.CHAR, value: 8201 }
	    , { type: types.CHAR, value: 8202 }
	    , { type: types.CHAR, value: 8232 }
	    , { type: types.CHAR, value: 8233 }
	    , { type: types.CHAR, value: 8239 }
	    , { type: types.CHAR, value: 8287 }
	    , { type: types.CHAR, value: 12288 }
	    , { type: types.CHAR, value: 65279 }
	  ];
	};

	var NOTANYCHAR = function() {
	 return [
	      { type: types.CHAR, value: 10 }
	    , { type: types.CHAR, value: 13 }
	    , { type: types.CHAR, value: 8232 }
	    , { type: types.CHAR, value: 8233 }
	  ];
	};

	// predefined class objects
	exports.words = function() {
	  return { type: types.SET, set: WORDS(), not: false };
	};

	exports.notWords = function() {
	  return { type: types.SET, set: WORDS(), not: true };
	};

	exports.ints = function() {
	  return { type: types.SET, set: INTS(), not: false };
	};

	exports.notInts = function() {
	  return { type: types.SET, set: INTS(), not: true };
	};

	exports.whitespace = function() {
	  return { type: types.SET, set: WHITESPACE(), not: false };
	};

	exports.notWhitespace = function() {
	  return { type: types.SET, set: WHITESPACE(), not: true };
	};

	exports.anyChar = function() {
	  return { type: types.SET, set: NOTANYCHAR(), not: true };
	};


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var types = __webpack_require__(5);

	exports.wordBoundary = function() {
	  return { type: types.POSITION, value: 'b' };
	};

	exports.nonWordBoundary = function() {
	  return { type: types.POSITION, value: 'B' };
	};

	exports.begin = function() {
	  return { type: types.POSITION, value: '^' };
	};

	exports.end = function() {
	  return { type: types.POSITION, value: '$' };
	};


/***/ },
/* 8 */
/***/ function(module, exports) {

	//protected helper class
	function _SubRange(low, high) {
	    this.low = low;
	    this.high = high;
	    this.length = 1 + high - low;
	}

	_SubRange.prototype.overlaps = function (range) {
	    return !(this.high < range.low || this.low > range.high);
	};

	_SubRange.prototype.touches = function (range) {
	    return !(this.high + 1 < range.low || this.low - 1 > range.high);
	};

	//returns inclusive combination of _SubRanges as a _SubRange
	_SubRange.prototype.add = function (range) {
	    return this.touches(range) && new _SubRange(Math.min(this.low, range.low), Math.max(this.high, range.high));
	};

	//returns subtraction of _SubRanges as an array of _SubRanges (there's a case where subtraction divides it in 2)
	_SubRange.prototype.subtract = function (range) {
	    if (!this.overlaps(range)) return false;
	    if (range.low <= this.low && range.high >= this.high) return [];
	    if (range.low > this.low && range.high < this.high) return [new _SubRange(this.low, range.low - 1), new _SubRange(range.high + 1, this.high)];
	    if (range.low <= this.low) return [new _SubRange(range.high + 1, this.high)];
	    return [new _SubRange(this.low, range.low - 1)];
	};

	_SubRange.prototype.toString = function () {
	    if (this.low == this.high) return this.low.toString();
	    return this.low + '-' + this.high;
	};

	_SubRange.prototype.clone = function () {
	    return new _SubRange(this.low, this.high);
	};




	function DiscontinuousRange(a, b) {
	    if (this instanceof DiscontinuousRange) {
	        this.ranges = [];
	        this.length = 0;
	        if (a !== undefined) this.add(a, b);
	    } else {
	        return new DiscontinuousRange(a, b);
	    }
	}

	function _update_length(self) {
	    self.length = self.ranges.reduce(function (previous, range) {return previous + range.length}, 0);
	}

	DiscontinuousRange.prototype.add = function (a, b) {
	    var self = this;
	    function _add(subrange) {
	        var new_ranges = [];
	        var i = 0;
	        while (i < self.ranges.length && !subrange.touches(self.ranges[i])) {
	            new_ranges.push(self.ranges[i].clone());
	            i++;
	        }
	        while (i < self.ranges.length && subrange.touches(self.ranges[i])) {
	            subrange = subrange.add(self.ranges[i]);
	            i++;
	        }
	        new_ranges.push(subrange);
	        while (i < self.ranges.length) {
	            new_ranges.push(self.ranges[i].clone());
	            i++;
	        }
	        self.ranges = new_ranges;
	        _update_length(self);
	    }

	    if (a instanceof DiscontinuousRange) {
	        a.ranges.forEach(_add);
	    } else {
	        if (a instanceof _SubRange) {
	            _add(a);
	        } else {
	            if (b === undefined) b = a;
	            _add(new _SubRange(a, b));
	        }
	    }
	    return this;
	};

	DiscontinuousRange.prototype.subtract = function (a, b) {
	    var self = this;
	    function _subtract(subrange) {
	        var new_ranges = [];
	        var i = 0;
	        while (i < self.ranges.length && !subrange.overlaps(self.ranges[i])) {
	            new_ranges.push(self.ranges[i].clone());
	            i++;
	        }
	        while (i < self.ranges.length && subrange.overlaps(self.ranges[i])) {
	            new_ranges = new_ranges.concat(self.ranges[i].subtract(subrange));
	            i++;
	        }
	        while (i < self.ranges.length) {
	            new_ranges.push(self.ranges[i].clone());
	            i++;
	        }
	        self.ranges = new_ranges;
	        _update_length(self);
	    }
	    if (a instanceof DiscontinuousRange) {
	        a.ranges.forEach(_subtract);
	    } else {
	        if (a instanceof _SubRange) {
	            _subtract(a);
	        } else {
	            if (b === undefined) b = a;
	            _subtract(new _SubRange(a, b));
	        }
	    }
	    return this;
	};


	DiscontinuousRange.prototype.index = function (index) {
	    var i = 0;
	    while (i < this.ranges.length && this.ranges[i].length <= index) {
	        index -= this.ranges[i].length;
	        i++;
	    }
	    if (i >= this.ranges.length) return null;
	    return this.ranges[i].low + index;
	};


	DiscontinuousRange.prototype.toString = function () {
	    return '[ ' + this.ranges.join(', ') + ' ]'
	};

	DiscontinuousRange.prototype.clone = function () {
	    return new DiscontinuousRange(this);
	};

	module.exports = DiscontinuousRange;


/***/ },
/* 9 */
/***/ function(module, exports) {

	function contextHelper(webUrl, crossSite) {
	    var web = null;
	    var site = null;
	    var clientContext = null;
	    var appContextSite = null;

	    if (crossSite) {
	        clientContext = SP.ClientContext.get_current();
	        appContextSite = new SP.AppContextSite(clientContext, webUrl);
	        web = appContextSite.get_web();
	        site = appContextSite.get_site();
	    } else {
	        clientContext = new SP.ClientContext(webUrl);
	        web = clientContext.get_web();
	        site = clientContext.get_site();
	    }

	    return {
	        web: web,
	        site: site,
	        clientContext: clientContext,
	        appContextSite: appContextSite
	    };
	}

	module.exports = contextHelper;

/***/ }
/******/ ]);