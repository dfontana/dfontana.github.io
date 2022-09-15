{# 
  Adapted from 
    - https://squidfunk.github.io/mkdocs-material/reference/admonitions 
    - https://github.com/Python-Markdown/markdown/tree/master/markdown/extensions
    - https://facelessuser.github.io/pymdown-extensions/extensions/details/ 
#}
{% if collapse %}
  <details {% if is_open %}open="open"{% endif%} class="{{type}}">
  <summary>{% if title %}{{title | capitalize }}{% else %}{{type | capitalize }}{% endif%}</summary>
  {{body | markdown}}
</details>
{% else %}
  <div class="admonition {{type}}">
    <p class="admonition-title">{% if title %}{{title | capitalize }}{% else %}{{type | capitalize }}{% endif%}</p>
    {{body | markdown}}
  </div>
{% endif %}

