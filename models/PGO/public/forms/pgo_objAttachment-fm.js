const _ = require('lodash');
exports.formCode = {
    initUBComponent: function () {
        var me = this,
            dcs = me.getDockedItems("toolbar[dock=top]");
        if(me.state && me.state=='OBJ_OUTPGO') {
            dcs[0].setDisabled(true);
            me.getField('name').setDisabled(true);
        }
        _.forEach(dcs[0].items.items, function (item) {
            if(item.key && item.key=="attachment"){
                item.menu.items.items[0].hide();
            }
        });
        !ADM.AccessManager.checkAccess('PGO_04_01_02') && me.disableEdit();
    }
};