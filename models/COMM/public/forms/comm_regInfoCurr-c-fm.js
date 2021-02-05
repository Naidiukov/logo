exports.formCode = {
    initUBComponent: function () {
        var me = this;
        me.state == 'DISMISSED' ? me.record.set('state', 'CANCELEDDREG') : me.record.set('state', 'CANCELEDREG')
    },
    onBeforeSave:function() {
        var me = this;
        if(me && me.sender && me.sender.onRefresh) me.sender.onRefresh();
    }
};