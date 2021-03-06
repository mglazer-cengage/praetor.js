var JSONPath = require("JSONPath")// JSONPathStoredProc (JPSP)

// using JSONpath query syntax 
// query a data store JSON object
// name the query for programmatic use
// name a code block against that query resultset

/* Praeter.js 0.1 - Stored Procedures (JS Code blocks) for JSON results via XPath JSON 
 *
 * Copyright (c) 2015 Michael Glazer (https://github.com/magnumjs/praetor.js)
 * Licensed under the MIT (MIT-LICENSE.txt) licence.
 */

var p = (function(window, undefined) {
  'use strict';
  
  // UTIL FUNCTIONS
  var realMerge = function(to, from) {
    for (var n in from) {
      if (typeof to[n] != 'object') {
        to[n] = from[n];
      } else if (typeof from[n] == 'object') {
        to[n] = realMerge(to[n], from[n]);
      }
    }
    return to;
  };
  // TODO: why two mege functions, diff, nested issues?
  function copy(to, from){
    for (var attr in from) {
      to[attr] = to[attr] === undefined ? from[attr] : to[attr]
    }
    return to
  }
  function createFunctionExec(queryResults, storedProc, parms) {
    // create temp function
    var fun = Function(storedProc.codeBody)

    //merge parms with defaults 
    //TODO: parms will override if attr don't exist
    for (var attr in storedProc.parms) {
      parms[attr] = parms[attr] === undefined ? storedProc.parms[attr] : parms[attr]
    }
    //TODO: optional context via defaults override options
    var context = {
      results: queryResults,
      params: parms
    }
    // execute proc and return results
    var ret = fun.apply(context)
    if (ret) return ret
    return context.results
  }
  // UTIL FUNCTIONS
  
  // data contruct
  var map = {}
  map.stores = {}
  map.queries = {}
  map.procs = {}

  // copy - don't modify!
  var model = function() {
    return JSON.parse(JSON.stringify(map))
  }()

  var defaults = {jsonPathOptions:{}}, // library defaults
      options  = {}, // user supplied
      settings = {} // combo of defaults and over rides in options

  var OBJECT = "[object Object]"
  var type = {}.toString;
  
  // initializer
  function p(state, id, options) {
    // add options with defaults to get settings
    //  p.settings = options + defaults
    // attach to id
    p.setOptions(options, id)
    //merge incoming state with copy of model
    var nstate= copy(state, JSON.parse(JSON.stringify(model)))
    p.map(id, nstate)
  }
  p.setOptions=function(noptions, id){
    // states options / id
    options = noptions
    p.settings(noptions, id);
  }
  p.getOptions=function(){
    return options
  }
  
  p.settings=function(noptions, id){
    // cache settings ?
    // settings into state?
    settings= realMerge(defaults, noptions)
    return settings
  }

  p.map = function(id, state) {
    this.state = this.state || {}
    if (id && type.call(id) !== OBJECT) {
      if (!this.state[id])
        this.state[id] = state || JSON.parse(JSON.stringify(model))
      return this.state[id]
    }
    this.state[p.id] = state || this.state[p.id] || map
    return this.state[p.id]
  }

  p.proc = function(json, queries, code, parms) {
    // can be raw or by stored names
    var queryResults = queries.map(function(query, idx) {
      return JSONPath(p.settings().jsonPathOptions, json, query)
    })
    var storedProc = {
      parms: parms,
      codeBody: code
    };
    //return results;
    return createFunctionExec(queryResults, storedProc, parms);
  }

  p.setDataStore = function(name, data, id) {
    p.map(id).stores[name] = data
  }

  p.getDataStore = function(name, id) {
    return p.map(id).stores[name]
  }

  p.setJsonQuery = function(name, JsonPathQuery, storeName, id) {
    p.map(id).queries[name] = {
      query: JsonPathQuery,
      store: storeName
    }
  }
  p.getJsonQuery = function(name, id) {
    return p.map(id).queries[name]
  }
  p.getJsonQueryResult = function(name, id) {
    var jsonQuery = p.getJsonQuery(name, id)
    var data = p.getDataStore(jsonQuery.store, id)
    var result = JSONPath(p.settings().jsonPathOptions, data, jsonQuery.query)
    return result
  }

  p.setStoredProc = function(name, namedQueries, codeBody, parms, id) {
    p.map(id).procs[name] = {
      namedQueries: namedQueries,
      codeBody: codeBody,
      parms: parms
    }
  }
  p.getStoredProc = function(name, id) {
    return p.map(id).procs[name]
  }

  p.getStoredProcResult = function(name, parms, id) {
    var storedProc = p.getStoredProc(name, id)
    var queryResults = [];
    // get all results
    queryResults = storedProc.namedQueries.map(function(val, idx) {
      var result = {}
      result[val] = p.getJsonQueryResult(val, id)
      return result
    })
    return createFunctionExec(queryResults, storedProc, parms);
  }

  // api methods
  p.setState = function(id, state) {
    p.map(id, state)
  }
  p.getState = function(id) {
    return JSON.parse(JSON.stringify(p.map(id)));
  }

  return p

})(typeof window != "undefined" ? window : {});

