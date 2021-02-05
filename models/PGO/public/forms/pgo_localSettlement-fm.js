exports.formCode = {
    initUBComponent: function () {
        var me = this,
            localSettlementCtrl = me.queryById('localSettlement');
        if(!localSettlementCtrl.store.ubRequest.whereList) localSettlementCtrl.store.ubRequest.whereList = {};
        localSettlementCtrl.store.ubRequest.whereList.byID = {
            expression: '[pgoDictID]',
            condition: 'equal',
            values: {
                'pgoDictID': me.pgoDictID
            }
        };
        // localSettlementCtrl.on('beforeQuerySend', function (queryEvent) {
        //     if (queryEvent.query)
        //     {
        //         queryEvent.query = queryEvent.query.toUpperCase();
        //         queryEvent.combo.setValue(queryEvent.query);
        //     }
        // });
    },
    onBeforeSave: function () {
        var me = this;
        let code = me.record.get('code');
        if(code && code < 10 && code.toString().length<2){
            code = '0' + code;
            me.record.set('code', code);
        }
        return new Promise((resolve, reject) => {
            $App.connection.select({
                entity: "pgo_localSettlement",
                fieldList: ['ID', 'settlementDictID', 'settlementDictID.pgoDictID'],
                whereList: {
                    byCode: {
                        expression: "[code]",
                        condition: "equal",
                        values: {settlementDictID: code}
                    },
                    bySettlement: {
                        expression: "[settlementDictID]",
                        condition: "equal",
                        values: {settlementDictID: me.record.get('settlementDictID')}
                    },
                    byPgoDictID: {
                        expression: "[settlementDictID.pgoDictID]",
                        condition: "equal",
                        values: {pgoDictID: me.pgoDictID}
                    },
                    byID: {
                        expression: "[ID]",
                        condition: "notEqual",
                        values: {ID: me.instanceID}
                    }
                },
                logicalPredicates: ["([bySettlement] or ([byCode] and [byPgoDictID]))"]
            }).then(function (r) {
                let res = UB.LocalDataStore.selectResultToArrayOfObjects(r)[0];

                if (res) {
                    resolve(false);
                    if (res.settlementDictID == me.record.get('settlementDictID')) $App.dialogError(`Цей населений пункт вже додано!`);
                    else if (res['settlementDictID.pgoDictID'] == me.pgoDictID) $App.dialogError(`Коди населених пунктів в межах однієї місцевої ради мають бути унікальними!`);
                } else if (!res) {

                    resolve(true);
                }
            });
        })
    }
};
