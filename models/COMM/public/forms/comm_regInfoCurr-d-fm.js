exports.formCode = {
    initUBComponent: function () {
        var me = this,
            regionCtrl = me.queryById('region'),
            settlementCtrl = me.getField('settlement'),
            streetCtrl = me.getField('street'),
            rregionCtrl = me.queryById('rRegion'),
            rsettlementCtrl = me.getField('rSettlement'),
            rstreetCtrl = me.getField('rStreet');

        if(!me.isNewInstance){
            me.queryById('area').setValue(me.record.get('area'));
            me.queryById('region').setValue(me.record.get('region'));

            me.queryById('rArea').setValue(me.record.get('rArea'));
            me.queryById('rRegion').setValue(me.record.get('rRegion'));
        }

        if (!me.record.get('area')) {
            INV.services.setWhereList(regionCtrl, 'byAreaName', 'byAreaName', -1);
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

        if (!me.record.get('rArea')) {
            INV.services.setWhereList(rregionCtrl, 'byAreaName', 'byAreaName', -1);
        }
        if (!me.record.get('rRegion')) {
            INV.services.setWhereList(rsettlementCtrl, 'byRegionName', 'pgoDictID.regionName', -1);
        }
        if (!me.record.get('rSettlement')) {
            INV.services.setWhereList(rstreetCtrl, 'bySettlementDictID', 'settlementDictID', -1);
        }
        if (!me.record.get('rStreetType')) {
            INV.services.setWhereList(rstreetCtrl, 'byStreetType', 'streetType', -1);
        }

    },
    onBeforeSave:function() {
        var me = this;
        if(me && me.sender && me.sender.onRefresh) me.sender.onRefresh();
    }
};