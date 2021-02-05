exports.formCode = {
    initUBComponent: function () {
        this.actions["fDelete"].hide();
        var me = this,
            localCtrl = me.queryById('locality');

        if(me.settlementReadOnly) localCtrl.setReadOnly(true);
    },
    onBeforeSave: function () {
        var me = this;
        var code = me.record.get('code');
        if(code) {
            code = code.toString();
            if(code.length<3){
                code = code.length == 2 ? '0' + code : '00' + code;
                me.record.set('code', code);
            }
        }
        return new Promise((resolve, reject) => {
            $App.connection.run({
                entity: "pgo_localStreet",
                method: "checkCodeStreet",
                execParams: {
                    ID: me.instanceID,
                    streetType: me.record.get('streetType'),
                    street: me.record.get('street'),
                    code: me.record.get('code'),
                    settlementDictID: me.record.get('settlementDictID')
                }
            }).then(function (res) {
                if (res.duplField) {
                    resolve(false);
                    $App.dialogInfo(`Поле "${res.duplField}" повинно бути унікальними в межах населеного пункту!`);
                } else {
                    resolve(true);
                }
            });
        })
    },
    onAfterSave: function () {
        var me = this;
        if(me.streetIDCtrl) me.streetIDCtrl.store.reload();
    }
};
