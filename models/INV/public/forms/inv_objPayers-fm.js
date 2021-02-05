exports.formCode = {
    initUBComponent: function () {
        var me = this,
            objectID = me.objectID;
        me.record.set('objectID', objectID);
    },
    onAfterSave: function () {
        var me = this;
        if (me && me.sender && me.sender.onRefresh) me.sender.onRefresh();
    }
};