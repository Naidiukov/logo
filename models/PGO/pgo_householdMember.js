
const me = pgo_householdMember;
const _ = require('lodash');
const UB = require('@unitybase/ub');
const Session = UB.Session;

me.beforeinsert = function (ctx) {
    var params = ctx.mParams.execParams,
        houseMembers = UB.Repository("pgo_householdMember")
            .attrs(["ID"])
            .where("[objAccountingID]", '=', params.objAccountingID)
            .orderBy("[ID]")
            .selectAsObject(),

        dsHouseholdMember = UB.DataStore('pgo_householdMember'),
        i = 0;

    if (params.isHead) {
        var householdHead = UB.Repository("pgo_householdMember")
            .attrs(["ID"])
            .where("[isHead]", '=', true)
            .where("[objAccountingID]", '=', params.objAccountingID)
            .selectAsObject();
       /* if (householdHead.length) {
            throw new Error('<<<Ознаку "Голова домогосподарства" встановлено для іншого члена домогосподарства>>>')
        } else {*/

            if (houseMembers.length) {
                for (i; i < houseMembers.length; i++) {
                    dsHouseholdMember.run('update', {
                        __skipSelectAfterUpdate: true,
                        __skipOptimisticLock: true,
                        execParams: {
                            ID: houseMembers[i].ID,
                            orderNum: i + 1
                        }
                    });
                }
            }
            params.orderNum = houseMembers.length ? i + 1 : 1;
        // }
    }
    else {
        if (houseMembers.length) {
            for (i; i < houseMembers.length; i++) {
                dsHouseholdMember.run('update', {
                    __skipSelectAfterUpdate: true,
                    __skipOptimisticLock: true,
                    execParams: {
                        ID: houseMembers[i].ID,
                        orderNum: i + 1
                    }
                });
            }
        }
        params.orderNum = houseMembers.length ? i + 1 : 1;
    }

};

me.afterinsert = function (ctx) {
    var params = ctx.mParams.execParams,
        dsPayers = UB.DataStore('inv_payers'),
        dsObjAccounting = UB.DataStore('pgo_objAccounting');

    if (params.isHead === true) {
        dsObjAccounting.run('update', {
            __skipSelectAfterUpdate: true,
            __skipOptimisticLock: true,
            execParams: {
                ID: params.objAccountingID,
                headPayerID: params.payerID
            }
        });
    }

/*    dsPayers.run('update', {
        __skipSelectAfterUpdate: true,
        __skipOptimisticLock: true,
        execParams: {
            ID: params.payerID,
            gender: params.gender,
            birthDate: params.birthDate,
            birthCertificate: params.birthCertificate,
            birthCertifDate: params.birthCertifDate,
            birthCertifIssuedBy: params.birthCertifIssuedBy,
            privilegeStartDate: params.privilegeStartDate,
            privilegePhysID: params.exemptionID,
            passportSeries: params.passportSeries,
            passportNumber: params.passportNumber,
            idCardNumber: params.idCardNumber,
            passportIssueDate: params.passportIssueDate,
            passportIssuedBy: params.passportIssuedBy,
            idnCode: params.idnCode,
            countryB: params.countryB,
            areaB: params.areaB,
            regionB: params.regionB,
            settlementB: params.settlementB,
            natalPlaceB: params.natalPlaceB,
            areaAddR: params.areaAddR,
            regionAddR: params.regionAddR,
            settlementAddR: params.settlementAddR,
            streetTypeAddR: params.streetTypeAddR,
            streetAddR: params.streetAddR,
            houseNumAddR: params.houseNumAddR,
            flatNumAddR: params.flatNumAddR,
            postIndex: params.postIndex,
            mi_modifyDate: new Date()
        }
    });*/

};
/*me.afterupdate = function (ctx) {
    var params = ctx.mParams.execParams,
        payerParams = {},
        doUpdate = false,
        dsObjAccounting = UB.DataStore('pgo_objAccounting'),
        dsPayers = UB.DataStore('inv_payers'),
        householdHead = UB.Repository("pgo_householdMember")
            .attrs(["isHead", "objAccountingID", "payerID"])
            .where("[ID]", '=', params.ID)
            .selectAsObject()[0];

    if (params.isHead != undefined) {
        if (householdHead.isHead) {
            dsObjAccounting.run('update', {
                __skipSelectAfterUpdate: true,
                __skipOptimisticLock: true,
                execParams: {
                    ID: householdHead.objAccountingID,
                    headPayerID: householdHead.payerID
                }
            });
        } else {
            dsObjAccounting.run('update', {
                __skipSelectAfterUpdate: true,
                __skipOptimisticLock: true,
                execParams: {
                    ID: householdHead.objAccountingID,
                    headPayerID: null
                }
            });
        }
    }

    payerParams.ID = householdHead.payerID;
    let paramsToUpdate = ['birthDate', 'gender', 'birthCertificate', 'birthCertifDate', 'birthCertifIssuedBy', 'privilegeStartDate', 'privilegePhysID',
            'passportSeries', 'passportNumber', 'idCardNumber', 'passportIssueDate', 'passportIssuedBy', 'idnCode', 'countryB', 'areaB', 'regionB', 'settlementB', 'natalPlaceB',
            'areaAddR', 'regionAddR', 'settlementAddR', 'streetTypeAddR', 'streetAddR', 'houseNumAddR', 'flatNumAddR', 'postIndex'],
        paramsKeys = Object.keys(params);
    for (let i = 0; i < paramsKeys.length; i++) {
        if (paramsKeys[i] != 'ID' && paramsToUpdate.indexOf(paramsKeys[i]) != -1) {
            payerParams[paramsKeys[i]] = params[i];
            doUpdate = true;
        }
    }


    if (doUpdate) {
        payerParams.mi_modifyDate = new Date();
        dsPayers.run('update', {
            __skipSelectAfterUpdate: true,
            __skipOptimisticLock: true,
            execParams: payerParams
        });
    }
};*/
me.afterdelete = function (ctx) {

};

