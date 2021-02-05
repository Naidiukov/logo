exports.formCode = {
    initUBComponent: function () {
        var me = this,
            payerCtrl = me.getField('payerID'),
            realtyCtrl = me.queryById('realtyObjectID'),
            isReadOnly = !ADM.AccessManager.checkAccess('PGO_04_01_02');

        if (!me.isNewInstance) {
            realtyCtrl.store.ubRequest.whereList = {};
            realtyCtrl.store.ubRequest.whereList.byPayerID = {
                expression: '[owner]',
                condition: '=',
                values: {owner: me.record.get('payerID')}
            };
            if (isReadOnly) {
                realtyCtrl.setReadOnly(false);
                me.disableEdit();
            }
            realtyCtrl.store.reload();
        }
    },
    onBeforeSave: function () {
        var me = this,
            realtyObjectID = me.record.get('realtyObjectID');
        if (me && me.sender && me.sender.onRefresh) me.sender.onRefresh();
        ///TODO ПОТОМ УБРАТЬ
        return new Promise((resolve, reject) => {
            if (realtyObjectID) {
                $App.connection.run({
                    entity: "pgo_roomOwnerInfo",
                    method: "updateRealty",
                    execParams: {
                        realtyObjectID: realtyObjectID,
                        objAccountingID: me.record.get('objAccountingID')
                    },
                    __skipSelectAfterUpdate: true,
                    __skipOptimisticLock: true
                }).then(function (res) {
                    resolve(true);
                });
                // $App.connection.select({
                //     entity: "pgo_livingRoomInfo",
                //     fieldList: ['ID', 'roomType', 'totalArea', 'summerArea', 'livingArea', 'ownershipArea'],
                //     whereList: {
                //         byObjAccountingID: {
                //             expression: "[objAccountingID]",
                //             condition: "=",
                //             values: {code: me.record.get('objAccountingID')}
                //         }
                //     },
                //     options: {limit: 1},
                //     orderList: {sortOrder: {expression: "ID", order: 'desc'}}
                // }).done(function (r) {
                //     let res = UB.LocalDataStore.selectResultToArrayOfObjects(r)[0];
                //     if (res) {
                //         let updateData = {
                //             ID: realtyObjectID,
                //             roomType: res.roomType,
                //             totalArea: res.totalArea,
                //             summerArea: res.summerArea,
                //             livingArea: res.livingArea,
                //             ownershipArea: res.ownershipArea,
                //             mi_modifyDate: new Date()
                //         };
                //         $App.connection.run({
                //             entity: "inv_realtyObject",
                //             method: "update",
                //             execParams: updateData
                //         });
                //     }
                //     defer.resolve(true);
                // });
            } else {
                resolve(true);
            }
        })
    }
};
