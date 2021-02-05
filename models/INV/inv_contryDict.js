
const me = inv_countryDict;
// const _ = require('lodash');

me.beforeinsert = function (ctx) {

};

me.afterinsert = function (ctx) {

};
me.afterupdate = function (ctx) {

};
me.afterdelete = function (ctx) {

};

// needed for history to work correctly
me.beforeupdate = function (ctx) {
};
me.beforedelete = function (ctx) {
    var params = ctx.mParams.execParams;
    if (params.ID == 333658698055681) throw new Error("<<<Видаляти Україну ЗАБОРОНЕНО!>>>");
};

me.afterbeforeupdate = function (ctx) {

};

me.afterbeforedelete = function (ctx) {

};

me.afterselect = function (ctx) {

};

me.entity.addMethod("beforeinsert");
me.entity.addMethod("afterinsert");
me.entity.addMethod("afterupdate");
me.entity.addMethod("afterdelete");
me.entity.addMethod("beforeupdate");
me.entity.addMethod("beforedelete");
me.entity.addMethod("afterbeforeupdate");
me.entity.addMethod("afterbeforedelete");
me.entity.addMethod("afterselect");