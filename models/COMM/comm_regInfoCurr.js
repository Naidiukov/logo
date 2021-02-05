
const me = comm_regInfoCurr;
const UB = require('@unitybase/ub');

function updateByState(regInfoCurrData, regInfoCurr) {
    let inv_payersDs = UB.DataStore('inv_payers');
    if (regInfoCurrData['state'] == 'REGISTERED') {
        inv_payersDs.run("update",
            {
                __skipSelectAfterUpdate: true,
                __skipOptimisticLock: true,
                execParams: {
                    ID: regInfoCurrData['payerID'],
                    areaAddR: regInfoCurrData['area'],
                    regionAddR: regInfoCurrData['region'],
                    settlementAddR: regInfoCurrData['settlement'],
                    streetTypeAddR: regInfoCurrData['streetType'],
                    streetAddR: regInfoCurrData['street'],
                    houseNumAddR: regInfoCurrData['houseNum'],
                    flatNumAddR: regInfoCurrData['flatNum'],
                    postIndex: regInfoCurrData['postIndex'],
                    regInfoCurrID: regInfoCurr["max(A01.ID)"],
                    mi_modifyDate: new Date()
                }
            });
    }
    else if (regInfoCurrData['state'] == 'DISMISSED') {
        inv_payersDs.run("update",
            {
                __skipSelectAfterUpdate: true,
                __skipOptimisticLock: true,
                execParams: {
                    ID: regInfoCurrData['payerID'],
                    areaAddR: regInfoCurrData['rArea'],
                    regionAddR: regInfoCurrData['rRegion'],
                    settlementAddR: regInfoCurrData['rSettlement'],
                    streetTypeAddR: regInfoCurrData['rStreetType'],
                    streetAddR: regInfoCurrData['rStreet'],
                    houseNumAddR: regInfoCurrData['rHouseNum'],
                    flatNumAddR: regInfoCurrData['rFlatNum'],
                    postIndex: regInfoCurrData['rPostIndex'],
                    regInfoCurrID: regInfoCurr["max(A01.ID)"],
                    mi_modifyDate: new Date()
                }
            });
    } else {
        inv_payersDs.run("update",
            {
                __skipSelectAfterUpdate: true,
                __skipOptimisticLock: true,
                execParams: {
                    ID: regInfoCurrData['payerID'],
                    areaAddR: null,
                    regionAddR: null,
                    settlementAddR: null,
                    streetTypeAddR: null,
                    streetAddR: null,
                    houseNumAddR: null,
                    flatNumAddR: null,
                    postIndex: null,
                    regInfoCurrID: null,
                    mi_modifyDate: new Date()
                }
            });
    }
}

