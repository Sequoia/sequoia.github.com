"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var l = exports.l = console.log.bind(console);
var e = exports.e = console.error.bind(console);
//for mapping over arrays arrays in arrays & transforming just one part
var justIndex = exports.justIndex = function justIndex(idx) {
  return function (fn) {
    return function (ray) {
      return ray.map(function (x, i) {
        return i === idx ? fn(x) : x;
      });
    };
  };
};