exports.formCode = {
    initUBComponent: function () {
        var me = this,
            regionCtrl = me.queryById('region'),
            settlementCtrl = me.getField('settlement'),
            streetCtrl = me.getField('street');

        if(!me.isNewInstance){
            me.queryById('area').setValue(me.record.get('area'));
            me.queryById('region').setValue(me.record.get('region'));
        }


        if (!me.record.get('area')) {
            INV.services.setWhereList(regionCtrl, 'byAreaName', 'areaName', -1);
        }
        if (!me.record.get('region')) {
            INV.services.setWhereList(settlementCtrl, 'byRegionName', 'pgoDictID.regionName', -1);
        }
        if (!me.record.get('settlement')) {
            INV.services.setWhereList(streetCtrl, 'bySettlementDictID', 'settlementDictID', -1);
        }
        if (!me.record.get('streetType')) {
            INV.services.setWhereList(streetCtrl, 'byStreetType', 'streetType', -1);
        }

    },
    onBeforeSave: function () {
        var me = this;
        if (me && me.sender && me.sender.onRefresh) me.sender.onRefresh();
    }
};