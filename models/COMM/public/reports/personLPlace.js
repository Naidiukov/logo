
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
      var showEditor = function (html) {
          var htmlToShow = html
          return me.editHtml(htmlToShow, reportParams.DocID)
              .then(function (result) {
                  if (me.reportType === 'pdf') {
                      result = me.transformToPdf(result);
                  }
                  return result;
              })
      };

      var result = this.buildHTML(JSON.parse(reportParams));
      return me.editHtml(result).then(function (result) {
          if (me.reportType === 'pdf') { result = me.transformToPdf(result);}
          return result;
      });

  },
    editHtml: function (html) {
        var me = this, win, old, editor, defer = new Promise();
        editor = Ext.widget('ubreporteditor', {});
        _.forEach(editor.tinyMCEConfig.plugins, (function (item, index) {
            if (item.search('templateEditor'));
            editor.tinyMCEConfig.plugins[index] = item.replace('templateEditor ', '');
        }));
        old = Ext.widget('ubreporteditor', {});
        win = new Ext.Window({
            modal: true,
            width: 800,
            height: 600,
            constrain: true,
            //autoScroll: true,
            title: 'Редактор',
            layout: 'fit',
            items: [editor],
            buttons: [
                {
                    text: 'Попередній перегляд',
                    handler: function () {
                        //
                        me.transformToPdf(editor.getValue(), {outputPdf: false}).then(function (data) {
                            me.testPdf(data.output('blobUrl'));
                        });
                    }
                },
                {
                    text: 'Сформувати PDF з урахуванням змін',
                    handler: function () {
                        // $App.connection.run({
                        //     entity: "vp_vpDecisionDocument",
                        //     method: "update",
                        //     execParams: {ID: docID, reportHtml: editor.getValue()}
                        // });
                        defer.resolve(editor.getValue());
                        win.close();
                    }
                },
                {
                    text: 'Сформувати PDF без урахування змін',
                    handler: function () {
                        defer.resolve(old.getValue());
                        win.close();

                    }
                }
            ]
        });
        win.show();
        editor.setValue(html);
        old.setValue(html);
        return defer.promise;
    },

    testPdf: function (pdf) {
        var win, editor;
        editor = Ext.widget('ubpdf', {useBlobForData: false});
        win = new Ext.Window({
            modal: true,
            width: 800,
            height: 600,
            constrain: true,
            //autoScroll: true,
            title: 'Попередній перегляд',
            layout: 'fit',
            items: [editor],
            buttons: [
                {
                    text: 'Закрити',
                    handler: function () {
                        win.close();
                    }
                }
            ]
        });
        win.show();
        editor.setSrc({
            url: pdf
        })
    },
    onTransformConfig: function (config) {
        config.margin = {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
        };
        return config;
    }
}
