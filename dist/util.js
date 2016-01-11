"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
//TODO make this into separate module
//TODO make `l` use `debug`
var l = exports.l = console.log.bind(console);
var e = exports.e = console.error.bind(console);
//for mapping over arrays in arrays & transforming just one part
var justIndex = exports.justIndex = function justIndex(idx) {
  return function (fn) {
    return function (ray) {
      return ray.map(function (x, i) {
        return i === idx ? fn(x) : x;
      });
    };
  };
};
//for mapping over objects in arrays & transforming just one part
var onProp = exports.onProp = function onProp(key) {
  return function (fn) {
    return function (obj) {
      obj[key] = fn(obj[key]);return obj;
    };
  };
};
//add k/v to obj & return obj
var addProp = exports.addProp = function addProp(prop) {
  return function (val) {
    return function (obj) {
      obj[prop] = val;return obj;
    };
  };
};
//add k/v to obj based on fn & return obj
var addPropFn = exports.addPropFn = function addPropFn(prop) {
  return function (fn) {
    return function (obj) {
      obj[prop] = fn(obj);return obj;
    };
  };
};