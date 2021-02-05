const _ = require('lodash');
exports.formCode = {
    initUBComponent: function () {
        var me = this,
            dcs = me.getDockedItems("toolbar[dock=top]");
        _.forEach(dcs[0].items.items, function (item) {
            if(item.key && item.key=="attachment"){
                item.menu.items.items[0].hide();
            }
        });
    }
};