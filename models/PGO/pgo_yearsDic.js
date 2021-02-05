
const me = pgo_yearsDic;
const _ = require('lodash');
const UB = require('@unitybase/ub');

me.beforeupdate = function (ctx) {
    var params = ctx.mParams.execParams;
    var pgo_yearsDic = UB.Repository("pgo_yearsDic")
        .attrs(["*"])
        .where("[yearFrom]", '<=', params.yearFrom, 'FromFrom')
        .where("[yearTo]", '>=', params.yearFrom, 'ToFrom')
        .where("[yearFrom]", '<=', params.yearTo, 'FromTo')
        .where("[yearTo]", '>=', params.yearTo, 'ToTo')
        .where("[ID]", '!=', params.ID)
        .logic('(([FromFrom] and [ToFrom]) or ([FromTo] and [ToTo]))')
        .selectAsObject();

    if (pgo_yearsDic && pgo_yearsDic.length > 0) {
        throw new Error('<<<Даний період перетинається з вже існуючим>>>');
    }
};

me.beforeinsert = function (ctx) {
    var params = ctx.mParams.execParams;
    var pgo_yearsDic = UB.Repository("pgo_yearsDic")
        .attrs(["*"])
        .where("[yearFrom]", '<=', params.yearFrom, 'FromFrom')
        .where("[yearTo]", '>=', params.yearFrom, 'ToFrom')
        .where("[yearFrom]", '<=', params.yearTo, 'FromTo')
        .where("[yearTo]", '>=', params.yearTo, 'ToTo')
        .logic('(([FromFrom] and [ToFrom]) or ([FromTo] and [ToTo]))')
        .selectAsObject();

    if (pgo_yearsDic && pgo_yearsDic.length > 0) {
        throw new Error('<<<Даний період перетинається з вже існуючим>>>');
    }
};

me.entity.addMethod("beforeinsert");
me.entity.addMethod("beforeupdate");