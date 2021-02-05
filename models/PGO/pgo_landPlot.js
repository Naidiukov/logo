
const me = pgo_landPlot;
const _ = require('lodash');
const UB = require('@unitybase/ub');
const Session = UB.Session;

me.beforeinsert = function (ctx) {
   /* var params = ctx.mParams.execParams,
        dsObjLog = UB.DataStore('pgo_objLog'),
        dsInvLandPlot = UB.DataStore('inv_landPlot');

    dsObjLog.run('insert', {
        execParams: {
            ID: dsObjLog.generateID(),
            changeDate: new Date(),
            actionType: 'INSERT',
            entityName: me.entity.description,
            totalArea: params.totalArea,
            cadastralNumber: params.cadastralNumber,
            landCategory: params.landCategory,
            location: params.location,
            useType: params.useType,
            landPurpose: params.landPurpose,
            documentOwnership: params.documentOwnership,
            registryData: params.registryData,
            position: params.position,
            employeeID: Session.userID
        }
    });

    if(!params.dontUpdate || !ctx.mParams.noSync){
        dsInvLandPlot.run('update', {
            __skipSelectAfterUpdate: true,
            __skipOptimisticLock: true,
            execParams: {
                'ID': params.landPlotID,
                'cadastralNumber': params.cadastralNumber,
                'documentOwnership': params.documentOwnership,
                'landCategory': params.landCategory,
                'landPurpose': params.landPurpose,
                'location': params.location,
                'notes': params.notes,
                'registryData': params.registryData,
                'totalArea': params.totalArea,
                'useType': params.useType,
                'position': params.position,
                mi_modifyDate: new Date(),
                mi_modifyUser: Session.userID
            }
        });
    }*/
};

me.afterinsert = function (ctx) {

};
me.afterupdate = function (ctx) {
   /* var params = ctx.mParams.execParams,
        dsObjLog = UB.DataStore('pgo_objLog'),
        dsInvLandPlot = UB.DataStore('inv_landPlot');

    let objAccountingID = UB.Repository('pgo_landPlot')
            .attrs(['objAccountingID', 'landPlotID', 'cadastralNumber', 'documentOwnership', 'landCategory', 'landPurpose', 'location', 'notes', 'registryData', 'totalArea', 'useType', 'position'])
            .where('[ID]', '=', params.ID)
            .selectAsObject()[0],
        pgoLandPlot = UB.Repository('pgo_landPlot')
            .attrs(['max(ID)'])
            .where('[landPlotID]', '=', objAccountingID.landPlotID)
            .where('[objAccountingID]', '=', objAccountingID.objAccountingID)
            .selectAsObject()[0];

    dsObjLog.run('insert', {
        execParams: {
            ID: dsObjLog.generateID(),
            changeDate: new Date(),
            actionType: 'EDIT',
            entityName: me.entity.description,
            totalArea: params.totalArea != undefined ? params.totalArea : 0,
            cadastralNumber: params.cadastralNumber != undefined ? params.cadastralNumber : null,
            landCategory: params.landCategory != undefined ? params.landCategory : null,
            location: params.location != undefined ? params.location : null,
            useType: params.useType != undefined ? params.useType : null,
            landPurpose: params.landPurpose != undefined ? params.landPurpose : null,
            documentOwnership: params.documentOwnership != undefined ? params.documentOwnership : null,
            registryData: params.registryData != undefined ? params.registryData : null,
            position: params.position != undefined ? params.position : null,
            employeeID: Session.userID
        }
    });

    if(!params.dontUpdate && pgoLandPlot['max(ID)'] === params.ID){
        let updateArrNull = ['cadastralNumber', 'landPurpose', 'notes', 'useType', 'position'],
            updateArrNotNull = ['documentOwnership', 'landCategory', 'location', 'registryData', 'totalArea'],
            paramsToUpdate = {'ID': objAccountingID.landPlotID, dontUpdate: true};

        for (let i = 0; i < updateArrNull.length; i++) {
            paramsToUpdate[updateArrNull[i]] = objAccountingID[updateArrNull[i]] ? objAccountingID[updateArrNull[i]] : null;
        }

        for (let i = 0; i < updateArrNotNull.length; i++) {
            paramsToUpdate[updateArrNotNull[i]] = objAccountingID[updateArrNotNull[i]];
        }

         dsInvLandPlot.run('update', {
            __skipSelectAfterUpdate: true,
            __skipOptimisticLock: true,
            execParams: paramsToUpdate
        });
    }*/
};
me.afterdelete = function (ctx) {

};

