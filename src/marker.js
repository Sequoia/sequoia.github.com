import marked from 'marked';
import highlight from 'highlight.js';

var wordpress_compat_options = {
  sanitize: false,
  langPrefix : 'hljs lang-',
  highlight: function (code, lang) {
    if(lang == 'nohighlight' || typeof lang === 'undefined' || lang === 'jade'){
      return `<pre class="lang:default highlight:0 decode:true">${code}</pre>`;
    }else{
      return `<pre class="lang:${lang} decode:true">${code}</pre>`;
    }
  }
}

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

// marked.setOptions(wordpress_compat_options);

export default marked;
