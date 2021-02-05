const _ = require('lodash');
require('models/UTL/shortcuts/factory.js');
require('./INV_fieldLists.js');
require('./INV_orderLists.js');
_.extend(UTL.shortcuts.factory, {
	inv_landDict: function (code) {

		var splitCode = code.split('.'),
			group = splitCode[0],
			resultShortcut,
			shortcutParams;
		resultShortcut = {
			cmdType: "showList",
			cmdData: {
				params: [
					{
						entity: "inv_landDict",
						method: "select"
					}
				]
			},
			description: "Довідник показників НГО",
			cmpInitConfig: {
				/*onDeterminateForm: function () {
					return true;
				},
				onItemContextMenu: function () {
				},
				onItemDblClick: function () {
					return true;
				}*/
			}
		};

		shortcutParams = resultShortcut.cmdData.params[0];
		switch (group) {
			case "search":

				resultShortcut.cmpInitConfig.toolbarActionList = ["addNew", "del", 'refresh'];
				resultShortcut.cmpInitConfig.hideActions = ["showPreview", "showDetail", "audit", "edit", "addNewByCurrent", "itemLink"];

				shortcutParams.fieldList = this.fieldLists.inv_landDict.search;
				/*shortcutParams.whereList = {
				 byID: {expression: "[ID]", condition: '!=', values: {"ID": 10}},
				 byState: {expression: "[state]", condition: '=', values: {"state": "ACTIVE"}}
				 };//exclude built-in admin from grid*/
				break;
		}
		return resultShortcut;
	},
	inv_subject: function (code) {
		var splitCode = code.split('.'),
			group = splitCode[0],
			resultShortcut,
			shortcutParams;
		resultShortcut = {
			cmdType: "showList",
			cmdData: {
				params: [
					{
						entity: "inv_subject",
						method: "select"
					}
				]
			},
			description: "Об’єкти обліку", //Взаємодія з ДЗК
			cmpInitConfig: {
				onDeterminateForm: function () {
					var me = this,
						record = me.store.getById(me.selectedRecordID),
						objType = record.get('oType'),
						formCode = objType ? (objType == 'realtyObject' ? 'inv_realtyObject' : 'inv_landPlot') : undefined;

					return {
						formCode: formCode,
						entityName: formCode,
						cmdData: {
							formCode: formCode,
							sender: me
						}
					}
				},
				onAddNew: function () {
					var me = this;
					Ext.MessageBox.show({
						title: 'Тип об’єкта',
						msg: 'Оберіть тип об’єкта:',
						fn: function (clickedBtnText) {
							if (clickedBtnText === "yes") {
								$App.doCommand({
									cmdType: "showForm",
									formCode: "inv_landPlot",
									entityName: "inv_landPlot",
									entity: "inv_landPlot",
									target: $App.viewport.centralPanel,
									tabId: "object" + Ext.id(),
									sender: me
								});

							} else if (clickedBtnText === "no") {
								$App.doCommand({
									cmdType: "showForm",
									formCode: "inv_realtyObject",
									entityName: "inv_realtyObject",
									entity: "inv_realtyObject",
									target: $App.viewport.centralPanel,
									tabId: "object" + Ext.id(),
									sender: me
								});
							} else {
								return;
							}
						},
						buttons: Ext.MessageBox.YESNO,
						buttonText: {yes: 'Земельна ділянка', no: 'Об’єкт нерухомості'},
						icon: Ext.MessageBox.INFO
					});

				},
				onItemContextMenu: function () {
				},
				onDel: function () {
					var me = this,
						selection = me.getSelectionModel().getSelection()[0];

					if (selection) {

						var objID = selection.get('ID'),
							objType = selection.get('oType'),
							formCode = objType ? (objType == 'realtyObject' ? 'inv_realtyObject' : 'inv_landPlot') : undefined;


						$App.dialogYesNo("Підтвердження видалення", 'Ви дійсно хочете видалити цей запис?').then(function (res) {

							if (!res) {
								return;
							}


							$App.connection.run({
								entity: formCode,
								method: "delete",
								__skipSelectAfterUpdate: true,
								__skipOptimisticLock: true,
								execParams: {
									ID: objID
								}
							}).then(function () {

								me.onRefresh();
							}, function (error) {
								$App.dialogInfo(error.message);
							});
						});


					}
					else {
						$App.dialogInfo(UB.i18n('Не обрано запис!'));
					}
				},
				addBaseDockedItems: function () {
					var me = this,
						gridAgreements = this;
					me.__proto__.addBaseDockedItems.apply(this, arguments);

					var excelBtn = Ext.create('Ext.Button', {
						text: 'Імпортувати з excel',
						tooltip: 'Імпортувати дані з обраного файлу excel',
						handler: function () {
							var me = this.up().up(),
								fileFld;

							var win = Ext.create("Ext.window.Window", {
								autoShow: true,
								title: UB.i18n("fayl"),
								border: 0,
								layout: "fit",
								modal: true,
								stateful: true,
								stateId: UB.core.UBLocalStorageManager.getKeyUI("UploadFileWindowP_window"),
								items: [
									{
										frame: true,
										items: [
											fileFld = Ext.create("Ext.form.field.File", {
												name: "document",
												allowBlank: false,
												width: 370,
												blankText: UB.i18n("obazatelnoePole"),
												fieldLabel: UB.i18n("vyberiteFayl"),
												anchor: "100%",
												buttonText: "",
												buttonConfig: {iconCls: "iconAttach"},
												regex: /^.*\.(xlsx?)$/i,
												regexText: "Дозволяється завантажувати файли лише у форматах .xlsx та .xls",
												listeners: {
													change: function () {
														if (!fileFld.isValid()) {
															Ext.MessageBox.alert({
																title: "Помилка",
																msg: fileFld.regexText,
																buttons: Ext.Msg.OK,
																buttonText: {ok: "Повернутися"},
																icon: Ext.Msg.ERROR
															});
														}
													},
													scope: this
												}
											})
										]
									}
								],
								buttons: [
									{
										text: UB.i18n("dobavit"),
										scope: this,
										handler: function (btn) {
											me.getEl().mask('Зачекайте, файл обробляється');

											var inputDom, ffile;
											inputDom = fileFld.fileInputEl.dom;
											if (inputDom.files.length === 0) {
												return;
											}
											ffile = inputDom.files[0];
											var fileName = ffile.name;
											try {
												$App.connection.run({
													entity: "adm_Import",
													method: "getID"
												}).then(function (result) {
													var importID = result.resultData;

													var params = {
														entity: "adm_Import",
														attribute: "Document",
														origName: fileName,
														filename: fileName,
														id: importID
													};
													$App.connection.post("setDocument", ffile, {
														params: params,
														headers: {"Content-Type": "application/octet-stream"}
													}).then(function (response) {
														var Document = JSON.stringify(response.data.result);

														$App.connection.run({
															entity: "adm_Import",
															method: "addImportData",
															importID: importID,
															fileName: fileName,
															Document: Document
														}).then(function (msgs) {
															me.getEl().unmask();
															win.close();
															let resData = JSON.parse(msgs.resultData);
															if (resData.error) $App.dialogInfo(resData.msg);
															else {
																me.onRefresh();
																let landGridStore = Ext.create('Ext.data.Store', {
																		fields: ['koattuRaw', 'code', 'landCategoryRaw', 'locationRaw', 'totalArea', 'documentOwnership', 'registryDataRaw'],
																		data: {'items': resData.landAllData},
																		proxy: {
																			type: 'memory',
																			reader: {
																				type: 'json',
																				root: 'items'
																			}
																		}
																	}),
																	landGrid = Ext.create('Ext.grid.Panel', {
																		store: landGridStore,
																		columns: [
																			{
																				xtype: 'rownumberer',
																				text: '№',
																				width: '1px',
																				align: 'center'
																			},
																			{
																				text: 'Код',
																				width: '130px',
																				dataIndex: 'code'
																			},
																			{
																				text: 'Код КОАТТУ',
																				width: '130px',
																				dataIndex: 'koattuRaw'
																			},
																			{
																				text: 'Категорія земель',
																				width: '105px',
																				dataIndex: 'landCategoryRaw'
																			},
																			{
																				text: 'Розташування',
																				width: '145px',
																				dataIndex: 'locationRaw'
																			},
																			{
																				text: 'Загальна площа',
																				width: '130px',
																				dataIndex: 'totalArea'
																			},
																			{
																				text: 'Документ права власності',
																				width: '185px',
																				dataIndex: 'documentOwnership'
																			},
																			{
																				text: 'Дата держреєстрації',
																				width: '90px',
																				dataIndex: 'registryDataRaw'
																			}
																		]
																	}),
																	realtyGridStore = Ext.create('Ext.data.Store', {
																		fields: ['koattuRaw', 'code', 'realtyTypeRaw', 'locationRaw', 'totalArea', 'documentOwnership', 'address', 'registryDataRaw'],
																		data: {'items': resData.realtyAllData},
																		proxy: {
																			type: 'memory',
																			reader: {
																				type: 'json',
																				root: 'items'
																			}
																		}
																	}),
																	realtyGrid = Ext.create('Ext.grid.Panel', {
																		store: realtyGridStore,
																		columns: [
																			{
																				xtype: 'rownumberer',
																				text: '№',
																				width: '1px',
																				align: 'center'
																			},
																			{
																				text: 'Код',
																				width: '130px',
																				dataIndex: 'code'
																			},
																			{
																				text: 'Код КОАТТУ',
																				width: '130px',
																				dataIndex: 'koattuRaw'
																			},
																			{
																				text: "Тип об'єкта нерухомості",
																				width: '105px',
																				dataIndex: 'realtyTypeRaw'
																			},
																			{
																				text: 'Розташування',
																				width: '145px',
																				dataIndex: 'locationRaw'
																			},
																			{
																				text: 'Загальна площа',
																				width: '130px',
																				dataIndex: 'totalArea'
																			},
																			{
																				text: 'Адреса об’єкта',
																				width: '185px',
																				dataIndex: 'address'
																			},
																			{
																				text: 'Документ права власності',
																				width: '185px',
																				dataIndex: 'documentOwnership'
																			},
																			{
																				text: 'Дата держреєстрації',
																				width: '90px',
																				dataIndex: 'registryDataRaw'
																			}
																		]
																	});
																Ext.create("Ext.window.Window", {
																	autoShow: true,
																	title: 'Дані, що були імпортовані',
																	width: 1220,
																	maxHeight: 720,
																	autoScroll: true,
																	border: 0,
																	layout: "fit",
																	modal: true,
																	items: [{
																		xtype: 'tabpanel',
																		items: [
																			{
																				title: 'Земельні ділянки',
																				layout: {
																					type: 'vbox',
																					align: "stretch",
																					flex: 1
																				},
																				defaults: {
																					layout: {
																						type: 'vbox',
																						align: 'stretch'
																					}
																				},
																				autoScroll: true,
																				items: [landGrid]
																			},
																			{
																				title: "Об'єкти нерухомості",
																				layout: {
																					type: 'vbox',
																					align: "stretch",
																					flex: 1
																				},
																				defaults: {
																					layout: {
																						type: 'vbox',
																						align: 'stretch'
																					}
																				},
																				autoScroll: true,
																				items: [realtyGrid]
																			}
																		]
																	}]
																});
															}
														});
													})
												}).error(function (e) {
												});
											}
											catch (e) {
												me.getEl().unmask();
												win.close();
											}

										}
									}
								]
							});
						},
						disabled: !ADM.AccessManager.checkAccess('INV_01_01_02'),
					});
					me.dockedItems[0].items.splice(me.dockedItems[0].items.length - 1, 0, excelBtn);

					me.dockedItems[0].items.splice(3, 0, {
						xtype: 'button',
						margin: "0, 0, 0, 2",
						iconCls: 'fa fa-files-o',
						style: {
							color: '#ff9668',
							fontSize: '18px'
						},
						width: 34,
						height: 32,
						name: 'copyBtn',
						itemId: 'copyBtn',
						tooltip: 'Розрахунок податку',
						disabled: !ADM.AccessManager.checkAccess('INV_01_01_02'),
						handler: function () {
							var win = Ext.create("Ext.window.Window", {
								autoShow: true,
								title: 'Оберіть дату',
								border: 0,
								layout: {
									type: "vbox",
									align: "stretch"
								},
								modal: true,
								height: 185,
								width: 270,
								items: [
									{
										xtype: 'datefield',
										itemId: "year",
										fieldLabel: "Дата розрахунку",
										allowBlank: false,
										margin: '10 20 5 20',
										listeners: {
											afterrender: function (fld) {
												fld.setValue(new Date());
											}
										}
									},
									{
										xtype: 'radiogroup',
										layout: {
											type: "vbox",
											align: "stretch"
										},
										itemId: 'subjectType',
										items: [
											{
												boxLabel: 'Земельна ділянка',
												name: 'subject',
												inputValue: 1,
												checked: true,
												margin: '0 0 0 0'
											},
											{
												boxLabel: 'Об’єкт нерухомості',
												name: 'subject',
												inputValue: 0,
												margin: '0 0 0 0'
											}
										]
									}
								],
								buttons: [
									{
										text: 'Обрати',
										handler: async function (btn) {
											const form = btn.up('window')
											var yearVal = form.queryById('year').getValue();
											const subjType = form.queryById('subjectType').getValue().subject

											if (this.up('window').items.items[0].isValid()) {
												const checkDate = parseInt(new Date(yearVal).getFullYear())
												const subjName = subjType ? 'Земельна ділянка' : 'Об’єкт нерухомості'

												const res = await UB.Repository(subjType ? 'inv_calcParams' : 'inv_calcRealtyParams').attrs('ID').where('year', '=', checkDate).selectScalar()
												if (!res) $App.dialogError(`За обраний рік відсутні записи у довіднику "Параметри розрахунку ${subjType ? 'земельного податку' : 'податку на нерухоме майно'}".`);
												else {
													const res2 = await $App.dialogYesNo("Підтвердження", `Ви дійсно бажаєте виконати "Розрахунок податку"? Операцію буде виконано для кожного об'єкту оподаткування 
                                                ${subjName}, у яких наявний "Дійсний платник та заповнено "${subjType ? 'Вид цільового призначення' : 'Класифікація будівель та споруд'}".`)
													if (!res2) {
														return;
													}
													me.getEl().mask('Зачекайте, операція виконується');
													try {
														$App.connection.run({
															entity: "inv_taxes",
															method: "insertNewTaxByYear",
															execParams: {
																year: new Date(yearVal).getFullYear(),
																subjType: subjType
															}
														}).catch(function (err) {
															me.getEl().unmask();
															throw new UB.UBError(err.message);
														}).then(function (res) {
															me.getEl().unmask();
														});
													} catch (e) {
														me.getEl().unmask();
													}
												}

												win.close();


												/*												Promise.all([
                                                  UB.Repository('inv_calcParams').attrs('ID').where('year', '=', checkDate).selectScalar(),
                                                  UB.Repository('inv_calcRealtyParams').attrs('ID').where('year', '=', checkDate).selectScalar()
                                                ]).then((res) => {
                                                  if (!res[0] || !res[1]) {
                                                    if (!res[0] && !res[1]) {
                                                      $App.dialogError('За обраний рік відсутні записи у довіднику "Параметри розрахунку земельного податку" та "Параметри розрахунку податку на нерухоме майно".')
                                                    }
                                                    else {
                                                      if (!res[0]) $App.dialogError('За обраний рік відсутні записи у довіднику "Параметри розрахунку земельного податку".');
                                                      if (!res[1]) $App.dialogError('За обраний рік відсутні записи у довіднику "Параметри розрахунку податку на нерухоме майно".');
                                                    }
                                                  }
                                                  else {
                                                    $App.dialogYesNo("Підтвердження", `Ви дійсно бажаєте виконати "Розрахунок податку"? Операцію буде виконано для кожного об'єкту оподаткування
                                                                        (Земельна ділянка/Об’єкт нерухомості), у яких наявний "Дійсний платник та заповнено "Вид цільового призначення/Класифікація будівель та споруд" відповідно.`).then(function (res) {
                                                      if (!res) {
                                                        return;
                                                      }
                                                      me.getEl().mask('Зачекайте, операція виконується');
                                                      try {
                                                        $App.connection.run({
                                                          entity: "inv_taxes",
                                                          method: "insertNewTaxByYear",
                                                          execParams: {
                                                            year: new Date(yearVal).getFullYear()
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
                                                  }
                                                });*/

											} else {
												$App.dialogError(`Дату вказано не вірно!`);
											}

										}
									}
								]
							});
						}
					});
					me.dockedItems[0].items.splice(4, 1);
				}
			}

		};
		shortcutParams = resultShortcut.cmdData.params[0];
		switch (group) {
			case "search":

				resultShortcut.cmpInitConfig.toolbarActionList = ['addNew', 'del', 'refresh'];
				resultShortcut.cmpInitConfig.hideActions = ["showPreview", "showDetail", "audit", "edit", "addNewByCurrent", "itemLink"];

				shortcutParams.fieldList = this.fieldLists.inv_subject.search;
				break;
		}
		return resultShortcut;
	},
	inv_payers: function (code) {
		var splitCode = code.split('.'),
			group = splitCode[0],
			resultShortcut,
			shortcutParams;
		resultShortcut = {
			cmdType: "showList",
			cmdData: {
				params: [
					{
						entity: "inv_payers",
						method: "select"
					}
				]
			},
			description: "Платники",
			cmpInitConfig: {
				onDeterminateForm: function () {
					var me = this,
						record = me.store.getById(me.selectedRecordID),
						personType = record ? record.get('personType') : undefined;
					return {
						formCode: "inv_payers-" + (personType === 'PHYSICAL' && 'phys' || 'leg'),
						entityName: "inv_payers",
						cmdData: {
							personType: personType,
							sender: me
						}
					}
				},
				onAddNew: function () {
					var me = this;
					Ext.MessageBox.show({
						title: 'Тип особи',
						msg: 'Оберіть тип особи:',
						fn: function (clickedBtnText) {
							if (clickedBtnText) {
								$App.doCommand({
									cmdType: "showForm",
									formCode: "inv_payers-" + (clickedBtnText === "yes" && 'phys' || 'leg'),
									entityName: "inv_payers",
									entity: "inv_payers",
									target: $App.viewport.centralPanel,
									tabId: "payer" + Ext.id(),
									sender: me
								});

							}
							else {
								return;
							}
						},
						buttons: Ext.MessageBox.YESNO,
						buttonText: {yes: 'Фізична', no: 'Юридична'},
						icon: Ext.MessageBox.INFO
					});

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

				shortcutParams.fieldList = this.fieldLists.inv_payers.search;
				break;
		}
		return resultShortcut;

	},
	inv_exemptionPhysDict: function (code) {
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

				shortcutParams.fieldList = this.fieldLists.inv_exemptionPhysDict.search;
				break;
		}
		return resultShortcut;

	},
	inv_exemptionLegDict: function (code) {
		var splitCode = code.split('.'),
			group = splitCode[0],
			resultShortcut,
			shortcutParams;
		resultShortcut = {
			cmdType: "showList",
			cmdData: {
				params: [
					{
						entity: "inv_exemptionLegDict",
						method: "select"
					}
				]
			},
			description: "Довідник пільгових категорій юр. осіб",
			cmpInitConfig: {
				onDeterminateForm: function () {
					return {
						formCode: "inv_exemptionLegDict",
						entityName: "inv_exemptionLegDict",
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

				shortcutParams.fieldList = this.fieldLists.inv_exemptionLegDict.search;
				break;
		}
		return resultShortcut;

	},
	inv_calcParams: function (code) {
		var splitCode = code.split('.'),
			group = splitCode[0],
			resultShortcut,
			shortcutParams;
		resultShortcut = {
			cmdType: "showList",
			cmdData: {
				params: [
					{
						entity: "inv_calcParams",
						method: "select"
					}
				]
			},
			description: "Параметри розрахунку земельного податку",
			cmpInitConfig: {
				onDeterminateForm: function () {
					return {
						formCode: "inv_calcParams",
						entityName: "inv_calcParams",
						cmdData: {
							sender: this
						}
					}
				},
				onItemContextMenu: function () {
				},
				customActions: [
					{
						text: 'Копіювати',
						iconCls: 'fa fa-clone',
						hidden: !ADM.AccessManager.checkAccess('INV_02_05_02'),
						handler: async function (btn) {
							let grid = btn.up('entitygridpanel'),
								selection = grid.getSelectionModel().getSelection()[0];

							if (!selection) return false;
							let calcParams = await UB.Repository('inv_calcParams').attrs('year', 'SGindex', 'notSGindex', 'permanentUse').selectById(selection.get('ID')),
								calcParamsGrid = await UB.Repository('inv_calcParamsGrid').attrs('calcParamsDictID', 'ngoLegal', 'ngoPhys', 'outLegal', 'outPhys').where('calcParamsID', '=', selection.get('ID')).selectAsObject();

							if (!calcParamsGrid.length) {
								calcParamsGrid =  await UB.Repository('inv_calcParamsDict').attrs('ID').where('parentID', 'isNotNull').selectAsObject({ID: 'calcParamsDictID'})
							}

							let result = await $App.connection.run({
								entity: 'inv_calcParams',
								method: 'insert',
								execParams: {
									year: calcParams.year,
									SGindex: calcParams.SGindex || 0,
									notSGindex: calcParams.notSGindex || 0,
									permanentUse: calcParams.permanentUse || 0,
									isNotInsertGrid: 1
								}
							});

							await calcParamsGrid.forEach(async (item)=>{
								await $App.connection.run({
									entity: 'inv_calcParamsGrid',
									method: 'insert',
									execParams: {
										calcParamsDictID: item.calcParamsDictID,
										calcParamsID: result.execParams.ID,
										ngoLegal: item.ngoLegal || 0,
										ngoPhys: item.ngoPhys || 0,
										outLegal: item.outLegal || 0,
										outPhys: item.outPhys || 0
									}
								})
							});
							grid.onRefresh();
							$App.doCommand(
								{
									cmdType: 'showForm',
									formCode: "inv_calcParams",
									instanceID: result.execParams.ID,
									entity: 'inv_calcParams',
									store: grid.getStore(),
									target: $App.viewport.centralPanel,
									tabId: 'inv_calcParams' + Ext.id(),
								}
							);
						}
					}
				]
			}

		};
		shortcutParams = resultShortcut.cmdData.params[0];
		switch (group) {
			case "search":

				resultShortcut.cmpInitConfig.toolbarActionList = ['addNew', 'del', 'refresh'];
				resultShortcut.cmpInitConfig.hideActions = ["showPreview", "showDetail", "audit", "edit", "addNewByCurrent", "itemLink"];

				shortcutParams.fieldList = this.fieldLists.inv_calcParams.search;
				break;
		}
		return resultShortcut;

	},
	inv_calcRealtyParams: function (code) {
		var splitCode = code.split('.'),
			group = splitCode[0],
			resultShortcut,
			shortcutParams;
		resultShortcut = {
			cmdType: "showList",
			cmdData: {
				params: [
					{
						entity: "inv_calcRealtyParams",
						method: "select"
					}
				]
			},
			description: "Параметри розрахунку податку на нерухоме майно",
			cmpInitConfig: {
				onDeterminateForm: function () {
					return {
						formCode: "inv_calcRealtyParams",
						entityName: "inv_calcRealtyParams",
						cmdData: {
							sender: this
						}
					}
				},
				onItemContextMenu: function () {
				},
				customActions: [
					{
						text: 'Копіювати',
						iconCls: 'fa fa-clone',
						hidden: !ADM.AccessManager.checkAccess('INV_02_06_02'),
						handler: async function (btn) {
							let grid = btn.up('entitygridpanel'),
								selection = grid.getSelectionModel().getSelection()[0];

							if (!selection) return false;
							let calcParams = await UB.Repository('inv_calcRealtyParams').attrs('year', 'forRooms').selectById(selection.get('ID')),
								calcParamsGrid = await UB.Repository('inv_calcRealtyParamsGrid').attrs('calcParamsDictID', 'legalZ1', 'legalZ2', 'legalZ3', 'physZ1', 'physZ2', 'physZ3').where('calcParamsID', '=', selection.get('ID')).selectAsObject();

							if (!calcParamsGrid.length) {
								calcParamsGrid =  await UB.Repository('inv_calcRealtyParamsDict').attrs('ID').where('parentID', 'isNotNull').selectAsObject({ID: 'calcParamsDictID'})
							}

							let result = await $App.connection.run({
								entity: 'inv_calcRealtyParams',
								method: 'insert',
								execParams: {
									year: calcParams.year,
									forRooms: calcParams.SGindex || 0,
									isNotInsertGrid: 1
								}
							});

							await calcParamsGrid.forEach(async (item)=>{
								await $App.connection.run({
									entity: 'inv_calcRealtyParamsGrid',
									method: 'insert',
									execParams: {
										calcParamsDictID: item.calcParamsDictID,
										calcParamsID: result.execParams.ID,
										legalZ1: item.legalZ1 || 0,
										legalZ2: item.legalZ2 || 0,
										legalZ3: item.legalZ3 || 0,
										physZ1: item.physZ1 || 0,
										physZ2: item.physZ2 || 0,
										physZ3: item.physZ3 || 0,
									}
								})
							});
							grid.onRefresh();
							$App.doCommand(
								{
									cmdType: 'showForm',
									formCode: "inv_calcRealtyParams",
									instanceID: result.execParams.ID,
									entity: 'inv_calcRealtyParams',
									store: grid.getStore(),
									target: $App.viewport.centralPanel,
									tabId: 'inv_calcRealtyParams' + Ext.id(),
								}
							);
						}
					}
				]
			}

		};
		shortcutParams = resultShortcut.cmdData.params[0];
		switch (group) {
			case "search":

				resultShortcut.cmpInitConfig.toolbarActionList = ['addNew', 'del', 'refresh'];
				resultShortcut.cmpInitConfig.hideActions = ["showPreview", "showDetail", "audit", "edit", "addNewByCurrent", "itemLink"];

				shortcutParams.fieldList = this.fieldLists.inv_calcRealtyParams.search;
				break;
		}
		return resultShortcut;

	},
	inv_localRequisites: function (code) {

		var splitCode = code.split('.'),
			group = splitCode[0],
			resultShortcut,
			shortcutParams;
		resultShortcut = {
			cmdType: "showList",
			cmdData: {
				params: [
					{
						entity: "inv_localRequisites",
						method: "select"
					}
				]
			},
			description: "Реквізити місцевої ради",
			cmpInitConfig: {
				onDeterminateForm: function () {
					return {
						formCode: "inv_localRequisites",
						entityName: "inv_localRequisites",
						cmdData: {
							sender: this
						}
					}
				},
				onItemContextMenu: function () {
				},
				onDel: function () {
					var me = this,
						selection = me.getSelectionModel().getSelection()[0];

					if (selection) {
						let data = selection.data;
						if (data && data.state) {
							if (data.state == 'Діє') {
								$App.dialogYesNo("Підтвердження", 'Ви дійсно хочете перевести в стан "Не діє"?').then(function (res) {
									if (!res) {
										return;
									}

									$App.connection.update({
										entity: 'inv_localRequisites', fieldList: ['ID', 'state'],
										execParams: {ID: data.ID, state: 'Не діє'}
									}).then(function (result) {
											me.onRefresh();
										}
									);
								});

							}
						} else {
							$App.dialogInfo('Запис вже в стані Не діє!');
						}
					}
					else {
						$App.dialogInfo(UB.i18n('Не обрано запис!'));
					}
				}
			}
		};

		shortcutParams = resultShortcut.cmdData.params[0];
		switch (group) {
			case "search":

				resultShortcut.cmpInitConfig.toolbarActionList = ["addNew", "del", 'refresh'];
				resultShortcut.cmpInitConfig.hideActions = ["showPreview", "showDetail", "audit", "edit", "addNewByCurrent", "itemLink"];

				shortcutParams.fieldList = this.fieldLists.inv_localRequisites.search;
				/*shortcutParams.whereList = {
				 byID: {expression: "[ID]", condition: '!=', values: {"ID": 10}},
				 byState: {expression: "[state]", condition: '=', values: {"state": "ACTIVE"}}
				 };//exclude built-in admin from grid*/
				break;
		}
		return resultShortcut;
	},
	inv_regIncome: function (code) {

		var splitCode = code.split('.'),
			group = splitCode[0],
			resultShortcut,
			shortcutParams;
		resultShortcut = {
			cmdType: "showList",
			cmdData: {
				params: [
					{
						entity: "inv_regIncome",
						method: "select"
					}
				]
			},
			description: "Реєстр надходжень",
			cmpInitConfig: {
				onDeterminateForm: function () {
					return {
						formCode: "inv_regIncome",
						entityName: "inv_regIncome",
						cmdData: {
							sender: this
						}
					}
				},
				onItemContextMenu: function () {
				},
				addBaseDockedItems: function (){
					let me = this;
					me.__proto__.addBaseDockedItems.apply(this, arguments);
					me.dockedItems[0].items.splice(3,1 , {
						text: 'Імпортувати дані з архіву',
						itemId: 'excerptsBtn',
						cls: 'btn-replace',
						xtype: 'button',
						scope: this,
						handler: function () {
							let me = this,
								form = me.up('basepanel');
							let fileFld,
								win = Ext.create('Ext.window.Window', {
									autoShow: true,
									title: UB.i18n('fayl'),
									border: 0,
									layout: 'fit',
									width: 400,
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
															let newValue = value.replace(/C:\\fakepath\\/g, '');
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
											itemId: 'hello',
											handler: function (btn) {
												let reader = new FileReader();
												let inputDom;
												inputDom = fileFld.fileInputEl.dom;
												let file = inputDom.files[0];
												let fileFormatValid = (/\.(?:\d+)$/);
												if (!file) {
													return;
												};
												let validFile = file.name.includes('vp');
												fileFormatValid.test(file.name) && validFile ?

												reader.onload = function(e) {
													// The file's text will be printed here
													let uploadData = e.target.result.split(/-{2,}/)
																					.filter( el => el.includes('R01'))
																					.map(item => item.split(/\r|\n|\n\r/).filter(String));//структурирование загружаемого архива с учетом переноса строки

													uploadData.forEach((item, i) => {
														let currItem = item[0].split(' ').filter(String);
														let paySum = currItem[6].replace(',', '.');
														let payDate = item[3].split(" ").slice(-1)[0].split('/');
														let prettyPayDate = new Date(parseInt(20 + payDate[2]) + ' ' + payDate[1] + ' ' + payDate[0])+1;
														let payPurpose = item[4] + item[5] || '' + item[6] || '' + item[7] || '' + item[8] || '';
														let payerInd = item[4].split(';')[2];

                                                   (payerInd !== undefined && payerInd.length <= 10 ) ? payerInd.trim() : payerInd = '';

														let params = {
															entity: "inv_regIncome",
															payDate: prettyPayDate,
															paySum,
															payer: payerInd,
															payPurpose,
															payCode: Number(currItem[1]),
															MFO: Number(currItem[2])
														};
															$App.connection.run({
																entity: params.entity,
																method: "insert",
																fieldList: [],
																execParams: {
																payDate: params.payDate,
																paySum: params.paySum,
																payer: params.payer,
																payPurpose: params.payPurpose,
																payCode: params.payCode,
																MFO: params.MFO
																}
															})
													});
												me.onRefresh();
												} : $App.dialogError('Файл повинен бути архівом та стандартного типу!');

												reader.readAsText(file, "cp1251" )
												win.close();
											}
										}
									]
								});
						}
					});
				}

			}
		};

		shortcutParams = resultShortcut.cmdData.params[0];
		switch (group) {
			case "search":

				resultShortcut.cmpInitConfig.toolbarActionList = ["addNew", "del", 'refresh'];
				resultShortcut.cmpInitConfig.hideActions = ["showPreview", "showDetail", "audit", "edit", "addNewByCurrent", "itemLink"];

				shortcutParams.fieldList = this.fieldLists.inv_regIncome.search;
				/*shortcutParams.whereList = {
				 byID: {expression: "[ID]", condition: '!=', values: {"ID": 10}},
				 byState: {expression: "[state]", condition: '=', values: {"state": "ACTIVE"}}
				 };//exclude built-in admin from grid*/
				break;
		}
		return resultShortcut;
	},
	inv_taxRealtyPay: function (code) {
		var splitCode = code.split('.'),
			group = splitCode[0],
			resultShortcut,
			shortcutParams;
		resultShortcut = {
			cmdType: "showList",
			cmdData: {
				params: [
					{
						entity: "inv_taxRealtyPay",
						method: "select"
					}
				]
			},
			description: "Пільги із сплати податку на нерухоме майно",
			cmpInitConfig: {
				onDeterminateForm: function () {
					return {
						formCode: "inv_taxRealtyPay",
						entityName: "inv_taxRealtyPay",
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

				shortcutParams.fieldList = this.fieldLists.inv_taxRealtyPay.search;
				break;
		}
		return resultShortcut;

	},
	inv_ngoDict: function (code) {

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
	inv_localStreet: function (code) {

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
						sender: me
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
	inv_excel: function (code) {
		var splitCode = code.split('.'),
			group = splitCode[0],
			resultShortcut,
			shortcutParams;


		function createExcel(year, koattNum, localGovern, paramsFormEl, paramsForm) {
			try {
				System.import('@unitybase/xlsx/').then((XLSX) => {
					let wb = new XLSX.XLSXWorkbook,
						stl = wb.style,

						borderFull = wb.style.borders.add({
							code: "borderFull",
							left: {style: "thin"},
							right: {style: "thin"},
							top: {style: "thin"},
							bottom: {style: "thin"}
						}),

						topFont = wb.style.fonts.add({
							code: "topFont",
							name: "Times New Roman",
							fontSize: 10,
							bold: false
						}),
						tableHeadFont = wb.style.fonts.add({
							code: "tableHeadFont",
							name: "Times New Roman",
							fontSize: 10,
							bold: true
						}),
						tableRowFont = wb.style.fonts.add({
							code: "tableRowFont",
							name: "Times New Roman",
							fontSize: 8
						}),

						rowFont = wb.style.fonts.add({
							code: "rowFont",
							name: "Times New Roman",
							fontSize: 14
						}),
						rowFont1 = wb.style.fonts.add({
							code: "rowFont1",
							name: "Times New Roman",
							fontSize: 14,
							bold: true
						}),

						topStyle,
						rowStyle, //old
						captionText = "",
						ws = wb.addWorkSheet({caption: captionText, name: captionText}),
						cols = [],
						rows = [],
						colProps = [], rowsCount = 2,
						toDayDate = Ext.Date.format(new Date(), 'd.m.Y');

					function addEmptyRow(workSheet) {
						return workSheet.addRow([
							{value: ""}
						], [
							{column: 0}
						], {height: 15});
					}

					ws.setOrientation("landscape");

					wb.useSharedString = false;
					stl.alignments.add({
						code: "HVcenter",
						horizontal: "center",
						vertical: "center",
						wrapText: "1"
					});
					stl.alignments.add({
						code: "nameAlign",
						horizontal: "left",
						vertical: "center",
						wrapText: "1"
					});

					stl.alignments.add({
						code: "nameAlignR",
						horizontal: "right",
						vertical: "center",
						wrapText: "1"
					});

					stl.alignments.add({
						code: "nameAlignNoWrap",
						horizontal: "left",
						vertical: "center",
						wrapText: "0"
					});

					topStyle = wb.style.getStyle({
						font: stl.fonts.named.rowFont,
						alignment: stl.alignments.named.HVcenter
					});

					var topStyleBCenter = wb.style.getStyle({
						font: stl.fonts.named.rowFont1,
						alignment: stl.alignments.named.HVcenter
					});

					var topStyleBoldCenter = wb.style.getStyle({
						font: stl.fonts.named.rowFont1,
						border: stl.borders.named.borderFull,
						alignment: stl.alignments.named.HVcenter
					});
					var topStyleCenter = wb.style.getStyle({
						font: stl.fonts.named.rowFont,
						border: stl.borders.named.borderFull,
						alignment: stl.alignments.named.HVcenter
					});

					var topStyleBoldLeft = wb.style.getStyle({
						font: stl.fonts.named.rowFont1,
						border: stl.borders.named.borderFull,
						alignment: stl.alignments.named.nameAlign
					});

					var topStyleLeft = wb.style.getStyle({
						font: stl.fonts.named.rowFont,
						border: stl.borders.named.borderFull,
						alignment: stl.alignments.named.HVcenter
					});

					var topStyleRight = wb.style.getStyle({
						font: stl.fonts.named.rowFont,
						border: stl.borders.named.borderFull,
						alignment: stl.alignments.named.nameAlignR
					});


					rowStyle = wb.style.getStyle({
						font: stl.fonts.named.rowFont,
						alignment: stl.alignments.named.HVcenter
					});

					$App.connection.run({
						entity: "inv_landPlot",
						method: "getExcelData",
						execParams: {
							koattNum: koattNum,
							year: year
						}
					}).then(function (data) {
						let result = data && data.resData ? JSON.parse(data.resData) : undefined,
							landData,
							realtyData,
							landDataPersonType,
							realtyDataPersonType;

						let colsWidth = {0: 70.00, 1: 16.71, 2: 16.71, 3: 16.71};
						for (let i = 0; i < 4; ++i) {
							cols.push({column: i, style: rowStyle});
							colProps.push({column: i, width: (colsWidth[i])});
							rows.push({value: ""});
						}

						ws.setColsProperties(colProps);

						function addHeadRow(value, row, colTo) {
							ws.addMerge({colFrom: 0, rowFrom: row, colTo: colTo, rowTo: row, style: topStyle});
							ws.addRow([
									{value: value}
								], [
									{column: 0, style: topStyleBCenter}
								],
								{height: '20'});

						}

						addHeadRow(localGovern, 1, 5);
						addHeadRow('Моніторинг планових та фактичних сум податків', 2, 3);
						addHeadRow(`за ${year} рік`, 3, 3);
						addHeadRow(`станом на ${toDayDate}`, 4, 3);

						addEmptyRow(ws);

						ws.addMerge({colFrom: 0, rowFrom: 5, colTo: 0, rowTo: 5, style: topStyleBoldCenter});

						function secondTableAddRow(values, styles, height) {
							if (height) {
								ws.addRow([
										{value: values.value1},
										{value: values.value2},
										{value: values.value3},
										{value: values.value4}
									], [
										{column: 0, style: styles.style1},
										{column: 1, style: styles.style2},
										{column: 2, style: styles.style3},
										{column: 3, style: styles.style4}

									],
									{height: height});
							} else {
								ws.addRow([
									{value: values.value1},
									{value: values.value2},
									{value: values.value3},
									{value: values.value4}
								], [
									{column: 0, style: styles.style1},
									{column: 1, style: styles.style2},
									{column: 2, style: styles.style3},
									{column: 3, style: styles.style4}

								]);
							}
						}

						secondTableAddRow({
							value1: '',
							value2: 'Планова сума податку, грн',
							value3: 'Фактично сплачено, грн',
							value4: 'Борг станом на початок року, грн'
						}, {
							style1: topStyleCenter,
							style2: topStyleCenter,
							style3: topStyleCenter,
							style4: topStyleCenter
						}, '101.25');

						secondTableAddRow({
							value1: 'Всього',
							value2: result.total.planSum,
							value3: result.total.factSum,
							value4: result.total.debtSum
						}, {
							style1: topStyleBoldCenter,
							style2: topStyleBoldCenter,
							style3: topStyleBoldCenter,
							style4: topStyleBoldCenter
						});

						secondTableAddRow({
							value1: 'Земельний податок',
							value2: result.land.planSum.total,
							value3: result.land.factSum.total,
							value4: result.land.debtSum.total
						}, {
							style1: topStyleBoldLeft,
							style2: topStyleBoldCenter,
							style3: topStyleBoldCenter,
							style4: topStyleBoldCenter
						});

						secondTableAddRow({
							value1: 'у т.ч. з фізичних осіб',
							value2: result.land.planSum.phys,
							value3: result.land.factSum.phys,
							value4: result.land.debtSum.phys
						}, {
							style1: topStyleRight,
							style2: topStyleCenter,
							style3: topStyleCenter,
							style4: topStyleCenter
						});

						secondTableAddRow({
							value1: 'у т.ч. з юридичних осіб',
							value2: result.land.planSum.leg,
							value3: result.land.factSum.leg,
							value4: result.land.debtSum.leg
						}, {
							style1: topStyleRight,
							style2: topStyleCenter,
							style3: topStyleCenter,
							style4: topStyleCenter
						});

						secondTableAddRow({
							value1: 'Орендна плата за зем. ділянки',
							value2: result.rentLand.planSum.total,
							value3: result.rentLand.factSum.total,
							value4: result.rentLand.debtSum.total
						}, {
							style1: topStyleBoldLeft,
							style2: topStyleBoldCenter,
							style3: topStyleBoldCenter,
							style4: topStyleBoldCenter
						});

						secondTableAddRow({
							value1: 'у т.ч. з фізичних осіб',
							value2: result.rentLand.planSum.phys,
							value3: result.rentLand.factSum.phys,
							value4: result.rentLand.debtSum.phys
						}, {
							style1: topStyleRight,
							style2: topStyleCenter,
							style3: topStyleCenter,
							style4: topStyleCenter
						});

						secondTableAddRow({
							value1: 'у т.ч. з юридичних осіб',
							value2: result.rentLand.planSum.leg,
							value3: result.rentLand.factSum.leg,
							value4: result.rentLand.debtSum.leg
						}, {
							style1: topStyleRight,
							style2: topStyleCenter,
							style3: topStyleCenter,
							style4: topStyleCenter
						});


						secondTableAddRow({
							value1: "Податок з об'єктів нерухомості",
							value2: result.realty.planSum.total,
							value3: result.realty.factSum.total,
							value4: result.realty.debtSum.total
						}, {
							style1: topStyleBoldLeft,
							style2: topStyleBoldCenter,
							style3: topStyleBoldCenter,
							style4: topStyleBoldCenter
						});

						secondTableAddRow({
							value1: "у т.ч. з фізичних осіб",
							value2: result.realty.planSum.phys,
							value3: result.realty.factSum.phys,
							value4: result.realty.debtSum.phys
						}, {
							style1: topStyleRight,
							style2: topStyleCenter,
							style3: topStyleCenter,
							style4: topStyleCenter
						});

						secondTableAddRow({
							value1: "у т.ч. з юридичних осіб",
							value2: result.realty.planSum.leg,
							value3: result.realty.factSum.leg,
							value4: result.realty.debtSum.leg
						}, {
							style1: topStyleRight,
							style2: topStyleCenter,
							style3: topStyleCenter,
							style4: topStyleCenter
						});

						secondTableAddRow({
							value1: "Орендна плата (об'єкти нерухомості)",
							value2: result.rentRealty.planSum.total,
							value3: result.rentRealty.factSum.total,
							value4: result.rentRealty.debtSum.total
						}, {
							style1: topStyleBoldLeft,
							style2: topStyleBoldCenter,
							style3: topStyleBoldCenter,
							style4: topStyleBoldCenter
						});

						secondTableAddRow({
							value1: "у т.ч. з фізичних осіб",
							value2: result.rentRealty.planSum.phys,
							value3: result.rentRealty.factSum.phys,
							value4: result.rentRealty.debtSum.phys
						}, {
							style1: topStyleRight,
							style2: topStyleCenter,
							style3: topStyleCenter,
							style4: topStyleCenter
						});

						secondTableAddRow({
							value1: "у т.ч. з юридичних осіб",
							value2: result.rentRealty.planSum.leg,
							value3: result.rentRealty.factSum.leg,
							value4: result.rentRealty.debtSum.leg
						}, {
							style1: topStyleRight,
							style2: topStyleCenter,
							style3: topStyleCenter,
							style4: topStyleCenter
						});

						// ws.setFixForFirstColumn();
						return wb.render({type: 'arraybuffer'});
					}).then((response) => {
						let blobData = new Blob(
							[response],
							{type: 'application/vnd.ms-excel'}
						);
						paramsFormEl.unmask();
						paramsForm.close();
						saveAs(blobData, 'Моніторинг.xlsx');
					});
				});
			}
			catch (e) {
				paramsFormEl.unmask();
			}
		}

		resultShortcut = {
			cmdType: "showForm",
			formCode: function (ctx) {
				Ext.create('UB.view.BaseWindow', {
					title: 'Параметри звіту',
					autoScroll: true,
					width: 430,
					height: 180,
					border: 0,
					layout: 'fit',
					autoDestroy: true, modal: true, resizable: false, maximizable: false, closable: true,
					items: [{
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
										xtype: 'textfield',
										fieldLabel: 'Рік',
										itemId: 'year',
										value: Ext.Date.format(new Date(), 'Y'),
										width: 405
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
								items: [{
									xtype: 'ubcombobox',
									itemId: "locality",
									fieldLabel: "Орган місцевого самоврядування",
									displayField: 'localGovernment',
									valueField: 'ID',
									//value: 152,
									width: 405,
									allowBlank: false,
									ubRequest: {
										entity: 'inv_landDict',
										method: 'select',
										fieldList: ['ID', 'koattNum', 'localGovernment']
									}
								}
								]
							}
						],
						buttons: [{
							text: 'Згенерувати',
							formBind: true,
							handler: function () {
								let paramsForm = this.up().up();
								paramsForm.getEl().mask('Зачекайте');
								createExcel(paramsForm.queryById('year').value, paramsForm.queryById('locality').value, paramsForm.queryById('locality').rawValue, paramsForm.getEl(), paramsForm.up());
							}
						}]
					}],
					isGrid: false,
					stateful: true
				}).show()
			},
			cmdData: {
				params: [
					{
						formCode: function (ctx) {

						}
					}
				]
			}

		};

		return resultShortcut;

	},
	inv_leaseAgreements: function (code) {

		var splitCode = code.split('.'),
			group = splitCode[0],
			resultShortcut,
			shortcutParams;
		resultShortcut = {
			cmdType: "showList",
			cmdData: {
				params: [
					{
						entity: "inv_leaseAgreements",
						method: "select"
					}
				]
			},
			description: "Договори оренди",
			cmpInitConfig: {
				onDeterminateForm: function () {
					return {
						formCode: "inv_leaseAgreements",
						entityName: "inv_leaseAgreements",
						cmdData: {
							sender: this
						}
					}
				},
				onItemContextMenu: function () {
				},
				addBaseDockedItems: function () {
					var me = this,
						gridAgreements = this;
					me.__proto__.addBaseDockedItems.apply(this, arguments);
					var menu = Ext.create("Ext.menu.Menu");

					menu.add({
						text: "Підписати",
						iconCls: 'fa fa-pencil',
						name: "agreementsActions",
						handler: function (ctx) {
							var grid = this.up('grid');
							let selection = gridAgreements.getSelectionModel().getSelection()[0];
							if (!selection) {
								$App.dialogError('Спочатку необхідно обрати запис з таблиці');
								return;
							}
							let selectedData = selection.data || {};
							if (selectedData && selectedData.state == "PROJECT") {
								$App.dialogYesNo("Підтвердження", 'Ви дійсно хочете перевести в стан "Діючий"?').then(function (res) {
									if (!res) {
										return;
									}

									$App.connection.update({
										entity: 'inv_leaseAgreements', fieldList: ['ID', 'state'],
										execParams: {ID: selectedData.ID, state: 'ACTIVE'}
									}).then(function (result) {
											me.onRefresh();
										}
									);
								});
							} else {
								$App.dialogError('Ця дія доступна для договорів зі станом «Проект».');
								return;
							}
						}
					});

					menu.add({
						text: "Припинити",
						iconCls: 'fa fa-ban',
						name: "agreementsActions",
						handler: function (ctx) {
							var grid = this.up('grid');
							let selection = gridAgreements.getSelectionModel().getSelection()[0];
							if (!selection) {
								$App.dialogError('Спочатку необхідно обрати запис з таблиці');
								return;
							}
							let selectedData = selection.data || {};
							if (selectedData && selectedData.state == "ACTIVE") {
								$App.dialogYesNo("Підтвердження", 'Ви дійсно хочете перевести в стан "Припинений"?').then(function (res) {
									if (!res) {
										return;
									}

									$App.connection.update({
										entity: 'inv_leaseAgreements', fieldList: ['ID', 'state'],
										execParams: {
											ID: selectedData.ID,
											state: 'STOPPED',
											stopDate: new Date()
										}
									}).then(function (result) {
											me.onRefresh();
										}
									);
								});
							}
							else {
								$App.dialogError('Ця дія доступна для договорів зі станом «Діючий».');
								return;
							}
						}
					});

					menu.add({
						text: "Видалити",
						iconCls: 'fa fa-trash-o',
						name: "agreementsActions",
						handler: function (ctx) {
							var grid = this.up('grid');
							let selection = gridAgreements.getSelectionModel().getSelection()[0];
							if (!selection) {
								$App.dialogError('Спочатку необхідно обрати запис з таблиці');
								return;
							}
							let selectedData = selection.data || {};
							if (selectedData && selectedData.state == "PROJECT") {
								$App.dialogYesNo("Підтвердження", 'Ви дійсно хочете видалити"?').then(function (res) {
									if (!res) {
										return;
									}

									$App.connection.run({
										entity: 'inv_leaseAgreements',
										method: "delete",
										execParams: {ID: selectedData.ID}
									}).then(function (result) {
											me.onRefresh();
										}
									);
								});
							} else {
								$App.dialogError('Ця дія доступна для договорів зі станом «Проект».');
								return;
							}
						}
					});
					me.dockedItems[0].items.splice(3, 0, {
						itemId: "agreementsMenu",
						text: "Всі дії",
						menu: menu
					});
				}
			}
		};

		shortcutParams = resultShortcut.cmdData.params[0];
		switch (group) {
			case "search":

				resultShortcut.cmpInitConfig.toolbarActionList = ["addNew", 'refresh'];
				resultShortcut.cmpInitConfig.hideActions = ["showPreview", "showDetail", "audit", "edit", "addNewByCurrent", "del", "itemLink"];

				shortcutParams.fieldList = this.fieldLists.inv_leaseAgreements.search;
				break;
		}
		return resultShortcut;
	},
	inv_objLog: function (code) {

		var splitCode = code.split('.'),
			group = splitCode[0],
			resultShortcut,
			shortcutParams;
		resultShortcut = {
			cmdType: "showList",
			cmdData: {
				params: [
					{
						entity: "inv_objLog",
						method: "select"
					}
				]
			},
			description: "Журнал змін МПН",
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

				shortcutParams.fieldList = this.fieldLists.inv_objLog.search;
				shortcutParams.orderList = {
					byChangeDate: this.orderLists.byChangeDate
				};
				break;
		}
		return resultShortcut;
	},
	'inv_subject-map': function (code) {
		var splitCode = code.split('.'),
			group = splitCode[0],
			resultShortcut,
			shortcutParams;
		resultShortcut = {
			cmdType: "showForm",
			caption: "Карта",
			description: "Карта",
			formCode: 'inv_subject-map',
			entityName: 'inv_subject',
			entity: "inv_subject",
			target: $App.viewport.centralPanel,
			tabId: 'inv_subject' + Ext.id()
		};

		return resultShortcut;
	}
});
