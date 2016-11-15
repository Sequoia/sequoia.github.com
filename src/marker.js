import marked from 'marked';
import highlight from 'highlight.js';

marked.setOptions({
  sanitize: false,
  langPrefix : 'hljs lang-',
  highlight: function (code, lang) {
    if(highlight.getLanguage(lang)){
      return highlight.highlight(lang, code).value; 
    }else{
      console.warn('highlight.js: LANGUAGE NOT FOUND: ```%s', lang);
      return code;
    }
  }
});

export default marked;
