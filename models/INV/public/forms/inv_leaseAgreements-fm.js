const _ = require('lodash');
exports.formCode = {
    initUBComponent: function () {
        this.actions["fDelete"].hide();
        var me = this,
            gridRents = me.queryById('gridRents'),
            gridAttach = me.queryById('gridAttachments'),
            gridAgrObjs = me.queryById('gridAgrObjs'),
            dcsRents = gridRents.getDockedItems("toolbar[dock=top]"),
            dcsAttach = gridAttach.getDockedItems("toolbar[dock=top]");

        var receiptBtn = {
            xtype: 'button',
            margin: "0, 0, 0, 2",
            text: 'Сформувати квитанцію',
            iconCls: 'fa fa-file-pdf-o',
            name: 'Ready',
            itemId: 'Ready',
            tooltip: '',
            handler: function (ctx) {
                var selection = gridRents.getSelectionModel().getSelection()[0];
                if (!selection) {
                    $App.dialogError('Спочатку необхідно обрати запис з таблиці');
                    return;
                }
                var selectedData = selection.data || {},
                    reportParams = {};
                let fieldList = ['name', 'code', 'MFO', 'leasePayPurpose', 'leasePayCode', 'leaseAccount'],
                    fromFieldList = [],
                    totalSum = 0.00;
                if(selectedData){
                    if(selectedData.sumYear) totalSum+=parseFloat(selectedData.sumYear);
                    if(selectedData.debt) totalSum+=parseFloat(selectedData.debt);
                    if(selectedData.fine) totalSum+=parseFloat(selectedData.fine);
                }
                var objsGridData = gridAgrObjs.getStore().getAt(0);

                $App.connection.select({
                    entity: "inv_localRequisites",
                    fieldList: fieldList,
                    whereList: {
                        byLandDictID: {
                            expression: "[landDictID.koattNum]",
                            condition: "equal",
                            values: {landDictID: objsGridData ? objsGridData.getData()['objectID.koattNum.koattNum'] : null}
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
                                                return v.search(/^[0-9]{1,20}(.[0-9]{1,2})?$/) == 0 ? true : 'Не припустимий формат!';
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
                                            fieldLabel: 'Платник',
                                            value: selectedData.pName ? selectedData.pName : null,
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
                                            value: selectedData.payerAddress ? selectedData.payerAddress : null,
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
                                                return v.search(/^[0-9]*$/) == 0 ? true : 'Не припустимий формат!';
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
                                            value: res ? res.leaseAccount : '',
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
                                                return v.search(/^[0-9]*$/) == 0 ? true : 'Не припустимий формат!';
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
                                            value: res && res.leasePayPurpose ? res.leasePayPurpose : '',
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
                                            value: res && res.leasePayCode ? res.leasePayCode : '',
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
                                            value: selectedData.sumYear ? selectedData.sumYear : 0,
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
                                            value: selectedData.debt ? selectedData.debt : 0,
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
                                            value: selectedData.fine ? selectedData.fine : 0,
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
                                            fieldLabel: 'Ідент. код/ЄДРПОУ',
                                            itemId: 'idnCode',
                                            allowBlank: true,
                                            value: selectedData.pIdn ? selectedData.pIdn : '',
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
                                        const valByFld = {
                                            "recPayer": "name",
                                            "recAddr": "payerAddress",
                                            "recReceiver": "receiver",
                                            "recCode": "recCode",
                                            "recAccount": "account",
                                            "recMFO": "MFO",
                                            "recPurpose": "purpose",
                                            "recPayCode": "payCode",
                                            "sumYear": "sumYear",
                                            "debt": "debt",
                                            "fine": "fine",
                                            "idnCode": "idnCode"
                                        }
                                        _.forEach(fields, function (item) {
                                            itemId = item.itemId;
                                            switch (itemId) {
                                                case "recSum":
                                                    var sum = item.getValue() ? item.getValue() : 0;
                                                    reportParams.sumGrn = '0';
                                                    reportParams.sumCop = '00';
                                                    //reportParams.objType = 'Земельний податок';
                                                    //reportParams.code = '*;101;';


                                                    if (sum) {
                                                        sum = Ext.util.Format.number(sum, '00.00');
                                                        if (sum.indexOf(',') >= 0) {
                                                            reportParams.sumGrn = sum.substr(0, sum.indexOf(','));
                                                            reportParams.sumCop = sum.substr(sum.indexOf(',') + 1, sum.length)
                                                        }
                                                    }
                                                    break;
                                                case "recPayer":
                                                case "recAddr":
                                                case "recReceiver":
                                                case "recCode":
                                                case "recAccount":
                                                case "recMFO":
                                                case "recPurpose":
                                                case "recPayCode":
                                                case "idnCode":
                                                    reportParams[valByFld[itemId]] = item.getValue() ? item.getValue() : '';
                                                    break;
                                                case "sumYear":
                                                case "debt":
                                                case "fine":
                                                    reportParams[valByFld[itemId]] = item.getValue() ? parseFloat(item.getValue()).toFixed(2) : '';
                                                    break;
                                            }
                                        });
                                        paramsForm.up().close();

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
                    }).show();
                });


            }
        };
        for (let i in dcsRents[0].items.items) {
            let item = dcsRents[0].items.items[i];
            if (item.xtype === "tbfill") {
                dcsRents[0].remove(item);
            }
        }
        dcsRents[0].add(receiptBtn);

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
                                        method: "getContrAttNewID",
                                    }).then(function (res) {
                                        let instanceID = res.attachID;
                                        $App.connection.post('setDocument', ffile, {
                                            params: {
                                                entity: "inv_contractAttachment",
                                                attribute: 'attachment',
                                                ID: instanceID,
                                                filename: ffile.name
                                            },
                                            headers: {"Content-Type": "application/octet-stream"}
                                        }).then(function (response) {
                                            var result = response.data.result;

                                            $App.connection.run({
                                                entity: "inv_contractAttachment", method: "insert",
                                                execParams: {
                                                    ID: instanceID,
                                                    agreementID: form.instanceID,
                                                    attachment: JSON.stringify(result),
                                                    name: ffile.name,
                                                    type: ffile.type
                                                }
                                            }).then(function () {
                                                $App.doCommand({
                                                    cmdType: "showForm",
                                                    formCode: 'inv_contractAttachment',
                                                    entity: "inv_contractAttachment",
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

        gridAttach.store.on('load', function (a, b) {
            me.deleteDoc(gridAttach);
        });
    },
    deleteDoc: function (grid) {
        let gridDelEl = grid.body.dom.getElementsByTagName('a'),
            delFunc = function (e) {
                let id = this.dataset.id;
                id && $App.connection.run({
                    entity: "inv_contractAttachment",
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
