exports.formCode = {
    initUBComponent: function () {
        var me = this,
            objectsCtrl = me.queryById('objects');
        objectsCtrl.store.ubRequest.whereList = {};
        objectsCtrl.store.ubRequest.whereList.byOwner = {
            expression: '[owner]',
            condition: 'equal',
            values: {state: JSON.parse(me.landLordID)}
        };
        if(me.objType){
            objectsCtrl.store.ubRequest.whereList.byObjType = {
                expression: '[oType]',
                condition: 'equal',
                values: {state: JSON.parse(me.objType)}
            };
        }
        objectsCtrl.store.reload();
    }
};