exports.formCode = {
    initUBComponent: function () {
        var me = this,
            yearField = me.getField('year'),
            yearToSet = parseInt(Ext.Date.format(new Date(), 'Y'));

        if (me.isNewInstance) {
            yearField.setValue(yearToSet);
            me.record.set('name', me.renterID);
        }
    }
};