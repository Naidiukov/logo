const _ = require('lodash');
require('models/UTL/shortcuts/factory.js');
require('./PGO_fieldLists.js');
require('./PGO_orderLists.js');
_.extend(UTL.shortcuts.factory, {
    pgo_cognation: function (code) {

        var splitCode = code.split('.'),
            group = splitCode[0],
            resultShortcut,
            shortcutParams;
        resultShortcut = {
            cmdType: "showList",
            cmdData: {
                params: [
                    {
                        entity: "pgo_cognation",
                        method: "select"
                    }
                ]
            },
            description: "Довідник родинних стосунків",
            cmpInitConfig: {
                onDeterminateForm: function () {
                    return {
                        formCode: "pgo_cognation-edit",
                        entityName: "pgo_cognation",
                        cmdData: {
                            sender: this
                        }
                    }
                }
            }
        };

        shortcutParams = resultShortcut.cmdData.params[0];
        switch (group) {
            case "search":

                resultShortcut.cmpInitConfig.toolbarActionList = ["addNew", "del", "edit", 'refresh'];
                resultShortcut.cmpInitConfig.hideActions = ["showPreview", "showDetail", "audit", "addNewByCurrent", "itemLink"];

                shortcutParams.fieldList = this.fieldLists.pgo_cognation.search;

                break;
        }
        return resultShortcut;
    },
    pgo_ngoDict: function (code) {

        var splitCode = code.split('.'),
            group = splitCode[0],
            resultShortcut,
            shortcutParams;
        resultShortcut = {
            cmdType: "showList",
            cmdData: {
                params: [
                    {
                        entity: "pgo_ngoDict",
                        method: "select"
                    }
                ]
            },
            description: "Довідник населених пунктів",
            cmpInitConfig: {
                onDeterminateForm: function () {
                    return {
                        formCode: "pgo_ngoDict",
                        entityName: "pgo_ngoDict",
                        cmdData: {
                            sender: this
                        }
                    }
                },
                onItemContextMenu: function () {
                }
            }
        };

        shortcutParams = resultShortcut.cmdData.params[0];
        switch (group) {
            case "search":

                resultShortcut.cmpInitConfig.toolbarActionList = ['refresh', "addNew", "del"];
                resultShortcut.cmpInitConfig.hideActions = ["showPreview", "showDetail", "audit", "edit", "addNewByCurrent", "itemLink"];

                shortcutParams.fieldList = this.fieldLists.pgo_ngoDict.search;
                /*shortcutParams.whereList = {
                 byID: {expression: "[ID]", condition: '!=', values: {"ID": 10}},
                 byState: {expression: "[state]", condition: '=', values: {"state": "ACTIVE"}}
                 };//exclude built-in admin from grid*/
                break;
        }
        return resultShortcut;
    },
    pgo_localStreet: function (code) {

        var splitCode = code.split('.'),
            group = splitCode[0],
            resultShortcut,
            shortcutParams;
        resultShortcut = {
            cmdType: "showList",
            cmdData: {
                params: [
                    {
                        entity: "pgo_localStreet",
                        method: "select"
                    }
                ]
            },
            description: "Довідник вулиць",
            cmpInitConfig: {
                onDeterminateForm: function () {
                    return true;
                },
                onItemContextMenu: function () {
                },
                onItemDblClick: function () {
                    var me = this,
                        record = me.store.getById(me.selectedRecordID);

                    $App.doCommand({
                        cmdType: "showForm",
                        formCode: 'pgo_localStreet',
                        entityName: 'pgo_localStreet',
                        entity: 'pgo_localStreet',
                        instanceID: record.get('ID'),
                        target: $App.viewport.centralPanel,
                        tabId: "street" + Ext.id(),
                        sender: me,
                        cmpInitConfig: {
                            settlementReadOnly: true
                        }
                    });
                },
                onAddNew: function () {
                    var me = this;
                    var win = Ext.create("Ext.window.Window", {
                        autoShow: true,
                        title: 'Оберіть населений пункт',
                        border: 0,
                        layout: "fit",
                        modal: true,
                        items: [
                            {
                                xtype: 'ubcombobox',
                                itemId: "locality",
                                fieldLabel: "Населений пункт",
                                displayField: 'governmentFullName',
                                width: 600,
                                allowBlank: false,
                                ubRequest: {
                                    entity: 'pgo_settlementDict',
                                    method: 'select',
                                    fieldList: ['ID', 'governmentFullName']
                                },
                                listeners: {
                                    change: function (fld, newV, oldV) {
                                        if (newV) {
                                            me.settlementDictID = fld.getValue();
                                            me.settlementDictName = fld.getRawValue();
                                        }
                                    },
                                    beforeQuerySend: function (queryEvent) {
                                        // if (queryEvent.query) {
                                        //     queryEvent.query = queryEvent.query.toUpperCase();
                                        //     queryEvent.combo.setValue(queryEvent.query);
                                        // }
                                    }
                                }
                            }
                        ],
                        buttons: [
                            {
                                text: 'Обрати',
                                handler: function (btn) {
                                    if (this.up('window').items.items[0].isValid()) {
                                        $App.doCommand({
                                            cmdType: UB.core.UBCommand.commandType.showForm,
                                            formCode: "pgo_localStreet-AddNew",
                                            target: $App.viewport.centralPanel,
                                            tabId: "street" + Ext.id(),
                                            sender: me,
                                            settlementDictID: me.settlementDictID,
                                            settlementDictName: me.settlementDictName
                                        });
                                        win.close();
                                    } else {
                                        $App.dialogError(`Оберіть населений пункт!`);
                                    }

                                }
                            }
                        ]
                    });

                }
            }
        };

        shortcutParams = resultShortcut.cmdData.params[0];
        switch (group) {
            case "search":

                resultShortcut.cmpInitConfig.toolbarActionList = ["addNew", "del", 'refresh'];
                resultShortcut.cmpInitConfig.hideActions = ["showPreview", "showDetail", "audit", "edit", "addNewByCurrent", "itemLink"];

                shortcutParams.fieldList = this.fieldLists.pgo_localStreet.search;
                /*shortcutParams.whereList = {
                 byID: {expression: "[ID]", condition: '!=', values: {"ID": 10}},
                 byState: {expression: "[state]", condition: '=', values: {"state": "ACTIVE"}}
                 };//exclude built-in admin from grid*/
                break;
        }
        return resultShortcut;
    },

    pgo_localRequisites: function (code) {

        var splitCode = code.split('.'),
            group = splitCode[0],
            resultShortcut,
            shortcutParams;
        resultShortcut = {
            cmdType: "showList",
            cmdData: {
                params: [
                    {
                        entity: "pgo_localRequisites",
                        method: "select"
                    }
                ]
            },
            description: "Реквізити місцевої ради",
            cmpInitConfig: {
                onDeterminateForm: function () {
                    return {
                        formCode: "pgo_localRequisites",
                        entityName: "pgo_localRequisites",
                        cmdData: {
                            sender: this
                        }
                    }
                },
                onItemContextMenu: function () {
                }
            }
        };

        shortcutParams = resultShortcut.cmdData.params[0];
        switch (group) {
            case "search":

                resultShortcut.cmpInitConfig.toolbarActionList = ['refresh', "addNew", "del"];
                resultShortcut.cmpInitConfig.hideActions = ["showPreview", "showDetail", "audit", "edit", "addNewByCurrent", "itemLink"];

                shortcutParams.fieldList = this.fieldLists.pgo_localRequisites.search;
                /*shortcutParams.whereList = {
                 byID: {expression: "[ID]", condition: '!=', values: {"ID": 10}},
                 byState: {expression: "[state]", condition: '=', values: {"state": "ACTIVE"}}
                 };//exclude built-in admin from grid*/
                break;
        }
        return resultShortcut;
    },
    pgo_objAccounting: function (code) {

        var splitCode = code.split('.'),
            group = splitCode[0],
            resultShortcut,
            shortcutParams;
        resultShortcut = {
            cmdType: "showList",
            cmdData: {
                params: [
                    {
                        entity: "pgo_objAccounting",
                        method: "select"
                    }
                ]
            },
            description: "Облік об’єктів господарського обліку",
            cmpInitConfig: {
                onDeterminateForm: function () {
                    return true;
                },
                onItemContextMenu: function () {
                },

                addBaseDockedItems: function () {
                    var me = this,
                        gridAgreements = this;
                    me.__proto__.addBaseDockedItems.apply(this, arguments);
                    var menu = Ext.create("Ext.menu.Menu");
                    //убрать спэйсер между кнопками слева
                    me.dockedItems[0].items.splice(2, 1);
                    let renumBtn = {
                        xtype: 'button',
                        margin: "0, 0, 0, 2",
                        //text: 'Перезакладення',
                        iconCls: 'fa fa-sort-numeric-asc',
                        style: {
                            color: '#0011ff',
                            fontSize: '14px'
                        },
                        name: 'renumBtn',
                        itemId: 'renumBtn',
                        tooltip: 'Перезакладення номерів ПГО',
                        disabled: !ADM.AccessManager.checkAccess('PGO_04_01_02'),
                        handler: function () {
                            $App.dialogYesNo("Підтвердження", 'Ви дійсно бажаєте перезакласти номери ПГО??').then(function (res) {
                                if (!res) {
                                    return;
                                }
                                $App.connection.run({
                                    entity: "pgo_objAccounting",
                                    method: "renumObjs"
                                }).then(function (res) {
                                    me.onRefresh();
                                });
                            });
                        }
                    };
                    me.dockedItems[0].items.splice(2, 0, renumBtn);
                    me.dockedItems[0].items.splice(3, 0, {
                        //text: "Погосподарська книга",
                        tooltip: 'Погосподарська книга',
                        iconCls: 'fa fa-file-excel-o',
                        style: {
                            color: '#008442',
                            fontSize: '16px'
                        },
                        disabled: !ADM.AccessManager.checkAccess('PGO_04_01_02'),
                        name: "book",
                        handler: function (ctx) {
                            var win = Ext.create("UB.view.BaseWindow", {
                                autoShow: true,
                                title: 'Формування погосподарської книги',
                                border: 0,
                                layout: 'fit',
                                modal: true,
                                items: [
                                    {
                                        xtype: 'form',
                                        layout: {
                                            type: "vbox",
                                            align: "stretch"
                                        },
                                        defaults: {
                                            labelWidth: 160,
                                            flex: 1
                                        },
                                        autoScroll: true,
                                        items: [
                                            {
                                                xtype: 'ubcombobox',
                                                itemId: "locality",
                                                ubID: "locality",
                                                fieldLabel: "Населений пункт",
                                                displayField: 'governmentNameFull',
                                                width: 600,
                                                allowBlank: false,
                                                ubRequest: {
                                                    entity: 'pgo_settlementDict',
                                                    method: 'select',
                                                    fieldList: ['ID', 'governmentNameFull']
                                                },
                                                listeners: {
                                                    change: function (fld, newV, oldV) {
                                                        var pgoBook = fld.up().query('ubcombobox[ubID="pgoBook"]')[0]
                                                        if (newV) {
                                                            pgoBook.setVisible(true)
                                                            pgoBook.store.ubRequest.whereList.byLocationID.values.locationID = newV
                                                            pgoBook.store.reload()
                                                            pgoBook.setValue(null);
                                                        } else {
                                                            pgoBook.setVisible(false)
                                                            pgoBook.store.ubRequest.whereList.byLocationID.values.locationID = -1
                                                            pgoBook.store.reload()
                                                            pgoBook.setValue(null);
                                                        }
                                                    }
                                                }
                                            },
                                            {
                                                xtype: 'ubcombobox',
                                                itemId: "years",
                                                ubID: "years",
                                                fieldLabel: "Період",
                                                displayField: 'yearsPeriod',
                                                width: 400,
                                                allowBlank: false,
                                                ubRequest: {
                                                    entity: 'pgo_yearsDic',
                                                    method: 'select',
                                                    fieldList: ['ID', 'yearFrom', 'yearTo', 'yearsPeriod']
                                                }
                                            },
                                            {
                                                xtype: 'ubcombobox',
                                                itemId: "pgoBook",
                                                ubID: "pgoBook",
                                                fieldLabel: "Книга обліку",
                                                displayField: 'pgoBook',
                                                width: 200,
                                                allowBlank: false,
                                                hidden: true,
                                                ubRequest: {
                                                    entity: 'pgo_objAccounting',
                                                    method: 'selectPgoBook',
                                                    fieldList: ['pgoBook'],
                                                    whereList: {
                                                        byLocationID: {
                                                            expression: "[locationID]",
                                                            condition: "=",
                                                            values: {"locationID": -1}
                                                        }
                                                    }
                                                }
                                            }
                                        ],
                                        buttons: [
                                            {
                                                text: 'Очистити',
                                                handler: function (btn) {
                                                    var me = btn.up().up(), locality = me.query('ubcombobox[ubID="locality"]')[0],
                                                        years = me.query('ubcombobox[ubID="years"]')[0],
                                                        pgoBook = me.query('ubcombobox[ubID="pgoBook"]')[0];
                                                    years.setValue(null);
                                                    locality.setValue(null);
                                                    pgoBook.setValue(null);
                                                }
                                            },
                                            {
                                                text: 'Сформувати',
                                                handler: function (btn) {
                                                    let me = this.up('form'),
                                                        form = me.getForm();

                                                    var locality = me.query('ubcombobox[ubID="locality"]')[0],
                                                        years = me.query('ubcombobox[ubID="years"]')[0],
                                                        pgoBook = me.query('ubcombobox[ubID="pgoBook"]')[0];
                                                    var yearFrom = years.getVal('yearFrom');
                                                    var yearTo = years.getVal('yearTo');
                                                    if (form.isValid()) {
                                                        me.getEl().mask('Зачекайте, файл обробляється');
                                                        $App.connection.get('rest/pgo_report/generatePGOBook?locality=' + locality.getValue() + '&pgoBook=' + pgoBook.getValue() + '&yearFrom=' + yearFrom + '&yearTo=' + yearTo + '&isAllBook=1', {responseType: 'arraybuffer'})
                                                            .then(function (response) {
                                                                me.getEl().unmask();
                                                                var blobData,
                                                                    byteArray = response.data;
                                                                blobData = new Blob(
                                                                    [byteArray],
                                                                    {type: 'application/vnd.ms-excel.sheet.macroEnabled.12'}
                                                                );

                                                                saveAs(blobData, "Book.xlsm");
                                                                win.close();
                                                            }, function (e) {
                                                                me.getEl().unmask();
                                                                win.close();
                                                                $App.dialogError('Заповніть реквізити місцевої ради');
                                                            });
                                                    } else
                                                        $App.dialogError(`Заповніть всі параметри!`);
                                                }
                                            }
                                        ]
                                    }

                                ]
                            });
                        }
                    });
                    me.dockedItems[0].items.splice(4, 0, {
                        xtype: 'button',
                        margin: "0, 0, 0, 2",
                        //text: 'Обхід ПГО',
                        iconCls: 'fa fa-files-o',
                        style: {
                            color: '#ff9668',
                            fontSize: '18px'
                        },
                        width: 34,
                        height: 32,
                        name: 'copyBtn',
                        itemId: 'copyBtn',
                        tooltip: 'Обхід ПГО',
                        disabled: !ADM.AccessManager.checkAccess('PGO_04_01_02'),
                        handler: function () {
                            var win = Ext.create("Ext.window.Window", {
                                autoShow: true,
                                title: 'Оберіть дату',
                                border: 0,
                                layout: "fit",
                                modal: true,
                                items: [
                                    {
                                        xtype: 'datefield',
                                        itemId: "year",
                                        fieldLabel: "Дата обходу",
                                        allowBlank: false,
                                        flex: 1,
                                        listeners: {
                                            afterrender: function (fld) {
                                                fld.setValue(new Date());
                                            }
                                        }
                                    }
                                ],
                                buttons: [
                                    {
                                        text: 'Обрати',
                                        handler: function (btn) {
                                            var yearVal = btn.up('window').queryById('year').getValue();
                                            if (this.up('window').items.items[0].isValid()) {
                                                $App.dialogYesNo("Підтвердження", 'Ви дійсно бажаєте виконати "Обхід ПГО"?').then(function (res) {
                                                    if (!res) {
                                                        return;
                                                    }
                                                    me.getEl().mask('Зачекайте, операція виконується');
                                                    try {
                                                        $App.connection.run({
                                                            entity: "pgo_objAccounting",
                                                            method: "copyPGO",
                                                            execParams: {
                                                                copyDate: yearVal
                                                            }
                                                        }).catch(function (err) {
                                                            me.getEl().unmask();
                                                            throw new UB.UBError(err.message);
                                                        }).then(function (res) {
                                                            me.getEl().unmask();
                                                        });
                                                    }
                                                    catch (e) {
                                                        me.getEl().unmask();
                                                    }

                                                });
                                                win.close();
                                            } else {
                                                $App.dialogError(`Дату вказано не вірно!`);
                                            }

                                        }
                                    }
                                ]
                            });
                        }
                    });

                    menu.add({
                        text: "Виключити об’єкт з ПГО",
                        iconCls: 'fa fa-toggle-off',
                        name: "enableObjPgo",
                        handler: function (ctx) {
                            var grid = this.up('grid');
                            let selection = gridAgreements.getSelectionModel().getSelection()[0];

                            if (!selection) {
                                $App.dialogError('Спочатку необхідно обрати запис з таблиці');
                                return;
                            }
                            let selectedData = selection.data || {};
                            if (selectedData && selectedData.objState == "OBJ_INPGO") {
                                $App.dialogYesNo("Підтвердження", 'Ви дійсно бажаєте виключити об’єкт із ПГО? Редагування даних картки буде неможливо та об’єкт ПГО не буде враховуватись у жодних відомостях.').then(function (res) {
                                    if (!res) {
                                        return;
                                    }

                                    $App.connection.update({
                                        entity: 'pgo_objAccounting', fieldList: ['ID', 'objState'],
                                        execParams: {ID: selectedData.ID, objState: 'OBJ_OUTPGO'}
                                    }).then(function (result) {
                                            gridAgreements.getSelectionModel().clearSelections();
                                            me.onRefresh();
                                        }
                                    );
                                });
                            } else {
                                $App.dialogError('Ця дія доступна, якщо поточний стан картки «Включено об’єкт до ПГО».');
                                return;
                            }
                        }
                    });
                    menu.add({
                        text: "Включити об’єкт до ПГО",
                        iconCls: 'fa fa-toggle-on',
                        name: "disableObjPgo",
                        handler: function (ctx) {
                            var grid = this.up('grid');
                            let selection = gridAgreements.getSelectionModel().getSelection()[0];
                            if (!selection) {
                                $App.dialogError('Спочатку необхідно обрати запис з таблиці');
                                return;
                            }
                            let selectedData = selection.data || {};
                            if (selectedData && selectedData.objState == "OBJ_OUTPGO") {
                                $App.dialogYesNo("Підтвердження", 'Ви дійсно бажаєте включити об’єкт до ПГО? Об’єкт ПГО буде враховуватись у відомостях.').then(function (res) {
                                    if (!res) {
                                        return;
                                    }

                                    $App.connection.update({
                                        entity: 'pgo_objAccounting', fieldList: ['ID', 'objState'],
                                        execParams: {ID: selectedData.ID, objState: 'OBJ_INPGO'}
                                    }).then(function (result) {
                                            gridAgreements.getSelectionModel().clearSelections();
                                            me.onRefresh();
                                        }
                                    );
                                });
                            }
                            else {
                                $App.dialogError('Ця дія доступна, якщо поточний стан картки «Виключено об’єкт з ПГО».');
                                return;
                            }
                        }
                    });
                    menu.add({
                        text: "Позначити/Прибрати позначку",
                        iconCls: 'fa  fa-check-square-o',
                        name: "markPGO",
                        handler: function (ctx) {
                            var grid = this.up('grid');
                            let selection = gridAgreements.getSelectionModel().getSelection()[0];
                            if (!selection) {
                                $App.dialogError('Спочатку необхідно обрати запис з таблиці');
                                return;
                            }
                            let selectedData = selection.data || {};
                            // if (selectedData && selectedData.objState == "OBJ_OUTPGO") {
                            //     $App.dialogYesNo("Підтвердження", 'Ви дійсно бажаєте включити об’єкт до ПГО? Об’єкт ПГО буде враховуватись у відомостях.').done(function (res) {
                            //         if (!res) {
                            //             return;
                            //         }

                            $App.connection.update({
                                entity: 'pgo_objAccounting', fieldList: ['ID', 'isMarked'],
                                execParams: {ID: selectedData.ID, isMarked: !selectedData.isMarked}
                            }).then(function (result) {
                                    me.onRefresh();
                                }
                            );
                            //     });
                            // }
                            // else {
                            //     $App.dialogError('Ця дія доступна, якщо поточний стан картки «Виключено об’єкт з ПГО».');
                            //     return;
                            // }
                        }
                    });
                    me.dockedItems[0].items.splice(5, 0, {
                        itemId: "agreementsMenu",
                        text: "Всі дії",
                        disabled: !ADM.AccessManager.checkAccess('PGO_04_01_02'),
                        menu: menu
                    });


                },
                getRowClass: function (row) {
                    var result = '';


                    result = row.get('isMarked') ? 'ub-row-red' : 'ub-row-lightgrey';

                    return result;
                }
                // beforeRender: function () {
                //     let me = this;
                //
                //     me.columns[0].renderer = function (value, a, b, c, d, e) {
                //
                //         if(b && b.data && b.data.isMarked){
                //             a.tdAttr = 'style="background:#ff8686;"';
                //         }else if(a && a.tdAttr){
                //             a.tdAttr = '';
                //         }
                //         return value;
                //     }
                // }
            }
        };

        shortcutParams = resultShortcut.cmdData.params[0];
        switch (group) {
            case "search":

                resultShortcut.cmpInitConfig.toolbarActionList = ['refresh', "addNew"];
                resultShortcut.cmpInitConfig.hideActions = ["del", "showPreview", "showDetail", "audit", "edit", "addNewByCurrent", "itemLink"];

                shortcutParams.fieldList = this.fieldLists.pgo_objAccounting.search;
                shortcutParams.orderList = {
                    byPgoBook: this.orderLists.byPgoBook,
                    byPgoBookPage: this.orderLists.byPgoBookPage
                };
                break;
        }
        return resultShortcut;
    },
    pgo_community: function (code) {

        var resultShortcut;
        resultShortcut = {
            cmdType: "showForm",
            caption: "Реєстр громад",
            description: "Реєстр громад",
            inWindow: true,
            formCode: 'inv_payers-SearchPGO',
            entityName: 'inv_payers',
            entity: "inv_payers"

        };

        return resultShortcut;
    },
    pgo_yearsDic: function (code) {

        var splitCode = code.split('.'),
            group = splitCode[0],
            resultShortcut,
            shortcutParams;
        resultShortcut = {
            cmdType: "showList",
            cmdData: {
                params: [
                    {
                        entity: "pgo_yearsDic",
                        method: "select"
                    }
                ]
            },
            description: "Довідник періодів",
            cmpInitConfig: {
                onDeterminateForm: function () {
                    return {
                        formCode: "pgo_yearsDic",
                        entityName: "pgo_yearsDic",
                        cmdData: {
                            sender: this
                        }
                    }
                },
                onItemContextMenu: function () {
                }
            }
        };

        shortcutParams = resultShortcut.cmdData.params[0];
        switch (group) {
            case "search":

                resultShortcut.cmpInitConfig.toolbarActionList = ['refresh', "addNew", "del"];
                resultShortcut.cmpInitConfig.hideActions = ["showPreview", "showDetail", "audit", "edit", "addNewByCurrent", "itemLink"];


                shortcutParams.fieldList = this.fieldLists.pgo_yearsDic.search;
                break;
        }
        return resultShortcut;
    },
    pgo_report: function (code) {

        var splitCode = code.split('.'),
            group = splitCode[0],
            resultShortcut,
            shortcutParams;
        resultShortcut = {
            cmdType: "showList",
            cmdData: {
                params: [
                    {
                        entity: "pgo_report",
                        method: "select"
                    }
                ]
            },
            description: "Реєстр звітів",
            cmpInitConfig: {
                onDeterminateForm: function () {
                    return true;
                },
                onItemContextMenu: function () {
                },
                onItemDblClick: function () {
                    if (!ADM.AccessManager.checkAccess('PGO_04_08_02')) {
                        $App.dialogError(`У вас не має доступу до файлу.`);
                    }
                    else {
                        var me = this,
                            record = me.store.getById(me.selectedRecordID);

                        me.getEl().mask('Зачекайте, файл обробляється');
                        try {

                            $App.connection.get('rest/pgo_report/generateExcel?ID=' + record.get('ID'), {responseType: 'arraybuffer'})
                                .then(function (response) {
                                    me.getEl().unmask();
                                    var blobData,
                                        byteArray = response.data;
                                    blobData = new Blob(
                                        [byteArray],
                                        {type: 'application/vnd.ms-excel'}
                                    );
                                    let fileName = '6-silrada';
                                    switch (record.data['repType']) {
                                        case 'JYTLO':
                                            fileName = '1-житлофонд (річна)'
                                            break;
                                        case 'SILRADA':
                                            fileName = '6-сільрада';
                                            break;
                                        case 'SCHOOL':
                                            fileName = 'Школярі';
                                            break;
                                    }
                                    saveAs(blobData, fileName + ".xlsx");
                                }).error(function (e) {
                            });
                        }
                        catch (e) {
                            me.getEl().unmask();
                        }
                    }

                },
                onAddNew: function () {
                    var grid = this;
                    var win = Ext.create("Ext.window.Window", {
                        autoShow: true,
                        title: 'Формування статистичних звітів',
                        border: 0,
                        layout: {
                            type: "vbox",
                            align: "stretch"
                        },
                        defaults: {
                            labelWidth: 160,
                            flex: 1
                        },
                        modal: true,
                        items: [
                            {
                                xtype: 'ubcombobox',
                                itemId: "locality",
                                ubID: "locality",
                                fieldLabel: "Населений пункт",
                                disableContextMenu: true,
                                displayField: 'governmentNameFull',
                                width: 600,
                                allowBlank: false,
                                ubRequest: {
                                    entity: 'pgo_settlementDict',
                                    method: 'select',
                                    fieldList: ['ID', 'governmentNameFull']
                                },
                                listeners: {
                                    // beforeQuerySend: function (queryEvent) {
                                    //     if (queryEvent.query) {
                                    //         queryEvent.query = queryEvent.query.toUpperCase();
                                    //         queryEvent.combo.setValue(queryEvent.query);
                                    //     }
                                    // }
                                }
                            },
                            {
                                xtype: 'ubcombobox',
                                itemId: "repType",
                                ubID: "repType",
                                disableContextMenu: true,
                                fieldLabel: "Тип звіту",
                                displayField: 'name',
                                valueField: 'code',
                                allowBlank: false,
                                flex: 1,
                                ubRequest: {
                                    entity: "ubm_enum",
                                    method: "select",
                                    fieldList: ['ID', 'eGroup', 'code', 'name', 'sortOrder'],
                                    whereList: {
                                        byGroup: {
                                            expression: '[eGroup]',
                                            condition: 'equal',
                                            values: {state: 'REP_TYPE'}
                                        }
                                    },
                                    orderList: {sortOrder: {expression: "sortOrder", order: 'asc'}}
                                },
                                listeners: {
                                    change: function (fld, newV, oldV) {
                                        var me = fld.up();
                                        var year = me.query('numberfield[ubID="year"]')[0];
                                        year.setVisible(!!newV && newV != 'SCHOOL')
                                    }
                                }
                            },
                            {
                                xtype: 'numberfield',
                                itemId: "year", /*Рік*/
                                ubID: "year", /*Рік*/
                                fieldLabel: "Рік",
                                minValue: 1900,
                                maxValue: (new Date()).getFullYear(),
                                allowBlank: false,
                                allowPureDecimal: true,
                                allowNegative: true,
                                hidden: true,
                                value: (new Date()).getFullYear()
                            }
                        ],
                        buttons: [
                            {
                                text: 'Очистити',
                                handler: function (btn) {
                                    var me = btn.up().up(), locality = me.query('ubcombobox[ubID="locality"]')[0],
                                        repType = me.query('ubcombobox[ubID="repType"]')[0],
                                        year = me.query('numberfield[ubID="year"]')[0];
                                    year.setValue((new Date()).getFullYear());
                                    repType.setValue(null);
                                    locality.setValue(null);
                                }
                            },
                            {
                                text: 'Сформувати',
                                handler: function (btn) {
                                    var me = btn.up().up(), locality = me.query('ubcombobox[ubID="locality"]')[0],
                                        repType = me.query('ubcombobox[ubID="repType"]')[0],
                                        year = me.query('numberfield[ubID="year"]')[0];

                                    if (this.up('window').items.items[0].isValid()) {
                                        var metod = 'saveDataSilrada',
                                            fileName = '1-житлофонд (річна)';
                                        switch (repType.getValue()) {
                                            case 'JYTLO': {
                                                metod = 'saveDataJytlo';
                                                break;
                                            }
                                            case 'SILRADA': {
                                                metod = 'saveDataSilrada';
                                                fileName = '6-сільрада';
                                                break;
                                            }
                                            case 'SCHOOL': {
                                                metod = 'saveDataSchool';
                                                fileName = 'Школярі';
                                                break;
                                            }
                                        }
                                        try {
                                            $App.connection.run({
                                                entity: "pgo_report",
                                                method: metod,
                                                locality: locality.getValue(),
                                                repType: repType.getValue(),
                                                year: year.getValue()
                                            }).then(function (res) {

                                                $App.connection.get('rest/pgo_report/generateExcel?ID=' + res.reportID, {responseType: 'arraybuffer'})
                                                    .then(function (response) {
                                                        var blobData,
                                                            byteArray = response.data;
                                                        blobData = new Blob(
                                                            [byteArray],
                                                            {type: 'application/vnd.ms-excel'}
                                                        );

                                                        grid.onRefresh();
                                                        saveAs(blobData, fileName + ".xlsx");
                                                    });
                                                win.close();
                                            }).error(function (e) {
                                            });
                                        }
                                        catch (e) {
                                            win.close();
                                        }
                                    } else {
                                        $App.dialogError(`Заповніть всі параметри!`);
                                    }

                                }
                            }
                        ]
                    });
                }
            }
        };

        shortcutParams = resultShortcut.cmdData.params[0];
        switch (group) {
            case "search":

                resultShortcut.cmpInitConfig.toolbarActionList = ["addNew", "del", 'refresh'];
                resultShortcut.cmpInitConfig.hideActions = ["showPreview", "showDetail", "audit", "edit", "addNewByCurrent", "itemLink"];

                shortcutParams.fieldList = this.fieldLists.pgo_report.search;
                break;
        }
        return resultShortcut;
    },
    pgo_exemptionPhysDict: function (code) {
        var splitCode = code.split('.'),
            group = splitCode[0],
            resultShortcut,
            shortcutParams;
        resultShortcut = {
            cmdType: "showList",
            cmdData: {
                params: [
                    {
                        entity: "inv_exemptionPhysDict",
                        method: "select"
                    }
                ]
            },
            description: "Довідник пільгових категорій фіз. осіб",
            cmpInitConfig: {
                onDeterminateForm: function () {
                    return {
                        formCode: "inv_exemptionPhysDict",
                        entityName: "inv_exemptionPhysDict",
                        cmdData: {
                            sender: this
                        }
                    }
                },
                onItemContextMenu: function () {
                }
            }

        };
        shortcutParams = resultShortcut.cmdData.params[0];
        switch (group) {
            case "search":

                resultShortcut.cmpInitConfig.toolbarActionList = ['addNew', 'del', 'refresh'];
                resultShortcut.cmpInitConfig.hideActions = ["showPreview", "showDetail", "audit", "edit", "addNewByCurrent", "itemLink"];

                shortcutParams.fieldList = this.fieldLists.pgo_exemptionPhysDict.search;
                break;
        }
        return resultShortcut;

    },
    pgo_regUnit: function (code) {

        var splitCode = code.split('.'),
            group = splitCode[0],
            resultShortcut,
            shortcutParams;
        resultShortcut = {
            cmdType: "showList",
            cmdData: {
                params: [
                    {
                        entity: "inv_regUnit",
                        method: "select"
                    }
                ]
            },
            description: "Довідник органів реєстрації",
            cmpInitConfig: {
                onDeterminateForm: function () {
                    return {
                        formCode: "inv_regUnit",
                        entityName: "inv_regUnit",
                        cmdData: {
                            sender: this
                        }
                    }
                }
            }
        };

        shortcutParams = resultShortcut.cmdData.params[0];
        switch (group) {
            case "search":

                resultShortcut.cmpInitConfig.toolbarActionList = ["addNew", "del", "edit", 'refresh'];
                resultShortcut.cmpInitConfig.hideActions = ["showPreview", "showDetail", "audit", "addNewByCurrent", "itemLink"];

                shortcutParams.fieldList = this.fieldLists.comm_regUnit.search;
                /*if ($App.connection.userData().roles != 'Admin')
                 shortcutParams.whereList = {
                 byUser: this.whereLists.comm_regUnit.byUser
                 };*/
                break;
        }
        return resultShortcut;
    },
    pgo_objLog: function (code) {

        var splitCode = code.split('.'),
            group = splitCode[0],
            resultShortcut,
            shortcutParams;
        resultShortcut = {
            cmdType: "showList",
            cmdData: {
                params: [
                    {
                        entity: "pgo_objLog",
                        method: "select"
                    }
                ]
            },
            description: "Журнал змін ПГО",
            cmpInitConfig: {
                onDeterminateForm: function () {
                    return true;
                },
                onItemContextMenu: function () {
                },
                onItemDblClick: function () {
                }
            }
        };

        shortcutParams = resultShortcut.cmdData.params[0];
        switch (group) {
            case "search":

                resultShortcut.cmpInitConfig.toolbarActionList = ['refresh'];
                resultShortcut.cmpInitConfig.hideActions = ["addNew", "del", "showPreview", "showDetail", "audit", "edit", "addNewByCurrent", "itemLink"];

                shortcutParams.fieldList = this.fieldLists.pgo_objLog.search;
                shortcutParams.orderList = {
                    byChangeDate: this.orderLists.byChangeDate
                };
                break;
        }
        return resultShortcut;
    }
});
