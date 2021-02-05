const me = inv_taxes;
const _ = require('lodash');
const UB = require('@unitybase/ub');

me.beforeinsert = function (ctx) {
	let params = ctx.mParams.execParams;

	if (params.skipBeforeInsert) {
		delete params.skipBeforeInsert
	}
	else if (params.name) {
		let taxes = UB.Repository('inv_taxes')
			.attrs(['ID'])
			.where('name', '=', params.name)
			.where('reportYear', '=', params.reportYear)
			.where('objectID', '=', params.objectID)
			.selectAsObject();
		if (taxes.length) throw new Error('<<<Запис з обраним платником вже додано.>>>');
	}
};

me.beforeupdate = function (ctx) {
	let params = ctx.mParams.execParams;

	if (!Ext.isEmpty(params.name) || !Ext.isEmpty(params.reportYear)) {
		let currData = UB.Repository('inv_taxes')
				.attrs(['objectID', 'name', 'reportYear'])
				.selectById(params.ID),
			taxes = UB.Repository('inv_taxes')
				.attrs(['ID'])
				.where('ID', '!=', params.ID)
				.where('objectID', '=', currData.objectID)
				.where('name', '=', !Ext.isEmpty(params.name) ? params.name : currData.name)
				.where('reportYear', '=', !Ext.isEmpty(params.reportYear) ? params.reportYear : currData.reportYear)
				.selectAsObject();

		if (taxes.length) throw new Error('<<<Запис з обраним платником вже додано.>>>');
	}
};

