exports.formCode = {
    initUBComponent: function () {
        var me = this,
            regionBCtrl = me.queryById('regionB'),
            settlementBCtrl = me.getField('settlementB'),
            settlementAddLCtrl = me.getField('settlementAddL'),
            streetAddLCtrl = me.getField('streetAddL'),
            gridAttach = me.queryById('gridAttachments'),
            dcsAttach = gridAttach.getDockedItems("toolbar[dock=top]"),
            gridRegInfoCurr = me.queryById('gridRegInfoCurr'),
            dcs = me.getDockedItems("toolbar[dock=top]"),
            dcsReg = gridRegInfoCurr.getDockedItems("toolbar[dock=top]"),
            menu1 = Ext.create("Ext.menu.Menu"),
            menu2 = Ext.create("Ext.menu.Menu"),
            menu3 = Ext.create("Ext.menu.Menu"),
            menu4 = Ext.create("Ext.menu.Menu"),
            menu5 = Ext.create("Ext.menu.Menu"),
            menu6 = Ext.create("Ext.menu.Menu");


        if (me.isNewInstance) me.record.set('countryB', 333658698055681);
        else {
            me.queryById('areaB').setValue(me.record.get('areaB'));
            me.queryById('regionB').setValue(me.record.get('regionB'));

            me.queryById('areaAddR').setValue(me.record.get('areaAddR'));
            me.queryById('regionAddR').setValue(me.record.get('regionAddR'));
            me.queryById('areaAddL').setValue(me.record.get('areaAddL'));
        }

        if (!me.record.get('areaB')) {
            INV.services.setWhereList(regionBCtrl, 'byAreaName', 'areaName', -1);
        }
        if (!me.record.get('regionB')) {
            INV.services.setWhereList(settlementBCtrl, 'byRegionName', 'pgoDictID.regionName', -1);
        }
        if (!me.record.get('areaAddL')) {
            INV.services.setWhereList(settlementAddLCtrl, 'byAreaName', 'pgoDictID.areaName', -1);
        }
        if (!me.record.get('streetTypeAddL')) {
            INV.services.setWhereList(streetAddLCtrl, 'byStreetType', 'streetType', -1);
        }

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
                                            entity: "inv_payers",
                                            method: "getObjAttNewID",
                                            execParams: {
                                                entityName: 'comm_commAttachment'
                                            }
                                        }).then(function (res) {
                                            let instanceID = res.attachID;
                                            $App.connection.post('setDocument', ffile, {
                                                params: {
                                                    entity: "comm_commAttachment",
                                                    attribute: 'attachment',
                                                    ID: instanceID,
                                                    filename: ffile.name
                                                },
                                                headers: {"Content-Type": "application/octet-stream"}
                                            }).then(function (response) {
                                                var result = response.data.result;

                                                $App.connection.run({
                                                    entity: "comm_commAttachment", method: "insert",
                                                    execParams: {
                                                        ID: instanceID,
                                                        payerID: form.instanceID,
                                                        attachment: JSON.stringify(result),
                                                        name: ffile.name,
                                                        type: ffile.type
                                                    }
                                                }).then(function () {
                                                    $App.doCommand({
                                                        cmdType: "showForm",
                                                        formCode: 'comm_commAttachment',
                                                        entity: "comm_commAttachment",
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

        function addCertifMenu() {
            menu1.add({
                text: "Про реєстрацію місця проживання особи",
                name: "personLPlace",
                handler: function (ctx) {
					$App.connection.get(`rest/inv_payers/getApplDoc?payerID=${me.instanceID}&personLPlace=${true}&code=personLPlace`, {responseType: 'arraybuffer'})
                        .catch(function (err) {
                            throw new UB.UBError(err.message || 'Відсутні дані у "Інформація про реєстрацію"');
                        }).then(function (response) {
							me.getEl().unmask();
							var blobData,
								byteArray = response.data;
							blobData = new Blob(
								[byteArray],
								{type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
							);

							saveAs(blobData, 'Довідка про реєстрацію місця проживання особи.docx');
						});
                    /*$App.connection.run({
                        entity: "inv_payers",
                        method: "getCertifData",
                        execParams: {
                            payerID: me.instanceID,
                            personLPlace: true
                        },
                        __skipSelectAfterUpdate: true,
                        __skipOptimisticLock: true
                    }).done(function (res) {
                        $App.doCommand({
                            cmdType: 'showReport',
                            cmdData: {
                                reportCode: 'personLPlace',
                                reportType: 'pdf',
                                reportParams: res.payerData
                            }
                        });
                    });*/
                }
            });
            menu1.add({
                text: "Про реєстрацію місця перебування особи",
                name: "personPosPlace",
                handler: function (ctx) {
					$App.connection.get(`rest/inv_payers/getApplDoc?payerID=${me.instanceID}&personPosPlace=${true}&code=personPosPlace`, {responseType: 'arraybuffer'})
						.then(function (response) {
							me.getEl().unmask();
							var blobData,
								byteArray = response.data;
							blobData = new Blob(
								[byteArray],
								{type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
							);

							saveAs(blobData, 'Довідка про реєстрацію місця перебування особи.docx');
						});
                    /*$App.connection.run({
                        entity: "inv_payers",
                        method: "getCertifData",
                        execParams: {
                            payerID: me.instanceID,
                            personPosPlace: true
                        },
                        __skipSelectAfterUpdate: true,
                        __skipOptimisticLock: true
                    }).done(function (res) {
                        $App.doCommand({
                            cmdType: 'showReport',
                            cmdData: {
                                reportCode: 'personPosPlace',
                                reportType: 'pdf',
                                reportParams: res.payerData
                            }
                        });
                    });*/
                }
            });
            dcs[0].insert(5, {
                itemId: "certifMenu",
                disabled: !ADM.AccessManager.checkAccess('RTG_05_01_03'),
                text: "Довідки",
                menu: menu1
            });
        }

        addCertifMenu();

        function showReportByCode(code) {
            $App.connection.run({
                entity: "inv_payers",
                method: "getApplData",
                execParams: {
                    payerID: me.instanceID,
                    code: code
                }
            }).then(function (r) {

                $App.doCommand({
                    cmdType: 'showReport',
                    cmdData: {
                        reportCode: code,
                        reportType: 'pdf',
                        reportParams: r.payerData
                    }
                });
            });
        }

        function showDocxByCode(code) {
            let fileName = '';
            switch (code) {
                case 'applBabyReg':
                    fileName = 'Реєстрація_проживання_малолітньої_дитини.docx';
                    break;
                case 'applRegLPlace':
                    fileName = 'Про_реєстрацію місця проживання.docx';
                    break;
                case 'applRemoveLReg':
                    fileName = 'Зняття_з_реєстрації_місця_проживання.docx';
                    break;
				case 'applBaby':
					fileName = 'Дані про новонароджену дитину.docx';
				    break;
				case 'applRegPos':
					fileName = 'Заява про реєстрацію місця перебування.docx';
					break;
            }

            $App.connection.get(`rest/inv_payers/getApplDoc?payerID=${me.instanceID}&code=${code}`, {responseType: 'arraybuffer'})
                .then(function (response) {
                    me.getEl().unmask();
                    var blobData,
                        byteArray = response.data;
                    blobData = new Blob(
                        [byteArray],
                        {type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
                    );

                    saveAs(blobData, fileName);
                })
        }

        function addApplMenu() {
            menu2.add({
                text: "Дані про новонароджену дитину",
                name: "applBaby",
                handler: function (ctx) {
					showDocxByCode('applBaby');
                }
            });
            menu2.add({
                text: "Заява про реєстрацію місця перебування",
                name: "applRegPos",
                handler: function (ctx) {
					showDocxByCode('applRegPos');
                }
            });
            menu2.add({
                text: "Заява про реєстрацію місця проживання малолітньої дитини",
                name: "applBabyReg",
                handler: function (ctx) {
                    //showReportByCode('applBabyReg');
                    showDocxByCode('applBabyReg')
                }
            });
            menu2.add({
                text: "Заява про реєстрацію місця проживання",
                name: "applRegLPlace",
                handler: function (ctx) {
                    //showReportByCode('applRegLPlace');
                    showDocxByCode('applRegLPlace')
                }
            });

            menu2.add({
                text: "Заява про зняття з реєстрації місця проживання",
                name: "applRemoveLReg",
                handler: function (ctx) {
                    //showReportByCode('applRemoveLReg');
                    showDocxByCode('applRemoveLReg')
                }
            });

            dcs[0].insert(5, {
                itemId: "applMenu",
                text: "Заяви",
                disabled: !ADM.AccessManager.checkAccess('RTG_05_01_03'),
                menu: menu2
            });
        }

        addApplMenu();

        function addCurrRegApplMenu() {
            menu3.add({
                text: "Про зняття з реєстрації місця проживання",
                name: "personRemoveLPLace",
                handler: function (ctx) {
                    var selection = gridRegInfoCurr.getView().getSelectionModel().getSelection()[0];
                    if (!selection) {
                        $App.dialogInfo('Оберіть спочатку запис!');
                    }
                    /*else if (selection.get('state') != 'DISMISSED') {
                        $App.dialogInfo('Дія можлива для запису у стані "Знято з реєстрації"!');
                    }*/
                    else {
						$App.connection.get(`rest/inv_payers/getApplDoc?payerID=${me.instanceID}&code=personRemoveLPLace&regCurrID=${selection.get('ID')}&personRemoveLPLace=${true}`, {responseType: 'arraybuffer'})
							.then(function (response) {
								me.getEl().unmask();
								var blobData,
									byteArray = response.data;
								blobData = new Blob(
									[byteArray],
									{type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
								);

								saveAs(blobData, 'Довідка про зняття з реєстрації місця проживання.docx');
							});
                        /*$App.connection.run({
                            entity: "inv_payers",
                            method: "getCertifData",
                            execParams: {
                                payerID: me.instanceID,
                                regCurrID: selection.get('ID'),
                                personRemoveLPLace: true
                            },
                            __skipSelectAfterUpdate: true,
                            __skipOptimisticLock: true
                        }).done(function (res) {
                            $App.doCommand({
                                cmdType: 'showReport',
                                cmdData: {
                                    reportCode: 'personRemoveLPlace',
                                    reportType: 'pdf',
                                    reportParams: res.payerData
                                }
                            });
                        });*/
                    }
                }
            });

            menu3.add({
                text: "Картка реєстрації особи",
                name: "personCard",
                handler: function (ctx) {
                    var selection = gridRegInfoCurr.getView().getSelectionModel().getSelection()[0];
                    if (!selection) {
                        $App.dialogInfo('Оберіть спочатку запис!');
                    }
                    else if (selection.get('state') != 'REGISTERED') {
                        $App.dialogInfo('Дія можлива для запису у стані "Зареєстровано"!');
                    }
                    else {
                        try {
                            $App.connection.get('rest/inv_payers/getExcelPersonData?payerID=' + me.instanceID, {responseType: 'arraybuffer'})
                                .then(function (response) {
                                    me.getEl().unmask();
                                    var blobData,
                                        byteArray = response.data;
                                    blobData = new Blob(
                                        [byteArray],
                                        {type: 'application/vnd.ms-excel'}
                                    );
                                    let fileName = 'картка_реєстрації_особи';
                                    saveAs(blobData, fileName + ".xlsx");
                                }).error(function (e) {
                            });
                        }
                        catch (e) {
                            me.getEl().unmask();
                        }
                    }
                }
            });

            menu4.add({
                text: "Про зняття з реєстрації місця проживання особи",
                name: "noticeRemoveLPLace",
                handler: function (ctx) {
                    var selection = gridRegInfoCurr.getView().getSelectionModel().getSelection()[0];
                    if (!selection) {
                        $App.dialogInfo('Оберіть спочатку запис!');
                    }
                    /*else if (selection.get('state') != 'DISMISSED') {
                        $App.dialogInfo('Дія можлива для запису у стані "Знято з реєстрації"!');
                    }*/
                    else {
						$App.connection.get(`rest/inv_payers/getApplDoc?payerID=${me.instanceID}&regCurrID=${selection.get('ID')}&personRemoveLPLace=${true}&code=noticeRemoveLPLace`, {responseType: 'arraybuffer'})
							.then(function (response) {
								me.getEl().unmask();
								var blobData,
									byteArray = response.data;
								blobData = new Blob(
									[byteArray],
									{type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
								);

								saveAs(blobData, 'Повідомлення про зняття з реєстрації місця проживання особи.docx');
							});
                        /*$App.connection.run({
                            entity: "inv_payers",
                            method: "getCertifData",
                            execParams: {
                                payerID: me.instanceID,
                                regCurrID: selection.get('ID')
                            },
                            __skipSelectAfterUpdate: true,
                            __skipOptimisticLock: true
                        }).done(function (res) {
                            $App.doCommand({
                                cmdType: 'showReport',
                                cmdData: {
                                    reportCode: 'noticeRemoveLPlace',
                                    reportType: 'pdf',
                                    reportParams: res.payerData
                                }
                            });
                        });*/
                    }
                }
            });

            menu4.add({
                text: "Про скасування реєстрації/зняття з реєстрації місця проживання/перебування особи",
                name: "noticeCancelLPLace",
                handler: function (ctx) {
                    var selection = gridRegInfoCurr.getView().getSelectionModel().getSelection()[0];
                    if (!selection) {
                        $App.dialogInfo('Оберіть спочатку запис!');
                    }
                    else if (selection.get('state') == 'CANCELEDREG' || selection.get('state') == 'CANCELEDDREG') {
						$App.connection.get(`rest/inv_payers/getApplDoc?payerID=${me.instanceID}&regCurrID=${selection.get('ID')}&personRemoveLPLace=${true}&code=noticeCancelLPLace`, {responseType: 'arraybuffer'})
							.then(function (response) {
								me.getEl().unmask();
								var blobData,
									byteArray = response.data;
								blobData = new Blob(
									[byteArray],
									{type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
								);

								saveAs(blobData, 'Повідомлення про скасування реєстрації/зняття з реєстрації місця проживання/перебування особи.docx');
							});
                        /*$App.connection.run({
                            entity: "inv_payers",
                            method: "getCertifData",
                            execParams: {
                                payerID: me.instanceID,
                                regCurrID: selection.get('ID'),
                                state: selection.get('state'),
                                noticeCancelLPLace: true
                            },
                            __skipSelectAfterUpdate: true,
                            __skipOptimisticLock: true
                        }).done(function (res) {
                            $App.doCommand({
                                cmdType: 'showReport',
                                cmdData: {
                                    reportCode: 'noticeCancelLPlace',
                                    reportType: 'pdf',
                                    reportParams: res.payerData
                                }
                            });
                        });*/
                    }
                    else {
                        $App.dialogInfo('Дія можлива для запису у стані "Скасовано реєстрацію" або "Скасовано зняття з реєстрації"!');

                    }
                }
            });

            menu6.add({
                itemId: "regApplMenuNotice",
                disabled: !ADM.AccessManager.checkAccess('RTG_05_01_03'),
                text: "Повідомлення",
                menu: menu4
            });
            menu6.add({
                itemId: "regApplMenu",
                text: "Довідки",
                disabled: !ADM.AccessManager.checkAccess('RTG_05_01_03'),
                menu: menu3
            });

        }

        addCurrRegApplMenu();

        function addTicketMenu() {
            menu5.add({
                text: "Реєстрації місця проживання",
                name: "ticketReg",
                handler: function (ctx) {
                    var selection = gridRegInfoCurr.getView().getSelectionModel().getSelection()[0];
                    if (!selection) {
                        $App.dialogInfo('Оберіть спочатку запис!');
                    }
                    else if (selection.get('state') === 'REGISTERED') {
                        $App.connection.get(`rest/inv_payers/generateTicketXlsx?ID=${selection.get('ID')}&code=ticketReg`, {responseType: 'arraybuffer'})
                            .then(function (response) {

                                me.getEl().unmask();
                                var blobData,
                                    byteArray = response.data;
                                blobData = new Blob(
                                    [byteArray],
                                    {type: 'application/vnd.ms-excel'}
                                );
                                saveAs(blobData, 'ticket_registration.xlsx');
                            })
                    }
                    else {
                        $App.dialogInfo('Дія можлива для запису у стані "Зареєстровано"!');
                    }

                }
            });
            menu5.add({
                text: "Зняття з реєстрації місця проживання",
                name: "ticketUnReg",
                handler: function (ctx) {
                    var selection = gridRegInfoCurr.getView().getSelectionModel().getSelection()[0];
                    if (!selection) {
                        $App.dialogInfo('Оберіть спочатку запис!');
                    }
                    else /*if (selection.get('state') === 'DISMISSED')*/ {
                        $App.connection.get(`rest/inv_payers/generateTicketXlsx?ID=${selection.get('ID')}&code=ticketUnReg`, {responseType: 'arraybuffer'})
                            .then(function (response) {
                                me.getEl().unmask();
                                var blobData,
                                    byteArray = response.data;
                                blobData = new Blob(
                                    [byteArray],
                                    {type: 'application/vnd.ms-excel'}
                                );

                                saveAs(blobData, 'ticket_cancellation.xlsx');
                            })
                    }
                    /*else {
                        $App.dialogInfo('Дія можлива для запису у стані "Знято з реєстрації"!');
                    }*/
                }
            });

            menu6.add({
                itemId: "ticketMenu",
                disabled: !ADM.AccessManager.checkAccess('RTG_05_01_03'),
                text: "Талони",
                menu: menu5
            });
        }

        addTicketMenu();
        dcsReg[0].insert(4, {
            itemId: "regDocMenu",
            disabled: !ADM.AccessManager.checkAccess('RTG_05_01_03'),
            text: "Документи",
            menu: menu6
        });
        me.on("formDataReady", me.onFormDataReady);
       /* me.on("refresh", function () {
            INV.services.unsetRegUnitByUser(me.queryById('birthCertifIssuedBy'));
            INV.services.unsetRegUnitByUser(me.queryById('deathCertifIssuedBy'));
            INV.services.unsetRegUnitByUser(me.queryById('passportIssuedBy'));
            me.setWhere = false;
        });*/
    },
    onFormDataReady: function () {
        let me = this;
        /*if (!me.setWhere) {
            INV.services.setRegUnitByUser(me.queryById('birthCertifIssuedBy'));
            INV.services.setRegUnitByUser(me.queryById('deathCertifIssuedBy'));
            INV.services.setRegUnitByUser(me.queryById('passportIssuedBy'));
            me.setWhere = true;
        }*/
    },
    onBeforeSave: function () {
        var me = this;
        /*INV.services.unsetRegUnitByUser(me.queryById('birthCertifIssuedBy'));
        INV.services.unsetRegUnitByUser(me.queryById('deathCertifIssuedBy'));
        INV.services.unsetRegUnitByUser(me.queryById('passportIssuedBy'));
        me.setWhere = false;*/
        if (me && me.sender && me.sender.onRefresh) me.sender.onRefresh();

    },
    onAfterSave: function () {
        var me = this;
        if (me.payerIDCtrl) me.payerIDCtrl.store.reload();
    }
};
