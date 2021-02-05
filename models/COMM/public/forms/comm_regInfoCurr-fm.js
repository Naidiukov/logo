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

        me.getField('docRegUnit').on('beforeQuerySend', function () {
            this.store.ubRequest.whereList = {}
            if (me.record.get('docType') === 'PGU') {
                this.store.ubRequest.whereList.byDocType = {
                    expression: 'type',
                    condition: "=",
                    values: {type: 'PASSPORT'}
                }
            } else if (me.record.get('docType') === 'SV') {
                this.store.ubRequest.whereList.byDocType = {
                    expression: 'type',
                    condition: "=",
                    values: {type: 'CERTIF'}
                }
            } else {
                delete this.store.ubRequest.whereList.byDocType
            }

            this.store.ubRequest.whereList.byUser = {
                expression: 'mi_createUser',
                condition: "=",
                values: {mi_createUser: $App.connection.userData().UserID}
            }

              if (this.getValue()) {
                  this.store.ubRequest.whereList.byCurrID = {
                      expression: 'ID',
                      condition: "=",
                      values: {ID: this.getValue()}
                  };
                  this.store.ubRequest.logicalPredicates = ["([byUser] or [byCurrID])"];
              } else {
                  this.store.ubRequest.logicalPredicates = [];
              }
              this.store.reload()
          }
        )
		// me.getField('settlementDistrict').hide();
    },
    onBeforeSave: function () {
        var me = this;
        if (me.isNewInstance) me.record.set('state', 'REGISTERED');
        if (me && me.sender && me.sender.onRefresh) me.sender.onRefresh();
    }
};
