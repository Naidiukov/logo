const me = pgo_roomOwnerInfo;
const _ = require('lodash');
const UB = require('@unitybase/ub');
const Session = UB.Session;

me.beforeinsert = function (ctx) {
    var params = ctx.mParams.execParams,
        dsObjLog = UB.DataStore('pgo_objLog'),
        ownerFullName = params.payerID ? UB.Repository('inv_payers')
                .attrs(['fullName'])
                .where('[ID]', '=', params.payerID)
                .selectAsObject()[0].fullName : '';

    dsObjLog.run('insert', {
        execParams: {
            ID: dsObjLog.generateID(),
            changeDate: new Date(),
            actionType: 'INSERT',
            entityName: me.entity.description,
            personType: params.personType,
            payerID: ownerFullName,
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
        dsObjLog = UB.DataStore('pgo_objLog'),
        ownerFullName = params.payerID ? UB.Repository('inv_payers')
                .attrs(['fullName'])
                .where('[ID]', '=', params.payerID)
                .selectAsObject()[0].fullName : '';

    dsObjLog.run('insert', {
        execParams: {
            ID: dsObjLog.generateID(),
            changeDate: new Date(),
            actionType: 'EDIT',
            entityName: me.entity.description,
            personType: params.personType != undefined ? params.personType : null,
            payerID: ownerFullName != undefined ? ownerFullName : null,
            employeeID: Session.userID
        }
    });
};
me.beforedelete = function (ctx) {
    var params = ctx.mParams.execParams,
        dsObjLog = UB.DataStore('pgo_objLog');

    let roomOwner = UB.Repository("pgo_roomOwnerInfo")
        .attrs(["personType", "payerID.fullName"])
        .where("[ID]", '=', params.ID)
        .selectAsObject()[0];

    dsObjLog.run('insert', {
        execParams: {
            ID: dsObjLog.generateID(),
            changeDate: new Date(),
            actionType: 'DELETE',
            entityName: me.entity.description,
            personType: roomOwner.personType,
            payerID: roomOwner['payerID.fullName'],
            employeeID: Session.userID
        }
    });
};

me.afterbeforeupdate = function (ctx) {

};

me.afterbeforedelete = function (ctx) {

};


me.searchRoomOwner = function (ctx) {
    var params = ctx.mParams.execParams,
        roomsOwnerSearchYear = UB.Repository("pgo_roomOwnerInfo")
        .attrs(["ID"])
        .where("[objAccountingID]", '=', params.objAccountingID)
        .where("[year]", '=', params.year)
        .selectAsObject(),
        isSearchYear = 'roomsSearchYear',
        roomsOwnerPrevYear = [];
    if(!roomsOwnerSearchYear.length){
        isSearchYear = 'roomsPrevYear';
        roomsOwnerPrevYear = UB.Repository("pgo_roomOwnerInfo")
            .attrs(["ID"])
            .where("[objAccountingID]", '=', params.objAccountingID)
            .where("[year]", '=', (parseInt(params.year)-1))
            .selectAsObject();
        if(!roomsOwnerPrevYear.length) isSearchYear = '!roomsPrevYear';
    }
    ctx.mParams.searchRes = isSearchYear;
};

me.insertPrevYear = function (ctx) {
    var params = ctx.mParams.execParams,
        searchYear = params.year,
        dsOwnerRoom  = UB.DataStore('pgo_roomOwnerInfo'),
        roomsOwnerPrevYear = UB.Repository("pgo_roomOwnerInfo")
            .attrs(["*"])
            .where("[objAccountingID]", '=', params.objAccountingID)
            .where("[year]", '=', (parseInt(params.year)-1))
            .selectAsObject();
    _.forEach(roomsOwnerPrevYear, function (item) {
        dsOwnerRoom.run('insert', {
            execParams: {
                ID: dsOwnerRoom.generateID(),
                year: searchYear,
                personType: item.personType,
                payerID: item.payerID,
                realtyObjectID: item.realtyObjectID,
                part: item.part,
                notes: item.notes,
                objAccountingID: params.objAccountingID
            }
        });
    });

};

me.updateRealty = function (ctx) {
    let params = ctx.mParams.execParams,
        dsRealty  = UB.DataStore('inv_realtyObject'),
        livingRoom = UB.Repository('pgo_livingRoomInfo')
            .attrs(['ID', 'totalArea', 'summerArea', 'livingArea', 'ownershipArea'])
            .where('[objAccountingID]', '=', params.objAccountingID)
            .limit(1)
            .orderByDesc('ID')
            .selectAsObject()[0];
    if(livingRoom){
        dsRealty.run('update', {
            __skipSelectAfterUpdate: true,
            __skipOptimisticLock: true,
            execParams: {
                ID: params.realtyObjectID,
                totalArea: livingRoom.totalArea,
                summerArea: livingRoom.summerArea,
                livingArea: livingRoom.livingArea,
                ownershipArea: livingRoom.ownershipArea,
                mi_modifyDate: new Date()
            }
        });
    }

};

me.entity.addMethod("beforeinsert");
me.entity.addMethod("afterinsert");
me.entity.addMethod("afterupdate");
me.entity.addMethod("afterdelete");
me.entity.addMethod("beforeupdate");
me.entity.addMethod("beforedelete");
me.entity.addMethod("afterbeforeupdate");
me.entity.addMethod("afterbeforedelete");

me.entity.addMethod("searchRoomOwner");
me.entity.addMethod("insertPrevYear");
me.entity.addMethod("updateRealty");