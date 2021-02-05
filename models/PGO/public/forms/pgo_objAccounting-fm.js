const _ = require('lodash');
exports.formCode = {
    addPgoBookBtn: function (dcs, form) {
        dcs[0].insert(4, {
            tooltip: 'Погосподарська книга',
            iconCls: 'fa fa-file-excel-o',
            style: {
                color: '#008442',
                fontSize: '16px'
            },
            name: "book",
            itemId: "bookExcel",
            disabled: form.record.get('objState') == "OBJ_OUTPGO" || !ADM.AccessManager.checkAccess('PGO_04_01_02'),
            handler: function (ctx) {
                var win = Ext.create("Ext.window.Window", {
                    autoShow: true,
                    title: 'Формування погосподарської книги',
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
                            itemId: "years",
                            ubID: "years",
                            fieldLabel: "Період",
                            displayField: 'yearsPeriod',
                            width: 600,
                            allowBlank: false,
                            ubRequest: {
                                entity: 'pgo_yearsDic',
                                method: 'select',
                                fieldList: ['ID', 'yearFrom', 'yearTo', 'yearsPeriod']
                            }
                        }
                    ],
                    buttons: [
                        {
                            text: 'Очистити',
                            handler: function (btn) {
                                var me = btn.up().up(),
                                    years = me.query('ubcombobox[ubID="years"]')[0];
                                years.setValue(null);
                            }
                        },
                        {
                            text: 'Сформувати',
                            handler: function (btn) {
                                var me = btn.up().up(),
                                    years = me.query('ubcombobox[ubID="years"]')[0];
                                if (years.isValid()) {
                                    var yearFrom = years.getVal('yearFrom');
                                    var yearTo = years.getVal('yearTo');
                                    me.getEl().mask('Зачекайте, файл обробляється');
                                    $App.connection.get('rest/pgo_report/generatePGOBook?locality=' + form.getField('locationID').getValue() + '&pgoBook=' + form.getField('pgoBook').getValue() + '&yearFrom=' + yearFrom + '&yearTo=' + yearTo + '&isAllBook=0&accountingID=' + form.instanceID, {responseType: 'arraybuffer'})
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
                                }
                                else {
                                    $App.dialogError(`Заповніть всі параметри!`);
                                }
                            }
                        }
                    ]
                });
            }
        });
    },
    initUBComponent: function () {
        var me = this,
            tabMain = me.queryById('tabMain'),
            pgoObjNumCtrl = me.getField('pgoObjNum'),
            pgoBookPageCtrl = me.getField('pgoBookPage'),
            pgoBookCtrl = me.getField('pgoBook'),
            locationIDCtrl = me.getField('locationID'),
            streetIDCtrl = me.getField('streetID'),
            qButton = me.queryById('qButton'),
            pgoTypeVal = me.record.get('pgoType'),
            objStateVal = me.record.get('objState'),
            ownerInVillageCtrl = me.getField('ownerInVillage'),
            membersNumCtrl = me.getField('membersNum'),
            gridAttach = me.queryById('gridAttachments'),
            dcsAttach = gridAttach.getDockedItems("toolbar[dock=top]");



        me.isReadOnly = !ADM.AccessManager.checkAccess('PGO_04_01_02');
        me.isReadOnly && me.disableEdit();

        pgoBookPageCtrl.inputEl.dom.placeholder = 'Автозаповнення після збереження картки';

        let setFieldsVisibility = function (field, isVisible, allowBlank) {
                if (isVisible) {
                    me.getField(field).show();
                    if (allowBlank != undefined && !allowBlank) me.getField(field).setAllowBlank(false);
                    else if (allowBlank != undefined && allowBlank) me.getField(field).setAllowBlank(true);
                } else {
                    me.getField(field).hide();
                    me.getField(field).setValue(null);
                    me.getField(field).setAllowBlank(true);
                }
            },
            addYearsSumGrid = function () {
                let yearsGridPanel = me.queryById('yearsGrid'),
                    yearsGridStore = Ext.create('Ext.data.Store', {
                        fields: ['year', 'total'],
                        data: {'items': []},
                        proxy: {
                            type: 'memory',
                            reader: {
                                type: 'json',
                                root: 'items'
                            }
                        }
                    }),
                    yearsGrid = Ext.create('Ext.grid.Panel', {
                        store: yearsGridStore,
                        //padding: '10, 0, 60, 0',
                        title: 'Усього по рокам',
                        id: 'streetGreed',
                        columns: [
                            {
                                text: 'Рік',
                                // width: '350px',
                                flex: 1,
                                dataIndex: 'year'
                            },
                            {
                                text: 'Усього (Га)',
                                // width: '450px',
                                flex: 3,
                                dataIndex: 'total'
                            }
                        ],
                        selType: 'cellmodel',
                        dockedItems: [
                            {
                                xtype: 'toolbar',
                                dock: 'top',
                                height: 40,
                                style: 'background: #eaeaea',
                                ui: 'footer',
                                items: ['->', {
                                    xtype: 'button',
                                    text: 'Підрахувати',
                                    tooltip: 'Підрахунок усіх значень «Загальна площа, Га» з реєстру',
                                    // border: '',
                                    handler: function () {

                                        $App.connection.select({
                                            entity: "pgo_landPlot",
                                            fieldList: ['SUM([totalArea])', 'year'],
                                            whereList: {
                                                byObjAccountingID: {
                                                    expression: "[objAccountingID]",
                                                    condition: "=",
                                                    values: {objAccountingID: me.record.get('ID')}
                                                }
                                            },
                                            groupList: ['year']
                                        }).then(function (r) {
                                            let res = UB.LocalDataStore.selectResultToArrayOfObjects(r);
                                            yearsGridStore.removeAll();
                                            _.forEach(res, function (item) {
                                                yearsGridStore.add({
                                                    'year': item['year'],
                                                    'total': item['SUM([totalArea])']
                                                })
                                            });
                                            // form.queryById('totalGA').setValue(total);
                                        });
                                    },
                                    disabled: me.isReadOnly
                                }]
                            }
                        ]
                    });
                yearsGridPanel.add(yearsGrid);
            };

        function addAttachDocBtn() {
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
                disabled: me.isReadOnly,
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
                                            entity: "pgo_objAccounting",
                                            method: "getObjAttNewID"
                                        }).then(function (res) {
                                            let instanceID = res.attachID;
                                            $App.connection.post('setDocument', ffile, {
                                                params: {
                                                    entity: "pgo_objAttachment",
                                                    attribute: 'attachment',
                                                    ID: instanceID,
                                                    filename: ffile.name
                                                },
                                                headers: {"Content-Type": "application/octet-stream"}
                                            }).then(function (response) {
                                                var result = response.data.result;

                                                $App.connection.run({
                                                    entity: "pgo_objAttachment", method: "insert",
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
                                                        formCode: 'pgo_objAttachment',
                                                        entity: "pgo_objAttachment",
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
        }

        addAttachDocBtn();
        me.on('formDataReady', me.onFormDataReady, me);
        delete me.actionsKeyMap["fDelete"];
        this.actions["fDelete"].hide();


        var menu = Ext.create("Ext.menu.Menu");

        menu.add({
            text: "Виключити об’єкт з ПГО",
            iconCls: 'fa fa-toggle-off',
            name: "enableObjPgo",
            disabled: me.isReadOnly,
            handler: function (ctx) {
                objStateVal = me.record.get('objState');
                let dirty = me.isDirty();
                if (!dirty) {
                    if (objStateVal && objStateVal == "OBJ_INPGO") {
                        $App.dialogYesNo("Підтвердження", 'Ви дійсно бажаєте виключити об’єкт із ПГО? Редагування даних картки буде неможливо та об’єкт ПГО не буде враховуватись у жодних відомостях.').then(function (res) {
                            if (!res) {
                                return;
                            }

                            $App.connection.update({
                                entity: 'pgo_objAccounting', fieldList: ['ID', 'objState'],
                                execParams: {ID: me.instanceID, objState: 'OBJ_OUTPGO'}
                            }).then(function (result) {
                                    me.onRefresh();
                                    me.setFormReadOnly();
                                    me.queryById('bookExcel').setDisabled(true);
                                    me.queryById('toolbarUploadFile').setDisabled(true);
                                }
                            );
                        });
                    } else {
                        $App.dialogError('Ця дія доступна, якщо поточний стан картки «Включено об’єкт до ПГО».');
                        return;
                    }
                } else {
                    $App.dialogError("Спочатку необхідно заповнити всі обов'язкові поля!");
                    return;
                }

            }
        });
        menu.add({
            text: "Включити об’єкт до ПГО",
            iconCls: 'fa fa-toggle-on',
            name: "disableObjPgo",
            disabled: me.isReadOnly,
            handler: function (ctx) {
                objStateVal = me.record.get('objState');
                let dirty = me.isDirty();
                if (!dirty) {
                    if (objStateVal && objStateVal == "OBJ_OUTPGO") {
                        $App.dialogYesNo("Підтвердження", 'Ви дійсно бажаєте включити об’єкт до ПГО? Об’єкт ПГО буде враховуватись у відомостях.').then(function (res) {
                            if (!res) {
                                return;
                            }

                            $App.connection.update({
                                entity: 'pgo_objAccounting', fieldList: ['ID', 'objState'],
                                execParams: {ID: me.instanceID, objState: 'OBJ_INPGO'}
                            }).then(function (result) {
                                    me.onRefresh();
                                    me.setFormEditable();
                                    me.queryById('bookExcel').setDisabled(false);
                                    me.queryById('toolbarUploadFile').setDisabled(false);
                                }
                            );
                        });
                    }
                    else {
                        $App.dialogError('Ця дія доступна, якщо поточний стан картки «Виключено об’єкт з ПГО».');
                        return;
                    }
                } else {
                    $App.dialogError("Спочатку необхідно заповнити всі обов'язкові поля");
                    return;
                }

            }
        });
        let dcs = me.getDockedItems("toolbar[dock=top]");

        if (!me.isNewInstance) {
            var accountingID = me.instanceID;
            me.addPgoBookBtn(dcs, me);
            me.getField('pgoBook').setReadOnly(me.isReadOnly);
            if (!me.isReadOnly) {
                me.queryById('toolbarUploadFile').setDisabled(objStateVal == 'OBJ_OUTPGO');
                objStateVal == 'OBJ_OUTPGO' ? me.setFormReadOnly() : me.setFormEditable();
            }
            me.queryById('tabHousehold').setDisabled(false);
            me.queryById('tabLivingRoom').setDisabled(false);
            me.queryById('tabLand').setDisabled(false);
            if (pgoTypeVal != 'ADANDONED_OBJ') me.queryById('tabAgriculture').setDisabled(false);
            me.queryById('tabAgricultureMachine').setDisabled(false);
            me.queryById('tabCheckDate').setDisabled(false);
            me.queryById('tabDocus').setDisabled(false);

            if (!streetIDCtrl.store.ubRequest.whereList) streetIDCtrl.store.ubRequest.whereList = {};

            streetIDCtrl.store.ubRequest.whereList.byLocation = {
                expression: '[settlementDictID]',
                condition: 'equal',
                values: {settlementDictID: locationIDCtrl.findRecordByValue(locationIDCtrl.getValue()).get('ID')}
            };
            streetIDCtrl.store.reload();
        }
        else {
            qButton.setTooltip('Оберіть спочатку місцезнаходження');
            streetIDCtrl.setReadOnly(true);
        }

        dcs[0].insert(6, {
            itemId: "agreementsMenu",
            text: "Всі дії",
            menu: menu,
            disabled: me.isReadOnly
        });

        pgoTypeVal != 'HOUSEHOLD_STAY' ? setFieldsVisibility('pgoInFlatNum', false) : setFieldsVisibility('pgoInFlatNum', true, false);
        pgoTypeVal != 'HOUSEHOLD_STAY' ? setFieldsVisibility('retireDate', false) : setFieldsVisibility('retireDate', true, true);
        pgoTypeVal != 'HOUSEHOLD_STAY' ? setFieldsVisibility('arriveDate', false) : setFieldsVisibility('arriveDate', true, true);
        pgoTypeVal != 'HOUSEHOLD_STAY' ? setFieldsVisibility('headRegAddress', false) : setFieldsVisibility('headRegAddress', true, true);
        pgoTypeVal == 'HOUSEHOLD_STAY' ? setFieldsVisibility('ownerRegAddress', false) : pgoTypeVal != 'HOUSEHOLD_LIVE' ? setFieldsVisibility('ownerRegAddress', true, false) : setFieldsVisibility('ownerRegAddress', false);
        pgoTypeVal == 'LAND_OWN' ? ownerInVillageCtrl.show() : ownerInVillageCtrl.hide();
        pgoTypeVal == 'LAND_OWN' || pgoTypeVal == 'ADANDONED_OBJ' ? membersNumCtrl.setAllowBlank(true) : membersNumCtrl.setAllowBlank(false);

        me.getField('pgoType').notFirstOpened = undefined;
        locationIDCtrl.notFirstOpened = undefined;

        Ext.Date.monthNumbers = {
            'Січ': 0,
            'Лют': 1,
            'Бер': 2,
            'Кві': 3,
            'Тра': 4,
            'Чер': 5,
            'Лип': 6,
            'Сер': 7,
            'Вер': 8,
            'Жов': 9,
            'Лис': 10,
            'Гру': 11
        };

        addYearsSumGrid();

        gridAttach.store.on('load', function (a, b) {
            me.deleteDoc(gridAttach);
        });
    },
    onFormDataReady: function () {
        var me = this,
            objStateVal = me.record.get('objState'),
            pgoTypeVal = me.record.get('pgoType');
        if (pgoTypeVal == 'ADANDONED_OBJ') me.queryById('tabAgriculture').setDisabled(true);
        else if (me.isNewInstance) me.queryById('tabAgriculture').setDisabled(true);
        if (!me.isNewInstance && !me.isReadOnly) {
            objStateVal == 'OBJ_OUTPGO' ? me.setFormReadOnly() : me.setFormEditable();
        }
    },
    setFormReadOnly: function (form, isNotDis) {
        let me = form || this,
            formActions = me.actions;

        _.forOwn(formActions, function (action, i) {
            if (i != "refresh") {
                action.hide();
            }
        });

        if (!isNotDis)
            me.disableEdit();

        if (me.record.get("state") == "ARCHIVED") {
            me.query('button').forEach(function (button) {
                if (button.componentCls !== 'x-tab') {
                    if (button.menuId !== "StatementActions") {
                        button.disable();
                    }
                }
            });
        }

        me.query('ubdetailgrid').forEach(function (grid) {
            grid.setReadOnly(true);

            if (!grid._doOnEdit) grid._doOnEdit = grid.doOnEdit;
            grid.doOnEdit = function () {
                this._doOnEdit();
            };

            var actions = UB.view.EntityGridPanel.actionId;

            _.forEach(actions, function (action) {
                if (action != "refresh") {
                    grid.hideAction(action);
                }
            });
        });
    },
    setFormEditable: function () {
        let me = this,
            formActions = me.actions;
        me.enableEdit();


        _.forOwn(formActions, function (action, i) {
            if (i != "refresh" && i != "fDelete") {
                action.show();
            }
        });
        if (me.record.get("state") == "UPDATED") {
            _.forOwn(formActions, function (action, i) {
                if (i == "fDelete") {
                    action.hide();
                }
            });
        }


        me.query('ubdetailgrid').forEach(function (grid) {
            grid.setReadOnly(false);

            if (!grid._doOnEdit) grid._doOnEdit = grid.doOnEdit;
            grid.doOnEdit = function () {
                this._doOnEdit();
            };

            var actions = grid.toolbarActionList;
            _.forEach(actions, function (action) {
                if (action != "refresh") {
                    grid.showAction(action);
                }
            });
        });
    },
    onBeforeSave: function () {
        var me = this;
        let dcs = me.getDockedItems("toolbar[dock=top]");

        if (me && me.sender && me.sender.onRefresh) me.sender.onRefresh();
        return new Promise((resolve, reject) => {
            $App.connection.run({
                entity: "pgo_objAccounting",
                method: "checkDuplicateObjCode",
                execParams: {
                    ID: me.instanceID,
                    locationID: me.record.get('locationID'),
                    pgoObjNum: me.record.get('pgoObjNum')
                },
                __skipSelectAfterUpdate: true,
                __skipOptimisticLock: true
            }).then(function (r) {
                if (r.isDuplicate) {
                    resolve(false);
                    $App.dialogError(`Номер об’єкта ПГО має бути унікальним в межах населеного пункту!`);
                } else {
                    if (me.isNewInstance) me.addPgoBookBtn(dcs, me);
                    resolve(true);
                }
            });
        });
    },
    onAfterSave: function () {
        var me = this,
            pgoTypeVal = me.record.get('pgoType');
        me.getField('pgoBook').setReadOnly(false);

        if (!me.isNewInstance && me.queryById('tabHousehold').disabled == true) {
            me.queryById('tabHousehold').setDisabled(false);
            me.queryById('tabLivingRoom').setDisabled(false);
            me.queryById('tabLand').setDisabled(false);
            if (pgoTypeVal != 'ADANDONED_OBJ') me.queryById('tabAgriculture').setDisabled(false);
            me.queryById('tabAgricultureMachine').setDisabled(false);
            me.queryById('tabCheckDate').setDisabled(false);
            me.queryById('tabDocus').setDisabled(false);
        }
    },
    deleteDoc: function (grid) {
        let gridDelEl = grid.body.dom.getElementsByTagName('a'),
            delFunc = function (e) {
                let id = this.dataset.id;
                id && $App.connection.run({
                    entity: "pgo_objAttachment",
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
