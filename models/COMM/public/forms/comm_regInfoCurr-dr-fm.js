exports.formCode = {
    initUBComponent: function () {
        var me = this;
        // if(!me.isNewInstance){
        //     me.queryById('area').setValue(me.record.get('area'));
        //     me.queryById('region').setValue(me.record.get('region'));
        //     me.queryById('rArea').setValue(me.record.get('rArea'));
        //     me.queryById('rRegion').setValue(me.record.get('rRegion'));
        // }
    },
    onBeforeSave:function() {
        var me = this;
        if(me && me.sender && me.sender.onRefresh) me.sender.onRefresh();
    }
};