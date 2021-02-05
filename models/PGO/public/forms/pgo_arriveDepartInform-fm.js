exports.formCode = {
    initUBComponent: function () {
        var me = this;
        var setFieldsVisibility = function (field, isVisible, blank) {
            if(isVisible) {
                field.show();
                if(blank) field.setAllowBlank(false) ;
            }else{
                field.hide();
                field.setValue(null);
                if(blank) field.setAllowBlank(true);
            }
        },
            deathDeparture = me.record.get('deathDeparture');
        if(!me.isNewInstance){
            setFieldsVisibility(me.getField('deathDeparture'), me.record.get('fullDeparture'), false);

            setFieldsVisibility(me.getField('deathCertificate'), deathDeparture, true);
            setFieldsVisibility(me.getField('certIssueDate'), deathDeparture, true);
            setFieldsVisibility(me.getField('certIssuedBy'), deathDeparture, true);
            setFieldsVisibility(me.getField('reason'), !deathDeparture, true);
        }
    },
};