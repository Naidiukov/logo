const _ = require('lodash');
require('models/UTL/shortcuts/factory.js');
require('./COMM_fieldLists.js');
_.extend(UTL.shortcuts.factory, {
    comm_community: function (code) {
        var resultShortcut;
        resultShortcut = {
            cmdType: "showForm",
            caption: "Реєстр громад",
            description: "Реєстр громад",
            inWindow: true,
            formCode: 'inv_payers-Search',
            entityName: 'inv_payers',
            entity: "inv_payers",
            cmpInitConfig: {
                isComm: true
            }
        };
        return resultShortcut;
    },
    comm_regUnit: function (code) {

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
    comm_ngoDict: function (code) {

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
    comm_localStreet: function (code) {

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
    comm_localRequisites: function (code) {

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
    comm_cognation: function (code) {

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
    comm_exemptionPhysDict: function (code) {
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
    comm_report: function (code) {

        var splitCode = code.split('.'),
            group = splitCode[0],
            resultShortcut,
            shortcutParams;
        resultShortcut = {
            cmdType: "showList",
            cmdData: {
                params: [
                    {
                        entity: "comm_report",
                        method: "select"
                    }
                ]
            },
            description: "Реєстр статистичних звітів",
            cmpInitConfig: {
                onDeterminateForm: function () {
                    return true;
                },
                onItemContextMenu: function () {
                },
                onItemDblClick: function () {
                    var me = this,
                        record = me.store.getById(me.selectedRecordID);

                    me.getEl().mask('Зачекайте, файл обробляється');
                    try {

                        $App.connection.get('rest/comm_report/generateExcel?ID=' + record.get('ID'), {responseType: 'arraybuffer'})
                            .then(function (response) {
                                me.getEl().unmask();
                                var blobData,
                                    byteArray = response.data;
                                blobData = new Blob(
                                    [byteArray],
                                    {type: 'application/vnd.ms-excel'}
                                );
                                let fileName = 'Form3.1';
                                switch (record.data['repType']) {
                                    case 'FORM31':
                                        fileName = 'Form3.1';
                                        break;
                                    case 'FORM34':
                                        fileName = 'Form3.4';
                                        break;
                                    case 'FORM35':
                                        fileName = 'Form3.5';
                                        break;
                                    case 'REGLPLACE':
                                        fileName = 'про_реєстрацію_місця_проживання';
                                        break;
                                    case 'REGLPLACEREM':
                                        fileName = 'про_зняття_з_реєстрації_місця_проживання';
                                        break;
                                    case 'PERSONCARD':
                                        fileName = 'адресна_картка_особи';
                                        break;
                                }
                                saveAs(blobData, fileName + ".xlsx");
                            }).error(function (e) {
                        });
                    }
                    catch (e) {
                        me.getEl().unmask();
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
                                xtype: 'form',
                                layout: {
                                    type: 'vbox',
                                    align: 'stretch'
                                },
                                items: [
                                    {
                                        xtype: 'ubcombobox',
                                        itemId: "repType",
                                        ubID: "repType",
                                        disableContextMenu: true,
                                        fieldLabel: "Тип відомості",
                                        displayField: 'name',
                                        valueField: 'code',
                                        minWidth: 600,
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
                                                    values: {state: 'COMM_REPTYPE'}
                                                }
                                            },
                                            orderList: {sortOrder: {expression: "sortOrder", order: 'asc'}}
                                        },
                                        listeners: {
                                            change: function (fld, newV, oldV) {
                                                var me = fld.up();
                                                var areaCtrl = me.query('ubcombobox[ubID="area"]')[0],
                                                    settlementCtrl = me.query('ubcombobox[ubID="settlement"]')[0],
                                                    streetCtrl = me.query('ubcombobox[ubID="street"]')[0],
                                                    localRequisites = me.query('ubcombobox[ubID="localRequisites"]')[0],
                                                    houseNumCtrl = me.queryById('houseNum'),
                                                    flatNumCtrl = me.queryById('flatNum'),
                                                    dateTo = me.queryById('dateTo'),
                                                    dateFrom = me.queryById('dateFrom'),
                                                    radio = me.queryById('radio'),
                                                    radioSettl = me.queryById('radioSettl');

                                                function setFieldVisible(field, isVisible, isBlank) {
                                                    if (isVisible) {
                                                        field.show();
                                                    } else {
                                                        field.hide();
                                                        if (field.setValue != undefined) field.setValue(null);
                                                    }
                                                    if (isBlank != undefined && field.setAllowBlank != undefined) {
                                                        field.setAllowBlank(!!isBlank);
                                                    }
                                                }

                                                if (fld.getValue()) {
                                                    if (fld.getValue() == 'PERSONCARD') {
                                                        setFieldVisible(areaCtrl, true, false);
                                                        setFieldVisible(settlementCtrl, true, false);
                                                        setFieldVisible(streetCtrl, true, false);
                                                        setFieldVisible(houseNumCtrl, true, false);
                                                        setFieldVisible(flatNumCtrl, true);
                                                        setFieldVisible(localRequisites, false, true);
                                                        setFieldVisible(dateTo, false, true);
                                                        setFieldVisible(dateFrom, false, true);
                                                        setFieldVisible(radio, false, undefined);
                                                    }
                                                    else {
                                                        radioSettl.setValue(true)
                                                        setFieldVisible(areaCtrl, true, false);
                                                        setFieldVisible(settlementCtrl, true, false);
                                                        setFieldVisible(streetCtrl, false, true);
                                                        setFieldVisible(houseNumCtrl, false, true);
                                                        setFieldVisible(flatNumCtrl, false);
                                                        setFieldVisible(dateTo, true, false);
                                                        setFieldVisible(localRequisites, false, true);
                                                        setFieldVisible(dateFrom, true, false);
                                                        setFieldVisible(radio, true, undefined);
                                                    }
                                                    // else{
                                                    //     setFieldVisible(areaCtrl, false, true);
                                                    //     setFieldVisible(settlementCtrl, false, true);
                                                    //     setFieldVisible(streetCtrl, false, true);
                                                    //     setFieldVisible(houseNumCtrl, false, true);
                                                    //     setFieldVisible(flatNumCtrl, false);
                                                    //     setFieldVisible(dateTo, true, false);
                                                    //     setFieldVisible(dateFrom, true, false);
                                                    // }
                                                } else {
                                                    radioSettl.setValue(true)
                                                    setFieldVisible(areaCtrl, false, true);
                                                    setFieldVisible(settlementCtrl, false, true);
                                                    setFieldVisible(streetCtrl, false, true);
                                                    setFieldVisible(houseNumCtrl, false, true);
                                                    setFieldVisible(flatNumCtrl, false);
                                                    setFieldVisible(localRequisites, false, true);
                                                    setFieldVisible(dateTo, false, false);
                                                    setFieldVisible(dateFrom, false, false);
                                                    setFieldVisible(radio, false, undefined);
                                                }
                                            }
                                        }
                                    },
                                    {
                                        xtype: 'datefield',
                                        itemId: "dateFrom",
                                        ubID: "dateFrom",
                                        fieldLabel: "Дата з",
                                        hidden: true,
                                        flex: 1,
                                        width: 600,
                                        allowBlank: true
                                    },
                                    {
                                        xtype: 'datefield',
                                        itemId: "dateTo",
                                        ubID: "dateTo",
                                        fieldLabel: "Дата по",
                                        hidden: true,
                                        flex: 1,
                                        width: 600,
                                        allowBlank: true
                                    },
                                    {
                                        xtype: 'fieldcontainer',
                                        itemId: "radio",
                                        fieldLabel: 'Рівень розрахунку',
                                        labelWidth: 120,
                                        defaultType: 'radiofield',
                                        hidden: true,
                                        defaults: {
                                            flex: 1
                                        },
                                        layout: 'hbox',
                                        items: [
                                            {
                                                boxLabel: 'Населений пункт',
                                                name: 'radio',
                                                inputValue: 's',
                                                id: 'radioSettl',
                                                itemId: 'radioSettl',
                                                checked: true,
                                                listeners: {
                                                    change: function (fld, newV, oldV) {
                                                        var me = fld.up().up();
                                                        var areaCtrl = me.query('ubcombobox[ubID="area"]')[0],
                                                            settlementCtrl = me.query('ubcombobox[ubID="settlement"]')[0],
                                                            localRequisites = me.query('ubcombobox[ubID="localRequisites"]')[0];

                                                        function setFieldVisible(field, isVisible, isBlank) {
                                                            if (isVisible) {
                                                                field.show();
                                                            } else {
                                                                field.hide();
                                                                if (field.setValue != undefined) field.setValue(null);
                                                            }
                                                            if (isBlank != undefined && field.setAllowBlank != undefined) {
                                                                field.setAllowBlank(!!isBlank);
                                                            }
                                                        }
                                                        if(fld.getValue()){
                                                            setFieldVisible(areaCtrl, true, false);
                                                            setFieldVisible(settlementCtrl, true, false);
                                                            setFieldVisible(localRequisites, false, true);
                                                        } else {
                                                            setFieldVisible(areaCtrl, false, true);
                                                            setFieldVisible(settlementCtrl, false, true);
                                                            setFieldVisible(localRequisites, true, false);
                                                        }

                                                    }
                                                }
                                            },
                                            {
                                                boxLabel: 'Рада',
                                                name: 'radio',
                                                inputValue: 'r',
                                                id: 'radioRequ',
                                                itemId: 'radioRequ',
                                                listeners: {
                                                    change: function (fld, newV, oldV) {
                                                        var me = fld.up().up();
                                                        var areaCtrl = me.query('ubcombobox[ubID="area"]')[0],
                                                            settlementCtrl = me.query('ubcombobox[ubID="settlement"]')[0],
                                                            localRequisites = me.query('ubcombobox[ubID="localRequisites"]')[0];

                                                        function setFieldVisible(field, isVisible, isBlank) {
                                                            if (isVisible) {
                                                                field.show();
                                                            } else {
                                                                field.hide();
                                                                if (field.setValue != undefined) field.setValue(null);
                                                            }
                                                            if (isBlank != undefined && field.setAllowBlank != undefined) {
                                                                field.setAllowBlank(!!isBlank);
                                                            }
                                                        }
                                                        if(fld.getValue()){
                                                            setFieldVisible(areaCtrl, false, true);
                                                            setFieldVisible(settlementCtrl, false, true);
                                                            setFieldVisible(localRequisites, true, false);
                                                        } else {
                                                            setFieldVisible(areaCtrl, true, false);
                                                            setFieldVisible(settlementCtrl, true, false);
                                                            setFieldVisible(localRequisites, false, true);
                                                        }

                                                    }
                                                }
                                            }
                                        ]
                                    },
                                    {
                                        xtype: 'ubcombobox',
                                        itemId: "area",
                                        ubID: "area",
                                        disableContextMenu: true,
                                        fieldLabel: "Область",
                                        displayField: 'areaName',
                                        valueField: 'areaName',
                                        allowBlank: true,
                                        hidden: true,
                                        flex: 1,
                                        ubRequest: {
                                            entity: "pgo_ngoDict",
                                            method: "select",
                                            fieldList: ['areaName'],
                                            orderList: {areaName: {expression: "areaName", order: 'asc'}},
                                            groupList: ["areaName"]
                                        },
                                        listeners: {
                                            change: function (fld, newV, oldV) {
                                                var me = fld.up();
                                                var settlementCtrl = me.query('ubcombobox[ubID="settlement"]')[0];
                                                settlementCtrl.setValue(null);
                                                if (fld.getValue()) {
                                                    INV.services.setWhereList(settlementCtrl, 'byAreaName', 'pgoDictID.areaName', fld.getRawValue())
                                                } else {
                                                    INV.services.setWhereList(settlementCtrl, 'byAreaName', 'pgoDictID.areaName', -1);
                                                }
                                                settlementCtrl.store.reload();
                                            },
                                            beforeRender: function () {
                                                this.store.ubRequest.fieldList = ['areaName']
                                            }
                                        }
                                    },
                                    {
                                        xtype: 'ubcombobox',
                                        itemId: "settlement",
                                        ubID: "settlement",
                                        disableContextMenu: true,
                                        fieldLabel: "Населений пункт",
                                        displayField: 'governmentFullName',
                                        valueField: 'ID',
                                        allowBlank: true,
                                        hidden: true,
                                        flex: 1,
                                        ubRequest: {
                                            entity: "pgo_settlementDict",
                                            method: "select",
                                            fieldList: ['ID', 'governmentFullName'],
                                            whereList: {
                                                byAreaName: {
                                                    expression: `[pgoDictID.areaName]`,
                                                    condition: "=",
                                                    values: {areaName: -1}
                                                }
                                            }
                                        },
                                        listeners: {
                                            change: function (fld, newV, oldV) {
                                                var me = fld.up();
                                                var streetCtrl = me.query('ubcombobox[ubID="street"]')[0];
                                                streetCtrl.setValue(null);
                                                if (fld.getValue()) {
                                                    INV.services.setWhereList(streetCtrl, 'bySettlementDictID', 'settlementDictID', fld.getValue())
                                                } else {
                                                    INV.services.setWhereList(streetCtrl, 'bySettlementDictID', 'settlementDictID', -1);
                                                }
                                                streetCtrl.store.reload();
                                            }
                                        }
                                    },
                                    {
                                        xtype: 'ubcombobox',
                                        itemId: "street",
                                        ubID: "street",
                                        disableContextMenu: true,
                                        fieldLabel: "Вулиця",
                                        displayField: 'streetFull',
                                        valueField: 'ID',
                                        allowBlank: true,
                                        hidden: true,
                                        flex: 1,
                                        ubRequest: {
                                            entity: "pgo_localStreet",
                                            method: "select",
                                            fieldList: ['ID', 'streetFull'],
                                            whereList: {
                                                bySettlementDictID: {
                                                    expression: `[settlementDictID]`,
                                                    condition: "=",
                                                    values: {settlementDictID: -1}
                                                }
                                            }
                                        }
                                    },
                                    {
                                        xtype: 'ubcombobox',
                                        itemId: "localRequisites",
                                        ubID: "localRequisites",
                                        disableContextMenu: true,
                                        fieldLabel: "Рада",
                                        displayField: 'pgoDictID.localGovernmentFullName',
                                        valueField: 'ID',
                                        allowBlank: true,
                                        hidden: true,
                                        flex: 1,
                                        ubRequest: {
                                            entity: "pgo_localRequisites",
                                            method: "select",
                                            fieldList: ['ID', 'pgoDictID', 'pgoDictID.localGovernmentFullName']
                                        }
                                    },
                                    {
                                        xtype: 'textfield',
                                        itemId: 'houseNum',
                                        ubID: "houseNum",
                                        fieldLabel: 'Будинок',
                                        hidden: true,
                                        allowBlank: true,
                                        flex: 1
                                    },
                                    {
                                        xtype: 'textfield',
                                        itemId: 'flatNum',
                                        ubID: "flatNum",
                                        fieldLabel: 'Квартира',
                                        hidden: true,
                                        allowBlank: true,
                                        flex: 1
                                    }
                                ]
                            }
                        ],
                        buttons: [
                            {
                                text: 'Очистити',
                                handler: function (btn) {
                                    var me = btn.up().up(), dateFrom = me.query('datefield[ubID="dateFrom"]')[0],
                                        dateTo = me.query('datefield[ubID="dateTo"]')[0],
                                        repType = me.query('ubcombobox[ubID="repType"]')[0],
                                        area = me.query('ubcombobox[ubID="area"]')[0],
                                        settlement = me.query('ubcombobox[ubID="settlement"]')[0],
                                        streetCtrl = me.query('ubcombobox[ubID="street"]')[0],
                                        houseNumCtrl = me.queryById('houseNum'),
                                        flatNumCtrl = me.queryById('flatNum');
                                    dateFrom.setValue(null);
                                    dateTo.setValue(null);
                                    repType.setValue(null);
                                    area.setValue(null);
                                    settlement.setValue(null);
                                    streetCtrl.setValue(null);
                                    houseNumCtrl.setValue(null);
                                    flatNumCtrl.setValue(null);
                                }
                            },
                            {
                                text: 'Сформувати',
                                handler: function (btn) {
                                    var me = btn.up().up(), dateFrom = me.query('datefield[ubID="dateFrom"]')[0],
                                        dateTo = me.query('datefield[ubID="dateTo"]')[0],
                                        repType = me.query('ubcombobox[ubID="repType"]')[0],
                                        area = me.query('ubcombobox[ubID="area"]')[0],
                                        settlement = me.query('ubcombobox[ubID="settlement"]')[0],
                                        streetCtrl = me.query('ubcombobox[ubID="street"]')[0],
                                        localRequisites = me.query('ubcombobox[ubID="localRequisites"]')[0],
                                        houseNumCtrl = me.queryById('houseNum'),
                                        flatNumCtrl = me.queryById('flatNum'),
                                        radioSettl = me.queryById('radioSettl'),
                                        runParams = {};

                                    function generateExcel(res) {
                                        $App.connection.get('rest/comm_report/generateExcel?ID=' + res.reportID, {responseType: 'arraybuffer'})
                                            .then(function (response) {
                                                var blobData,
                                                    byteArray = response.data;
                                                blobData = new Blob(
                                                    [byteArray],
                                                    {type: 'application/vnd.ms-excel'}
                                                );

                                                grid.onRefresh();
                                                saveAs(blobData, fileName[repType.getValue()] + ".xlsx");
                                            });
                                    }

                                    if (this.up('window').items.items[0].isValid()) {
                                        var fileName = {
                                            FORM31: 'Form3.1',
                                            FORM34: 'Form3.4',
                                            FORM35: 'Form3.5',
                                            REGLPLACE: 'про_реєстрацію_місця_проживання',
                                            REGLPLACEREM: 'про_зняття_з_реєстрації_місця_проживання',
                                            PERSONCARD: 'адресна_картка_особи'
                                        };
                                        try {
                                            switch (repType.getValue()) {
                                                case 'FORM35':
                                                    runParams = {
                                                        entity: "comm_report",
                                                        method: 'saveDataFormsR',
                                                        dateFrom: INV.services.getDate(dateFrom.getValue()),
                                                        dateTo: INV.services.getDate(dateTo.getValue()),
                                                        repType: repType.getValue(),
                                                        area: area.getValue(),
                                                        settlement: settlement.getValue(),
                                                        areaRaw: area.getRawValue(),
                                                        settlementRaw: settlement.getRawValue(),
                                                        isSettlement:radioSettl.checked,
                                                        localRequisites: localRequisites.getValue(),
                                                        localRequisitesRaw: localRequisites.getRawValue()
                                                    };
                                                    break;
                                                case 'REGLPLACEREM':
                                                    runParams = {
                                                        entity: "comm_report",
                                                        method: 'saveDataFormsR',
                                                        dateFrom: INV.services.getDate(dateFrom.getValue()),
                                                        dateTo: INV.services.getDate(dateTo.getValue()),
                                                        repType: repType.getValue(),
                                                        area: area.getValue(),
                                                        settlement: settlement.getValue(),
                                                        areaRaw: area.getRawValue(),
                                                        settlementRaw: settlement.getRawValue(),
                                                        isSettlement:radioSettl.checked,
                                                        localRequisites: localRequisites.getValue(),
                                                        localRequisitesRaw: localRequisites.getRawValue()
                                                    };
                                                    break;
                                                case 'PERSONCARD':
                                                    runParams = {
                                                        entity: "comm_report",
                                                        method: 'saveDataPersonCard',
                                                        dateFrom: INV.services.getDate(dateFrom.getValue()),
                                                        dateTo: INV.services.getDate(dateTo.getValue()),
                                                        repType: repType.getValue(),
                                                        area: area.getValue(),
                                                        settlement: settlement.getValue(),
                                                        settlementRaw: settlement.getRawValue(),
                                                        street: streetCtrl.getValue(),
                                                        streetRaw: streetCtrl.getRawValue(),
                                                        houseNum: houseNumCtrl.getValue(),
                                                        flatNum: flatNumCtrl.getValue()
                                                    };
                                                    break;
                                                case 'FORM31':
                                                    runParams = {
                                                        entity: "comm_report",
                                                        method: 'saveDataForm31',
                                                        dateFrom: INV.services.getDate(dateFrom.getValue()),
                                                        dateTo: INV.services.getDate(dateTo.getValue()),
                                                        repType: repType.getValue(),
                                                        area: area.getValue(),
                                                        settlement: settlement.getValue(),
                                                        areaRaw: area.getRawValue(),
                                                        settlementRaw: settlement.getRawValue(),
                                                        isSettlement:radioSettl.checked,
                                                        localRequisites: localRequisites.getValue(),
                                                        localRequisitesRaw: localRequisites.getRawValue()
                                                    };
                                                    break;
                                                default:
                                                    runParams = {
                                                        entity: "comm_report",
                                                        method: 'saveDataForms',
                                                        dateFrom: INV.services.getDate(dateFrom.getValue()),
                                                        dateTo: INV.services.getDate(dateTo.getValue()),
                                                        repType: repType.getValue(),
                                                        area: area.getValue(),
                                                        settlement: settlement.getValue(),
                                                        areaRaw: area.getRawValue(),
                                                        settlementRaw: settlement.getRawValue(),
                                                        isSettlement:radioSettl.checked,
                                                        localRequisites: localRequisites.getValue(),
                                                        localRequisitesRaw: localRequisites.getRawValue()
                                                    };
                                                    break;
                                            }

                                            $App.connection.run(runParams).then(function (res) {
                                                generateExcel(res);
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

                shortcutParams.fieldList = this.fieldLists.comm_report.search;
                break;
        }
        return resultShortcut;
    }
});
