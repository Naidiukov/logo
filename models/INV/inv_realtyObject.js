
const me = inv_realtyObject;
const _ = require('lodash');
const UB = require('@unitybase/ub');
const Session = UB.Session;

me.beforeinsert = function (ctx) {
    var params = ctx.mParams.execParams,
        dsObjLog = UB.DataStore('inv_objLog'),
        ownerFullName = params.owner ? UB.Repository('inv_payers')
                .attrs(['fullName'])
                .where('[ID]', '=', params.owner)
                .selectAsObject()[0].fullName : '';

    dsObjLog.run('insert', {
        execParams: {
            ID: dsObjLog.generateID(),
            changeDate: new Date(),
            actionType: 'INSERT',
            oType: 'Об’єкт нерухомості',
            totalArea: params.totalArea,
            address: params.address,
            documentOwnership: params.documentOwnership,
            registryData: params.registryData,
            owner: ownerFullName,
            location: params.location,
            terminationDate: params.terminationDate,
            employeeID: Session.userID
        }
    });
};

me.afterinsert = function (ctx) {

};
me.afterupdate = function (ctx) {

};
me.afterdelete = function (ctx) {

};

// needed for history to work correctly
me.beforeupdate = function (ctx) {
    var params = ctx.mParams.execParams,
        dsObjLog = UB.DataStore('inv_objLog'),
        ownerFullName = params.owner ? UB.Repository('inv_payers')
                .attrs(['fullName'])
                .where('[ID]', '=', params.owner)
                .selectAsObject()[0].fullName : '';

    dsObjLog.run('insert', {
        execParams: {
            ID: dsObjLog.generateID(),
            changeDate: new Date(),
            actionType: 'EDIT',
            oType: 'Об’єкт нерухомості',
            totalArea: params.totalArea != undefined ? params.totalArea : null,
            address: params.address != undefined ? params.address : null,
            documentOwnership: params.documentOwnership != undefined ? params.documentOwnership : null,
            registryData: params.registryData != undefined ? params.registryData : null,
            owner: ownerFullName != undefined ? ownerFullName : null,
            location: params.location != undefined ? params.location : null,
            terminationDate: params.terminationDate != undefined ? params.terminationDate : null,
            employeeID: Session.userID
        }
    });
};

me.beforedelete = function (ctx) {
    var params = ctx.mParams.execParams,
        dsObjLog = UB.DataStore('inv_objLog');

    let realtyObj = UB.Repository("inv_realtyObject")
        .attrs(["totalArea", "address", "documentOwnership", "registryData", "owner.fullName", "location", "terminationDate"])
        .where("[ID]", '=', params.ID)
        .selectAsObject()[0];

    dsObjLog.run('insert', {
        execParams: {
            ID: dsObjLog.generateID(),
            changeDate: new Date(),
            actionType: 'DELETE',
            oType: 'Об’єкт нерухомості',
            totalArea: realtyObj.totalArea,
            address: realtyObj.address,
            documentOwnership: realtyObj.documentOwnership,
            registryData: realtyObj.registryData,
            owner: realtyObj['owner.fullName'],
            location: realtyObj.location,
            terminationDate: realtyObj.terminationDate,
            employeeID: Session.userID
        }
    });
};

me.afterbeforeupdate = function (ctx) {

};

me.afterbeforedelete = function (ctx) {

};


me.entity.addMethod("beforeinsert");
me.entity.addMethod("afterinsert");
me.entity.addMethod("afterupdate");
me.entity.addMethod("afterdelete");
me.entity.addMethod("beforeupdate");
me.entity.addMethod("beforedelete");
me.entity.addMethod("afterbeforeupdate");
me.entity.addMethod("afterbeforedelete");
