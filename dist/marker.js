'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _marked = require('marked');

var _marked2 = _interopRequireDefault(_marked);

var _highlight2 = require('highlight.js');

var _highlight3 = _interopRequireDefault(_highlight2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_marked2.default.setOptions({
  sanitize: false,
  langPrefix: 'hljs lang-',
  highlight: function highlight(code, lang) {
    if (_highlight3.default.getLanguage(lang)) {
      return _highlight3.default.highlight(lang, code).value;
    } else {
      console.warn('highlight.js: LANGUAGE NOT FOUND: ```%s', lang);
      return code;
    }
  }
});

exports.default = _marked2.default;