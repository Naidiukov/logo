exports.formCode = {
	initUBComponent: function () {
		var me = this,
			regionBCtrl = me.queryById('regionB'),
			settlementBCtrl = me.getField('settlementB'),
			regionAddRCtrl = me.queryById('regionAddR'),
			settlementAddRCtrl = me.getField('settlementAddR'),
			streetAddRCtrl = me.getField('streetAddR'),
			settlementAddLCtrl = me.getField('settlementAddL'),
			streetAddLCtrl = me.getField('streetAddL');

		if(!me.isNewInstance){
			me.queryById('areaB').setValue(me.record.get('areaB'));
			me.queryById('regionB').setValue(me.record.get('regionB'));
			me.queryById('areaAddR').setValue(me.record.get('areaAddR'));
			me.queryById('regionAddR').setValue(me.record.get('regionAddR'));
			me.queryById('areaAddL').setValue(me.record.get('areaAddL'));
		}
		else {
			me.record.set('personType', 'PHYSICAL')
		}

		if (!me.record.get('areaB')) {
			INV.services.setWhereList(regionBCtrl, 'byAreaName', 'areaName', -1);
		}
		if (!me.record.get('regionB')) {
			INV.services.setWhereList(settlementBCtrl, 'byRegionName', 'pgoDictID.regionName', -1);
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
		if (!me.record.get('areaAddL')) {
			INV.services.setWhereList(settlementAddLCtrl, 'byAreaName', 'pgoDictID.areaName', -1);
		}
		if (!me.record.get('streetTypeAddL')) {
			INV.services.setWhereList(streetAddLCtrl, 'byStreetType', 'streetType', -1);
		}

	},
	onBeforeSave: function () {
		var me = this;
		if (me && me.sender && me.sender.onRefresh) me.sender.onRefresh();
	}
};