// needed for history to work correctly
/*me.beforeupdate = function (ctx) {

};*/
me.beforedelete = function (ctx) {
    var params = ctx.mParams.execParams,
        dsObjAccounting = UB.DataStore('pgo_objAccounting'),
        houseMember = UB.Repository("pgo_householdMember")
            .attrs(["objAccountingID"])
            .where("[ID]", '=', params.ID)
            .selectAsObject()[0],
        houseMembers = UB.Repository("pgo_householdMember")
            .attrs(["ID"])
            .where("[objAccountingID]", '=', houseMember.objAccountingID)
            .where("[ID]", 'notEqual', params.ID)
            .orderBy("[ID]")
            .selectAsObject(),
        dsHouseholdMember = UB.DataStore('pgo_householdMember'),
        i = 0;
    if (houseMembers.length) {
        for (i; i < houseMembers.length; i++) {
            dsHouseholdMember.run('update', {
                __skipSelectAfterUpdate: true,
                __skipOptimisticLock: true,
                execParams: {
                    ID: houseMembers[i].ID,
                    orderNum: i + 1
                }
            });
        }
    }

    var householdHead = UB.Repository("pgo_householdMember")
        .attrs(["isHead", "objAccountingID"])
        .where("[ID]", '=', params.ID)
        .selectAsObject()[0];

    if (householdHead.isHead) {
        dsObjAccounting.run('update', {
            __skipSelectAfterUpdate: true,
            __skipOptimisticLock: true,
            execParams: {
                ID: householdHead.objAccountingID,
                headPayerID: null
            }
        });
    }
};


/*me.afterbeforeupdate = function (ctx) {
    var params = ctx.mParams.execParams;

    if (params.isHead === true) {
        let memberToUpdate = UB.Repository("pgo_householdMember")
                .attrs(["objAccountingID"])
                .where("[ID]", '=', params.ID)
                .selectAsObject()[0],
            objMembers = UB.Repository("pgo_householdMember")
                .attrs(["ID"])
                .where("[isHead]", '=', true)
                .where("[objAccountingID]", '=', memberToUpdate.objAccountingID)
                .selectAsObject();

        if (objMembers.length) {

            throw new Error('<<<Ознаку "Голова домогосподарства" встановлено для іншого члена домогосподарства>>>');
        }
    }
};*/

me.afterbeforedelete = function (ctx) {

};

me.updateHouseMembers = function (ctx) {
    Session.runAsAdmin(() => {
        let houseMembers = _.groupBy(UB.Repository('pgo_householdMember')
                .attrs(['ID', 'isHead', 'payerID', 'objAccountingID.headPayerID', 'objAccountingID'])
                .orderBy('objAccountingID')
                .orderBy('ID')
                .selectAsObject(), 'objAccountingID'),
            dsObjAccounting = UB.DataStore('pgo_objAccounting'),
            ds_member = UB.DataStore('pgo_householdMember');

        _.forEach(houseMembers, function (item, objAccountingID) {
            let orderNum = 0;
            for (let i = 0; i < item.length; i++) {
                ds_member.runSQL(`UPDATE pgo_householdMember set orderNum=${++orderNum} where ID=${item[i].ID}`, {});
                /*ds_member.run('update', {
                    __skipSelectAfterUpdate: true,
                    __skipOptimisticLock: true,
                    execParams: {
                        ID: item[i].ID,
                        orderNum: ++orderNum
                    }
                });*/

                if (item[i].isHead && item[i]['objAccountingID.headPayerID'] !== item[i].payerID) {
                    dsObjAccounting.runSQL(`UPDATE pgo_objAccounting set headPayerID=${item[i].payerID} where ID=${item[i].objAccountingID}`, {});
                   /* dsObjAccounting.run('update', {
                        __skipSelectAfterUpdate: true,
                        __skipOptimisticLock: true,
                        execParams: {
                            ID: item[i].objAccountingID,
                            headPayerID: item[i].payerID
                        }
                    });*/
                }
            }
        });
    });

};


me.entity.addMethod("beforeinsert");
me.entity.addMethod("afterinsert");
// me.entity.addMethod("afterupdate");
me.entity.addMethod("afterdelete");
// me.entity.addMethod("beforeupdate");
me.entity.addMethod("beforedelete");
// me.entity.addMethod("afterbeforeupdate");
me.entity.addMethod("afterbeforedelete");
