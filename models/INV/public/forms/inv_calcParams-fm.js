exports.formCode = {
    initUBComponent: function () {
        var me = this,
            datefield = me.queryById('calcYear');

        if(me.isNewInstance) datefield.setValue(Ext.Date.format(new Date(), 'Y'));
    },
    onBeforeSave: function () {
        var me = this;

        if (me.isNewInstance) me.doRefreshGrid = true;
        return new Promise((resolve, reject) => {
            $App.connection.select({
                entity: "inv_calcParams",
                fieldList: ['ID'],
                whereList: {
                    byYear: {
                        expression: "[year]",
                        condition: "equal",
                        values: {landDictID: me.record.get('year')}
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
                    $App.dialogError(`За ${me.record.get('year')} вже існує запис!`);
                } else if (!res) {
                    resolve(true);
                }


            });
        })
    },
    onAfterSave: function () {
        var me = this;
        if (me.doRefreshGrid){
            me.queryById('gridCalc').onRefresh();
            delete me.doRefreshGrid;
        }
	}
};
