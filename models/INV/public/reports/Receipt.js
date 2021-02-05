exports.reportCode = {
    /**
     * This function must be defined in report code block.
     *
     * Inside function you must:
     * 1) Prepare data
     * 2) Run method this.buildHTML(reportData); where reportData is data for mustache template
     * 3) If need create PDF run method this.transformToPdf(htmlReport); where htmlReport is HTML
     * 4) If is server side function must return report as string otherwise Promise or string
     *
     * @cfg {function} buildReport
     * @params {[]|{}} reportParams
     * @returns {Promise|Object} If code run on server method must return report data.
     * Promise object must be resolved report code
     */
    buildReport: function (reportParams) {
        var me = this;
        var result

        switch (me.reportType) {
            case 'html':
                result = this.buildHTML(reportParams)
                return me.editHtml(result).then(function (result) {
                    return result;
                });
            case 'xlsx':
                result = this.buildXLSX(reportParams)
                break
        }
        return result
    },
    editHtml: function (html) {
        var me = this, win, old, editor;
        editor = Ext.widget('ubreporteditor', {});
        _.forEach(editor.tinyMCEConfig.plugins, (function (item, index) {
            if (item.search('templateEditor'))
            editor.tinyMCEConfig.plugins[index] = item.replace('templateEditor ', '');
        }));
        old = Ext.widget('ubreporteditor', {});

        return new Promise((resolve, reject) => {
            win = new Ext.Window({
                modal: true,
                width: 900,
                height: 700,
                constrain: true,
                title: 'Редактор',
                layout: 'fit',
                items: [editor],
                buttons: [
                    {
                        text: 'Сформувати з урахуванням змін',
                        handler: function () {
                            resolve(editor.getValue());
                            win.close();
                        }
                    },
                    {
                        text: 'Сформувати без урахування змін',
                        handler: function () {
                            resolve(old.getValue());
                            win.close();

                        }
                    }
                ]
            });
            win.show();
            editor.setValue(html);
            old.setValue(html);
        });
    },
}