// needed for history to work correctly
me.beforeupdate = function (ctx) {

};

me.beforedelete = function (ctx) {
    var params = ctx.mParams.execParams,
        dsObjLog = UB.DataStore('pgo_objLog');

    let livingRoom = UB.Repository("pgo_landPlot")
        .attrs(["totalArea", "cadastralNumber", "landCategory", "location", "useType", "landPurpose", "documentOwnership", "registryData", "position"])
        .where("[ID]", '=', params.ID)
        .selectAsObject()[0];

    dsObjLog.run('insert', {
        execParams: {
            ID: dsObjLog.generateID(),
            changeDate: new Date(),
            actionType: 'DELETE',
            entityName: me.entity.description,
            totalArea: livingRoom.totalArea,
            cadastralNumber: livingRoom.cadastralNumber,
            landCategory: livingRoom.landCategory,
            location: livingRoom.location,
            useType: livingRoom.useType,
            landPurpose: livingRoom.landPurpose,
            documentOwnership: livingRoom.documentOwnership,
            registryData: livingRoom.registryData,
            position: livingRoom.position,
            employeeID: Session.userID
        }
    });
};

me.afterbeforeupdate = function (ctx) {

};

me.afterbeforedelete = function (ctx) {

};


me.searchLandOwner = function (ctx) {
    var params = ctx.mParams.execParams,
        roomsOwnerSearchYear = UB.Repository("pgo_landPlot")
            .attrs(["ID"])
            .where("[objAccountingID]", '=', params.objAccountingID)
            .where("[year]", '=', params.year)
            .selectAsObject(),
        isSearchYear = 'landSearchYear',
        roomsOwnerPrevYear = [];
    if (!roomsOwnerSearchYear.length) {
        isSearchYear = 'landPrevYear';
        roomsOwnerPrevYear = UB.Repository("pgo_landPlot")
            .attrs(["ID"])
            .where("[objAccountingID]", '=', params.objAccountingID)
            .where("[year]", '=', (parseInt(params.year) - 1))
            .selectAsObject();
        if (!roomsOwnerPrevYear.length) isSearchYear = '!landPrevYear';
    }
    ctx.mParams.searchRes = isSearchYear;
};

me.insertPrevYear = function (ctx) {
    var params = ctx.mParams.execParams,
        searchYear = params.year,
        dsLandPlot = UB.DataStore('pgo_landPlot'),
        landPlotPrevYear = UB.Repository("pgo_landPlot")
            .attrs(["*"])
            .where("[objAccountingID]", '=', params.objAccountingID)
            .where("[year]", '=', (parseInt(params.year) - 1))
            .selectAsObject();
    _.forEach(landPlotPrevYear, function (item) {
        dsLandPlot.run('insert', {
            execParams: {
                ID: dsLandPlot.generateID(),
                year: searchYear,
                payerID: item.payerID,
                landPlotID: item.landPlotID,
                cadastralNumber: item.cadastralNumber,
                landCategory: item.landCategory,
                location: item.location,
                useType: item.useType,
                landPurpose: item.landPurpose,
                leased: item.leased,
                totalArea: item.totalArea,
                documentOwnership: item.documentOwnership,
                registryData: item.registryData,
                position: item.position,
                notes: item.notes,
                dontUpdate: true,
                objAccountingID: params.objAccountingID
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

me.entity.addMethod("searchLandOwner");
me.entity.addMethod("insertPrevYear");
