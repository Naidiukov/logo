exports.formCode = {
    initUBComponent: function () {
        var me = this;
    },
    onBeforeSave:function() {
        var me = this;
        if(me && me.sender && me.sender.onRefresh) me.sender.onRefresh();
    }
};