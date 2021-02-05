exports.formCode = {
    initUBComponent: function () {
        var me = this,
            checkDateCtrl = me.getField('checkDate');
        delete me.actionsKeyMap["fDelete"];
        this.actions["fDelete"].hide();
        if(me.isNewInstance) checkDateCtrl.setValue(new Date());
        !ADM.AccessManager.checkAccess('PGO_04_01_02') && me.disableEdit();
    }
};