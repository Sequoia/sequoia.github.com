import marked from 'marked';
import highlight from 'highlight.js';

marked.setOptions({
  sanitize: false,
  langPrefix : 'hljs lang-',
  highlight: function (code) {
    return highlight.highlightAuto(code).value;
  }
});

export default marked;