me.afterinsert = function (ctx) {
    let params = ctx.mParams.execParams,
        inv_payersDs = UB.DataStore('inv_payers'),
        regInfoCurr = UB.Repository("comm_regInfoCurr")
            .attrs(["max(A01.ID)"])
            .where("[payerID]", '=', params.payerID)
            .where("[regDate]", 'in', UB.Repository("comm_regInfoCurr").attrs(["max([regDate])"]).where("[payerID]", '=', params.payerID))
            .selectAsObject()[0];

    const execParams = {
        ID: params['payerID'],
        areaAddR: params['area'],
        regionAddR: params['region'],
        settlementAddR: params['settlement'],
        streetTypeAddR: params['streetType'],
        streetAddR: params['street'],
        houseNumAddR: params['houseNum'],
        flatNumAddR: params['flatNum'],
        postIndex: params['postIndex'],
        regInfoCurrID: regInfoCurr["max(A01.ID)"] ? regInfoCurr["max(A01.ID)"] : params.ID,
        mi_modifyDate: new Date()
    }

    if (params.docType === 'PGU')
        Object.assign(execParams, {
            passportSeries: params.series,
            passportNumber: params.num,
            passportIssueDate: params.issueDate,
            passportIssuedBy: params.docRegUnit,
            passportValidToDate: params.validTo
        })
    if (params.docType === 'SV') {
        Object.assign(execParams, {
            birthCertificateSeries: params.series,
            birthCertificateNum: params.num,
            birthCertifDate: params.issueDate,
            birthCertifIssuedBy: params.docRegUnit
        })
    }

    inv_payersDs.run("update",
        {
            __skipSelectAfterUpdate: true,
            __skipOptimisticLock: true,
            execParams
        });
};
me.afterupdate = function (ctx) {
    let params = ctx.mParams.execParams,
        payerID = UB.Repository("comm_regInfoCurr")
            .attrs(["payerID"])
            .where("[ID]", '=', params.ID)
            .selectAsObject()[0]["payerID"],
        maxRegInfoCurr = UB.Repository("comm_regInfoCurr")
            .attrs(["max(A01.ID)"])
            .where("[payerID]", '=', payerID)
            .where("[regDate]", 'in', UB.Repository("comm_regInfoCurr").attrs(["max([regDate])"]).where("[payerID]", '=', payerID))
            .selectAsObject()[0],
        regInfoCurrData = UB.Repository("comm_regInfoCurr")
            .attrs(["payerID", "area", "region", "settlement", "streetType", "street", "houseNum", "flatNum", "postIndex", "state", "rArea", "rRegion", "rSettlement", "rStreetType", "rStreet", "rHouseNum", "rFlatNum", "rPostIndex"])
            .where("[ID]", '=', maxRegInfoCurr['max(A01.ID)'])
            .selectAsObject()[0];

    updateByState(regInfoCurrData, maxRegInfoCurr);
};

me.beforedelete = function (ctx) {
    let params = ctx.mParams.execParams,
        currRegInfo = UB.Repository("comm_regInfoCurr")
            .attrs(["payerID"])
            .where("[ID]", '=', params.ID)
            .selectAsObject()[0];
    me.payerID = currRegInfo.payerID;
};

me.afterdelete = function (ctx) {
    let currRegInfo = UB.Repository("comm_regInfoCurr")
        .attrs(["payerID"])
        .where("[payerID]", '=', me.payerID)
        .selectAsObject();

    if (currRegInfo.length >= 1) {
        let regInfoCurr = UB.Repository("comm_regInfoCurr")
                .attrs(["max(A01.ID)"])
                .where("[payerID]", '=', me.payerID)
                .where("[regDate]", 'in', UB.Repository("comm_regInfoCurr").attrs(["max([regDate])"]).where("[payerID]", '=', me.payerID))
                .selectAsObject()[0],
            regInfoCurrData = UB.Repository("comm_regInfoCurr")
                .attrs(["payerID", "area", "region", "settlement", "streetType", "street", "houseNum", "flatNum", "postIndex", "state", "rArea", "rRegion", "rSettlement", "rStreetType", "rStreet", "rHouseNum", "rFlatNum", "rPostIndex"])
                .where("[ID]", '=', regInfoCurr['max(A01.ID)'])
                .selectAsObject()[0];

        updateByState(regInfoCurrData, regInfoCurr);
    }
    else {
        let inv_payersDs = UB.DataStore('inv_payers');
        inv_payersDs.run("update",
            {
                __skipSelectAfterUpdate: true,
                __skipOptimisticLock: true,
                execParams: {
                    ID: me.payerID,
                    areaAddR: null,
                    regionAddR: null,
                    settlementAddR: null,
                    streetTypeAddR: null,
                    streetAddR: null,
                    houseNumAddR: null,
                    flatNumAddR: null,
                    postIndex: null,
                    regInfoCurrID: null,
                    mi_modifyDate: new Date()
                }
            });
    }
};

me.beforeupdate = function () {
    debugger
}
me.entity.addMethod("afterinsert");
me.entity.addMethod("afterupdate");
me.entity.addMethod("afterdelete");
me.entity.addMethod("beforedelete");
me.entity.addMethod("beforeupdate");
