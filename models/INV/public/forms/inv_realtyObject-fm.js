const _ = require('lodash');
exports.formCode = {
    initUBComponent: function () {
        this.actions["fDelete"].hide();
        var me = this,
            gridTaxes = me.queryById('gridTaxes'),
            gridAttach = me.queryById('gridAttachments'),
            dcsTaxes = gridTaxes.getDockedItems("toolbar[dock=top]"),
            dcsAttach = gridAttach.getDockedItems("toolbar[dock=top]"),
            receiptHandler = function (isExcel) {
                var selection = gridTaxes.getSelectionModel().getSelection()[0];
                if (!selection) {
                    $App.dialogError('Спочатку необхідно обрати запис з таблиці');
                    return;
                }
                var selectedData = selection.data || {},
                    reportParams = {};

                $App.connection.select({
                    entity: "inv_taxes",
                    fieldList: ['name.payerID.fullName', 'name.payerID.personType', 'name.payerID.code', 'payerAddress', 'sumYear', 'debt', 'fine', 'reportYear'],
                    whereList: {
                        byID: {
                            expression: "[ID]",
                            condition: "equal",
                            values: {ID: selectedData.ID}
                        }
                    }
                }).then(function (r0) {
                    let res0 = UB.LocalDataStore.selectResultToArrayOfObjects(r0)[0];

                    let fieldList = ['name', 'code', 'MFO'],
                        fromFieldList = [],
                        totalSum = 0.00;
                    const fieldListByType = {
                        PHYSICAL: {
                            y: ['physRealtyPayPurpose', 'physRealtyPayCode', 'physRealtyAccount'],
                            n: ['physRealtyPayPurposeN', 'physRealtyPayCodeN', 'physRealtyAccountN']
                        },
                        LEGAL: {
                            y: ['legRealtyPayPurpose', 'legRealtyPayCode', 'legRealtyAccount'],
                            n: ['legRealtyPayPurposeN', 'legRealtyPayCodeN', 'legRealtyAccountN']
                        }
                    }
                    if (res0) {
                        if (res0['name.payerID.personType']) {
                            let currFieldList = fieldListByType[res0['name.payerID.personType']]
                            currFieldList = ['FLAT', 'HOUSE', 'RESIDENTIAL_PROPERTY'].includes(me.record.get('realtyType')) ? currFieldList.y : currFieldList.n
                            fieldList = fieldList.concat(currFieldList)
                            fromFieldList = fromFieldList.concat(currFieldList)
                        }
                        if (res0.sumYear) totalSum += parseFloat(res0.sumYear);
                        if (res0.debt) totalSum += parseFloat(res0.debt);
                        if (res0.fine) totalSum += parseFloat(res0.fine);
                    }

                    $App.connection.select({
                        entity: "inv_localRequisites",
                        fieldList: fieldList,
                        whereList: {
                            byLandDictID: {
                                expression: "[landDictID]",
                                condition: "equal",
                                values: {landDictID: me.record.get('koattNum')}
                            },
                            byState: {
                                expression: "[state]",
                                condition: "equal",
                                values: {state: 'Діє'}
                            }
                        }
                    }).then(function (r) {

                        let res = UB.LocalDataStore.selectResultToArrayOfObjects(r)[0];
                        Ext.create('UB.view.BaseWindow', {
                            title: 'Параметри квитанції',
                            height: 450,
                            draggable: true,
                            floating: true,
                            width: 450,
                            layout: 'fit',
                            autoScroll: true,
                            border: 0,
                            autoDestroy: true, modal: true, resizable: false, maximizable: false, closable: true,
                            items: [{
                                xtype: 'form',
                                layout: {
                                    type: "vbox",
                                    align: "stretch"
                                },
                                defaults: {
                                    labelWidth: 160
                                },
                                flex: 4,
                                autoScroll: true,
                                items: [
                                    {
                                        layout: {
                                            type: "hbox",
                                            align: "stretch"
                                        },
                                        defaults: {
                                            labelWidth: 160
                                        },
                                        margin: "5, 0, 0, 0",
                                        items: [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: 'Загальна сума',
                                                itemId: 'recSum',
                                                value: totalSum ? totalSum : 0,
                                                hideTrigger: true,
                                                validator: function (v) {
                                                    return /^[0-9]{1,20}(.[0-9]{1,2})?$/.test(v) ? true : 'Не припустимий формат!';
                                                },
                                                regexText: 'Не припустимий формат',
                                                minValue: 0,
                                                allowBlank: false,
                                                width: 400
                                            }
                                        ]
                                    },
                                    {
                                        layout: {
                                            type: "hbox",
                                            align: "stretch"
                                        },
                                        defaults: {
                                            labelWidth: 160
                                        },
                                        margin: "5, 0, 0, 0",
                                        items: [
                                            {
                                                xtype: 'textfield',
                                                fieldLabel: 'Загальна сума (прописними)',
                                                value: '',
                                                itemId: 'recSumStr',
                                                allowBlank: !isExcel,
                                                hidden: !isExcel,
                                                width: 400
                                            }
                                        ]
                                    },
                                    {
                                        layout: {
                                            type: "hbox",
                                            align: "stretch"
                                        },
                                        defaults: {
                                            labelWidth: 160
                                        },
                                        margin: "5, 0, 0, 0",
                                        items: [
                                            {
                                                xtype: 'textfield',
                                                fieldLabel: 'Платник',
                                                value: res0['name.payerID.fullName'] ? res0['name.payerID.fullName'] : null,
                                                itemId: 'recPayer',
                                                allowBlank: false,
                                                width: 400
                                            }
                                        ]
                                    },
                                    {
                                        layout: {
                                            type: "hbox",
                                            align: "stretch"
                                        },
                                        defaults: {
                                            labelWidth: 160
                                        },
                                        margin: "5, 0, 0, 0",
                                        items: [
                                            {
                                                xtype: 'textfield',
                                                fieldLabel: 'Місце проживання',
                                                value: res0.payerAddress ? res0.payerAddress : null,
                                                itemId: 'recAddr',
                                                allowBlank: false,
                                                width: 400
                                            }
                                        ]
                                    },
                                    {
                                        layout: {
                                            type: "hbox",
                                            align: "stretch"
                                        },
                                        defaults: {
                                            labelWidth: 160
                                        },
                                        margin: "5, 0, 0, 0",
                                        items: [
                                            {
                                                xtype: 'textfield',
                                                fieldLabel: 'Отримувач',
                                                itemId: 'recReceiver',
                                                value: res ? res.name : '',
                                                allowBlank: false,
                                                width: 400
                                            }
                                        ]
                                    },
                                    {
                                        layout: {
                                            type: "hbox",
                                            align: "stretch"
                                        },
                                        defaults: {
                                            labelWidth: 160
                                        },
                                        margin: "5, 0, 0, 0",
                                        items: [
                                            {
                                                xtype: 'textfield',
                                                fieldLabel: 'Код отримувача',
                                                validator: function (v) {
                                                    return /^[0-9]*$/.test(v) ? true : 'Не припустимий формат!';
                                                },
                                                itemId: 'recCode',
                                                value: res ? res.code : '',
                                                allowBlank: false,
                                                width: 400
                                            }
                                        ]
                                    },
                                    {
                                        layout: {
                                            type: "hbox",
                                            align: "stretch"
                                        },
                                        defaults: {
                                            labelWidth: 160
                                        },
                                        margin: "5, 0, 0, 0",
                                        items: [
                                            {
                                                xtype: 'textfield',
                                                fieldLabel: 'Розрахунковий рахунок',
                                                itemId: 'recAccount',
                                                allowBlank: false,
                                                value: res && fromFieldList[2] ? res[fromFieldList[2]] : '',
                                                width: 400
                                            }
                                        ]
                                    },
                                    {
                                        layout: {
                                            type: "hbox",
                                            align: "stretch"
                                        },
                                        defaults: {
                                            labelWidth: 160
                                        },
                                        margin: "5, 0, 0, 0",
                                        items: [
                                            {
                                                xtype: 'textfield',
                                                fieldLabel: 'МФО банку',
                                                validator: function (v) {
                                                    return /^[0-9]*$/.test(v) ? true : 'Не припустимий формат!';
                                                },
                                                itemId: 'recMFO',
                                                allowBlank: false,
                                                value: res ? res.MFO : '',
                                                width: 400
                                            }
                                        ]
                                    },
                                    {
                                        layout: {
                                            type: "hbox",
                                            align: "stretch"
                                        },
                                        defaults: {
                                            labelWidth: 160
                                        },
                                        margin: "5, 0, 0, 0",
                                        items: [
                                            {
                                                xtype: 'textfield',
                                                fieldLabel: 'Призначення платежу',
                                                itemId: 'recPurpose',
                                                allowBlank: false,
                                                value: res && fromFieldList[0] ? res[fromFieldList[0]] : '',
                                                width: 400
                                            }
                                        ]
                                    },
                                    {
                                        layout: {
                                            type: "hbox",
                                            align: "stretch"
                                        },
                                        defaults: {
                                            labelWidth: 160
                                        },
                                        margin: "5, 0, 0, 0",
                                        items: [
                                            {
                                                xtype: 'textfield',
                                                fieldLabel: 'Код платежу',
                                                itemId: 'recPayCode',
                                                allowBlank: false,
                                                value: res && fromFieldList[1] ? res[fromFieldList[1]] : '',
                                                width: 400
                                            }
                                        ]
                                    },
                                    {
                                        layout: {
                                            type: "hbox",
                                            align: "stretch"
                                        },
                                        defaults: {
                                            labelWidth: 160
                                        },
                                        margin: "5, 0, 0, 0",
                                        items: [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: 'Планова сума податку за рік',
                                                itemId: 'sumYear',
                                                allowBlank: false,
                                                value: res0.sumYear ? res0.sumYear : 0,
                                                width: 400
                                            }
                                        ]
                                    },
                                    {
                                        layout: {
                                            type: "hbox",
                                            align: "stretch"
                                        },
                                        defaults: {
                                            labelWidth: 160
                                        },
                                        margin: "5, 0, 0, 0",
                                        items: [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: 'Борг',
                                                itemId: 'debt',
                                                allowBlank: false,
                                                value: res0.debt ? res0.debt : 0,
                                                width: 400
                                            }
                                        ]
                                    },
                                    {
                                        layout: {
                                            type: "hbox",
                                            align: "stretch"
                                        },
                                        defaults: {
                                            labelWidth: 160
                                        },
                                        margin: "5, 0, 0, 0",
                                        items: [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: 'Пеня',
                                                itemId: 'fine',
                                                allowBlank: false,
                                                value: res0.fine ? res0.fine : 0,
                                                width: 400
                                            }
                                        ]
                                    },
                                    {
                                        layout: {
                                            type: "hbox",
                                            align: "stretch"
                                        },
                                        defaults: {
                                            labelWidth: 160
                                        },
                                        margin: "5, 0, 0, 0",
                                        items: [
                                            {
                                                xtype: 'textfield',
                                                fieldLabel: 'Ідент. код/ЄДРПОУ',
                                                itemId: 'idnCode',
                                                allowBlank: true,
                                                value: res0['name.payerID.code'] ? res0['name.payerID.code'] : '',
                                                width: 400,
                                                maxLength: 10
                                            }
                                        ]
                                    }
                                ],
                                buttons: [{
                                    text: 'Згенерувати',
                                    formBind: true,
                                    handler: function () {

                                        let paramsForm = this.up('form'),
                                            form = paramsForm.getForm();

                                        if (form.isValid()) {
                                            let fields = form.getFields() ? form.getFields().items : undefined,
                                                itemId = '';
                                            _.forEach(fields, function (item) {
                                                itemId = item.itemId;
                                                switch (itemId) {
                                                    case "recSum":
                                                        var sum = item.getValue() ? item.getValue() : 0;
                                                        reportParams.sumGrn = '0';
                                                        reportParams.sumCop = '00';

                                                        if (sum) {
                                                            sum = Ext.util.Format.number(sum, '00.00');
                                                            reportParams.sumFull = sum.replace(/,/g, '.');

                                                            if (sum.indexOf(',') >= 0) {
                                                                reportParams.sumGrn = sum.substr(0, sum.indexOf(','));
                                                                reportParams.sumCop = sum.substr(sum.indexOf(',') + 1, sum.length)
                                                            }
                                                        }
                                                        break;
                                                    case "recSumStr":
                                                        reportParams.sumStr = item.getValue() ? item.getValue() : '';
                                                        break;
                                                    case "recPayer":
                                                        reportParams.name = item.getValue() ? item.getValue() : '';
                                                        break;
                                                    case "recAddr":
                                                        reportParams.payerAddress = item.getValue() ? item.getValue() : '';
                                                        break;
                                                    case "recReceiver":
                                                        reportParams.receiver = item.getValue() ? item.getValue() : '';
                                                        break;
                                                    case "recCode":
                                                        reportParams.recCode = item.getValue() ? item.getValue() : '';
                                                        break;
                                                    case "recAccount":
                                                        reportParams.account = item.getValue() ? item.getValue() : '';
                                                        break;
                                                    case "recMFO":
                                                        reportParams.MFO = item.getValue() ? item.getValue() : '';
                                                        break;
                                                    case "recPurpose":
                                                        reportParams.purpose = item.getValue() ? item.getValue() : '';
                                                        break;
                                                    case "recPayCode":
                                                        reportParams.payCode = item.getValue() ? item.getValue() : '';
                                                        break;
                                                    case "sumYear":
                                                        reportParams.sumYear = item.getValue() ? parseFloat(item.getValue()).toFixed(2) : '';
                                                        break;
                                                    case "debt":
                                                        reportParams.debt = !Ext.isEmpty(item.getValue()) ? parseFloat(item.getValue()).toFixed(2) : '';
                                                        break;
                                                    case "fine":
                                                        reportParams.fine = !Ext.isEmpty(item.getValue()) ? parseFloat(item.getValue()).toFixed(2) : '';
                                                        break;
                                                    case "idnCode":
                                                        reportParams.idnCode = item.getValue() ? item.getValue() : '';
                                                        break;
                                                }
                                            });
                                            paramsForm.up().close();
                                            reportParams.reportYear = res0.reportYear;
                                            reportParams.address = me.record.get('address')
                                            isExcel ?
                                                $App.connection.post('rest/inv_landPlot/getReceiptXlsx', reportParams, {responseType: 'arraybuffer'})
                                                    .then(function (response) {
                                                        var blobData,
                                                            byteArray = response.data;
                                                        blobData = new Blob(
                                                            [byteArray],
                                                            {type: 'application/vnd.ms-excel'}
                                                        );

                                                        saveAs(blobData, "tax_notice-decision.xlsx");
                                                    }, function (e) {
                                                        me.getEl().unmask();
                                                    })

                                                :
                                              $App.doCommand({
                                                    cmdType: 'showReport',
                                                    cmdData: {
                                                        reportCode: 'Receipt',
                                                        reportType: 'html',
                                                        reportParams: reportParams,
                                                        reportOptions: {
                                                            allowExportToExcel: true
                                                        }
                                                    }
                                                });
                                        }
                                    }
                                }]
                            }],
                            isGrid: false,
                            stateful: true
                        }).show()

                    });
                });
            };

        var receiptBtn = {
            xtype: 'button',
            margin: "0, 0, 0, 2",
            text: 'Сформувати квитанцію',
            iconCls: 'fa fa-file-pdf-o',
            name: 'Ready',
            itemId: 'Ready',
            tooltip: '',
            handler: () => {
                receiptHandler(false)
            },
            disabled: !ADM.AccessManager.checkAccess('INV_01_01_02')
        };
        var receiptExcelBtn = {
            xtype: 'button',
            margin: "0, 0, 0, 2",
            text: 'Квитанція КП',
            iconCls: 'fa fa-file-excel-o',
            name: 'Excel',
            itemId: 'Excel',
            tooltip: '',
            handler: () => {
                receiptHandler(true)
            },
            disabled: !ADM.AccessManager.checkAccess('INV_01_01_02')
        };

        for (let i in dcsTaxes[0].items.items) {
            let item = dcsTaxes[0].items.items[i];
            if (item.xtype === "tbfill") {
                dcsTaxes[0].remove(item);
            }
        }
        dcsTaxes[0].add(receiptBtn);
        dcsTaxes[0].add(receiptExcelBtn);

        for (let i in dcsAttach[0].items.items) {
            let item = dcsAttach[0].items.items[i];
            if (item.xtype === "tbfill") {
                dcsAttach[0].remove(item);
            }
        }

        var attachBtn = {
            xtype: 'button',
            margin: "0, 0, 0, 2",
            text: 'Завантажити файл',
            iconCls: 'fa fa-file',
            name: 'toolbarUploadFile',
            itemId: 'toolbarUploadFile',
            tooltip: '',
            handler: function () {
                var me = this,
                    form = me.up('basepanel');
                var fileFld,
                    win = Ext.create('Ext.window.Window', {
                        autoShow: true,
                        title: UB.i18n('fayl'),
                        border: 0,
                        layout: 'fit',
                        modal: true,
                        stateful: true,
                        stateId: UB.core.UBLocalStorageManager.getKeyUI('UploadFileWindowP_window'),
                        items: [
                            {
                                frame: true,
                                items: [
                                    fileFld = Ext.create('Ext.form.field.File', {
                                        name: 'document',
                                        allowBlank: false,
                                        width: 370,
                                        blankText: UB.i18n('obazatelnoePole'),
                                        fieldLabel: UB.i18n('vyberiteFayl'),
                                        anchor: '100%',
                                        buttonText: '',
                                        buttonConfig: {iconCls: 'iconAttach'},
                                        listeners: {
                                            afterrender: function (sender) {
                                                sender.getEl().dom.addEventListener('change', this.onFileSelect, false);
                                                sender.inputEl.on('click', function () {
                                                    this.button.fileInputEl.dom.click();
                                                }, sender);
                                            },
                                            change: function (fld, value) {
                                                var newValue = value.replace(/C:\\fakepath\\/g, '');
                                                fld.setRawValue(newValue);
                                            },
                                            scope: this
                                        }
                                    })
                                ]
                            }
                        ],
                        buttons: [
                            {
                                text: UB.i18n('load'),
                                scope: this,
                                handler: function (btn) {
                                    var inputDom, ffile;
                                    inputDom = fileFld.fileInputEl.dom; //getEl()
                                    if (inputDom.files.length === 0) { // !form.isValid()
                                        return;
                                    }

                                    ffile = inputDom.files[0];

                                    var src = {
                                        url: '',
                                        contentType: ffile.type,
                                        html: '',
                                        blobData: ffile
                                    };
                                    $App.connection.run({
                                        entity: "inv_landPlot",
                                        method: "getObjAttNewID",
                                        execParams: {
                                            entityName: 'inv_objAttachment'
                                        }
                                    }).then(function (res) {
                                        let instanceID = res.attachID;
                                        $App.connection.post('setDocument', ffile, {
                                            params: {
                                                entity: "inv_objAttachment",
                                                attribute: 'attachment',
                                                ID: instanceID,
                                                filename: ffile.name
                                            },
                                            headers: {"Content-Type": "application/octet-stream"}
                                        }).then(function (response) {
                                            var result = response.data.result;

                                            $App.connection.run({
                                                entity: "inv_objAttachment", method: "insert",
                                                execParams: {
                                                    ID: instanceID,
                                                    objectID: form.instanceID,
                                                    attachment: JSON.stringify(result),
                                                    name: ffile.name,
                                                    type: ffile.type
                                                }
                                            }).then(function () {
                                                $App.doCommand({
                                                    cmdType: "showForm",
                                                    formCode: 'inv_objAttachment',
                                                    entity: "inv_objAttachment",
                                                    instanceID: instanceID
                                                });
                                            });
                                            form.queryById('gridAttachments').onRefresh();
                                            return true;
                                        });
                                    });

                                    win.close();
                                }
                            }
                        ]
                    });
            }
        };
        dcsAttach[0].add(attachBtn);

        me.ctrlKoattNum = me.queryById('koattNum');
        me.localityCtrl = me.queryById('locality');
        me.organSamCtrl = me.queryById('organSam');
        if (!me.isNewInstance) {
            me.ctrlKoattNum.setValue(me.record.get('koattNum.koattNum'));
            me.localityCtrl.setValue(me.record.get('koattNum.governmentFullName'));
            me.organSamCtrl.setValue(me.record.get('koattNum.localGovernment'));
        }

        gridAttach.store.on('load', function (a, b) {
            me.deleteDoc(gridAttach);
        });
    },
    onBeforeSave: function () {
        var me = this;
        return new Promise((resolve, reject) => {
            if (me.isNewInstance) {
                $App.connection.run({
                    entity: "inv_landPlot",
                    method: "getNewCode",
                    __skipSelectAfterUpdate: true,
                    __skipOptimisticLock: true,
                    execParams: {
                        formCode: 'inv_realtyObject'
                    }
                }).then(function (res) {
                    me.record.set('code', Ext.isEmpty(res.newCode) ? 1 : parseInt(res.newCode) + 1);
                    resolve(true);
                });
            }
            // else if (me.pgoRealtyID) {
            //     let fieldToUpdate = {'landCategory': true, 'position': true, 'location': true, 'landPurpose': true, 'cadastralNumber': true, 'totalArea': true, 'documentOwnership': true, 'registryData': true, 'owner': true, 'useType': true, 'notes': true},
            //         modifiedData = {};
            //
            //     _.forOwn(me.record.modified, function (item, i) {
            //         if(fieldToUpdate[i]) modifiedData[i] = me.record.get(i);
            //     });
            //
            //     if(!_.isEmpty(modifiedData)){
            //         modifiedData.ID = me.pgoRealtyID;
            //         $App.connection.run({
            //             entity: "pgo_landPlot",
            //             method: "update",
            //             execParams: modifiedData
            //         }).done(function (res) {
            //             defer.resolve(true);
            //         });
            //     }
            // }
            else {
                resolve(true);
            }

            if (me && me.sender && me.sender.onRefresh) me.sender.onRefresh();
        })
    },
    onAfterSave: function () {
        var me = this;
        if (me.ctrlToRefresh) me.ctrlToRefresh.store.reload();
    },
    deleteDoc: function (grid) {
        let gridDelEl = grid.body.dom.getElementsByTagName('a'),
            delFunc = function (e) {
                let id = this.dataset.id;
                id && $App.connection.run({
                    entity: "inv_objAttachment",
                    method: "delete",
                    execParams: {ID: parseInt(id, 10)}
                }).then(function (res) {
                    grid.onRefresh && grid.onRefresh();
                });

                e.preventDefault();
            };
        for (let i = 0, L = gridDelEl.length; i < L; i++) {
            gridDelEl[i].addEventListener('click', delFunc, true);
        }
    }
};
