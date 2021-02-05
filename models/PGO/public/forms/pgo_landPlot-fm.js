const _ = require('lodash');
exports.formCode = {
    initUBComponent: function () {
        var me = this,
            payerCtrl = me.getField('payerID'),
            landCtrl =  me.queryById('landPlotID'),
            topToolBar = me.up();

        var setCtrlAvailable = function (fields, form) {
            let currField;
                _.forEach(fields, function (fld) {
                    currField = form.getField(fld);
                    if(currField){
                        currField.setReadOnly(false);
                    }
                })
        };


        me.on("formDataReady", function () {
            if(!me.isNewInstance) {
                //if(ADM.AccessManager.checkAccess('PGO_04_01_02')) setCtrlAvailable(['cadastralNumber', 'documentOwnership', 'landCategory', 'landPurpose', 'location', 'notes', 'owner', 'registryData', 'totalArea', 'useType', 'leased', 'position'], me);
                landCtrl.store.ubRequest.whereList = {};
                landCtrl.store.ubRequest.whereList.byPayerID = {
                    expression: '[owner]',
                    condition: '=',
                    values: { owner: me.record.get('payerID')}
                };
                //landCtrl.setReadOnly(!ADM.AccessManager.checkAccess('PGO_04_01_02'));
                landCtrl.setValue(me.record.get('landPlotID'));
                landCtrl.store.reload();
            }
        });
        !ADM.AccessManager.checkAccess('PGO_04_01_02') && me.disableEdit();
        //topToolBar.maximize();  Аня забраковала :(
    },
    onBeforeSave: function () {
        var me = this;
        if (me && me.sender && me.sender.onRefresh) me.sender.onRefresh();
    }
};