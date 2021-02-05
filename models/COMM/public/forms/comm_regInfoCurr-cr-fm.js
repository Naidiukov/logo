exports.formCode = {
    initUBComponent: function () {
        var me = this,
            settlementCtrl = me.getField('rSettlement'),
            regionCtrl = me.queryById('rRegion'),
            streetCtrl = me.getField('rStreet');

        if(!me.isNewInstance){
            me.queryById('rArea').setValue(me.record.get('area'));
            me.queryById('rRegion').setValue(me.record.get('region'));
        }

        if (!me.record.get('rArea')) {
            INV.services.setWhereList(regionCtrl, 'byAreaName', 'areaName', -1);
        }
        if (!me.record.get('rRegion')) {
            INV.services.setWhereList(settlementCtrl, 'byRegionName', 'pgoDictID.regionName', -1);
        }
        if (!me.record.get('rSettlement')) {
            INV.services.setWhereList(streetCtrl, 'bySettlementDictID', 'settlementDictID', -1);
        }
        if (!me.record.get('rStreetType')) {
            INV.services.setWhereList(streetCtrl, 'byStreetType', 'streetType', -1);
        }
        me.record.set('rCountry', 333658698055681);
        me.record.set('state', 'DISMISSED');
        $App.connection.select({
            entity: "inv_regUnit",
            fieldList: ['ID'],
            whereList: {
                byIsRegAuth: {
                    expression: "[isRegAuth]",
                    condition: "=",
                    values: {isRegAuth: 1}
                }
            }
        }).then(function (r) {
            let res = UB.LocalDataStore.selectResultToArrayOfObjects(r)[0];
            if(res){
                me.record.set('rRegUnit', res.ID);
            }
        });
    },
    onBeforeSave:function() {
        var me = this;
        if(me && me.sender && me.sender.onRefresh) me.sender.onRefresh();
    }
};
