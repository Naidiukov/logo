exports.formCode = {
    initUBComponent: function () {
        var me = this,
            yearFrom = me.getField('yearFrom'),
            yearTo = me.getField('yearTo');

        yearFrom.on('change', function (ctrl, newVal, oldVal) {
            if (newVal && newVal >= 1990) {
                yearTo.setValue(newVal + 4);
            }
        })
        yearTo.on('change', function (ctrl, newVal, oldVal) {
            if (newVal && newVal >= 1995) {
                yearFrom.setValue(newVal - 4);
            }
        })
    }
};