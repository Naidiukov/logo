
const me = pgo_agriculture;
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


me.searchAgriculture = function (ctx) {
    var params = ctx.mParams.execParams,
        agricultureSearchYear = UB.Repository("pgo_agriculture")
        .attrs(["ID"])
        .where("[objAccountingID]", '=', params.objAccountingID)
        .where("[year]", '=', params.year)
        .selectAsObject(),
        isSearchYear = 'agrSearchYear',
        agriculturePrevYear = [];
    if(!agricultureSearchYear.length){
        isSearchYear = 'agrPrevYear';
        agriculturePrevYear = UB.Repository("pgo_agriculture")
            .attrs(["ID"])
            .where("[objAccountingID]", '=', params.objAccountingID)
            .where("[year]", '=', (parseInt(params.year)-1))
            .selectAsObject();
        if(!agriculturePrevYear.length) isSearchYear = '!agrPrevYear';
    }
    ctx.mParams.searchRes = isSearchYear;
};

me.insertPrevYear = function (ctx) {
    var params = ctx.mParams.execParams,
        searchYear = params.year,
        dsAgriculture  = UB.DataStore('pgo_agriculture'),
        dsAnimals  = UB.DataStore('pgo_agricultureCellAnimal'),
        agriculturePrevYear = UB.Repository("pgo_agriculture")
            .attrs(["*"])
            .where("[objAccountingID]", '=', params.objAccountingID)
            .where("[year]", '=', (parseInt(params.year)-1))
            .selectAsObject(),
        animalsPrevYear = UB.Repository("pgo_agricultureCellAnimal")
            .attrs(["*", "agricultureID.objAccountingID"])
            .where("[agricultureID.objAccountingID]", '=', params.objAccountingID)
            .where("[agricultureID.year]", '=', (parseInt(params.year)-1))
            .selectAsObject(),
        animalsGroupBy = _.groupBy(animalsPrevYear, 'agricultureID.objAccountingID'),
        newAgrID;
    _.forEach(agriculturePrevYear, function (item) {
        newAgrID = dsAgriculture.generateID();
        dsAgriculture.run('insert', {
            execParams: {
                ID: newAgrID,
                year: searchYear,
                cattleTotal: item.cattleTotal,
                bull: item.bull,
                cow: item.cow,
                heiferOneTwo: item.heiferOneTwo,
                heiferTwoMore: item.heiferTwoMore,
                calveOneYear: item.calveOneYear,
                pigsTotal: item.pigsTotal,
                sowsNineMore: item.sowsNineMore,
                repairPigFourMore: item.repairPigFourMore,
                pigletTwoLess: item.pigletTwoLess,
                sheepTotal: item.sheepTotal,
                sheepYearMore: item.sheepYearMore,
                goatTotal: item.goatTotal,
                goatYearMore: item.goatYearMore,
                horseTotal: item.horseTotal,
                mareThreeYearMore: item.mareThreeYearMore,
                horseYearMore: item.horseYearMore,
                birdTotal: item.birdTotal,
                hen: item.hen,
                rabbitTotal: item.rabbitTotal,
                rabbits: item.rabbits,
                beesTotal: item.beesTotal,
                notes: item.notes,
                objAccountingID: item.objAccountingID

            }
        });
        _.forEach(animalsGroupBy[item.objAccountingID], function (animal) {
            dsAnimals.run('insert', {
                execParams: {
                    ID: dsAnimals.generateID(),
                    name: animal.name,
                    count: animal.count,
                    agricultureID: newAgrID

                }
            });
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

me.entity.addMethod("searchAgriculture");
me.entity.addMethod("insertPrevYear");