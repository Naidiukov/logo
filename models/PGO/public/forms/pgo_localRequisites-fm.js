exports.formCode = {
    initUBComponent: function () {
        var me = this,
            tabLocality = me.queryById('tabLocality'),
            localGovernmentCtrl = me.queryById('localGovernment'),
            pgoDictID = me.record.get('pgoDictID');

        // if(me.isAdd){
            // debugger
            //me.queryById('cmpTabPanel').setActiveTab(me.queryById('tabLocality'));
        // }
        // localGovernmentCtrl.on('beforeQuerySend', function (queryEvent) {
        //     if (queryEvent.query)
        //     {
        //         queryEvent.query = queryEvent.query.toUpperCase();
        //         //queryEvent.combo.setValue(queryEvent.query);
        //     }
        // });
        if(!me.isNewInstance){
            localGovernmentCtrl.setReadOnly(true);
            tabLocality.setDisabled(false);
        }else{
            me.queryById('settlementDictID').setDisabled(true);
        }
    },
    onBeforeSave: function () {
        var me = this;
        return new Promise((resolve, reject) => {
            $App.connection.select({
                entity: "pgo_localRequisites",
                fieldList: ['pgoDictID.localGovernment'],
                whereList: {
                    byPgoDictID: {
                        expression: "[pgoDictID]",
                        condition: "equal",
                        values: {pgoDictID: me.record.get('pgoDictID')}
                    },
                    byID: {
                        expression: "[ID]",
                        condition: "notEqual",
                        values: {ID: me.instanceID}
                    }
                }
            }).then(function (r) {
                let res = UB.LocalDataStore.selectResultToArrayOfObjects(r)[0];
                if (res) {
                    resolve(false);
                    $App.dialogError(`Для "${res['pgoDictID.localGovernment']}" вже існує запис!`);
                } else if (!res) {
                    resolve(true);
                }


            });
        })
    },
    onAfterSave: function (action) {
        var me = this,
            localGovernmentCtrl = me.queryById('localGovernment'),
            tabLocality = me.queryById('tabLocality');

        if(localGovernmentCtrl.readOnly == false) localGovernmentCtrl.setReadOnly(true);
        if(tabLocality.isDisabled()) tabLocality.setDisabled(false);
        if(me.streetIDCtrl) me.streetIDCtrl.store.reload();
    }
};