me.insertNewTaxByYear = function (ctx) {
	let params = ctx.mParams.execParams
	let currYear = new Date()
	let payers = _.keyBy(UB.Repository('inv_payers')
		.attrs(["ID", "fullName", "areaAddR", "regionAddR", "settlementAddR.governmentShortName", "streetTypeAddR.name", "streetAddR.street", "houseNumAddR", "flatNumAddR",
			"privilegePhysID", "privilegeLegID", "privilegePhysID.exemptionCat", "privilegeLegID.exemptionCat", "privilegeStartDate", "privilegeEndDate", "personType"])
		.selectAsObject(), 'ID')
	let activePayers = _.keyBy(UB.Repository('inv_objPayers')
		.attrs(['ID', 'payerID', 'objectID'])
		.where('state', '=', 'Дійсний')
		.selectAsObject(), 'objectID')
	let ds_taxes = UB.DataStore('inv_taxes');
	currYear.setMinutes(-currYear.getTimezoneOffset());
	currYear = currYear.getFullYear();

	if (params.subjType) {
		let	landPlot = UB.Repository('inv_landPlot')
			.attrs(['ID', 'koattNum', 'location', 'owner', 'registryData', 'totalArea', 'useType', 'landCategory', 'acceptPrivilege', 'NGODone', 'calcParamsID'])
			.selectAsObject()
		let exemption = {
			inv_exemptionPhysDict: _.keyBy(UB.Repository("inv_exemptionPhysDict").attrs('*').selectAsObject(), 'ID'),
			inv_exemptionLegDict: _.keyBy(UB.Repository("inv_exemptionLegDict").attrs('*').selectAsObject(), 'ID')
		}
		let calcParams = UB.Repository('inv_calcParams')
				.attrs('*')
				.where('year', '=', params.year)
				.selectSingle(),
			calcParamsGrid = _.keyBy(UB.Repository('inv_calcParamsGrid')
				.attrs('*')
				.where('calcParamsID', '=', calcParams.ID)
				.selectAsObject(), 'calcParamsDictID');

		landPlot.forEach((item) => {
			let activePayer = activePayers[item.ID],
				addressFull = null,
				sumYear = 0;

			if (activePayer && item.calcParamsID) {
				let data = payers[activePayer.payerID],
					totalArea = item.totalArea, //Загальна площа
					regDate = new Date(item.registryData), //Дата держреєстрації
					personType = data && (data["personType"] ? data["personType"] : 'PHYSICAL') || null,
					landCategory = item.landCategory,
					acceptPrivilege = item.acceptPrivilege,
					ngoDone = item.NGODone,
					byexemptionTypeId = personType == 'PHYSICAL' ? "privilegePhysID" : "privilegeLegID";

				if (data) {
					let exCategory = data['personType'] == 'PHYSICAL' ? data['privilegePhysID.exemptionCat'] : data['privilegeLegID.exemptionCat'];
					// privilege.setValue(exCategory);
					// privilegeStartDate.setValue(data['privilegeStartDate']);
					if (data['areaAddR']) data['areaAddR'] += ' обл.';
					if (data['streetAddR.street']) data['streetFull'] = `${data['streetTypeAddR.name']} ${data['streetAddR.street']}`;
					if (data['flatNumAddR']) data['flatNumAddR'] = 'кв. ' + data['flatNumAddR'];
					addressFull = _.compact([data['areaAddR'], data['regionAddR'], data['settlementAddR.governmentShortName'], data['streetFull'], data['houseNumAddR'], data['flatNumAddR']]).join(', ');

					// payerAddress.setValue(addressFull);

					let square = 1,
						privStartDate = data["privilegeStartDate"] && new Date(data["privilegeStartDate"]) || null,
						privEndDate = data["privilegeEndDate"] && new Date(data["privilegeEndDate"]) || null,
						checkStartDate = new Date(currYear, 0, 1), //01.01 поточного року
						checkEndDate = new Date(currYear, 11, 31), //31.12 поточного року
						useType = item.useType;

					checkStartDate.setMinutes(-checkStartDate.getTimezoneOffset());
					checkEndDate.setMinutes(-checkEndDate.getTimezoneOffset());

					checkStartDate = checkStartDate.getTime();
					checkEndDate = checkEndDate.getTime();

					let r = exemption[personType == 'PHYSICAL' ? "inv_exemptionPhysDict" : "inv_exemptionLegDict"][data[byexemptionTypeId]],
						extractSum = 0, //значення з довідника пільгових категорій відповідно до пільгової категорії ТА виду використання
						monthWithPriv = 1,
						monthWithoutPriv = 1,
						sumMonthPriv = 0, //ЯКЩО юр.особа має пільгу ТО Сума міс з пільгою = 0
						sumMonthNoPriv = 0, //Сума міс без пільги
						fieldList = [],
						Ki = ['ID', landCategory == 'NOT_AGRICULTURAL' ? 'notSGindex' : 'SGindex'],
						currCalcParams = calcParamsGrid[item.calcParamsID];
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

					if (calcParams) {
						//ЯКЩО Дата держреєстрації ≤ 01,01 поточного року
						if (regDate && regDate.getTime() <= checkStartDate) {
							if ((exCategory && privEndDate && acceptPrivilege && privEndDate.getTime() < checkStartDate) || (!exCategory) || (!acceptPrivilege)) //Значення в полі "Пільгова категорія" є ТА дата закінчення пільги < 01,01 поточного року АБО пільги для власника немає
							{
								square = totalArea; //S  (Площа, що оподатковується) = Загальна площа
								sumYear = currCalcParams[fieldList[0]] ? (square * calcParams[Ki[1]] * currCalcParams[fieldList[0]]).toFixed(2) : 0;    //Сума(рік) = S* *Кі*Ставка податку(відп)
							}
							else if (privStartDate) {
								square = totalArea - extractSum; //S = Площа загальна – значення з довідника пільгових категорій відповідно до пільгової категорії ТА виду використання.
								square < 0 && (square = 0);
								if (privStartDate <= checkStartDate && (privEndDate && privEndDate.getTime() >= checkEndDate || !privEndDate)) { //дата початку пільги ≤ 01,01 поточного року ТА (дата закінчення пільги >= 31,12 поточного року АБО порожнє)
									sumYear = personType == 'PHYSICAL' && currCalcParams[fieldList[0]] ?
										(square * calcParams[Ki[1]] * currCalcParams[fieldList[0]]).toFixed(2) ://Фіз особа: Сума(рік) = S* *Кі*Ставка податку(відп)
										0;    //Юр.особа: Сума(рік) з пільгою = 0

								} else if (privStartDate.getTime() > checkStartDate || (privEndDate && privEndDate.getTime() < checkEndDate)) { //дата початку пільги >01,01 поточного року АБО дата закінчення пільги < 31,12 поточного року
									//визначаємо кількість місяців дії пільги
									monthWithPriv = 12 - (new Date(privStartDate).getDate() > 1 ? new Date(privStartDate).getMonth() + 1 : new Date(privStartDate).getMonth()); //к-сть місяців з пільгою
									monthWithoutPriv = 12 - monthWithPriv; //к-сть місяців без пільги

									if (currCalcParams[fieldList[0]]) {
										sumMonthNoPriv = totalArea * calcParams[Ki[1]] * currCalcParams[fieldList[0]] / 12; // Сума(міс) без пільги = Площа загальна*Кі*Ставка податку(відп)/12
										sumMonthPriv = personType == 'PHYSICAL' ?
											square * calcParams[Ki[1]] * currCalcParams[fieldList[0]] / 12 : //Фіз особа: Сума(міс) з пільгою = S*Кі*Ставка податку(відп)/12
											0; // Юр.особа: Сума(міс) з пільгою = 0

										sumYear = (sumMonthPriv * monthWithPriv + sumMonthNoPriv * monthWithoutPriv).toFixed(2); //Сума за рік  = Сума міс з пільгою * К-ть міс дії пільги + Сума міс без пільги* К-ть міс без пільги
									}
									else sumYear = 0;
								}
							}

						}
						else if (regDate && regDate.getTime() > checkStartDate) { //ЯКЩО Дата держреєстрації > 01,01 поточного року
							if ((exCategory && privEndDate && privEndDate.getTime() < checkStartDate) || (!exCategory) || (!acceptPrivilege)) //Значення в полі "Пільгова категорія" є ТА дата закінчення пільги < 01,01 поточного року АБО пільги для власника немає
							{
								square = totalArea; //S  (Площа, що оподатковується) = Загальна площа
								monthWithPriv = 12 - regDate.getMonth(); // К-ть міс =  12 – порядковий номер місяця з дати держреєстрації +1
								sumYear = fieldList[1] ? (square * calcParams[fieldList[0]] * currCalcParams[fieldList[0]] / 12 * monthWithPriv).toFixed(2) : 0; //Сума(рік) = S*Кі*Ставка податку(відп)/12* к-ть місяців
							}
							else {
								square = totalArea - extractSum; //S = Площа загальна – значення з довідника пільгових категорій відповідно до пільгової категорії ТА виду використання.
								square < 0 && (square = 0);
								if (privStartDate && privStartDate.getTime() <= checkStartDate && (privEndDate && privEndDate.getTime() >= checkEndDate || !privEndDate)) { //дата початку пільги ≤ 01,01 поточного року ТА (дата закінчення пільги > 31,12 поточного року АБО порожнє)
									monthWithPriv = 12 - regDate.getMonth(); // К-ть міс =  12 – порядковий номер місяця з дати держреєстрації +1
									sumYear = personType == 'PHYSICAL' && currCalcParams[fieldList[0]] ?
										(square * calcParams[Ki[1]] * currCalcParams[fieldList[0]] / 12 * monthWithPriv).toFixed(2) : //Сума(рік) = S*Кі*Ставка податку(відп)/12* к-ть місяців
										0; // Юр.особа: Сума(міс) з пільгою = 0

								} else if ((privStartDate && privStartDate.getTime() > checkStartDate) || (privEndDate && privEndDate.getTime() < checkEndDate)) { //дата початку пільги >01,01 поточного року АБО дата закінчення пільги < 31,12 поточного року
									//визначаємо кількість місяців дії пільги
									if (privStartDate) monthWithPriv = 12 - (privStartDate.getDate() > 1 ? privStartDate.getMonth() + 1 : privStartDate.getMonth()); //к-сть місяців з пільгою
									monthWithoutPriv = 11 - regDate.getMonth() + 1 - monthWithPriv; // К-ть міс без пільги=  12 – порядковий номер місяця з дати держреєстрації +1
									if (fieldList[1]) {
										sumMonthNoPriv = totalArea * calcParams[Ki[1]] * currCalcParams[fieldList[0]] / 12; // Сума(міс) без пільги = Площа загальна*Кі*Ставка податку(відп)/12
										sumMonthPriv = personType == 'PHYSICAL' ?
											square * calcParams[Ki[1]] * currCalcParams[fieldList[0]] / 12 : //Фіз особа: Сума(міс) з пільгою = S*Кі*Ставка податку(відп)/12
											0; // Юр.особа: Сума(міс) з пільгою = 0
										sumYear = (sumMonthPriv * monthWithPriv + sumMonthNoPriv * monthWithoutPriv).toFixed(2); //Сума за рік  = Сума міс з пільгою * К-ть міс дії пільги + Сума міс без пільги* К-ть міс без пільги
									}
									else sumYear = 0;
								}
							}
						}
					}
				}
			}

			ds_taxes.run('insert', {
				__skipSelectAfterInsert: true,
				execParams: {
					ID: ds_taxes.generateID(),
					reportYear: params.year,
					name: activePayer && activePayer.ID || null,
					payerAddress: addressFull,
					privilege: activePayer && payers[activePayer.payerID] && (payers[activePayer.payerID]['personType'] == 'PHYSICAL' ? payers[activePayer.payerID]['privilegePhysID.exemptionCat'] : payers[activePayer.payerID]['privilegeLegID.exemptionCat']) || null,
					privilegeStartDate: activePayer && payers[activePayer.payerID] && payers[activePayer.payerID]['privilegeStartDate'] || null,
					sumYear: (sumYear && parseFloat(sumYear)) || 0,
					objectID: item.ID,
					skipBeforeInsert: true
				}
			});
		});
	}
	else {
		let realtyObject = UB.Repository('inv_realtyObject')
			.attrs('ID', 'koattNum', 'owner', 'totalArea', 'registryData', 'notToLive', 'notTaxed', 'realtyType', 'location', 'acceptPrivilege')
			.selectAsObject()
		let calcRealtyParams = UB.Repository('inv_calcRealtyParams')
				.attrs('*')
				.where('year', '=', params.year)
				.selectSingle(),
			calcRealtyParamsGrid = _.keyBy(UB.Repository('inv_calcRealtyParamsGrid')
				.attrs('*')
				.where('calcParamsID', '=', calcRealtyParams.ID)
				.selectAsObject(), 'ID'),
			taxRealtyPay = UB.Repository('inv_taxRealtyPay')
				.attrs('*')
				.where('year', '=', params.year);
		realtyObject.forEach((item) => {
			let activePayer = activePayers[item.ID],
				addressFull = null,
				planSum = 0;

			if (activePayer && item.calcParamsID) {
				let data = payers[activePayer.payerID],
					totalArea = item.totalArea, //Загальна площа
					regDate = new Date(item.registryData), //Дата держреєстрації
					// privilege = form.getField('privilege'),
					// payerAddress = form.getField('payerAddress'),
					// privilegeStartDate = form.queryById('privStartDate'),
					// objType = form ? form.objType : undefined,
					personType = data && (data["personType"] ? data["personType"] : 'PHYSICAL') || null,
					acceptPrivilege = item.acceptPrivilege;

				if (data) {
					// privilege.setValue(exCategory);
					// privilegeStartDate.setValue(data['privilegeStartDate']);
					if (data['areaAddR']) data['areaAddR'] += ' обл.';
					if (data['streetAddR.street']) data['streetFull'] = `${data['streetTypeAddR.name']} ${data['streetAddR.street']}`;
					if (data['flatNumAddR']) data['flatNumAddR'] = 'кв. ' + data['flatNumAddR'];
					addressFull = _.compact([data['areaAddR'], data['regionAddR'], data['settlementAddR.governmentShortName'], data['streetFull'], data['houseNumAddR'], data['flatNumAddR']]).join(', ');

					let square = 1,
						monthWithPriv = 0,
						checkStartDate = new Date(currYear, 0, 1), //01.01 поточного року
						realtyTrue = {FLAT: 'flat', HOUSE: 'house', RESIDENTIAL_PROPERTY: 'otherRealtyObj'},//realtyTrue[realtyType]
						currCalcParams = calcRealtyParamsGrid[item.calcParamsID];

					checkStartDate.setMinutes(-checkStartDate.getTimezoneOffset());
					checkStartDate = checkStartDate.getTime();

					if (item.notToLive || item.notTaxed) { //ЯКЩО заповнено поле «Не оподатковується» АБО «Непридатна для проживання» ТО планова сума податку = 0
						planSum = 0;
						// form.getField('sumYear').setValue(planSum);
					}
					else {
						let payTypeSum = 0;

						if (calcRealtyParams) {
							//ЯКЩО власник – фіз.особа
							//ТА тип об’єкта нерухомості = 1 АБО 2 АБО 3
							let extrParam = 0;
							let fieldList = [];
							switch (personType) {
								case 'PHYSICAL':
									fieldList.push(item.location === 'INLOCAL' ? 'physZ1' : 'physZ2');
									break;
								default:
									fieldList.push(item.location === 'INLOCAL' ? 'legalZ1' : 'legalZ2');
									break;
							}

							if (taxRealtyPay) {
								extrParam = taxRealtyPay[realtyTrue[item.realtyType]] || 0;

								if (personType == 'PHYSICAL' && acceptPrivilege && realtyTrue[item.realtyType] && totalArea < extrParam * 5) { ////ТА загальна площа <  Відповідний параметр*5
									square = totalArea - extrParam >= 0 ? totalArea - extrParam : 0; // ТО Площа, що оподатковується = Загальна площа – Відповідний параметр. (Якщо значення від’ємне, то Площа, що оподатковується =0)
								}
								else square = totalArea; //ІНАКШЕ Площа, що оподатковується = Загальна площа

								//Ставка податку
								if (!realtyTrue[item.realtyType]) {
									payTypeSum = calcRealtyParams.forRooms;
								}
								else {
									payTypeSum = currCalcParams[fieldList[0]];
								}

								/*if (item.location == 'INLOCAL') {
								payTypeSum = personType == 'PHYSICAL' ? calcRealtyParams.inSettlementPhys : calcRealtyParams.inSettlementLeg
							}
							else {
								payTypeSum = personType == 'PHYSICAL' ? calcRealtyParams.outSettlementPhys : calcRealtyParams.outSettlementLeg
							}*/

								if (regDate.getTime() < checkStartDate) { //ЯКЩО Дата держреєстрації < 01,01 поточного року
									planSum = square * payTypeSum; //ТО Планова сума податку = S*Ставка податку
								}
								else {
									monthWithPriv = 11 - regDate.getMonth() + 1;//Кіл-ть місяців =12 – порядковий номер місяця з дати держреєстрації +1.
									planSum = square * payTypeSum / 12 * monthWithPriv; // Сума(рік) = S*Ставка податку/12*к-ть місяців
								}

								//ЯКЩО тип об’єкта нерухомості = 1 ТА загальна площа > 300
								//АБО тип об’єкта нерухомості = 2 ТА загальна площа > 500
								if ((item.realtyType == 'FLAT' && item.totalArea > 300) || (item.realtyType == 'HOUSE' && item.totalArea > 500)) {
									planSum = (planSum + 25000).toFixed(2); //ТО Планова сума податку = S*Ставка податку + 25000
								}
							}
						}
					}
				}
			}

			ds_taxes.run('insert', {
				__skipSelectAfterInsert: true,
				execParams: {
					ID: ds_taxes.generateID(),
					reportYear: params.year,
					name: activePayer && activePayer.ID || null,
					payerAddress: addressFull,
					privilege: activePayer && payers[activePayer.payerID] && (payers[activePayer.payerID]['personType'] == 'PHYSICAL' ? payers[activePayer.payerID]['privilegePhysID.exemptionCat'] : payers[activePayer.payerID]['privilegeLegID.exemptionCat']) || null,
					privilegeStartDate: activePayer && payers[activePayer.payerID] && payers[activePayer.payerID]['privilegeStartDate'] || null,
					sumYear: (planSum && parseFloat(planSum)) || 0,
					objectID: item.ID,
					skipBeforeInsert: true
				}
			});
		});

	}
};

me.entity.addMethod("beforeinsert");
me.entity.addMethod("beforeupdate");
me.entity.addMethod("insertNewTaxByYear");