if (typeof module != "undefined" && module !== null && module.exports) module.exports = p;
else if (typeof define === "function" && define.amd) define(function() {
  return p
});


/*global module, exports, require*/
/*jslint vars:true, evil:true*/
/* JSONPath 0.8.0 - XPath for JSON
 *
 * Copyright (c) 2007 Stefan Goessner (goessner.net)
 * Licensed under the MIT (MIT-LICENSE.txt) licence.
 * modded by https://github.com/s3u/JSONPath
 * OPTIONS: 
 * autostart (default: true) - If this is supplied as false, one may call the evaluate method manually as needed.
 * flatten (default: false) - Whether the returned array of results will be flattened to a single dimension array.
 * resultType (default: "value") - Can be case-insensitive form of "value" or "path" to determine whether to return results as the values of the found items or as their absolute paths.
 * sandbox (*default: An empty object *) - Key-value map of variables to be available to code evaluations such as filtering expressions. (Note that the current path and value will also be available; see the Syntax section for details.)
 * wrap (default: true) 
 */
 //!function(require){"use strict";function push(t,e){return t=t.slice(),t.push(e),t}function unshift(t,e){return e=e.slice(),e.unshift(t),e}function JSONPath(t,e,r){if(!(this instanceof JSONPath))try{return new JSONPath(t,e,r)}catch(a){if(!a.avoidNew)throw a;return a.value}t=t||{};var n=t.hasOwnProperty("json")&&t.hasOwnProperty("path");if(this.resultType=t.resultType&&t.resultType.toLowerCase()||"value",this.flatten=t.flatten||!1,this.wrap=t.hasOwnProperty("wrap")?t.wrap:!0,this.sandbox=t.sandbox||{},t.autostart!==!1){var i=this.evaluate(n?t.json:e,n?t.path:r);if(!i||"object"!=typeof reg)throw{avoidNew:!0,value:i,message:"JSONPath should not be called with 'new'"}}}Array.isArray||(Array.isArray=function(t){return"[object Array]"===Object.prototype.toString.call(t)});var isNode="undefined"!=typeof module&&!!module.exports,vm=isNode?require("vm"):{runInNewContext:function(expr,context){return eval(Object.keys(context).reduce(function(t,e){return"var "+e+"="+JSON.stringify(context[e])+";"+t},expr))}},cache={};JSONPath.prototype.evaluate=function(t,e){var r=this;if(this._obj=t,e&&t&&("value"===this.resultType||"path"===this.resultType)){var a=this._normalize(e);"$"===a[0]&&a.length>1&&a.shift();var n=this._trace(a,t,["$"]);return n=n.filter(function(t){return t&&!t.isParentSelector}),n.length?1!==n.length||this.wrap||Array.isArray(n[0].value)?n.reduce(function(t,e){var a=e[r.resultType];return"path"===r.resultType&&(a=r._asPath(a)),r.flatten&&Array.isArray(a)?t=t.concat(a):t.push(a),t},[]):n[0][this.resultType]||!1:this.wrap?[]:!1}},JSONPath.prototype._normalize=function(t){if(cache[t])return cache[t];var e=[],r=t.replace(/[\['](\??\(.*?\))[\]']/g,function(t,r){return"[#"+(e.push(r)-1)+"]"}).replace(/'?\.'?|\['?/g,";").replace(/(?:;)?(\^+)(?:;)?/g,function(t,e){return";"+e.split("").join(";")+";"}).replace(/;;;|;;/g,";..;").replace(/;$|'?\]|'$/g,""),a=r.split(";").map(function(t){var r=t.match(/#([0-9]+)/);return r&&r[1]?e[r[1]]:t});return cache[t]=a,cache[t]},JSONPath.prototype._asPath=function(t){var e,r,a=t,n="$";for(e=1,r=a.length;r>e;e++)n+=/^[0-9*]+$/.test(a[e])?"["+a[e]+"]":"['"+a[e]+"']";return n},JSONPath.prototype._trace=function(t,e,r){function a(t){o=o.concat(t)}var n=this;if(!t.length)return[{path:r,value:e}];var i=t[0],s=t.slice(1);if("^"===i)return r.length?[{path:r.slice(0,-1),expr:s,isParentSelector:!0}]:[];var o=[];if(e&&e.hasOwnProperty(i))a(this._trace(s,e[i],push(r,i)));else if("*"===i)this._walk(i,s,e,r,function(t,e,r,i,s){a(n._trace(unshift(t,r),i,s))});else if(".."===i)a(this._trace(s,e,r)),this._walk(i,s,e,r,function(t,e,r,i,s){"object"==typeof i[t]&&a(n._trace(unshift("..",r),i[t],push(s,t)))});else if("("===i[0])a(this._trace(unshift(this._eval(i,e,r[r.length],r),s),e,r));else if(0===i.indexOf("?("))this._walk(i,s,e,r,function(t,e,i,s,o){n._eval(e.replace(/^\?\((.*?)\)$/,"$1"),s[t],t,r)&&a(n._trace(unshift(t,i),s,o))});else if(i.indexOf(",")>-1){var h,u;for(h=i.split(","),u=0;u<h.length;u++)a(this._trace(unshift(h[u],s),e,r))}else/^(-?[0-9]*):(-?[0-9]*):?([0-9]*)$/.test(i)&&a(this._slice(i,s,e,r));return o.reduce(function(t,r){return t.concat(r.isParentSelector?n._trace(r.expr,e,r.path):[r])},[])},JSONPath.prototype._walk=function(t,e,r,a,n){var i,s,o;if(Array.isArray(r))for(i=0,s=r.length;s>i;i++)n(i,t,e,r,a);else if("object"==typeof r)for(o in r)r.hasOwnProperty(o)&&n(o,t,e,r,a)},JSONPath.prototype._slice=function(t,e,r,a){if(Array.isArray(r)){var n,i=r.length,s=t.split(":"),o=s[0]&&parseInt(s[0],10)||0,h=s[1]&&parseInt(s[1],10)||i,u=s[2]&&parseInt(s[2],10)||1;o=0>o?Math.max(0,o+i):Math.min(i,o),h=0>h?Math.max(0,h+i):Math.min(i,h);var c=[];for(n=o;h>n;n+=u)c=c.concat(this._trace(unshift(n,e),r,a));return c}},JSONPath.prototype._eval=function(t,e,r,a){if(!this._obj||!e)return!1;t.indexOf("@path")>-1&&(this.sandbox._$_path=this._asPath(a.concat([r])),t=t.replace(/@path/g,"_$_path")),t.indexOf("@")>-1&&(this.sandbox._$_v=e,t=t.replace(/@/g,"_$_v"));try{return vm.runInNewContext(t,this.sandbox)}catch(n){throw console.log(n),Error("jsonPath: "+n.message+": "+t)}},JSONPath.eval=function(t,e,r){return JSONPath(r,t,e)},"undefined"==typeof module?(window.jsonPath={eval:JSONPath.eval},window.JSONPath=JSONPath):module.exports=JSONPath}("undefined"==typeof require?null:require);
