
const me = pgo_livingRoomInfo;
const _ = require('lodash');
const UB = require('@unitybase/ub');
const Session = UB.Session;

me.beforeinsert = function (ctx) {
  /*  var params = ctx.mParams.execParams,
        dsRealtyObject = UB.DataStore('inv_realtyObject'),
        dsObjLog = UB.DataStore('pgo_objLog');

    dsObjLog.run('insert', {
        execParams: {
            ID: dsObjLog.generateID(),
            changeDate: new Date(),
            actionType: 'INSERT',
            entityName: me.entity.description,
            roomType: params.roomType,
            totalArea: params.totalArea,
            employeeID: Session.userID
        }
    });

    if(!ctx.mParams.noSync){
        let roomOwners = UB.Repository('pgo_roomOwnerInfo')
            .attrs(['realtyObjectID'])
            .where('[realtyObjectID]', 'notNull')
            .where('[objAccountingID]', '=', params.objAccountingID)
            .selectAsObject();

        _.forEach(roomOwners, function (item) {
            dsRealtyObject.run('update', {
                __skipSelectAfterUpdate: true,
                __skipOptimisticLock: true,
                execParams: {
                    ID: item.realtyObjectID,
                    totalArea: params.totalArea ? params.totalArea : null,
                    summerArea: params.summerArea ? params.summerArea : null,
                    livingArea: params.livingArea ? params.livingArea : null,
                    ownershipArea: params.ownershipArea ? params.ownershipArea : null
                }
            });
        });
    }*/
};

me.afterinsert = function (ctx) {

};
me.afterupdate = function (ctx) {
    var params = ctx.mParams.execParams,
        dsRealtyObject = UB.DataStore('inv_realtyObject'),
        dsObjLog = UB.DataStore('pgo_objLog');

    dsObjLog.run('insert', {
        execParams: {
            ID: dsObjLog.generateID(),
            changeDate: new Date(),
            actionType: 'EDIT',
            entityName: me.entity.description,
            roomType: params.roomType != undefined ? params.roomType : null,
            totalArea: params.totalArea != undefined ? params.totalArea : null,
            employeeID: Session.userID
        }
    });

    let objAccounting = UB.Repository('pgo_livingRoomInfo')
            .attrs(['objAccountingID', 'totalArea', 'summerArea', 'livingArea', 'ownershipArea'])
            .where('[ID]', '=', params.ID)
            .selectAsObject()[0],
        roomOwners = UB.Repository('pgo_roomOwnerInfo')
            .attrs(['realtyObjectID'])
            .where('[realtyObjectID]', 'notNull')
            .where('[objAccountingID]', '=', objAccounting.objAccountingID)
            .selectAsObject(),
        execParams = {
            totalArea: objAccounting.totalArea,
            summerArea: objAccounting.summerArea,
            livingArea: objAccounting.livingArea,
            ownershipArea: objAccounting.ownershipArea,
            mi_modifyDate: new Date()
        };


    _.forEach(roomOwners, function (item) {
        execParams.ID = item.realtyObjectID;
        dsRealtyObject.run('update', {
            __skipSelectAfterUpdate: true,
            __skipOptimisticLock: true,
            execParams: execParams
        });
    });
};
me.afterdelete = function (ctx) {

};

// needed for history to work correctly
me.beforeupdate = function (ctx) {

};
me.beforedelete = function (ctx) {
    var params = ctx.mParams.execParams,
        dsObjLog = UB.DataStore('pgo_objLog');

    let livingRoom = UB.Repository("pgo_livingRoomInfo")
        .attrs(["roomType", "totalArea"])
        .where("[ID]", '=', params.ID)
        .selectAsObject()[0];

    dsObjLog.run('insert', {
        execParams: {
            ID: dsObjLog.generateID(),
            changeDate: new Date(),
            actionType: 'DELETE',
            entityName: me.entity.description,
            roomType: livingRoom.roomType,
            totalArea: livingRoom.totalArea,
            employeeID: Session.userID
        }
    });
};

me.afterbeforeupdate = function (ctx) {

};

me.afterbeforedelete = function (ctx) {

};


me.searchRoom = function (ctx) {
    var params = ctx.mParams.execParams,
        roomsSearchYear = UB.Repository("pgo_livingRoomInfo")
            .attrs(["ID"])
            .where("[objAccountingID]", '=', params.objAccountingID)
            .where("[year]", '=', params.year)
            .selectAsObject(),
        isSearchYear = 'roomsSearchYear',
        roomsPrevYear = [];
    if (!roomsSearchYear.length) {
        isSearchYear = 'roomsPrevYear';
        roomsPrevYear = UB.Repository("pgo_livingRoomInfo")
            .attrs(["ID"])
            .where("[objAccountingID]", '=', params.objAccountingID)
            .where("[year]", '=', (parseInt(params.year) - 1))
            .selectAsObject();
        if (!roomsPrevYear.length) isSearchYear = '!roomsPrevYear';
    }
    ctx.mParams.searchRes = isSearchYear;
};

me.insertPrevYear = function (ctx) {
    var params = ctx.mParams.execParams,
        searchYear = params.year,
        dslivingRoom = UB.DataStore('pgo_livingRoomInfo'),
        roomsPrevYear = UB.Repository("pgo_livingRoomInfo")
            .attrs(["*"])
            .where("[objAccountingID]", '=', params.objAccountingID)
            .where("[year]", '=', (parseInt(params.year) - 1))
            .selectAsObject();
    _.forEach(roomsPrevYear, function (item) {
        dslivingRoom.run('insert', {
            execParams: {
                ID: dslivingRoom.generateID(),
                year: searchYear,
                buildYear: item.buildYear,
                roomType: item.roomType,
                wallMaterial: item.wallMaterial,
                roofMaterial: item.roofMaterial,
                checkDate: item.checkDate,
                totalArea: item.totalArea,
                summerArea: item.summerArea,
                livingArea: item.livingArea,
                ownershipArea: item.livingArea,
                floorCount: item.floorCount,
                livingRoomCount: item.livingRoomCount,
                aqueduct: item.aqueduct,
                sewerage: item.sewerage,
                heating: item.heating,
                hotWater: item.hotWater,
                bath: item.bath,
                naturalGas: item.naturalGas,
                liquefiedGas: item.liquefiedGas,
                electricPlate: item.electricPlate,
                oldFund: item.oldFund,
                emergencyFund: item.emergencyFund,
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

me.entity.addMethod("searchRoom");
me.entity.addMethod("insertPrevYear");
