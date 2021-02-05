
const me = pgo_agricultureMachine;
const _ = require('lodash');
const UB = require('@unitybase/ub');

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

};

me.afterbeforeupdate = function (ctx) {

};

me.afterbeforedelete = function (ctx) {

};


me.searchAgricultureMachine = function (ctx) {
    var params = ctx.mParams.execParams,
        agricultureSearchYear = UB.Repository("pgo_agricultureMachine")
        .attrs(["ID"])
        .where("[objAccountingID]", '=', params.objAccountingID)
        .where("[year]", '=', params.year)
        .selectAsObject(),
        isSearchYear = 'agrMachineSearchYear',
        agriculturePrevYear = [];
    if(!agricultureSearchYear.length){
        isSearchYear = 'agrMachinePrevYear';
        agriculturePrevYear = UB.Repository("pgo_agriculture")
            .attrs(["ID"])
            .where("[objAccountingID]", '=', params.objAccountingID)
            .where("[year]", '=', (parseInt(params.year)-1))
            .selectAsObject();
        if(!agriculturePrevYear.length) isSearchYear = '!agrMachinePrevYear';
    }
    ctx.mParams.searchRes = isSearchYear;
};

me.insertPrevYear = function (ctx) {
    var params = ctx.mParams.execParams,
        searchYear = params.year,
        dsAgricultureMachine  = UB.DataStore('pgo_agricultureMachine'),
        agricultureMachinePrevYear = UB.Repository("pgo_agricultureMachine")
            .attrs(["*"])
            .where("[objAccountingID]", '=', params.objAccountingID)
            .where("[year]", '=', (parseInt(params.year)-1))
            .selectAsObject(),
        newAgrID;
    _.forEach(agricultureMachinePrevYear, function (item) {
        newAgrID = dsAgricultureMachine.generateID();
        dsAgricultureMachine.run('insert', {
            execParams: {
                ID: newAgrID,
                year: searchYear,
                tractorTotal: item.tractorTotal,
                miniTractor: item.miniTractor,
                truck: item.truck,
                combineTotal: item.combineTotal,
                harvesterCombine: item.harvesterCombine,
                notes: item.notes,
                objAccountingID: item.objAccountingID
            }
        });
    });

};

me.entity.addMethod("beforeinsert");
me.entity.addMethod("afterinsert");
me.entity.addMethod("afterupdate");
me.entity.addMethod("afterdelete");
me.entity.addMethod("beforeupdate");
me.entity.addMethod("beforedelete");
me.entity.addMethod("afterbeforeupdate");
me.entity.addMethod("afterbeforedelete");

me.entity.addMethod("searchAgricultureMachine");
me.entity.addMethod("insertPrevYear");