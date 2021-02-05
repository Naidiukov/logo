exports.formCode = {
    initUBComponent: function () {
        let me = this;
        !ADM.AccessManager.checkAccess('PGO_04_01_02') && me.disableEdit();
    },
    onBeforeSave: function () {
        var me = this;
        if (me && me.sender && me.sender.onRefresh) me.sender.onRefresh();
    },
};