exports.formCode = {
	initUBComponent: function () {
		var me = this,
			regionAddRCtrl = me.queryById('regionAddR'),
			settlementAddRCtrl = me.getField('settlementAddR'),
			streetAddRCtrl = me.getField('streetAddR');

		if(!me.isNewInstance){
			me.queryById('areaAddR').setValue(me.record.get('areaAddR'));
			me.queryById('regionAddR').setValue(me.record.get('regionAddR'));
		}
		else {
			me.record.set('personType', 'LEGAL')
		}

		if (!me.record.get('areaAddR')) {
			INV.services.setWhereList(regionAddRCtrl, 'byAreaName', 'areaName', -1);
		}
		if (!me.record.get('regionAddR')) {
			INV.services.setWhereList(settlementAddRCtrl, 'byRegionName', 'pgoDictID.regionName', -1);
		}
		if (!me.record.get('streetTypeAddR')) {
			INV.services.setWhereList(streetAddRCtrl, 'byStreetType', 'streetType', -1);
		}

	},
	onBeforeSave: function () {
		var me = this;
		if (me && me.sender && me.sender.onRefresh) me.sender.onRefresh();
	}
};