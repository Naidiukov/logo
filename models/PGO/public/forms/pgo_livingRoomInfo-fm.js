exports.formCode = {
    initUBComponent: function () {
        var me = this;
        !ADM.AccessManager.checkAccess('PGO_04_01_02') && me.disableEdit();
    },
    onBeforeSave: function () {
        var me = this;
            //defer = Q.defer();
        if (me && me.sender && me.sender.onRefresh) me.sender.onRefresh();

        // $App.connection.select({
        //     entity: "pgo_roomOwnerInfo",
        //     fieldList: ['realtyObjectID'],
        //     whereList: {
        //         byObjAccountingID: {
        //             expression: "[objAccountingID]",
        //             condition: "=",
        //             values: {code: me.record.get('objAccountingID')}
        //         },
        //         byRealtyObjectID: {
        //             expression: "[realtyObjectID]",
        //             condition: "notNull"
        //         }
        //     }
        // }).done(function (r) {
        //     let res = UB.LocalDataStore.selectResultToArrayOfObjects(r);
        //     if (res.length) {
        //         let allData = me.record.getData(),
        //             updateData = {
        //                 // ID: res.realtyObjectID,
        //                 roomType: allData.roomType,
        //                 totalArea: allData.totalArea,
        //                 summerArea: allData.summerArea,
        //                 livingArea: allData.livingArea,
        //                 ownershipArea: allData.ownershipArea
        //             };
        //         _.forEach(res, function (item) {
        //             updateData.ID = item.realtyObjectID;
        //             $App.connection.run({
        //                 entity: "inv_realtyObject",
        //                 method: "update",
        //                 execParams: updateData
        //             });
        //         });
        //         defer.resolve(true);
        //     } else {
        //         defer.resolve(true);
        //     }
        // });
        // return defer.promise;
    }
};