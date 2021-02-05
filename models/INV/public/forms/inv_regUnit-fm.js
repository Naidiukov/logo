exports.formCode = {
    initUBComponent: function () {

    },
    onBeforeSave: function () {
        var me = this;
        return new Promise((resolve, reject) => {
            $App.connection.run({
                entity: "inv_regUnit",
                method: "checkUniqueAuth",
                execParams: {
                    mi_createUser: $App.connection.userData().UserID,
                    ID: me.instanceID,
                    code: me.record.get('code'),
                    isRegAuth: me.record.get('isRegAuth')
                }
            }).then(function (res) {
                if (res.isCode) {
                    resolve(false);
                    $App.dialogInfo(`Код має бути унікальним в межах реєстру!`);
                } else if (res.isRegAuth) {
                    resolve(false);
                    $App.dialogInfo(`Ознака "Є органом реєстрації" має бути унікальною в межах реєстру!`);
                } else {
                    resolve(true);
                }
            });
        })
    }
};
