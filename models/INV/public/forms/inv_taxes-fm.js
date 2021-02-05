const _ = require('lodash');
exports.formCode = {
	initUBComponent: async function () {
		var me = this,
			isRealtyObj = me.privilegeSum,
			privSumCtrl = me.queryById('privSum'),
			nameCombo = me.queryById('pName'),
			yearField = me.getField('reportYear'),
			taxRateField = me.getField('taxRate');

		if (me.ID) {
			nameCombo.store.ubRequest.whereList = {
				byState: {
					expression: '[state]',
					condition: 'equal',
					values: {state: 'Дійсний'}
				},
				byID: {
					expression: '[objectID]',
					condition: 'equal',
					values: {'objectID': me.ID}
				}
			};
			if (me.record.get('name')) {
				nameCombo.store.ubRequest.whereList.byName = {
					expression: '[ID]',
					condition: 'equal',
					values: {'ID': me.record.get('name')}
				};
				nameCombo.store.ubRequest.logicalPredicates = ["([byID] and [byState]) or [byName]"];
			}

		}
		if (isRealtyObj && privSumCtrl) privSumCtrl.show();
		if (me.isNewInstance) {

			var yearToSet = parseInt(Ext.Date.format(new Date(), 'Y'));
			yearField.setValue(yearToSet);
			me.activePayer && me.record.set('name', me.activePayer);
			me.calculateTax(yearToSet);
		}
	},
	addBaseActions: function () {
		var me = this;
		this.callParent(arguments);

		this.actions.calculateTax = new Ext.Action({
			actionId: "calculateTax",
			itemId: 'toolbarCalculateTax',
			actionText: 'Розрахувати податок',
			hidden: !ADM.AccessManager.checkAccess("INV_01_01_02"),
			handler: function (btn) {
				me.calculateTax(parseInt(me.record.get('reportYear')))
			}
		});
	},
	calculateTax: async function (year) {
		let me = this;
		if (!me.payerID) me.payerID = me.record.get('name.payerID')
		if (me.payerID) {


			let r = await $App.connection.select({
				entity: "inv_payers",
				fieldList: ["fullName", "areaAddR", "regionAddR", "settlementAddR.governmentShortName", "streetTypeAddR.name", "streetAddR.street", "houseNumAddR", "flatNumAddR", "privilegePhysID", "privilegeLegID", "privilegePhysID.exemptionCat", "privilegeLegID.exemptionCat", "privilegeStartDate", "privilegeEndDate", "personType"],
				whereList: {
					byID: {expression: "[ID]", condition: "equal", values: {ID: me.payerID}}
				}
			});
			let data = UB.LocalDataStore.selectResultToArrayOfObjects(r)[0];

			if (data) {
				let senderForm = me.sender.up('form')
				var form = me,
					totalArea = senderForm.record.get('totalArea'), //Загальна площа
					regDate = senderForm.record.get('registryData'), //Дата держреєстрації
					privilege = form.getField('privilege'),
					payerAddress = form.getField('payerAddress'),
					privilegeStartDate = form.queryById('privStartDate'),
					objType = form ? form.objType : undefined,
					personType = data["personType"] ? data["personType"] : 'PHYSICAL',
					landCategory = senderForm.record.get('landCategory'),
					acceptPrivilege = senderForm.record.get('acceptPrivilege');

				if (objType && data) {
					if (!data.privilegeStartDate && ((personType === 'PHYSICAL' && data.privilegePhysID) || (personType === 'LEGAL' && data.privilegeLegID))) {
						$App.dialogError('У платника заповнена пільгова категорія, але не заповнена дата початку дії пільги.');
						return false;
					}

					if (data.privilegeStartDate && ((personType === 'PHYSICAL' && !data.privilegePhysID) || (personType === 'LEGAL' && !data.privilegeLegID))) {
						$App.dialogError('У платника заповнена дата початку дії пільги, але не заповнена пільгова категорія.');
						return false;
					}


					let exCategory = data['personType'] == 'PHYSICAL' ? data['privilegePhysID.exemptionCat'] : data['privilegeLegID.exemptionCat'];
					privilege.setValue(exCategory);
					privilegeStartDate.setValue(data['privilegeStartDate']);
					if (data['areaAddR']) data['areaAddR'] += ' обл.';
					if (data['streetAddR.street']) data['streetFull'] = `${data['streetTypeAddR.name']} ${data['streetAddR.street']}`;
					if (data['flatNumAddR']) data['flatNumAddR'] = 'кв. ' + data['flatNumAddR'];
					let addressFull = _.compact([data['areaAddR'], data['regionAddR'], data['settlementAddR.governmentShortName'], data['streetFull'], data['houseNumAddR'], data['flatNumAddR']]).join(', ');

					payerAddress.setValue(addressFull);
					if (objType == 'inv_landPlot') calculateLandTax(exCategory);
					else calculateRealtyTax(senderForm.record.get('notToLive'), senderForm.record.get('notTaxed'), senderForm.record.get('realtyType'));
				}

				async function calculateLandTax(exCategory) {
					let sumYear = 0;
					let ngoDone = senderForm.record.get('NGODone')
					let calcParamsID = senderForm.record.get('calcParamsID')
					let location = senderForm.record.get('location')

					if (!ngoDone && location === 'INLOCAL') { //Якщо Проведено НГО="Ні" та розташування = "у межах нас. пунктів" ТО податок не обраховується
						sumYear = 0;
					}
					else {

						if (calcParamsID) {
							var square = 1,
								privStartDate = data["privilegeStartDate"],
								privEndDate = data["privilegeEndDate"],
								checkStartDate = new Date(year, 0, 1).getTime(), //01.01 року з поля "Звітний рік"
								checkEndDate = new Date(year, 11, 31).getTime(), //31.12 року з поля "Звітний рік"
								useType = senderForm.record.get('useType'),
								sumMonth = 0;

							let byExemptionTypeId = personType == 'PHYSICAL' ? "privilegePhysID" : "privilegeLegID";
							let r = data[byExemptionTypeId] ? await UB.Repository(personType == 'PHYSICAL' ? "inv_exemptionPhysDict" : "inv_exemptionLegDict")
								.attrs('*')
								.selectById(data[byExemptionTypeId]) : {}

							let extractSum = 0, //значення з довідника пільгових категорій відповідно до пільгової категорії ТА виду використання
								monthWithPriv = 1,
								monthWithoutPriv = 1,
								sumMonthPriv = 0, //ЯКЩО юр.особа має пільгу ТО Сума міс з пільгою = 0
								sumMonthNoPriv = 0, //Сума міс без пільги
								fieldList = [],
								Ki = ['ID', landCategory == 'NOT_AGRICULTURAL' ? 'notSGindex' : 'SGindex'];

							switch (useType) {
								case 'OSGMANAGE':
									extractSum = r && r.managingOSG ? r.managingOSG : 0;
									break;
								case 'SMALLHOLDING':
									extractSum = r && r.smallholding ? r.smallholding : 0;
									break;
								case 'COTTAGECONSTR':
									extractSum = r && r.cottageConstruction ? r.cottageConstruction : 0;
									break;
								case 'CONSTRGARAGES':
									extractSum = r && r.constructionGarages ? r.constructionGarages : 0;
									break;
								case 'GARDENMANAGE':
									extractSum = r && r.managingGarden ? r.managingGarden : 0;
									break;
								case 'SGPRODUCTMANAGE':
									extractSum = 0;
									break;
								case 'TRADEINSTITUTE':
									extractSum = 0;
									break;
								case 'OTHERS':
									extractSum = 0;
									break;
							}

							switch (personType) {
								case 'PHYSICAL':
									fieldList.push(ngoDone ? 'ngoPhys' : 'outPhys');
									break;
								default:
									fieldList.push(ngoDone ? 'ngoLegal' : 'outLegal');
									break;
							}

							let r2 = await $App.connection.select({
								entity: "inv_calcParams",
								fieldList: Ki,
								whereList: {
									byYear: {
										expression: "[year]",
										condition: "equal",
										values: {year: year}
									}
								}
							});

							let res = UB.LocalDataStore.selectResultToArrayOfObjects(r2)[0];
							if (res) {
								let r3 = UB.LocalDataStore.selectResultToArrayOfObjects(await $App.connection.select({
									entity: "inv_calcParamsGrid",
									fieldList: fieldList,
									whereList: {
										byCalcParamsDictID: {
											expression: "[calcParamsDictID]",
											condition: "equal",
											values: {calcParamsID: calcParamsID}
										},
										byCalcParamsID: {
											expression: "[calcParamsID]",
											condition: "equal",
											values: {calcParamsID: res.ID}
										}
									}
								}))[0];

								if (!r3){
									$App.dialogInfo(`Відсутні необхідні для розрахунку параметри в довіднику "Параметри розрахунку земельного податку" - планова сума податку не була розрахована.`);
									return false;
								}


								//ЯКЩО Дата держреєстрації ≤ 01,01 поточного року
								if (regDate && regDate.getTime() <= checkStartDate) {
									if (((exCategory && privEndDate && acceptPrivilege && privEndDate && privEndDate.getTime() < checkEndDate) || (privStartDate && privStartDate.getTime() > checkEndDate)) || (!exCategory) || (!acceptPrivilege) || !privStartDate) //Значення в полі "Пільгова категорія" є ТА дата закінчення пільги < 01,01 поточного року АБО дата початку пільги > 31,12 поточного року АБО пільги для власника немає
									{
										square = totalArea; //S  (Площа, що оподатковується) = Загальна площа
										sumYear = r3[fieldList[0]] ? (square * res[Ki[1]] * r3[fieldList[0]]).toFixed(2) : 0;    //Сума(рік) = S* *Кі*Ставка податку(відп)
									}
									else {
										square = +(totalArea - extractSum).toFixed(2); //S = Площа загальна – значення з довідника пільгових категорій відповідно до пільгової категорії ТА виду використання.
										square < 0 && (square = 0);
										if (privStartDate <= checkStartDate && (privEndDate && privEndDate.getTime() >= checkEndDate || !privEndDate)) { //дата початку пільги ≤ 01,01 поточного року ТА (дата закінчення пільги >= 31,12 поточного року АБО порожнє)
											sumYear = personType == 'PHYSICAL' && r3[fieldList[0]] ?
												(square * res[Ki[1]] * r3[fieldList[0]]).toFixed(2) ://Фіз особа: Сума(рік) = S* *Кі*Ставка податку(відп)
												0;    //Юр.особа: Сума(рік) з пільгою = 0

										} else if (privStartDate && privStartDate.getTime() >= checkStartDate) { //дата початку пільги >=01,01 поточного року
											//визначаємо кількість місяців дії пільги

											//Дата закінчення порожня АБО Рік дати закінчення більше поточного - по кінець року, ІНАКШЕ - по дату закінчення
											monthWithPriv = (new Date(privEndDate ? privEndDate.getFullYear() > new Date(checkEndDate).getFullYear() ? checkEndDate : privEndDate : checkEndDate).getMonth() - new Date(privStartDate).getMonth()) + 1;
											monthWithoutPriv = 12 - monthWithPriv;
											//monthWithPriv = 12 - (new Date(privStartDate).getDate() > 1 ? new Date(privStartDate).getMonth() + 1 : new Date(privStartDate).getMonth()); //к-сть місяців з пільгою
											//monthWithoutPriv = 12 - monthWithPriv; //к-сть місяців без пільги

											if (r3[fieldList[0]]) {
												sumMonthNoPriv = totalArea * res[Ki[1]] * r3[fieldList[0]] / 12; // Сума(міс) без пільги = Площа загальна*Кі*Ставка податку(відп)/12
												sumMonthPriv = personType == 'PHYSICAL' ?
													square * res[Ki[1]] * r3[fieldList[0]] / 12 : //Фіз особа: Сума(міс) з пільгою = S*Кі*Ставка податку(відп)/12
													0; // Юр.особа: Сума(міс) з пільгою = 0

												sumYear = +(sumMonthPriv * monthWithPriv + sumMonthNoPriv * monthWithoutPriv).toFixed(2); //Сума за рік  = Сума міс з пільгою * К-ть міс дії пільги + Сума міс без пільги* К-ть міс без пільги
											}
											else sumYear = 0;
										}
									}

								}
								else if (regDate && regDate.getTime() > checkStartDate) { //ЯКЩО Дата держреєстрації > 01,01 поточного року
									if ((exCategory && privEndDate && privEndDate.getTime() < checkStartDate) || (!exCategory) || (!acceptPrivilege) || !privStartDate) //Значення в полі "Пільгова категорія" є ТА дата закінчення пільги < 01,01 поточного року АБО пільги для власника немає
									{
										square = totalArea; //S  (Площа, що оподатковується) = Загальна площа
										monthWithPriv = 12 - regDate.getMonth(); // К-ть міс =  12 – порядковий номер місяця з дати держреєстрації +1
										sumYear = r3[fieldList[0]] ? (square * res[Ki[1]] * r3[fieldList[0]] / 12 * monthWithPriv).toFixed(2) : 0; //Сума(рік) = S*Кі*Ставка податку(відп)/12* к-ть місяців
									}
									else {
										square = +(totalArea - extractSum).toFixed(2); //S = Площа загальна – значення з довідника пільгових категорій відповідно до пільгової категорії ТА виду використання.
										square < 0 && (square = 0);
										if (privStartDate && privStartDate.getTime() <= checkStartDate && (privEndDate && privEndDate.getTime() >= checkEndDate || !privEndDate)) { //дата початку пільги ≤ 01,01 поточного року ТА (дата закінчення пільги >= 31,12 поточного року АБО порожнє)
											monthWithPriv = 12 - regDate.getMonth(); // К-ть міс =  12 – порядковий номер місяця з дати держреєстрації +1
											sumYear = personType == 'PHYSICAL' && r3[fieldList[0]] ?
												(square * res[Ki[1]] * r3[fieldList[0]] / 12 * monthWithPriv).toFixed(2) : //Сума(рік) = S*Кі*Ставка податку(відп)/12* к-ть місяців
												0; // Юр.особа: Сума(міс) з пільгою = 0

										} else if (privStartDate && privStartDate.getTime() >= checkStartDate) { //дата початку пільги >=01,01 поточного року
											//визначаємо кількість місяців дії пільги
											monthWithPriv = (new Date(privEndDate ? privEndDate.getFullYear() > new Date(checkEndDate).getFullYear() ? checkEndDate : privEndDate : checkEndDate).getMonth() - new Date(privStartDate).getMonth()) + 1;
											monthWithoutPriv = 12 - monthWithPriv;
											//monthWithPriv = 12 - (new Date(privStartDate).getDate() > 1 ? new Date(privStartDate).getMonth() + 1 : new Date(privStartDate).getMonth()); //к-сть місяців з пільгою
											//monthWithoutPriv = 11 - regDate.getMonth() + 1 - monthWithPriv; // К-ть міс без пільги=  12 – порядковий номер місяця з дати держреєстрації +1
											if (fieldList[1]) {
												sumMonthNoPriv = totalArea * res[Ki[1]] * r3[fieldList[0]] / 12; // Сума(міс) без пільги = Площа загальна*Кі*Ставка податку(відп)/12
												sumMonthPriv = personType == 'PHYSICAL' ?
													square * res[Ki[1]] * r3[fieldList[0]] / 12 : //Фіз особа: Сума(міс) з пільгою = S*Кі*Ставка податку(відп)/12
													0; // Юр.особа: Сума(міс) з пільгою = 0
												sumYear = (sumMonthPriv * monthWithPriv + sumMonthNoPriv * monthWithoutPriv).toFixed(2); //Сума за рік  = Сума міс з пільгою * К-ть міс дії пільги + Сума міс без пільги* К-ть міс без пільги
											}
											else sumYear = 0;
										}
									}
								}
							}
							else {
								$App.dialogInfo('Планова сума податку за рік не була розрахована - за поточний рік відсутній запис у довіднику "Параметри розрахунку земельного податку".')
							}
						}
						else {
							$App.dialogInfo(`У поточного об'єкта оподаткування не заповнено "Вид цільового призначення" - планова сума податку не була розрахована.`);
						}
					}

					form.getField('sumYear').setValue(parseFloat(sumYear));
				}

				async function calculateRealtyTax(notToLive, notTaxed, realtyType) {
					let planSum = 0,
						square = 1,
						monthWithPriv = 0,
						checkStartDate = new Date(year, 0, 1),
						realtyTrue = {FLAT: 'flat', HOUSE: 'house', RESIDENTIAL_PROPERTY: 'otherRealtyObj'};//realtyTrue[realtyType]

					let calcParamsID = senderForm.record.get('calcParamsID')
					let location = senderForm.record.get('location')
					if (calcParamsID) {
						if (notToLive || notTaxed) { //ЯКЩО заповнено поле «Не оподатковується» АБО «Непридатна для проживання» ТО планова сума податку = 0
							planSum = 0;
						}
						else {
							var payTypeSum = 0;
							let data1 = UB.LocalDataStore.selectResultToArrayOfObjects(await $App.connection.select({
								entity: "inv_calcRealtyParams",
								fieldList: ["*"],
								whereList: {
									byYear: {expression: "[year]", condition: "equal", values: {year: year}}
								}
							}))[0];
							if (data1) {
								//ЯКЩО власник – фіз.особа
								//ТА тип об’єкта нерухомості = 1 АБО 2 АБО 3
								let fieldList = [];
								switch (personType) {
									case 'PHYSICAL':
										fieldList.push(location === 'INLOCAL' ? 'physZ1' : 'physZ2');
										break;
									default:
										fieldList.push(location === 'INLOCAL' ? 'legalZ1' : 'legalZ2');
										break;
								}
								let data2 = UB.LocalDataStore.selectResultToArrayOfObjects(await $App.connection.select({
										entity: "inv_calcRealtyParamsGrid",
										fieldList: fieldList,
										whereList: {
											byCalcParamsDictID: {
												expression: "[calcParamsDictID]",
												condition: "equal",
												values: {calcParamsID: calcParamsID}
											},
											byCalcParamsID: {
												expression: "[calcParamsID]",
												condition: "equal",
												values: {calcParamsID: data1.ID}
											}
										}
									}))[0],
									data3 = UB.LocalDataStore.selectResultToArrayOfObjects(await $App.connection.select({
										entity: "inv_taxRealtyPay",
										fieldList: ["*"],
										whereList: {
											byYear: {
												expression: "[year]",
												condition: "equal",
												values: {year: year}
											}
										}
									}))[0],
									extrParam = 0;
								if (!data2 || !data3) {
									$App.dialogInfo(`Відсутні необхідні для розрахунку параметри в довіднику ${!data2 && "Параметри розрахунку податку на нерухоме майно" || "Пільги із сплати податку на нерухоме майно"} - планова сума податку не була розрахована.`);
									return false;
								}
									extrParam = data3[realtyTrue[realtyType]] || 0;

									if (personType == 'PHYSICAL' && acceptPrivilege && realtyTrue[realtyType] && totalArea < extrParam * 5) { ////ТА загальна площа <  Відповідний параметр*5
										square = totalArea - extrParam >= 0 ? +(totalArea - extrParam).toFixed(2) : 0; // ТО Площа, що оподатковується = Загальна площа – Відповідний параметр. (Якщо значення від’ємне, то Площа, що оподатковується =0)
									}
									else square = totalArea; //ІНАКШЕ Площа, що оподатковується = Загальна площа

									//Ставка податку
									if (!realtyTrue[realtyType]) {
										payTypeSum = data1.forRooms;
									}
									else {
										payTypeSum = data2[fieldList[0]];
									}


									/*if (form.location == 'INLOCAL') {
									 payTypeSum = personType == 'PHYSICAL' ? data1.inSettlementPhys : data1.inSettlementLeg
									 }
									 else {
									 payTypeSum = personType == 'PHYSICAL' ? data1.outSettlementPhys : data1.outSettlementLeg
									 }*/
									if (regDate < checkStartDate) { //ЯКЩО Дата держреєстрації < 01,01 поточного року
										planSum = square * payTypeSum; //ТО Планова сума податку = S*Ставка податку
									}
									else {
										monthWithPriv = 11 - regDate.getMonth() + 1;//Кіл-ть місяців =12 – порядковий номер місяця з дати держреєстрації +1.
										planSum = square * payTypeSum / 12 * monthWithPriv; // Сума(рік) = S*Ставка податку/12*к-ть місяців
									}

									//ЯКЩО тип об’єкта нерухомості = 1 ТА загальна площа > 300
									//АБО тип об’єкта нерухомості = 2 ТА загальна площа > 500
									if ((realtyType == 'FLAT' && form.totalArea > 300) || (realtyType == 'HOUSE' && form.totalArea > 500)) {
										planSum = (planSum + 25000).toFixed(2); //ТО Планова сума податку = S*Ставка податку + 25000

									}

								//}
							}
							else {
								$App.dialogInfo('За поточний рік відсутній запис у довіднику "Параметри розрахунку податку на нерухоме майно" - планова сума податку за рік не була розрахована.')
							}
						}
					}
					else {
						$App.dialogInfo(`У поточного об'єкта оподаткування не заповнено "Класифікація будівель та споруд" - планова сума податку не була розрахована.`);
					}
					form.getField('sumYear').setValue(parseFloat(planSum));
				}
			}

		}
	},
	onAfterSave: function () {
		let me = this;
		me.sender && me.sender.onRefresh && me.sender.onRefresh();
	}

};
