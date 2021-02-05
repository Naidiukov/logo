const me = inv_payers;
// const LocalDataStore = require('@unitybase/base').LocalDataStore;
const XlsxTemplate = require('xlsx-template');
const fs = require('fs');
const path = require('path');
const Docxtemplater = require('docxtemplater');
const JSZip = require('jszip');
const _ = require('lodash');
const UB = require('@unitybase/ub');
const Session = UB.Session;
const moment = require('moment')
var getDate = function (date, isStr) {
	if (Ext.isString(date)) {
		date = new Date(date);
	}
	if (date) {
		var date1 = new Date(date);
		date1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
		date1.setMinutes(-date1.getTimezoneOffset());
		return isStr ? Ext.Date.format(date1, 'd.m.Y') : date1;
	}
};

var splitStr = function (str, length) {
	let strArr = str.split(' '),
		str1 = '',
		str2 = '';
	for (let i = 0; i < strArr.length; i++) {
		if (`${str1} ${strArr[i]}`.length <= length) {
			str1 += ' ' + strArr[i];
		} else {
			str2 = strArr.splice(i, strArr.length - i).join(' ');
			break;
		}
	}

	return {str1: str1.trim(), str2: str2.trim()};
};

me.getApplDoc = function (fake, req, resp) {
	var param = req.parameters.split('&'),
		params = {};
	param.forEach((elem) => {
		let a = elem.split('=');
		params[a[0]] = a[1]
	});
	var fileName = {
			applRegLPlace: 'Pro_reyestraciyu_miscya_prozhyvannya.docx',
			applBabyReg: 'Reyestraciya_prozhyvannya_malolitnoyi_dytyny.docx',
			applRemoveLReg: 'Znyattya_z_reyestraciyi_miscya_prozhyvannya.docx',
			applBaby: 'Dani_pro_novonarodzheny_dytyny.docx',
			applRegPos: 'Zayava_reyestraciya_miscya_perebyvannya.docx',
			noticeRemoveLPLace: 'Povidoml_pro_znyattya_z_ reyestraciyi.docx',
			noticeCancelLPLace: 'Povidoml_pro_skasuvanya_reyestraciyi.docx',
			personLPlace: 'dovidka_pro_reyestraciyi_miscya_prozhyvannya.docx',
			personPosPlace: 'dovidka_pro_reyestraciyi_miscya_perebuvannya.docx',
			personRemoveLPLace: 'dovidka_pro_znyattya_reyestraciyi_miscya_prozhyvannya.docx',

		},
		methodName = '';


	var templatePath = path.join(process.configPath, 'docTemplate', fileName[params.code]);
	var content = fs.readFileSync(templatePath, {encoding: 'bin'});
	var zip = new JSZip(content);
	var doc = new Docxtemplater();
	doc.nullGetter = function (part) {
		if (!part.module) {
			return "";
		}

		return "";
	};
	doc.loadZip(zip);

	switch (params.code) {
		case 'applBabyReg':
			methodName = 'getApplBabyRegData'
			break;
		case 'applRegPos':
			methodName = 'getApplRegPos'
			break;
		case 'applRemoveLReg':
			methodName = 'getApplRemoveLReg'
			break;
		case 'applRegLPlace':
		case 'applBaby':
			methodName = 'getApplData';
			break;
		case 'personLPlace':
			methodName = 'getPersonLPlace'
			break;
		case 'noticeRemoveLPLace':
		case 'noticeCancelLPLace':
		case 'personPosPlace':
		case 'personRemoveLPLace':
			methodName = 'getCertifData';
			break;
	}

	var data = me[methodName]({mParams: {execParams: params}, noCtx: true});
	doc.setData(data);
	try {
		doc.render()
	}
	catch (error) {
		var e = {
			message: error.message,
			name: error.name,
			stack: error.stack,
			properties: error.properties,
		};
		console.log(JSON.stringify({error: e}));

		throw error;
	}

	var buf = doc.getZip().generate({type: 'ArrayBuffer'});


	//fs.writeFileSync(path.resolve(__dirname, 'Про_реєстрацію місця проживання.docx'), buf);
	resp.writeEnd(buf);
	resp.writeHead('Content-type:  application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition: inline; filename="' + fileName[params.code] + '"');
	resp.statusCode = 200;

};

me.beforeinsert = function (ctx) {
	let params = ctx.mParams.execParams;
	if (params.birthCertificateSeries || params.birthCertificateNum) {
		ctx.mParams.execParams.birthCertificate = params.birthCertificateSeries ? `${params.birthCertificateSeries}${(params.birthCertificateNum && ' ' + params.birthCertificateNum || '')}` : (params.birthCertificateNum || null);
	}

	if (params.deathCertificateSeries || params.deathCertificateNum) {
		ctx.mParams.execParams.deathCertificate = params.deathCertificateSeries ? `${params.deathCertificateSeries}${(params.deathCertificateNum && ' ' + params.deathCertificateNum || '')}` : (params.deathCertificateNum || null);
	}
};

me.afterinsert = function (ctx) {

};
me.afterupdate = function (ctx) {

};
me.afterdelete = function (ctx) {

};

// needed for history to work correctly
me.beforeupdate = function (ctx) {
	let params = ctx.mParams.execParams,
		currCert;

	if (params.birthCertificateSeries || params.birthCertificateNum || params.deathCertificateSeries || params.deathCertificateNum) {
		currCert = UB.Repository('inv_payers')
			.attrs('birthCertificateSeries', 'birthCertificateNum', 'deathCertificateSeries', 'deathCertificateNum')
			.selectById(params.ID)
	}
	if (params.birthCertificateSeries || params.birthCertificateNum) {
		let birthCertificateSeries = params.birthCertificateSeries || currCert.birthCertificateSeries,
			birthCertificateNum = params.birthCertificateNum || currCert.birthCertificateNum;
		ctx.mParams.execParams.birthCertificate = params.birthCertificateSeries ? `${params.birthCertificateSeries}${(params.birthCertificateNum && ' ' + params.birthCertificateNum || '')}` : (params.birthCertificateNum || null);
	}

	if (params.deathCertificateSeries || params.deathCertificateNum) {
		let deathCertificateSeries = params.deathCertificateSeries || currCert.deathCertificateSeries,
			deathCertificateNum = params.deathCertificateNum || currCert.deathCertificateNum;
		ctx.mParams.execParams.deathCertificate = params.deathCertificateSeries ? `${params.deathCertificateSeries}${(params.deathCertificateNum && ' ' + params.deathCertificateNum || '')}` : (params.deathCertificateNum || null);
	}
};
me.beforedelete = function (ctx) {

};

me.afterbeforeupdate = function (ctx) {

};

me.afterbeforedelete = function (ctx) {

};

me.afterselect = function (ctx) {

	// var innerArray = JSON.parse(ctx.dataStore.asJSONArray);
	//
	// function initStore(store, dataJSONArray, fieldList) {
	//     store.initialize(LocalDataStore.flatten(fieldList ? fieldList : ["*"], dataJSONArray));
	// }
	//
	// if (innerArray.rowCount > 0) initStore(ctx.dataStore, innerArray);

};

me.selectSearch = function (ctx) {
	me.selectSearchImpl(ctx, function (key) {
		var i = key.indexOf(".");
		var entityCode = (i > 0) ? key.substr(0, i) : "";
		var attrCode = (i >= 0) ? key.substr(i + 1) : key;

		return {entityCode: entityCode, attrCode: attrCode};
	});
};

me.selectSearchImpl = function (ctx, splitKey) {
	var mParams = ctx.mParams;
	var searchParams = mParams.searchParams || {};

	var whereLists = {};
	var searchAttributes = [];
	var searchAttributeItems = [];
	var mapping = {
		military: function (whereListItem) {
			return {
				alias: "byMilitary",
				masterAttr: "ID",
				detailEntity: "pgo_militaryInOut",
				detailMethod: "select",
				detailAttr: "payerID"
			};
		},
		regInfoFrom: function (whereListItem) {
			return {
				alias: "byRegInfoFrom",
				masterAttr: "ID",
				detailEntity: "comm_regInfoFrom",
				detailMethod: "select",
				detailAttr: "payerID"
			};
		},
		regInfoCurr: function (whereListItem) {
			return {
				alias: "byRegInfoCurr",
				masterAttr: "ID",
				detailEntity: "comm_regInfoCurr",
				detailMethod: "select",
				detailAttr: "payerID"
			};
		},
		commAttach: function (whereListItem) {
			return {
				alias: "byCommAttach",
				masterAttr: "ID",
				detailEntity: "comm_commAttachment",
				detailMethod: "select",
				detailAttr: "payerID"
			};
		},
		cognationInfo: function (whereListItem) {
			return {
				alias: "byCognation",
				masterAttr: "ID",
				detailEntity: "comm_cognationInfo",
				detailMethod: "select",
				detailAttr: "payerID"
			};
		}
	};

	function processSearchParams(searchParams, splitKey, whereLists, whereListsMapping, searchAttributes, searchAttributeItems) {
		_.forOwn(searchParams, function (value, key) {
			var splitedKey = splitKey(key);

			var entityCode = splitedKey.entityCode;
			var attrCode = splitedKey.attrCode;

			if (!whereLists[entityCode])
				whereLists[entityCode] = {};

			if (value == null) {
				searchAttributes.push({code: key, isNull: true});
				whereLists[entityCode]["by" + attrCode.replace(".", "_") + "IsNull"] = {
					expression: "[" + attrCode + "]",
					condition: "isNull"
				};
			} else if (value.value !== undefined) {
				if (typeof value.value == "string")
					searchAttributes.push({code: key, stringValue: value.value});
				else if (typeof value.value == "number")
					searchAttributes.push({code: key, idValue: value.value});
				else if (typeof value.value == "boolean")
					searchAttributes.push({code: key, booleanValue: (value.value) ? "1" : "0"});
				whereLists[entityCode]["by" + attrCode.replace(".", "_") + "Value"] = {
					expression: "[" + attrCode + "]",
					condition: "equal",
					values: {value: value.value}
				};
			} else if (value.pattern !== undefined) {
				searchAttributes.push({code: key, patternValue: value.pattern});
				var isLikeIdx = value.pattern.indexOf('%');
				//if (isLikeIdx==0) {
				whereLists[entityCode]["by" + attrCode.replace(".", "_") + "Pattern"] = {
					expression: "[" + attrCode + "]",
					condition: (isLikeIdx == 0) ? "like" : "startWith",
					values: {value: value.pattern}
				};
				//}
				// else {
				//     var startPattern = value.pattern.slice(0, isLikeIdx);
				//     var endPattern = startPattern + "99999999999999999999"; // in UKRAINIAN_CI 9 is the last character in nlssort order
				//     whereLists[entityCode]["by" + attrCode.replace(".", "_") + "Pattern1"] = { expression: "[" + attrCode + "]", condition: ">=", values: { value: startPattern } };
				//     whereLists[entityCode]["by" + attrCode.replace(".", "_") + "Pattern2"] = { expression: "[" + attrCode + "]", condition: "<", values: { value: endPattern } };
				//     if (isLikeIdx<value.pattern.length-1)
				//         whereLists[entityCode]["by" + attrCode.replace(".", "_") + "Pattern"] = { expression: "[" + attrCode + "]", condition: "startWith", values: { value: value.pattern } };
				// }
			} else if (value.values !== undefined) {
				var sal = {code: key, isList: true};
				_.forEach(value.values, function (val) {
					if (typeof val == "string")
						searchAttributeItems.push({searchAttribute: sal, stringValue: val});
					else if (typeof val == "number")
						searchAttributeItems.push({searchAttribute: sal, idValue: val});
				});
				searchAttributes.push(sal);
				whereLists[entityCode]["by" + attrCode.replace(".", "_") + "List"] = {
					expression: "[" + attrCode + "]",
					condition: "in",
					values: {values: value.values}
				};
			} else {
				var sar = {code: key};
				if (value.from !== undefined) {
					if (typeof value.from == "number")
						sar.currencyValueFrom = value.from;
					else if (value.to instanceof Date)
						sar.dateValueFrom = value.from;
					whereLists[entityCode]["by" + attrCode.replace(".", "_") + "From"] = {
						expression: "[" + attrCode + "]",
						condition: "moreEqual",
						values: {value: value.from}
					};
				}
				if (value.to !== undefined) {
					if (typeof value.to == "number")
						sar.currencyValueTo = value.to;
					if (value.to instanceof Date) {
						sar.dateValueTo = value.to;
						value.to = new Date(value.to.valueOf() + 24 * 60 * 60 * 1000 - 1);
					}
					whereLists[entityCode]["by" + attrCode.replace(".", "_") + "To"] = {
						expression: "[" + attrCode + "]",
						condition: "lessEqual",
						values: {value: value.to}
					};
				}
				searchAttributes.push(sar);
			}
		});

		if (whereListsMapping) {
			_.forEach(whereListsMapping, function (mapping, key) {
				var originalItem = whereLists[key];
				if (originalItem) {
					var mappingDesc = mapping(originalItem);
					if (mappingDesc) {
						if (!whereLists[""])
							whereLists[""] = {};
						whereLists[""][mappingDesc.alias] = {
							'expression': '[' + splitKey(mappingDesc.masterAttr).attrCode + ']',
							"condition": "subquery",
							"subQueryType": "squtIn", //squtIn, squtExists, squtNotIn, squtNotExists
							"values": {
								"entity": mappingDesc.detailEntity,
								"method": mappingDesc.detailMethod,
								"fieldList": [mappingDesc.detailAttr],
								"whereList": originalItem
							}
						}
					}
				}
			});
		}

		if (!mParams.whereList)
			mParams.whereList = {};


		_.assign(mParams.whereList, whereLists[""]);

		ctx.dataStore.run("select", mParams);
		let resultCount = ctx.dataStore.rowCount;
		if (mParams.options.totalRequired) {
			ctx.dataStore.currentDataName = "__totalRecCount";
			mParams.__totalRecCount = ctx.dataStore.rowCount ? ctx.dataStore.get(0) : resultCount;
			ctx.dataStore.currentDataName = "";
		}
		delete mParams.__nativeDatasetFormat;
	}

	processSearchParams(searchParams, splitKey, whereLists, mapping, searchAttributes, searchAttributeItems);
};

me.getObjAttNewID = function (ctx) {
	var notifAttachDS = UB.DataStore("comm_commAttachment");
	ctx.mParams.attachID = notifAttachDS.generateID();
};

me.getCertifData = function (ctx) {
	let params = ctx.mParams.execParams,
		data = JSON.parse(UB.Repository("inv_payers")
			.attrs(["lastName", "prevLastName", "firstName", "middleName", "birthDate", "countryB.name", "areaB", "regionB", "settlementB.governmentShortName", "natalPlaceB", "nationality.name", "EDDRecordNum",
				"areaAddR", "regionAddR", "settlementAddR.governmentShortName", "streetTypeAddR.name", "streetAddR.street", "houseNumAddR", "flatNumAddR", "areaAddL", "settlementAddL.governmentShortName", "streetTypeAddL.name",
				"streetAddL.street", "houseNumAddL", "flatNumAddL"])
			.where("[ID]", '=', parseInt(params.payerID))
			.select().asJSONObject.replace(/\.name/g, '_name'))[0];

	if (params.personPosPlace) {
		data.addrPlace1 = _.compact([data['areaAddL'], data['settlementAddL.governmentShortName']]).join(', ');
		data.addrPlace2 = data['streetAddL.street'] ? _.compact([`${data['streetTypeAddL_name']} ${data['streetAddL.street']}`, data['houseNumAddL'], data['flatNumAddL']]).join(', ') : _.compact([data['houseNumAddL'], data['flatNumAddL']]).join(', ');
		if (data.addrPlace2) data.addrPlace1 += ',';
	}
	else if (params.personLPlace) {
		data.addrPlace1 = _.compact([data['areaAddR'], data['regionAddR'], data['settlementAddR.governmentShortName']]).join(', ');
        data.addrPlace2 = data['streetAddR.street'] ? _.compact([`${data['streetTypeAddR_name']} ${data['streetAddR.street']}`,`буд.  ${data['houseNumAddR']}`, `кв.  ${data['flatNumAddR']}`]).join(', ') : _.compact([(data['houseNumAddR']?`буд. ${data['houseNumAddR']}`:''),(data['flatNumAddR']? `кв. ${data['flatNumAddR']}`:'')]).join(', ');
        let regInfoCurr = UB.Repository("comm_regInfoCurr")
            .attrs(["regDate", "regUnit.name"])
            .where("[payerID]", '=', parseInt(params.payerID))
						.where("[state]","=","REGISTERED")
            .selectAsObject()[0];
        if (!regInfoCurr) throw new Error("<<< Відсутні дані у Інформація про реєстрацію. >>>");
        data.regDate = getDate(regInfoCurr.regDate, true);
	}
	else {
		let regInfoCurr = UB.Repository("comm_regInfoCurr")
			.attrs(["regDate", "regUnit.name", "regUnit.nameNom", "payerID", "state"])
			.where("[payerID]", '=', parseInt(params.payerID))
			.orderByDesc("removeDate");

		if (params.regCurrID) {
			regInfoCurr.attrs(["removeDate", "rRegUnit.name", "rReason", "rCountry", "rCountry.name", "rArea", "rRegion", "rSettlement.governmentShortName", "rStreetType.name", "rStreet.street", "rHouseNum", "rFlatNum", "rPostIndex", "rLivePlace",
				"rDocType.name", "rSeries", "rNum", "rIssueDate", "rDocRegUnit.name", "rValidTo"])
				.where("[ID]", '=', parseInt(params.regCurrID));
		}
		if (params.state) {
			regInfoCurr.attrs(["cancelReason.name"]);
		}
		if (params.personRemoveLPLace || params.noticeCancelLPLace || params.code === 'noticeRemoveLPLace') {
			regInfoCurr.attrs(["area", "region", "settlement.governmentShortName", "streetType.name", "street.street", "houseNum", "flatNum", "postIndex"]);
		}

		regInfoCurr = regInfoCurr.selectAsObject({'rDocType.name': 'rDocTypeName'})[0];

		if (regInfoCurr) {
			if(regInfoCurr['houseNum']) regInfoCurr['houseNum'] = 'б. ' + regInfoCurr['houseNum'];
			if(regInfoCurr['flatNum']) regInfoCurr['flatNum'] = 'кв. ' + regInfoCurr['flatNum'];

			if(regInfoCurr['rHouseNum']) regInfoCurr['rHouseNum'] = 'б. ' + regInfoCurr['rHouseNum'];
			if(regInfoCurr['rFlatNum']) regInfoCurr['rFlatNum'] = 'кв. ' + regInfoCurr['rFlatNum'];

			data.regUnitName = regInfoCurr["regUnit.name"];
			data.regUnitNameNom = regInfoCurr["regUnit.nameNom"];

			data.rCountry = regInfoCurr["rCountry.name"];

			if (data['areaAddR']) data['areaAddR'] = data['areaAddR'] + ' область';

			if (regInfoCurr['rArea']) regInfoCurr['rArea'] = regInfoCurr['rArea'] + ' область';
			if (regInfoCurr['removeDate']) regInfoCurr['removeDate'] = getDate(regInfoCurr['removeDate'], true);
			if (regInfoCurr.state === 'DISMISSED') {
				if (regInfoCurr['rCountry'] == 333658698055681) {
					data.addrToPlace1 = params.personRemoveLPLace ? _.compact([regInfoCurr['rArea'], regInfoCurr['rRegion"']]).join(', ') : _.compact([regInfoCurr['rCountry.name'], regInfoCurr['rArea'], regInfoCurr['rRegion"']]).join(', ');
					data.addrToPlace2 = _.compact([regInfoCurr['rSettlement.governmentShortName'], (regInfoCurr['rStreet.street'] ? `${regInfoCurr['rStreetType.name']} ${regInfoCurr['rStreet.street']}` : regInfoCurr['rStreet.street']), regInfoCurr['rHouseNum'], regInfoCurr['rFlatNum'], regInfoCurr['rPostIndex']]).join(', ');
				}
				else data.addrToPlace1 = _.compact([regInfoCurr['rLivePlace']]).join(', ');
				if (data.addrToPlace2) data.addrToPlace1 += ',';
				if (params.personRemoveLPLace || params.noticeCancelLPLace) {
					data.addrPlace1 = _.compact([regInfoCurr['area'], regInfoCurr['settlement.governmentShortName']]).join(', ');
					data.addrPlace2 = regInfoCurr['street.street'] ? _.compact([(regInfoCurr['street.street'] ? `${regInfoCurr['streetType.name']} ${regInfoCurr['street.street']}` : regInfoCurr['rStreet.street']), regInfoCurr['houseNum'], regInfoCurr['flatNum']]).join(', ') : _.compact([regInfoCurr['houseNum'], regInfoCurr['flatNum']]).join(', ');
				}
				else {
					data.addrPlace1 = _.compact([data['areaAddR'], data['settlementAddR.governmentShortName']]).join(', ');
					data.addrPlace2 = data['streetAddR.street'] ? _.compact([`${data['streetTypeAddR_name']} ${data['streetAddR.street']}`, data['houseNumAddR'], data['flatNumAddR']]).join(', ') : _.compact([data['houseNumAddR'], data['flatNumAddR']]).join(', ');
				}
				if (data.addrPlace2) data.addrPlace1 += ',';
			}
			else if (params.code === 'noticeRemoveLPLace' || params.code === 'personRemoveLPLace') removeLPLaceData(regInfoCurr, data)

			if (regInfoCurr['rIssueDate']) regInfoCurr['rIssueDate'] = getDate(regInfoCurr['rIssueDate'], true);
			if (regInfoCurr['rValidTo']) regInfoCurr['rValidTo'] = getDate(regInfoCurr['rValidTo'], true);
			data.docData = _.compact([regInfoCurr['rDocTypeName'], _.compact([regInfoCurr['rSeries'], regInfoCurr['rNum']]).join(' '), regInfoCurr['rIssueDate'], regInfoCurr['rDocRegUnit.name'], regInfoCurr['rValidTo']]).join(', ');
			data.cancelReason = regInfoCurr ? regInfoCurr["cancelReason.name"] : '';

			if (params.state) {
				data.isAddrReg = params.state == 'CANCELEDREG';
			}
		}
	}

	if (!data.regUnitName) {
		let defaultRegUnit = UB.Repository('inv_regUnit')
			.attrs(['name', 'nameNom'])
			.where('isRegAuth', '=', 1)
			// .where('mi_createUser', '=', Session.userID)
			.selectAsObject()[0];

		if (defaultRegUnit) {
			data.regUnitName = defaultRegUnit.name;
			data.regUnitNameNom = defaultRegUnit.nameNom;
		}
	}

	/*if (params.personRemoveLPLace) {
		data.regUnitName = splitStr(data.regUnitName, 71);
	}*/

	if (data.birthDate) data.birthDate = getDate(data.birthDate, true);

	if (data['areaB']) data['areaB'] = data['areaB'] + ' область';
	data.birthPlace = _.compact([data.birthDate, data['countryB_name'], data['areaB'], data['regionB'], data['settlementB.governmentShortName'], data['natalPlaceB']]).join(', ');


	let position = Session.uData.EmployeePositionName;
	data.currUser = position && position != 'Не вказана' ? `${position}, ${Session.uData.EmployeeShortSNP}` : Session.uData.EmployeeShortSNP;

	// ctx.mParams.payerData = JSON.stringify(data);
	data.currDate = Ext.Date.format(new Date(), 'd.m.Y');
	return data;
};

function removeLPLaceData (regInfoCurr, data) {
	const currRegInfoFrom = UB.Repository('comm_regInfoFrom')
		.attrs('area', 'settlement.governmentShortName', 'streetType.name', 'street.street', 'houseNum', 'flatNum')
		.where('payerID', '=', regInfoCurr.payerID)
		.limit(1)
		.orderByDesc('mi_createDate')
		.selectSingle() || {}

	if (currRegInfoFrom.area) currRegInfoFrom.area += ' обл.'
	if (currRegInfoFrom.houseNum) currRegInfoFrom.houseNum = 'буд. ' + currRegInfoFrom.houseNum
	if (currRegInfoFrom.flatNum) currRegInfoFrom.flatNum = 'кв. ' + currRegInfoFrom.flatNum

	data.addrPlace1 = _.compact([currRegInfoFrom['area'], currRegInfoFrom['settlement.governmentShortName']]).join(', ');
	data.addrPlace2 = currRegInfoFrom['street.street'] ? _.compact([`${currRegInfoFrom['streetType.name']} ${currRegInfoFrom['street.street']}`, currRegInfoFrom['houseNum'], currRegInfoFrom['flatNum']]).join(', ') : _.compact([currRegInfoFrom['houseNum'], currRegInfoFrom['flatNum']]).join(', ');

	if (regInfoCurr.area) regInfoCurr.area += ' обл.'
	if (regInfoCurr.region) regInfoCurr.region += ' р.'
	if (regInfoCurr) regInfoCurr.houseNum = 'буд. ' + regInfoCurr.houseNum
	if (regInfoCurr.flatNum) regInfoCurr.flatNum = 'кв. ' + regInfoCurr.flatNum

	data.addrToPlace1 = _.compact([regInfoCurr['area'], regInfoCurr['region"']]).join(', ');
	data.addrToPlace2 = _.compact([regInfoCurr['settlement.governmentShortName'], (regInfoCurr['street.street'] ? `${regInfoCurr['streetType.name']} ${regInfoCurr['street.street']}` : regInfoCurr['street.street']), regInfoCurr['houseNum'], regInfoCurr['flatNum'], regInfoCurr['postIndex']]).join(', ');
	if (data.addrToPlace2) data.addrToPlace1 += ',';
}

me.getExcelPersonData = function (fake, req, resp) {
	let param = req.parameters.split('='),
		payerID = param[1];

	let data = {childrenData: {}, personData: {}, fromData: {removeDate: '20  року'}, currAddress: {}},
		personData = UB.Repository('inv_payers')
			.attrs(['lastName', 'firstName', 'middleName', 'prevLastName', 'birthDate', 'nationality.name',
				'countryB', 'countryB.name', 'areaB', 'regionB', 'settlementB.governmentShortName', 'natalPlaceB',
				'areaAddR', 'regionAddR', 'settlementAddR', 'settlementAddR.governmentShortName', 'streetTypeAddR.name', 'streetAddR.street',
				'houseNumAddR', 'flatNumAddR', 'regInfoCurrID', 'regInfoCurrID.settlement', 'regInfoCurrID.regDate', 'regInfoCurrID.docType.name', 'regInfoCurrID.series', 'regInfoCurrID.num', 'regInfoCurrID.issueDate', 'regInfoCurrID.docRegUnit.name'])
			.where('[ID]', '=', payerID)
			.selectAsObject({
				'nationality.name': 'natName',
				'countryB.name': 'countryBName',
				'settlementB.governmentShortName': 'settlementBName',
				'settlementAddR.governmentShortName': 'settlementAddRName',
				'streetTypeAddR.name': 'streeTypeAddRName',
				'streetAddR.street': 'streetAddRName'
			})[0];
	/*fieldsAlias1 = {
	 'nationality.name': 'natName',
	 'countryB.name': 'countryBName',
	 'settlementB.governmentShortName': 'settlementBName',
	 'settlementAddR.governmentShortName': 'settlementAddRName',
	 'streetTypeAddR.name': 'streeTypeAddRName',
	 'streetAddR.street': 'streetAddRName'
	 };

	 personData = LocalDataStore.selectResultToArrayOfObjects(personData, fieldsAlias1)[0];*/

	if (personData) {
		let regInfoFromData = UB.Repository('comm_regInfoFrom')
			.attrs(['removeDate', 'area', 'region', 'settlement', 'settlement.governmentShortName', 'streetType.name',
				'street.street', 'houseNum', 'flatNum', 'postIndex'])
			.where('[payerID]', '=', payerID)
			//.where('[settlement]', '=', personData['regInfoCurrID.settlement'])
			.orderByDesc('removeDate')
			.orderBy('ID')
			.limit(1)
			.selectAsObject({
				'settlement.governmentShortName': 'settlementName',
				'streetType.name': 'streetTypeName',
				'street.street': 'streetName'
			})[0];
		/*regInfoFromData = LocalDataStore.selectResultToArrayOfObjects(regInfoFromData, {
		 'settlement.governmentShortName': 'settlementName',
		 'streetType.name': 'streetTypeName',
		 'street.street': 'streetName'
		 })[0];*/
		data.personData = {
			'lastName': personData.lastName,
			'firstName': personData['firstName'],
			'middleName': personData['middleName'],
			'prevLastName': personData['prevLastName'],
			'birthDate': personData['birthDate'] ? getDate(personData['birthDate'], 'd.m.Y', true) : '',
			'natName': personData['natName'],
			'birthPlace': personData['countryB'] === 333658698055681 ? (_.compact([personData.countryBName, personData.areaB, personData.regionB, personData.settlementBName])).join(', ') : (_.compact([personData.countryBName, personData['natalPlaceB']])).join(', ')
		};

		data.docData = {
			docTypeName: personData['regInfoCurrID.docType.name'],
			series: personData['regInfoCurrID.series'],
			num: personData['regInfoCurrID.num'],
			issueDate: personData['regInfoCurrID.issueDate'] ? getDate(personData['regInfoCurrID.issueDate'], true) : '',
			docRegUnit: personData['regInfoCurrID.docRegUnit.name'] || ''
		};

		if (data.docData.issueDate) data.docData.docRegUnit += data.docData.docRegUnit ? ' ' + data.docData.issueDate : data.docData.issueDate;

		data.currAddress = {
			street: (_.compact([personData['streeTypeAddRName'], personData['streetAddRName']])).join(', '),
			houseNum: personData['houseNumAddR'] ? personData['houseNumAddR'] : '    ',
			flatNum: personData['flatNumAddR'] ? personData['flatNumAddR'] : '   ',
			settlement: personData['settlementAddRName'] ? personData['settlementAddRName'] : '                                          '
		};


		if (personData['regInfoCurrID.regDate'] && personData['regInfoCurrID.settlement']) {
			let dismissedData = UB.Repository('comm_regInfoCurr')
				.attrs(['removeDate', 'settlement', 'rStreetType.name', 'rStreet.street', 'rHouseNum', 'rFlatNum'])
				.where('[state]', '=', 'DISMISSED')
				.where('[removeDate]', '<=', new Date(personData['regInfoCurrID.regDate']))
				.where('[payerID]', '=', payerID)
				.limit(1)
				.orderByDesc('removeDate')
				.orderBy('ID')
				.selectAsObject()[0];

			if (dismissedData && dismissedData['settlement'] == personData['regInfoCurrID.settlement']) {
				data.dismissedData = {
					street: (_.compact([dismissedData['rStreetType.name'], dismissedData['rStreet.street']])).join(', '),
					houseNum: dismissedData['rHouseNum'],
					flatNum: dismissedData['rFlatNum'],
					removeDate: dismissedData['removeDate'] ? getDate(dismissedData['removeDate'], true) + ' року' : '20  року'
				}
			} else if (regInfoFromData && regInfoFromData['settlement'] == personData['regInfoCurrID.settlement'] && regInfoFromData.removeDate && personData['regInfoCurrID.regDate'] && new Date(regInfoFromData.removeDate) <= new Date(personData['regInfoCurrID.regDate'])) {
				data.dismissedData = {
					street: (_.compact([regInfoFromData.streetTypeName, regInfoFromData.streetName])).join(', '),
					houseNum: regInfoFromData['houseNum'],
					flatNum: regInfoFromData.flatNum,
					removeDate: getDate(regInfoFromData['removeDate'], true) + ' року'
				}
			}
			else if (regInfoFromData) {
				data.fromData = {
					removeDate: regInfoFromData['removeDate'] ? getDate(regInfoFromData['removeDate'], true) + ' року' : '20  + року',
					address1: (_.compact([regInfoFromData.area, regInfoFromData.region])).join(', '),
					address2: regInfoFromData.settlementName,
					address3: (_.compact([regInfoFromData.streetTypeName, regInfoFromData.streetName])).join(', '),
					address4: (_.compact([regInfoFromData.houseNum, regInfoFromData.flatNum, regInfoFromData.postIndex])).join(', ')
				};
			}
		} else if (regInfoFromData) {
			data.fromData = {
				removeDate: regInfoFromData['removeDate'] ? getDate(regInfoFromData['removeDate'], true) + ' року' : '20  +  року',
				address1: (_.compact([regInfoFromData.area, regInfoFromData.region])).join(', '),
				address2: regInfoFromData.settlementName,
				address3: (_.compact([regInfoFromData.streetTypeName, regInfoFromData.streetName])).join(', '),
				address4: (_.compact([regInfoFromData.houseNum, regInfoFromData.flatNum, regInfoFromData.postIndex])).join(', ')
			};
		}
	}


	let dateTo = new Date(),
		dateFrom = new Date();
	dateFrom.setHours(0, 0, 0);
	dateTo.setHours(23, 59, 59);
	dateFrom.setFullYear(dateFrom.getFullYear() - 14);
	let children = UB.Repository('comm_cognationInfo')
		.attrs(['cognation.name', 'fullName.fullName', 'fullName.birthDate', 'fullName.regInfoCurrID.regDate',
			'fullName.countryB', 'fullName.countryB.name', 'fullName.areaB', 'fullName.regionB', 'fullName.settlementB.governmentShortName', 'fullName.natalPlaceB'])
		.where('[payerID]', '=', payerID)
		.where('[cognation.name]', 'in', ['син', 'донька'], 'byLower')
		.where('[cognation.name]', 'in', ['Син', 'Донька'], 'byUppFirst')
		.where('[fullName.birthDate]', '>=', dateFrom)
		.where('[fullName.birthDate]', '<=', dateTo)
		.logic('([byLower] or [byUppFirst])')
		.selectAsObject({
			'cognation.name': 'cognation',
			'fullName.fullName': 'fullName',
			'fullName.birthDate': 'birthDate',
			'fullName.regInfoCurrID.regDate': 'regDate',
			'fullName.countryB': 'countryB',
			'fullName.countryB.name': 'countryBName',
			'fullName.areaB': 'areaB',
			'fullName.regionB': 'regionB',
			'fullName.settlementB.governmentShortName': 'settlementBName',
			'fullName.natalPlaceB': 'natalPlaceB'
		});
	/*children = LocalDataStore.selectResultToArrayOfObjects(children, {
	 'cognation.name': 'cognation',
	 'fullName.fullName': 'fullName',
	 'fullName.birthDate': 'birthDate',
	 'fullName.regInfoCurrID.regDate': 'regDate',
	 'fullName.countryB': 'countryB',
	 'fullName.countryB.name': 'countryBName',
	 'fullName.areaB': 'areaB',
	 'fullName.regionB': 'regionB',
	 'fullName.settlementB.governmentShortName': 'settlementBName',
	 'fullName.natalPlaceB': 'natalPlaceB'
	 });*/

	if (children.length) {
		let childrenLength = children.length <= 3 ? children.length : 3;
		for (let i = 0; i < childrenLength; i++) {
			let currData = children[i],
				formatData = {
					cognation: currData.cognation,
					fullName: currData.fullName,
					birthDate: currData.birthDate ? getDate(currData.birthDate, true) : '',
					regDate: currData.regDate ? getDate(currData.regDate, true) : '',
				};

			if (currData.countryB !== 333658698055681) {
				formatData.birthPlace = currData.natalPlaceB;
			} else {
				formatData.birthPlace = (_.compact([currData.countryBName, currData.areaB, currData.regionB, currData.settlementBName])).join(', ');
			}
			formatData.personInfo = formatData.cognation + ' ' + formatData.fullName;
			if (formatData.birthDate) formatData.personInfo += `, ${formatData.birthDate}`;
			if (formatData.birthPlace) formatData.personInfo += `, ${formatData.birthPlace}`;
			if (formatData.regDate) formatData.personInfo += `, ${formatData.regDate}`;
			data.childrenData['personInfo' + (i + 1)] = formatData.personInfo;
		}
	}


	var templatePath = path.join(process.configPath, 'excelTemplate', 'person_reg_card.xlsx');
	var templateFile = fs.readFileSync(templatePath, {encoding: 'bin'});
	// Create a template
	var template = new XlsxTemplate(templateFile);


	var sheetNumber = 1;


	template.substitute(sheetNumber, data);

	// Get binary data
	var resultDoc = template.generate({type: 'ArrayBuffer'});
	resp.writeEnd(resultDoc);
	resp.writeHead('Content-type: application/vnd.ms-excel', 'Content-Disposition: inline; filename="картка_реєстрації_особи.xlsx"');
	resp.statusCode = 200;
};



me.getApplData = function (ctx) {
	let params = ctx.mParams.execParams,
		payer = UB.Repository('inv_payers')
			.attrs(['lastName', 'firstName', 'middleName', 'fullName', 'birthDateFormatted', 'nationality.name', 'EDDRecordNum',
				'countryB', 'countryB.name', 'areaB', 'regionB', 'settlementB.governmentShortName', 'natalPlaceB',
				'areaAddL', 'settlementAddL.governmentShortName', 'streetTypeAddL.name', 'streetAddL.street', 'houseNumAddL', 'flatNumAddL',
				'regInfoCurrID.docType.name', 'regInfoCurrID.series', 'regInfoCurrID.num','regInfoCurrID.issueDateFormatted', 'regInfoCurrID.docRegUnit.name',
				'regInfoCurrID.validToFormatted'])
			.where('[ID]', '=', parseInt(params.payerID));
	if (params.code == 'applRegLPlace' || params.code == 'applBabyReg') {
		payer.attrs(['areaFrom', 'regionFrom', 'settlementFrom', 'streetTypeFrom', 'streetFrom', 'houseNumFrom', 'flatNumFrom', 'postIndexFrom',

			'areaAddR', 'regionAddR', 'settlementAddR.governmentShortName', 'streetTypeAddR.name', 'streetAddR.street', 'houseNumAddR', 'flatNumAddR', 'postIndex'])
	}
	if (params.code == 'applBabyReg' || params.code == 'applRemoveLReg') {
		payer.attrs(['birthCertificate', 'birthCertifDateFormatted', 'birthCertifIssuedBy.name'])
	}

	if (params.code == 'applRemoveLReg') {
		payer.attrs(['regInfoCurrID.rCountry.name', 'regInfoCurrID.rArea', 'regInfoCurrID.rRegion', 'regInfoCurrID.rSettlement.governmentShortName', 'regInfoCurrID.rStreetType.name', 'regInfoCurrID.rStreet.street', 'regInfoCurrID.rHouseNum', 'regInfoCurrID.rFlatNum', 'regInfoCurrID.rPostIndex'])
	}

	if (params.code === 'applBabyReg') payer.attrs('authorizedPersonID.fullName');

	payer = payer.selectAsObject({
		'birthDateFormatted': 'birthDate',
		'nationality.name': 'nationality',
		'countryB.name': 'countryBName',
		'settlementB.governmentShortName': 'settlementB',
		'settlementAddL.governmentShortName': 'settlementAddL',
		'streetTypeAddL.name': 'streetTypeAddL',
		'streetAddL.street': 'streetAddL',
		'settlementAddR.governmentShortName': 'settlementAddR',
		'streetTypeAddR.name': 'streetTypeAddR',
		'streetAddR.street': 'streetAddR',
		'birthCertifDateFormatted': 'birthCertifDate',
		'birthCertifIssuedBy.name': 'birthCertifIssuedBy',
		'regInfoCurrID.rCountry.name': 'rCountry',
		'regInfoCurrID.rArea': 'rArea',
		'regInfoCurrID.rRegion': 'rRegion',
		'regInfoCurrID.rSettlement.governmentShortName': 'rSettlement',
		'regInfoCurrID.rStreetType.name': 'rStreetType',
		'regInfoCurrID.rStreet.street': 'rStreet',
		'regInfoCurrID.rHouseNum': 'rHouseNum',
		'regInfoCurrID.rFlatNum': 'rFlatNum',
		'regInfoCurrID.rPostIndex': 'rPostIndex',
		'authorizedPersonID.fullName': 'authorizedFullName'
	})[0];

	/*payer = LocalDataStore.selectResultToArrayOfObjects(payer, {
	 'birthDateFormatted': 'birthDate',
	 'nationality.name': 'nationality',
	 'countryB.name': 'countryBName',
	 'settlementB.governmentShortName': 'settlementB',
	 'settlementAddL.governmentShortName': 'settlementAddL',
	 'streetTypeAddL.name': 'streetTypeAddL',
	 'streetAddL.street': 'streetAddL',
	 'settlementAddR.governmentShortName': 'settlementAddR',
	 'streetTypeAddR.name': 'streetTypeAddR',
	 'streetAddR.street': 'streetAddR',
	 'birthCertifDateFormatted': 'birthCertifDate',
	 'birthCertifIssuedBy.name': 'birthCertifIssuedBy',
	 'regInfoCurrID.rCountry.name': 'rCountry',
	 'regInfoCurrID.rArea': 'rArea',
	 'regInfoCurrID.rRegion': 'rRegion',
	 'regInfoCurrID.rSettlement.governmentShortName': 'rSettlement',
	 'regInfoCurrID.rStreetType.name': 'rStreetType',
	 'regInfoCurrID.rStreet.street': 'rStreet',
	 'regInfoCurrID.rHouseNum': 'rHouseNum',
	 'regInfoCurrID.rFlatNum': 'rFlatNum',
	 'regInfoCurrID.rPostIndex': 'rPostIndex'
	 })[0];*/

	if (payer) {
		if (payer['areaB']) payer['areaB'] += ' область';
		if (payer['areaAddL']) payer['areaAddL'] += ' область';
		if (payer['houseNumAddL']) payer['houseNumAddL'] = 'буд. ' + payer['houseNumAddL'];
		if (payer['flatNumAddL']) payer['flatNumAddL'] = 'кв. ' + payer['flatNumAddL'];

		if (payer['countryB'] == 333658698055681) {
			payer.addrBPlace1 = _.compact([payer['countryBName'], payer['areaB']]).join(', ');
			payer.addrBPlace2 = _.compact([payer['regionB'], payer.settlementB]).join(', ');
		}
		else payer.addrBPlace1 = _.compact([payer['countryBName'], payer['natalPlaceB']]).join(', ');
		if (payer.addrBPlace2) payer.addrBPlace1 += ',';

		if (payer['streetAddL']) payer['streetAddL'] = `${payer['streetTypeAddL']} ${payer['streetAddL']}`;

		payer.addrLPlace = _.compact([payer['areaAddL'], payer['settlementAddL'], payer['streetAddL'], payer['houseNumAddL'], payer['flatNumAddL']]).join(', ');

		if (params.code == 'applRegLPlace' || params.code == 'applBabyReg') {
			if (payer['areaFrom']) payer['areaFrom'] += ' область';
			if (payer['houseNumFrom']) payer['houseNumFrom'] = 'буд. ' + payer['houseNumFrom'];
			if (payer['flatNumFrom']) payer['flatNumFrom'] = 'кв. ' + payer['flatNumFrom'];

			if (payer['areaAddR']) payer['areaAddR'] += ' область';
			// if (payer['regionAddR']) payer['regionAddR'] += ' район';
			if (payer['houseNumAddR']) payer['houseNumAddR'] = 'буд. ' + payer['houseNumAddR'];
			if (payer['flatNumAddR']) payer['flatNumAddR'] = 'кв. ' + payer['flatNumAddR'];

			payer.addrRPlace = _.compact([payer['areaAddR'], payer['regionAddR'], payer['settlementAddR'], payer['streetTypeAddR'], payer['streetAddR'], payer['houseNumAddR'], payer['flatNumAddR'], payer['postIndex']]).join(', ');
			payer.addrFromPlace = _.compact([payer['areaFrom'], payer['regionFrom'], payer['settlementFrom'], payer['streetTypeFrom'], payer['streetFrom'], payer['houseNumFrom'], payer['flatNumFrom'], payer['postIndexFrom']]).join(', ');
			payer.regDoc = _.compact([payer['regInfoCurrID.docType.name'], payer['regInfoCurrID.series'], payer['regInfoCurrID.num'], payer['regInfoCurrID.issueDateFormatted'], payer['regInfoCurrID.docRegUnit.name'], payer['regInfoCurrID.validToFormatted']]).join(', ');
		}

		if (params.code == 'applRemoveLReg') {
			if (payer['rArea']) payer['rArea'] += ' область';
			if (payer['rHouseNum']) payer['rHouseNum'] = 'буд. ' + payer['rHouseNum'];
			if (payer['rFlatNum']) payer['rFlatNum'] = 'кв. ' + payer['rFlatNum'];
			payer.addrToPlace = _.compact([payer['rCountry'], payer['rArea'], payer['rRegion'], payer['rSettlement'], payer['rStreetType'], payer['rStreet'], payer['rHouseNum'], payer['rFlatNum'], payer['rPostIndex']]).join(', ');
			payer.regDoc = _.compact([payer['regInfoCurrID.docType.name'], payer['regInfoCurrID.series'], payer['regInfoCurrID.num'], payer['regInfoCurrID.issueDateFormatted'], payer['regInfoCurrID.docRegUnit.name'], payer['regInfoCurrID.validToFormatted']]).join(', ');
			payer['isRCountry'] = payer['rCountry'] == 'Україна';
		}
	}

	let regUnit = UB.Repository('inv_regUnit')
		.attrs(['name'])
		.where('[isRegAuth]', '=', 1)
		// .where('[mi_createUser]', '=', Session.uData.UserID)
		.selectAsObject()[0];
	if (regUnit) {
		let /*unitName1 = [],
			unitName2 = [],*/
			unitName = splitRegUnit2(regUnit.name, 46);
/*
		if (regUnit && regUnit.name && regUnit.name.length > 40) {
			let nameArr = regUnit.name.split(' ');
			for (let i = 0; i < nameArr.length; i++) {
				if (unitName1.join(' ').length < 40 && unitName1.join(' ').length + nameArr[i].length < 40) {
					unitName1.push(nameArr[i]);
				} else {
					unitName2.push(nameArr[i]);
				}
			}
			unitName.unitName1 = unitName1.join(' ');
			unitName.unitName2 = unitName2.join(' ');
		} else {
			unitName.unitName1 = regUnit && regUnit.name ? regUnit.name : '';
		}*/

		payer.unitName1 = unitName.unitName1;
		payer.unitName2 = unitName.unitName2;
	}
	let position = Session.uData.EmployeePositionName;
	payer.currUser = position && position != 'Не вказана' ? `${position}, ${Session.uData.EmployeeShortSNP}` : Session.uData.EmployeeShortSNP;
	payer.currDate = Ext.Date.format(new Date(), 'd.m.Y');
	if (ctx.noCtx) return payer;
	else ctx.mParams.payerData = JSON.stringify(payer);

};

me.generateTicketXlsx = function (fake, req, resp) {
	var url = require('url'),
		param = url.parse(req.url, true).query;

	if (param.ID && param.code) {
		var fileName = param.code === 'ticketReg' ? 'ticket_registration.xlsx' : 'ticket_cancellation.xlsx',
			fieldsAlias = {
				'payerID.lastName': 'lastName',
				"payerID.firstName": "firstName",
				"payerID.middleName": "middleName",
				'payerID.prevLastName': 'prevLastName',
				'payerID.birthDate': 'birthDate',
				"payerID.countryB.name": "countryB",
				"payerID.areaB": "areaB",
				"payerID.regionB": "regionB",
				"payerID.settlementB.governmentShortName": "settlementBName",
				"payerID.natalPlaceB": "natalPlaceB",
				"payerID.nationality.name": "nationalityName",
				'payerID.birthCertificate': 'birthCertificate',
				'payerID.birthCertifDate': 'birthCertifDate',
				"payerID.birthCertifIssuedBy.name": "birthCertifIssuedBy",
				'settlement.governmentShortName': 'settlementName',
				'streetType.name': 'streetTypeName',
				'street.street': 'street',
				'regUnit.name': 'regUnitName',
				'docRegUnit.name': 'docRegUnitName',
				'docType.name': 'docTypeName'
			};
		var payerData = UB.Repository('comm_regInfoCurr')
			.attrs(['payerID', 'regDate', 'payerID.lastName', "payerID.firstName", "payerID.middleName", "payerID.prevLastName", "payerID.birthDate",
				"payerID.countryB.name", "payerID.areaB", "payerID.regionB", "payerID.settlementB.governmentShortName", "payerID.natalPlaceB", "payerID.nationality.name",
				'payerID.birthCertificate', 'payerID.birthCertifDate', "payerID.birthCertifIssuedBy.name", "payerID.gender",
				"area", 'region', "settlement.governmentShortName", 'streetType.name', 'street.street', 'houseNum', 'flatNum', 'postIndex', 'state',
				'regUnit.name', 'docType.name', 'series', 'num', 'issueDate', 'docRegUnit.name'])
			.where('ID', '=', param.ID);
		if (param.code === 'ticketReg') {

/*			fieldsAlias['regUnit.name'] = 'regUnitName';
			fieldsAlias['docRegUnit.name'] = 'docRegUnitName';*/
		} else {
			payerData.attrs(['removeDate', 'rCountry.name', 'rArea', 'rRegion', 'rSettlement.governmentShortName', 'rStreetType.name', 'rStreet.street', 'rHouseNum', 'rFlatNum', 'rPostIndex',
				'rDocType.name', 'rSeries', 'rNum', 'rIssueDate', 'rDocRegUnit.name', 'rLivePlace']);
			fieldsAlias['rCountry.name'] = 'rCountry';
			fieldsAlias['rSettlement.governmentShortName'] = 'rSettlementName';
			fieldsAlias['rStreetType.name'] = 'rStreetTypeName';
			fieldsAlias['rStreet.street'] = 'rStreet';
			fieldsAlias['rDocRegUnit.name'] = 'rDocRegUnitName';
			fieldsAlias['rDocType.name'] = 'rDocTypeName'
		}

		payerData = payerData.selectAsObject(fieldsAlias)[0];
		// payerData = LocalDataStore.selectResultToArrayOfObjects(payerData, fieldsAlias)[0];


		var monthGen = {
			0: 'січня',
			1: 'лютого',
			2: 'березня',
			3: 'квітня',
			4: 'травня',
			5: 'червня',
			6: 'липня',
			7: 'серпня',
			8: 'вересня',
			9: 'жовтня',
			10: 'листопада',
			11: 'грудня'
		};
		if (payerData.birthDate) {
			var birthDate = getDate(payerData.birthDate);
			payerData.birthDate = {
				day: birthDate.getDate(),
				month: monthGen[birthDate.getMonth()],
				year: birthDate.getFullYear()
			}
		}

		if (payerData.areaB) payerData.areaB = payerData.areaB + ' обл.';
		if (payerData.natalPlaceB) {
			payerData.birthPlace1 = payerData.countryB;
			payerData.birthPlace2 = payerData.natalPlaceB;
		}
		else if (payerData.countryB) {
			payerData.birthPlace1 = _.compact([payerData.countryB, payerData.areaB]).join(', ');
			payerData.birthPlace2 = payerData.regionB;
			payerData.birthPlace3 = payerData.settlementBName;
		}

		if (param.code === 'ticketReg') {
			if (payerData.area) payerData.area = payerData.area + ' обл.';
			payerData.regPlace1 = payerData.area;
			payerData.regPlace2 = payerData.region;
			payerData.regPlace3 = payerData.settlementName;
			if (payerData.streetTypeName && payerData.street) payerData.streetFullName = `${payerData.streetTypeName} ${payerData.street}`;
			payerData.regPlace4 = _.compact([payerData.streetFullName, payerData.houseNum, payerData.flatNum, payerData.postIndex]).join(', ');

			if (payerData.regUnitName) {
				let regUnitName12 = splitRegUnit2(payerData.regUnitName, 27),
					regUnitName3 = splitRegUnit2(regUnitName12.unitName2, 27);
				payerData.regUnitName1 = regUnitName12.unitName1;
				payerData.regUnitName2 = regUnitName3.unitName1;
				payerData.regUnitName3 = regUnitName3.unitName2;
			}

			payerData.seriesNum = payerData.series && payerData.num ? `${payerData.series} ${payerData.num}` : payerData.series || payerData.num;
			payerData.docData1 = _.compact([payerData.docTypeName, payerData.seriesNum, getDate(payerData.issueDate, true)]).join(', ');
			if (payerData.docRegUnitName) {
				let docRegUnit = splitRegUnit2(payerData.docRegUnitName, 46);
				payerData.docData2 = docRegUnit.unitName1;
				payerData.docData3 = docRegUnit.unitName2;
			}


			let regDate = getDate(payerData.regDate);
			payerData.regDateObj = {
				day: regDate.getDate(),
				month: monthGen[regDate.getMonth()],
				year: regDate.getFullYear().toString().substring(2, 4)
			};

			let regFrom = UB.Repository('comm_regInfoCurr')
				.attrs(['area', 'region', 'settlement.governmentShortName', 'streetType.name', 'street.street', 'houseNum', 'flatNum', 'postIndex'])
				.where('[state]', '=', 'DISMISSED')
				.where('[removeDate]', '<=', payerData.regDate)
				.where('payerID', '=', payerData.payerID)
				.limit(1)
				.orderByDesc('removeDate')
				.orderBy('ID')
				.selectAsObject()[0];

			if (!regFrom) {
				regFrom = UB.Repository('comm_regInfoFrom')
					.attrs(['area', 'region', 'settlement.governmentShortName', 'streetType.name', 'street.street', 'houseNum', 'flatNum', 'postIndex'])
					.where('payerID', '=', payerData.payerID)
					.where('removeDate', '<=', payerData.regDate)
					.orderByDesc('ID')
					.selectAsObject()[0];
			}
			if (regFrom && regFrom.area) {
				payerData.fromPlace1 = regFrom.area + ' обл.';
				if (regFrom.region) payerData.fromPlace2 = regFrom.region;
				payerData.fromPlace3 = _.compact([regFrom['settlement.governmentShortName'], regFrom['streetType.name']]).join(', ');
				payerData.fromPlace4 = _.compact([regFrom['street.street'], regFrom.fullStreetName, regFrom.houseNum, regFrom.flatNum, regFrom.postIndex]).join(', ');
			}
		} else {
			if (payerData.state === 'DISMISSED') {
				if (payerData.rCountry) {
					if (payerData.rCountry === 'Україна') {
						payerData.toPlace1 = payerData.rArea;
						payerData.toPlace2 = payerData.rRegion;
						payerData.toPlace3 = payerData.rSettlementName;
						if (payerData.rStreetTypeName && payerData.rStreet) payerData.toStreetFullName = `${payerData.rStreetTypeName} ${payerData.rStreet}`;
						payerData.toPlace4 = _.compact([payerData.toStreetFullName, payerData.rHouseNum, payerData.rFlatNum, payerData.rPostIndex]).join(', ');
					} else {
						payerData.toPlace1 = payerData.rCountry;
						payerData.toPlace2 = payerData.rLivePlace;
					}
				}

				payerData.fromPlace1 = payerData.area + ' обл.';
				payerData.fromPlace2 = payerData.region;
				payerData.fromPlace3 = payerData.settlementName;
				if (payerData.streetTypeName && payerData.street) payerData.streetFullName = `${payerData.streetTypeName} ${payerData.street}`;
				payerData.fromPlace4 = _.compact([payerData.streetFullName, payerData.houseNum, payerData.flatNum]).join(', ');
				payerData.fromPlace5 = payerData.postIndex || '';


				payerData.rSeriesNum = payerData.rSeries && payerData.rNum ? `${payerData.rSeries} ${payerData.rNum}` : payerData.rSeries || payerData.rNum;
				payerData.docData1 = _.compact([payerData.rDocTypeName, payerData.rSeriesNum, getDate(payerData.rIssueDate, true)]).join(', ');
				if (payerData.rDocRegUnitName) {
					let docRegUnit = splitRegUnit2(payerData.rDocRegUnitName, 46);
					payerData.docData2 = docRegUnit.unitName1;
					payerData.docData3 = docRegUnit.unitName2;
				}

				let removeDate = getDate(payerData.removeDate);
				payerData.removeDate = {
					day: removeDate.getDate(),
					month: monthGen[removeDate.getMonth()],
					year: removeDate.getFullYear().toString().substring(2, 4)
				};
			}
			else {
				const currRegInfoFrom = UB.Repository('comm_regInfoFrom')
					.attrs('area', 'settlement.governmentShortName', 'streetType.name', 'street.street', 'houseNum', 'flatNum', 'removeDate')
					.where('payerID', '=', payerData.payerID)
					.limit(1)
					.orderByDesc('mi_createDate')
					.selectSingle({
						'settlement.governmentShortName': 'settlementName',
						'streetType.name': 'streetTypeName',
						'street.street': 'street'
					}) || {}

				payerData.fromPlace1 = currRegInfoFrom.area + ' обл.';
				payerData.fromPlace2 = currRegInfoFrom.region;
				payerData.fromPlace3 = currRegInfoFrom.settlementName;
				if (currRegInfoFrom.streetTypeName && currRegInfoFrom.street) currRegInfoFrom.streetFullName = `${currRegInfoFrom.streetTypeName} ${currRegInfoFrom.street}`;
				payerData.fromPlace4 = _.compact([currRegInfoFrom.streetFullName, currRegInfoFrom.houseNum, currRegInfoFrom.flatNum]).join(', ');
				payerData.fromPlace5 = currRegInfoFrom.postIndex || '';


				payerData.toPlace1 = payerData.area + ' обл.';
				payerData.toPlace2 = payerData.region;
				payerData.toPlace3 = payerData.settlementName;
				if (payerData.streetTypeName && payerData.street) payerData.streetFullName = `${payerData.streetTypeName} ${payerData.street}`;
				payerData.toPlace4 = _.compact([payerData.streetFullName, payerData.houseNum, payerData.flatNum, payerData.postIndex]).join(', ');

				payerData.seriesNum = payerData.series && payerData.num ? `${payerData.series} ${payerData.num}` : payerData.series || payerData.num;
				payerData.docData1 = _.compact([payerData.docTypeName, payerData.seriesNum, getDate(payerData.issueDate, true)]).join(', ');
				if (payerData.docRegUnitName) {
					let docRegUnit = splitRegUnit2(payerData.docRegUnitName, 46);
					payerData.docData2 = docRegUnit.unitName1;
					payerData.docData3 = docRegUnit.unitName2;
				}

				let removeDate = getDate(currRegInfoFrom.removeDate);
				currRegInfoFrom.removeDate = {
					day: removeDate.getDate(),
					month: monthGen[removeDate.getMonth()],
					year: removeDate.getFullYear().toString().substring(2, 4)
				};
			}
		}

		payerData.birthData1 = _.compact([payerData.birthCertificate, getDate(payerData.birthCertifDate, true)]).join(', ');
		payerData.birthData2 = payerData.birthCertifIssuedBy;


		var templatePath = path.join(process.configPath, 'excelTemplate', fileName);
		var templateFile = fs.readFileSync(templatePath, {encoding: 'bin'});

		var template = new XlsxTemplate(templateFile);

		var sheetNumber = 1;

		payerData.m=payerData['payerID.gender'] == "MALE" ? 1 : null;
		payerData.f=payerData['payerID.gender'] == "FEMALE" ? 2 : null;

		template.substitute(sheetNumber, payerData);

		var resultDoc = template.generate({type: 'ArrayBuffer'});

		resp.writeEnd(resultDoc);
		resp.writeHead('Content-type: application/vnd.ms-excel', 'Content-Disposition: inline; filename="' + fileName + '"');
		resp.statusCode = 200;
	}

};

me.getApplBabyRegData = function (ctx) {
	let params = ctx.mParams.execParams

	let regUnit = UB.Repository('inv_regUnit')
		.attrs(['name'])
		.where('[isRegAuth]', '=', 1)
		.selectScalar()

	const regUnitSplit = splitRegUnit2(regUnit)

	let payer = UB.Repository('inv_payers')
		.attrs('authorizedPersonID', 'authorizedPersonID.fullName', 'lastName', 'firstName', 'middleName', 'birthDate', 'areaB',
			'regionB', 'countryB.code', 'countryB.name', 'settlementB.governmentShortName', 'natalPlaceB', 'nationality.name',
			'areaAddR', 'regionAddR', 'settlementAddR.governmentShortName', 'streetTypeAddR.name', 'streetAddR.street', 'houseNumAddR',
			'flatNumAddR', 'postIndex', 'EDDRecordNum', 'birthCertificate', 'birthCertifDateFormatted', 'birthCertifIssuedBy.name',
			'regInfoCurrID.docType.name', 'regInfoCurrID.series', 'regInfoCurrID.num', 'regInfoCurrID.issueDateFormatted',
			'regInfoCurrID.docRegUnit.name', 'regInfoCurrID.validToFormatted', 'fullName')
		.where('ID', '=', parseInt(params.payerID))
		.selectSingle({
			'authorizedPersonID.fullName': 'authorizedFullName',
			'countryB.name': 'countryBName',
			'settlementB.governmentShortName': 'settlementB',
			'nationality.name': 'nationality',
			'streetTypeAddR.name': 'streetTypeAddR',
			'streetAddR.street': 'streetAddR',
			'birthCertifDateFormatted': 'birthCertifDate',
			'birthCertifIssuedBy.name': 'birthCertifIssuedBy',
		})

	if (payer) {
		setAddrPrefix(['areaB', 'areaFrom', 'houseNumFrom', 'flatNumFrom', 'areaAddR',
			'houseNumAddR', 'flatNumAddR'], payer)

		payer.birthDate = getDate(payer.birthDate, true) || null;

		if (payer['countryB.code'] === '01') {
			payer.addrBPlace1 = joinFieldValues(['countryBName', 'areaB'], payer)
			payer.addrBPlace2 = joinFieldValues(['regionB', 'settlementB'], payer)
		} else {
			payer.addrBPlace1 = joinFieldValues(['countryBName', 'natalPlaceB'], payer)
		}
		if (payer.addrBPlace2) payer.addrBPlace1 += ',';

		payer.birthData = joinFieldValues(['birthCertificate', 'birthCertifDate', 'birthCertifIssuedBy'], payer)

		payer.streetFull = joinFieldValues(['streetTypeAddR', 'streetAddR'], payer, ' ')
		payer.seriesFull = joinFieldValues(['regInfoCurrID.series', 'regInfoCurrID.num'], payer, ' ')

		payer.addrRPlace = joinFieldValues(['areaAddR', 'regionAddR', 'settlementAddR', 'streetFull', 'houseNumAddR',
			'flatNumAddR', 'postIndex'], payer)

		payer.regDoc = joinFieldValues(['regInfoCurrID.docType.name', 'regInfoCurrID.series', 'regInfoCurrID.num',
			'regInfoCurrID.issueDateFormatted', 'regInfoCurrID.docRegUnit.name', 'regInfoCurrID.validToFormatted'], payer);
		if (payer.authorizedPersonID) {
			const authorizedPerson = UB.Repository('inv_payers')
				.attrs('passportSeriesAndNumber', 'passportIssueDate', 'passportIssuedBy.name', 'nationality.name', 'idCardNumber',
					'birthDate', 'countryB.name', 'areaB', 'regionB', 'settlementB.governmentShortName', 'natalPlaceB')
				.where('ID', '=', payer.authorizedPersonID)
				.selectSingle()

			if (authorizedPerson.passportSeriesAndNumber) authorizedPerson.passportSeriesAndNumber = 'ПГУ ' + authorizedPerson.passportSeriesAndNumber
			else if (authorizedPerson.idCardNumber) authorizedPerson.passportSeriesAndNumber = authorizedPerson.idCardNumber
			if (authorizedPerson.passportIssueDate) authorizedPerson.passportIssueDate = getDate(authorizedPerson.passportIssueDate, true);
			payer.authorizedPassport = joinFieldValues(['passportSeriesAndNumber', 'passportIssueDate', 'passportIssuedBy.name'], authorizedPerson)
			if (authorizedPerson.birthDate) authorizedPerson.birthDate = getDate(authorizedPerson.birthDate, true);
			payer.authorizedBirthData = joinFieldValues(['birthDate', 'countryB.name', 'areaB', 'regionB', 'settlementB.governmentShortName', 'natalPlaceB', 'nationality.name'], authorizedPerson)
		}
	} else payer = {}

	let payerFromData = UB.Repository('comm_regInfoFrom')
		.attrs('area', 'region', 'settlement.governmentStatus', 'settlement.governmentName', 'streetType.name',
			'street.street', 'houseNum', 'flatNum', 'postIndex')
		.where('payerID', '=', parseInt(params.payerID))
		.limit(1)
		.orderByDesc('ID')
		.selectSingle()

	if (payerFromData) {
		setAddrPrefix(['area', 'houseNum', 'flatNum'], payerFromData)
		payerFromData.settlementFull = joinFieldValues(['settlement.governmentStatus', 'settlement.governmentName'], payerFromData, ' ')
		payerFromData.streetFull = joinFieldValues(['streetType.name', 'street.street'], payerFromData, ' ')
		payer.addrFromPlace = joinFieldValues(['area', 'region', 'settlementFull', 'streetFull', 'houseNum', 'flatNum', 'postIndex'], payerFromData)
	}

	let position = Session.uData.EmployeePositionName;
	payer.currUser = position && position !== 'Не вказана' ? `${position}, ${Session.uData.EmployeeShortSNP}` : Session.uData.EmployeeShortSNP;
	payer.currDate = Ext.Date.format(new Date(), 'd.m.Y');
	Object.assign(payer, regUnitSplit)
	if (ctx.noCtx) return payer;
	else ctx.mParams.payerData = JSON.stringify(payer);
}

me.getPersonLPlace = function (ctx) {
	let params = ctx.mParams.execParams
	let regInfoCurr = UB.Repository("comm_regInfoCurr")
		.attrs(["regDate"])
		.where("[payerID]", '=', parseInt(params.payerID))
		.where("[state]","=","REGISTERED")
		.selectSingle();
	if (!regInfoCurr) throw new Error("<<< Відсутні дані у Інформація про реєстрацію. >>>");

	let data = UB.Repository('inv_payers')
		.attrs('lastName', 'prevLastName', 'firstName', 'middleName', 'nationality.name', 'birthDate', 'countryB.name',
			'areaB', 'regionB', 'settlementB.governmentShortName', 'natalPlaceB', 'EDDRecordNum',
			'areaAddR','regionAddR','settlementAddR.governmentShortName', 'streetTypeAddR.name', 'streetAddR.street',
			'houseNumAddR', 'flatNumAddR')
		.where('ID', '=', parseInt(params.payerID))
		.selectSingle({
			'nationality.name': 'nationality'
		})

	setAddrPrefix(['areaB', 'areaAddR', 'houseNumAddR', 'flatNumAddR'], data)

	data.addrPlace1 = joinFieldValues(['areaAddR','regionAddR','settlementAddR.governmentShortName'], data)
	data.streetFull = joinFieldValues(['streetTypeAddR.name', 'streetAddR.street'], data, ' ') || ''
	data.addrPlace2 = joinFieldValues(['streetFull', 'houseNumAddR', 'flatNumAddR'], data)
	if (data.addrPlace2) data.addrPlace1 += ', '

	data.regDate = getDate(regInfoCurr.regDate, true);


	let defaultRegUnit = UB.Repository('inv_regUnit')
		.attrs(['name', 'nameNom'])
		.where('isRegAuth', '=', 1)
		.selectSingle();

	data.regUnitNameNom = defaultRegUnit.nameNom || defaultRegUnit.name


	if (data.birthDate) data.birthDate = getDate(data.birthDate, true);
	data.birthPlace = joinFieldValues(['birthDate', 'countryB.name', 'areaB', 'regionB', 'settlementB.governmentShortName', 'natalPlaceB'], data)

	const position = Session.uData.EmployeePositionName;
	data.currUser = position && position !== 'Не вказана' ? `${position}, ${Session.uData.EmployeeShortSNP}` : Session.uData.EmployeeShortSNP;
	data.currDate = Ext.Date.format(new Date(), 'd.m.Y');
	return data;
}

me.getApplRegPos = function (ctx) {
	let params = ctx.mParams.execParams

	let regUnit = UB.Repository('inv_regUnit')
		.attrs(['name'])
		.where('[isRegAuth]', '=', 1)
		.selectScalar()

	const regUnitSplit = splitRegUnit2(regUnit)

	let payer = UB.Repository('inv_payers')
		.attrs('fullName', 'birthDate', 'areaB', 'regionB', 'countryB.code', 'countryB.name',
			'settlementB.governmentShortName', 'natalPlaceB', 'lastName', 'firstName', 'middleName', 'prevLastName',
			'nationality.name', 'areaAddL', 'settlementAddL.governmentShortName', 'settlementAddL.pgoDictID.regionName',
			'streetTypeAddL.name', 'streetAddL.street',	'houseNumAddL', 'flatNumAddL', 'EDDRecordNum', 'areaAddR', 'regionAddR',
			'settlementAddR.governmentShortName', 'streetTypeAddR.name', 'streetAddR.street', 'houseNumAddR', 'flatNumAddR')
		.where('ID', '=', parseInt(params.payerID))
		.selectSingle({
			'countryB.name': 'countryBName',
			'nationality.name': 'nationality'
		})

	if (payer) {
		setAddrPrefix(['areaB', 'areaAddL', 'houseNumAddL', 'flatNumAddL', 'areaAddR', 'houseNumAddR', 'flatNumAddR'], payer)
		if (payer.birthDate) payer.birthDate = getDate(payer.birthDate, true)

		if (payer['countryB.code'] === '01') {
			payer.addrBPlace1 = joinFieldValues(['countryBName', 'areaB'], payer);
			payer.addrBPlace2 = joinFieldValues(['regionB', 'settlementB.governmentShortName'], payer);
		}
		else payer.addrBPlace1 = joinFieldValues(['countryBName', 'natalPlaceB'], payer)
		if (payer.addrBPlace2) payer.addrBPlace1 += ',';

		payer.streetAddLFull = joinFieldValues(['streetTypeAddL.name', 'streetAddL.street'], payer, ' ')
		payer.addrLPlace = joinFieldValues(['areaAddL', 'settlementAddL.pgoDictID.regionName', 'settlementAddL.governmentShortName', 'streetAddLFull', 'houseNumAddL', 'flatNumAddL'], payer)

		payer.streetAddRFull = joinFieldValues(['streetTypeAddR.name', 'streetAddR.street'], payer, ' ')
		payer.addrRPlace = joinFieldValues(['areaAddR', 'regionAddR', 'settlementAddR.governmentShortName', 'streetAddRFull', 'houseNumAddR', 'flatNumAddR'], payer)

	} else payer = {}


	let position = Session.uData.EmployeePositionName;
	payer.currUser = position && position !== 'Не вказана' ? `${position}, ${Session.uData.EmployeeShortSNP}` : Session.uData.EmployeeShortSNP;
	payer.currDate = Ext.Date.format(new Date(), 'd.m.Y');
	Object.assign(payer, regUnitSplit)
	if (ctx.noCtx) return payer;
	else ctx.mParams.payerData = JSON.stringify(payer);
}

me.getApplRemoveLReg = function (ctx) {
	let params = ctx.mParams.execParams

	let regUnit = UB.Repository('inv_regUnit')
		.attrs(['name'])
		.where('[isRegAuth]', '=', 1)
		.selectScalar()

	const regUnitSplit = splitRegUnit2(regUnit)

	let payer = UB.Repository('inv_payers')
		.attrs('authorizedPersonID', 'authorizedPersonID.fullName', 'lastName', 'firstName', 'middleName', 'fullName',
			'birthDate', 'areaB', 'regionB', 'countryB.code', 'countryB.name', 'settlementB.governmentShortName', 'natalPlaceB',
			'nationality.name', 'EDDRecordNum', 'birthCertificate', 'birthCertificateSeries', 'birthCertificateNum', 'birthCertifDate',
			'birthCertifIssuedBy.name')
		.where('ID', '=', parseInt(params.payerID))
		.selectSingle({
			'authorizedPersonID.fullName': 'authorizedFullName',
			'nationality.name': 'nationality',
			'countryB.name': 'countryBName'
		})

	if (payer) {
		payer.is16 = true
		setAddrPrefix(['areaB'], payer)

		if (payer['countryB.code'] === '01') {
			payer.addrBPlace1 = joinFieldValues(['countryBName', 'areaB', 'regionB'], payer)
			payer.addrBPlace2 = payer['settlementB.governmentShortName']
		} else {
			payer.addrBPlace1 = joinFieldValues(['countryBName', 'natalPlaceB'], payer)
		}
		if (payer.addrBPlace2) payer.addrBPlace1 += ',';
		if (payer.birthDate) {
			payer.is16 = moment().diff(moment(payer.birthDate), 'years') > 15
			payer.birthDate = getDate(payer.birthDate, true);
		}
		if (payer.birthCertifDate) payer.birthCertifDate = getDate(payer.birthCertifDate, true);
		payer.birthData = joinFieldValues(['birthCertificate', 'birthCertifDate', 'birthCertifIssuedBy.name'], payer)

		if (payer.authorizedPersonID) {
			const authorizedPerson = UB.Repository('inv_payers')
				.attrs('passportSeriesAndNumber', 'passportIssueDate', 'passportIssuedBy.name', 'nationality.name', 'idCardNumber',
					'birthDate', 'countryB.name', 'areaB', 'regionB', 'settlementB.governmentShortName', 'natalPlaceB', 'EDDRecordNum')
				.where('ID', '=', payer.authorizedPersonID)
				.selectSingle()

			if (authorizedPerson.passportSeriesAndNumber) authorizedPerson.passportSeriesAndNumber = 'ПГУ ' + authorizedPerson.passportSeriesAndNumber
			else if (authorizedPerson.idCardNumber) authorizedPerson.passportSeriesAndNumber = 'ПГУ ' + authorizedPerson.idCardNumber
			if (authorizedPerson.passportIssueDate) authorizedPerson.passportIssueDate = getDate(authorizedPerson.passportIssueDate, true);
			payer.authorizedPassport = joinFieldValues(['passportSeriesAndNumber', 'passportIssueDate', 'passportIssuedBy.name'], authorizedPerson)
			if (authorizedPerson.birthDate) authorizedPerson.birthDate = getDate(authorizedPerson.birthDate, true);
			payer.authorizedBirthData = joinFieldValues(['birthDate', 'countryB.name', 'areaB', 'regionB', 'settlementB.governmentShortName', 'natalPlaceB', 'nationality.name'], authorizedPerson)
			payer.authorizedEDDRecordNum = authorizedPerson.EDDRecordNum
		}

		const regInfoCurr = UB.Repository('comm_regInfoCurr')
			.attrs('rCountry.name', 'rArea', 'rRegion', 'rSettlement.governmentShortName', 'rStreetType.name',
				'rStreet.street', 'rHouseNum', 'rFlatNum', 'rPostIndex', 'docType.name', 'series', 'num', 'issueDate',
				'docRegUnit.name', 'validTo')
			.where('payerID', '=', parseInt(params.payerID))
			.limit(1)
			.orderByDesc('ID')
			.where('state', '=', 'DISMISSED')
			.selectSingle()
		if (regInfoCurr) {
			setAddrPrefix(['rArea', 'rHouseNum', 'rFlatNum'], regInfoCurr)
			if (regInfoCurr.issueDate) regInfoCurr.issueDate = getDate(regInfoCurr.issueDate, true);
			if (regInfoCurr.validTo) regInfoCurr.validTo = getDate(regInfoCurr.validTo, true);
			payer.streetFull = joinFieldValues(['rStreetType.name', 'rStreet.street'], payer, ' ')
			payer.addrToPlace = joinFieldValues(['rArea', 'rRegion', 'rSettlement.governmentShortName', 'streetFull', 'rHouseNum', 'rFlatNum', 'rPostIndex'], regInfoCurr);
			payer.rCountry = regInfoCurr['rCountry.name']
			regInfoCurr.seriesNum = joinFieldValues(['series', 'num'], regInfoCurr, ' ')
			payer.regDoc = joinFieldValues(['docType.name', 'seriesNum', 'issueDate', 'docRegUnit.name', 'validTo'], regInfoCurr)
		}
	}
	else payer = {}

	let position = Session.uData.EmployeePositionName;
	payer.currUser = position && position !== 'Не вказана' ? `${position}, ${Session.uData.EmployeeShortSNP}` : Session.uData.EmployeeShortSNP;
	payer.currDate = Ext.Date.format(new Date(), 'd.m.Y');
	Object.assign(payer, regUnitSplit)
	if (ctx.noCtx) return payer;
	else ctx.mParams.payerData = JSON.stringify(payer);
}

function setAddrPrefix(fields, payer) {
	fields.forEach(item => {
		if (payer[item]) {
			switch (item) {
				case 'area':
				case 'areaB':
				case 'areaAddR':
				case 'areaAddL':
				case 'rArea':
					payer[item] += ' область';
					break
				case 'houseNum':
				case 'houseNumAddR':
				case 'houseNumAddL':
				case 'rHouseNum':
					payer[item] = 'буд. ' + payer[item];
					break
				case 'flatNum':
				case 'flatNumAddR':
				case 'flatNumAddL':
				case 'rFlatNum':
					payer[item] = 'кв. ' + payer[item];
					break
			}
		}
	})
}

function joinFieldValues(arr, payer, splitter = ', ') {
	const fields = []

	arr.forEach(item => {
		fields.push(payer[item])
	})

	return _.compact(fields).join(splitter)
}

function splitRegUnit(regUnit) {
		let unitName1 = [],
			unitName2 = [],
			unitName = {unitName1: '', unitName2: ''};

		if (regUnit && regUnit.length > 40) {
			let nameArr = regUnit.split(' ');
			for (let i = 0; i < nameArr.length; i++) {
				if (unitName1.join(' ').length < 40 && unitName1.join(' ').length + nameArr[i].length < 40) {
					unitName1.push(nameArr[i]);
				} else {
					unitName2.push(nameArr[i]);
				}
			}
			unitName.unitName1 = unitName1.join(' ');
			unitName.unitName2 = unitName2.join(' ');
		} else {
			unitName.unitName1 = regUnit || '';
		}

		return unitName
/*		payer.unitName1 = unitName.unitName1;
		payer.unitName2 = unitName.unitName2;*/
}
function splitRegUnit2(row, length = 40) {
	let unitName = {};
	let currUnitIdx = 0
	let currUnit = []
	let isUnit2 = false
	if (row && row.length > length) {
		let nameArr = row.split(' ');
		for (let i = 0; i < nameArr.length; i++) {
			// if (!isUnit2 && unitName1.join(' ').length < length && unitName1.join(' ').length + nameArr[i].length < length) {
			if (currUnit.join(' ').length < length && currUnit.join(' ').length + nameArr[i].length < length) {
				currUnit.push(nameArr[i]);
			} else {
				currUnitIdx++
				Object.assign(unitName, {['unitName' + currUnitIdx]: currUnit.join(' ')})
				currUnit = [nameArr[i]];
			}
		}
	} else {
		Object.assign(unitName, {unitName1: row || ''})
	}
	currUnit.length && Object.assign(unitName, {['unitName' + (currUnitIdx + 1)]: currUnit.join(' ')})
	return unitName
}

me.addUpdatePayer = function (ctx) {
	var params = ctx.mParams.execParams,
		data = params ? params.data : undefined,
		payer_DS = UB.DataStore("inv_payers"),
		payerID = data.ID;

	if (data) {
		for (let item in data) {
			if (!data[item]) data[item] = null
		}
		if (!payerID) {
			payerID = payer_DS.generateID();
			ctx.mParams.payerID = payerID;
		}
		payer_DS.run(data.ID && 'update' || 'insert', Object.assign({
			execParams: Object.assign(data, {
				ID: payerID,
			})
		}, data.ID ? {
				__skipSelectAfterUpdate: true,
				__skipOptimisticLock: true
			} : {__skipSelectAfterInsert: true}));
	}
};

me.entity.addMethod("beforeinsert");
me.entity.addMethod("afterinsert");
me.entity.addMethod("afterupdate");
me.entity.addMethod("afterdelete");
me.entity.addMethod("beforeupdate");
me.entity.addMethod("beforedelete");
me.entity.addMethod("afterbeforeupdate");
me.entity.addMethod("afterbeforedelete");
me.entity.addMethod("afterselect");

me.entity.addMethod("selectSearch");
me.entity.addMethod("getObjAttNewID");
me.entity.addMethod("getCertifData");
me.entity.addMethod("getExcelPersonData");
me.entity.addMethod("getApplData");
me.entity.addMethod("getApplDoc");
me.entity.addMethod("generateTicketXlsx");
me.entity.addMethod("addUpdatePayer");

//импорт с дбфников Іванків
me.invankivImport = function () {
	let encoder = require('base64-arraybuffer');
	const parseDbf = require("./lib/parsedbf.js");

	function getDocData(ID) {
		var docRequest = new TubDocumentRequest();
		docRequest.entity = 'inv_contractAttachment';
		docRequest.attribute = 'attachment';
		docRequest.id = ID;
		var docHandler = docRequest.createHandlerObject(true);
		docHandler.loadContentFromEntity(TubLoadContentBody.Yes);

		var buf = encoder.decode(docHandler.request.getBodyAsBase64String());

		var bytes = new Uint8Array(buf);
		return parseDbf(bytes, 'windows-1251');
	}

	var data1 = getDocData(336357558943746); //kniga1_1
	var groupData1 = _.groupBy(data1, 'KODG');


	var data2 = getDocData(336347486322689), //kniga1_2
		groupData2 = _.groupBy(data2, 'KODG');

	var data3 = getDocData(336367841509378), //zeml
		groupData3 = _.groupBy(data3, 'KODG');

	var data4 = getDocData(336367661907969), //kniga1_3
		groupData4 = _.groupBy(data4, 'KODG');

	var data5 = getDocData(336367662792705), //kniga1_v
		groupData5 = _.groupBy(data5, 'KODG');


	var ds_payer = UB.DataStore('inv_payers'),
		ds_streetType = UB.DataStore('pgo_streetType'),
		ds_street = UB.DataStore('pgo_localStreet'),
		ds_land = UB.DataStore('inv_landPlot'),
		ds_realty = UB.DataStore('inv_realtyObject'),
		ds_objAccounting = UB.DataStore('pgo_objAccounting'),
		ds_houseMember = UB.DataStore('pgo_householdMember'),
		ds_owner = UB.DataStore('pgo_roomOwnerInfo'),
		ds_room = UB.DataStore('pgo_livingRoomInfo'),
		ds_pgoLand = UB.DataStore('pgo_landPlot'),
		ds_agriculture = UB.DataStore('pgo_agriculture'),
		ds_animal = UB.DataStore('pgo_agricultureCellAnimal'),
		ds_machine = UB.DataStore('pgo_agricultureMachine'),
		execParams,
		fullName = [],
		checkDate = function (date) {
			return date && !isNaN(Date.parse(date)) ? date : null
		},
		privilegePhys = UB.Repository('inv_exemptionPhysDict')
			.attrs('ID', 'exemptionCat')
			.selectAsObject(),
		privilege = {};
	_.forEach(privilegePhys, (item) => {
		privilege[item['exemptionCat'].trim()] = item['ID'];
	});

	var streetTypeArr = UB.Repository('pgo_streetType')
			.attrs('ID', 'name')
			.selectAsObject(),
		streetType = {};

	_.forEach(streetTypeArr, (item) => {
		streetType[item['name']] = item.ID;
	});

	var streetArr = UB.Repository('pgo_localStreet')
			.attrs('ID', 'street', 'streetType.name')
			.selectAsObject(),
		street = {};

	_.forEach(streetArr, (item) => {
		if (!street[item['streetType.name']]) {
			street[item['streetType.name']] = {};
		}

		street[item['streetType.name']][item['street']] = item.ID
	});

	var cognationArr = UB.Repository('pgo_cognation')
			.attrs('ID', 'name')
			.selectAsObject(),
		cognation = {};

	_.forEach(cognationArr, (item) => {
		cognation[item['name']] = item.ID;
	});

	var pgoType = {
		1: 'HOUSEHOLD_LIVE',
		2: 'HOUSEHOLD_STAY',
		3: 'HOUSE_OWN',
		4: 'LAND_OWN',
		5: 'ADANDONED_OBJ',
	};

	var wallMaterialArr = UB.Repository('pgo_wallMaterial')
			.attrs('ID', 'name')
			.selectAsObject(),
		wallMaterial = {};

	_.forEach(wallMaterialArr, (item) => {
		wallMaterial[item['name']] = item.ID;
	});

	var roofMaterialArr = UB.Repository('pgo_roofMaterial')
			.attrs('ID', 'name')
			.selectAsObject(),
		roofMaterial = {};

	_.forEach(roofMaterialArr, (item) => {
		roofMaterial[item['name']] = item.ID;
	});

	var pens = {
			PENS1: 'За віком',
			PENS2: 'По інвалідності',
			PENS4: 'За вислугою років',
			PENS7: 'Інвалід пенсійного віку',
			PENS10: 'Інвалід I групи',
			PENS11: 'Інвалід II групи',
			PENS12: 'Інвалід III групи',
			PENS14: 'Інвалід дитинства',
			PENS19: 'Інвалід зору',
			PENS20: 'Учасник бойових дій',
			PENS22: 'Учасник війни',
			PENS30: 'Особа, що постраждали внаслідок Чорнобильської катастрофи'
		},
		getPrivilege = function (item) {
			let field;

			Object.keys(pens).some((key) => {
				if (item[key]) {
					field = key;
				}
				return item[key];
			});

			return field;
		},
		groupPIB1,
		groupPIB2,
		currPIB1 = {},
		currPIB2 = {},
		address = {}, //Адрес пго
		head = [],//Голова
		codeStreetType = 32,
		codeStreet = 118,
		payerID,
		headPayerID,
		groupForLand,
		currLandPIB = {},
		codeLand = inv_landPlot.doGetNewCode('inv_landPlot')[0].code || 1,
		codeRealty = inv_landPlot.doGetNewCode('inv_realtyObject')[0].code || 1,
		currRealty = {},
		realtyObjectID,
		realtyOwnership = { //Право на буд.(кв.)
			1: 'Власність',
			2: 'Співвласність',
			3: 'Найм житла',
			4: 'Будинок іншого д/г'
		},
		objAccountingID,
		currRoomOwner,
		agricultureID,
		animalType = {
			1: 'Норка',
			2: 'Нутрія',
			3: 'Песець',
			4: 'Лисиця',
			5: 'Фредка',
			6: 'Ондатра',
			7: 'Інші',
			8: ' '
		},
		landPlotID;


	function getLastYearRecord(item, obj) {
		let last = obj;
		item.forEach((el) => {
			if (last['RIKBAZ'] < el['RIKBAZ']) {
				last = el;
			}
		});

		return last;
	}

//Для каждой группы по koatuu+ID пго
	_.forEach(groupData2, (item, KODG) => {
		groupPIB2 = _.groupBy(item, 'PIB'); //данные человека
		groupPIB1 = groupData1[KODG] && groupData1[KODG].length ? _.groupBy(groupData1[KODG], 'PIB') : null; //адрес человека

		headPayerID = null;
		currPIB1 = {};
		currPIB2 = {};
		address = {};
		head = [];
		head = _.filter(item, {RODZV: 1});

		if (groupPIB1) {
			if (head && head.length) {
				currPIB1 = Object.keys(groupPIB1).length && ((groupPIB1[head[0]['PIB']] && groupPIB1[head[0]['PIB']][0]) || groupPIB1[Object.keys(groupPIB1)[0]][0]) || null;
				if (groupPIB1[head[0]['PIB']]) {
					currPIB1 = getLastYearRecord(groupPIB1[head[0]['PIB']], currPIB1);
					/*groupPIB1[head[0]['PIB']].forEach((el) => {
					 if (currPIB1['RIKBAZ'] < el['RIKBAZ']) {
					 currPIB1 = el;
					 }
					 });*/
				}
				else {
					/*groupPIB1[Object.keys(groupPIB1)[0]].forEach((el) => {
					 if (currPIB1['RIKBAZ'] < el['RIKBAZ']) {
					 currPIB1 = el;
					 }
					 });*/
					currPIB1 = getLastYearRecord(groupPIB1[Object.keys(groupPIB1)[0]], currPIB1)
				}

			}


			address = {
				areaAddR: 'Київська',
				regionAddR: 'Бориспільський район',
				settlementAddR: 3220884001,
				settlementName: 'Село Іванків',
				//streetTypeAddR: (currPIB1 && currPIB1['VUDVUL'] && streetType[currPIB1['VUDVUL']]) || null,
				//streetAddR: (currPIB1 && currPIB1['VUDVUL'] && currPIB1['NAMEVYL'] && street[currPIB1['VUDVUL']][currPIB1['NAMEVYL']]) || null,
				houseNumAddR: currPIB1['BYD'] || null,
				flatNumAddR: currPIB1['KV'] || null
			};

			if (currPIB1['VUDVUL'] && !streetType[currPIB1['VUDVUL']]) {
				let streetTypeID = ds_streetType.generateID();
				ds_streetType.run('insert', {
					__skipSelectAfterInsert: true,
					execParams: {
						ID: streetTypeID,
						code: codeStreetType.toString(),
						name: currPIB1['VUDVUL']
					}
				});

				streetType[currPIB1['VUDVUL']] = streetTypeID;

				address.streetTypeAddR = streetTypeID;
			}
			else address.streetTypeAddR = (currPIB1 && currPIB1['VUDVUL'] && streetType[currPIB1['VUDVUL']]) || null;
			address.streetTypeName = currPIB1['VUDVUL'] || '';


			if (currPIB1['VUDVUL'] && currPIB1['NAMEVYL'] && (!street[currPIB1['VUDVUL']] || !street[currPIB1['VUDVUL']][currPIB1['NAMEVYL']])) {
				let streetID = ds_street.generateID();
				ds_street.run('insert', {
					__skipSelectAfterInsert: true,
					execParams: {
						ID: streetID,
						settlementDictID: 3220884001,
						street: currPIB1['NAMEVYL'],
						code: codeStreet.toString(),
						streetType: streetType[currPIB1['VUDVUL']]
					}
				});
				address.streetAddR = streetID;
				codeStreet += 1;
				if (!street[currPIB1['VUDVUL']]) street[currPIB1['VUDVUL']] = {};
				street[currPIB1['VUDVUL']][currPIB1['NAMEVYL']] = streetID;
			} else address.streetAddR = (currPIB1 && currPIB1['VUDVUL'] && currPIB1['NAMEVYL'] && street[currPIB1['VUDVUL']][currPIB1['NAMEVYL']]) || null;
			address.streetName = currPIB1['VUDVUL'] && currPIB1['NAMEVYL'] ? currPIB1['NAMEVYL'] : '';
		}
		groupForLand = groupData3[KODG] ? _.groupBy(groupData3[KODG], 'PIB') : {};

		realtyObjectID = null;
		landPlotID = null;
		if (Object.keys(currPIB1).length) {
			objAccountingID = ds_objAccounting.generateID();
			ds_objAccounting.run('insert', {
				__skipSelectAfterInsert: true,
				execParams: {
					ID: objAccountingID,
					pgoType: pgoType[currPIB1['TYPG']] || 'OBJ_INPGO',
					pgoBookPage: currPIB1['NOMPAGE'] || 0,
					pgoBook: currPIB1['NOMBOOK'] || 0,
					locationID: 3220884001,
					streetID: address.streetAddR || 336370097520641,
					houseNum: currPIB1['BYD'] || 0,
					flatNum: currPIB1['KV'] || null,
					pgoObjNum: currPIB1['NOBEKT'] || null,
					membersNum: Object.keys(groupPIB2).length,
					specialNotes: currPIB1['SPECIN'] || null,
					headRegAddress: currPIB1['TYPG'] == 2 ? _.compact([address.areaAddR + ' обл.', address.regionAddR, address.settlementName, _.compact([address.streetTypeName, address.streetName]).join(' '), address.houseNumAddR, address.flatNumAddR]).join(', ') : null,
					ownerRegAddress: currPIB1['TYPG'] == 3 || currPIB1['TYPG'] == 4 || currPIB1['TYPG'] == 5 ? _.compact([address.areaAddR + ' обл.', address.regionAddR, address.settlementName, _.compact([address.streetTypeName, address.streetName]).join(' '), address.houseNumAddR, address.flatNumAddR]).join(', ') : null,
					oldID: KODG,
					oldTable: 'kinga1_1'
				}
			});
		}

		let memberNum = 1;
		//для каждого человека в пго
		_.forEach(groupPIB2, (item2, PIB) => {
			payerID = null;
			if (!!PIB.trim()) {
				currPIB2 = item2[0];
				//ищем за последний год
				currPIB2 = getLastYearRecord(item2, currPIB2);


				fullName = PIB.split(' ');

				PIB == currPIB1.PIB ? headPayerID = ds_payer.generateID() : payerID = ds_payer.generateID();

				ds_payer.run('insert', {
					__skipSelectAfterInsert: true,
					execParams: {
						ID: payerID || headPayerID,
						personType: 'PHYSICAL',
						lastName: fullName[0] || null,
						firstName: fullName[1] || null,
						middleName: fullName[2] || null,
						idnCode: currPIB2['IDENNOM'] || null,
						passportSeries: currPIB2['SERPS'],
						passportNumber: currPIB2['NOMPS'],
						passportIssueDate: currPIB2['DATAV'],
						birthDate: checkDate(currPIB2['DATANAR']),
						privilegePhysID: currPIB2[getPrivilege(currPIB2)] ? privilege[pens[getPrivilege(currPIB2)]] : null,
						gender: currPIB2['STAT1'] && ((currPIB2['STAT1'] == '1' && 'MALE') || (currPIB2['STAT1'] == '2' && 'FEMALE')) || null,
						birthCertificate: currPIB2['SVIDNAR'] || null,
						birthCertifDate: checkDate(currPIB2['DATAAK']),
						deathCertificate: currPIB2['NOMERAKS'] || null,
						deathCertifDate: checkDate(currPIB2['DATAAKS']),
						areaAddR: address.areaAddR || null,
						regionAddR: address.regionAddR || null,
						settlementAddR: address.settlementAddR || null,
						streetTypeAddR: address.streetTypeAddR || null,
						streetAddR: address.streetAddR || null,
						houseNumAddR: address.houseNumAddR || null,
						flatNumAddR: address.flatNumAddR || null,
						oldID: KODG,
						oldTable: 'kniga1_2, kniga1_1'
					}
				});


				//ПГО
				if (objAccountingID) {
					//Члени домогосп
					ds_houseMember.run('insert', {
						__skipSelectAfterInsert: true,
						execParams: {
							ID: ds_houseMember.generateID(),
							orderNum: memberNum++,
							payerID: payerID || headPayerID,
							isHead: currPIB2['RODZV'] == 1,
							gender: currPIB2['STAT1'] && ((currPIB2['STAT1'] == '1' && 'MALE') || (currPIB2['STAT1'] == '2' && 'FEMALE')) || null,
							birthDate: checkDate(currPIB2['DATANAR']) || new Date(1902, 1, 2),
							birthCertificate: currPIB2['SVIDNAR'] || null,
							birthCertifDate: checkDate(currPIB2['DATAAK']) || null,
							passportSeries: currPIB2['SERPS'] || null,
							passportNumber: currPIB2['NOMPS'] || null,
							passportIssueDate: currPIB2['DATAV'] || null,
							idnCode: currPIB2['IDENNOM'] || null,
							cognationID: cognation[currPIB2['RODZV']] || null,
							workPlace: currPIB2['MISCER'] || null,
							exemptionID: currPIB2[getPrivilege(currPIB2)] ? privilege[pens[getPrivilege(currPIB2)]] : null,
							areaAddR: address.areaAddR || null,
							regionAddR: address.regionAddR || null,
							settlementAddR: address.settlementAddR || null,
							streetTypeAddR: address.streetTypeAddR || null,
							streetAddR: address.streetAddR || null,
							houseNumAddR: address.houseNumAddR || null,
							flatNumAddR: address.flatNumAddR || null,
							objAccountingID: objAccountingID,
							oldID: KODG,
							oldTable: 'kniga1_1, kniga1_2'
						}
					});

				}
			}
		});

		if (Object.keys(currPIB1).length && headPayerID) {
			//Земли
			if (groupForLand[currPIB1['PIB']] && groupForLand[currPIB1['PIB']].length) {
				currLandPIB = groupForLand[currPIB1['PIB']][0];
				currLandPIB = getLastYearRecord(groupForLand[currPIB1['PIB']], currLandPIB);

				landPlotID = ds_land.generateID();
				ds_land.run('insert', {
					__skipSelectAfterInsert: true,
					execParams: {
						ID: landPlotID,
						koattNum: 157,
						code: codeLand++,
						landCategory: currLandPIB['ZEM1'] ? 'NOT_AGRICULTURAL' : 'AGRICULTURAL',
						landPurpose: (currLandPIB['ZEM4'] && 'PASTURES') || null,
						cadastralNumber: currLandPIB['KNOMER'] || null,
						totalArea: currLandPIB['ZEM'] || 0,
						documentOwnership: currLandPIB['NOMAKT'] || '-',
						registryData: checkDate(currPIB2['DATAAKT']) || new Date(1902, 1, 2),
						position: currLandPIB['MAS'] || null,
						owner: headPayerID,
						location: 'INLOCAL',
						useType: (currLandPIB['ZEM2'] && 'OSGMANAGE') || (currLandPIB['ZEM3'] && 'SGPRODUCTMANAGE') || (currLandPIB['ZEM5'] && 'SMALLHOLDING') || (currLandPIB['ZEM6'] && 'GARDENMANAGE') || null,
						notes: currLandPIB['PIDSTAVA'] || null,
						oldID: KODG,
						oldTable: 'zeml'
					}
				});
			}

			//Об'єкти нерухомості
			if (groupData4[KODG] && groupData4[KODG].length && headPayerID) {
				let addressRealty = currPIB1['VUDVUL'] || '';
				if (addressRealty) {
					addressRealty += currPIB1['NAMEVYL'] ? ' ' + currPIB1['NAMEVYL'] : '';
				}
				else addressRealty = currPIB1['NAMEVYL'] ? ' ' + currPIB1['NAMEVYL'] : '';
				addressRealty = _.compact([addressRealty, ((currPIB1['BYD'] && `буд. ${currPIB1['BYD']}`) || null), ((currPIB1['KV'] && `кв. ${currPIB1['KV']}`) || null)]).join(', ');

				currRealty = groupData4[KODG][0];
				currRealty = getLastYearRecord(groupData4[KODG], currRealty);
				realtyObjectID = ds_realty.generateID();
				ds_realty.run('insert', {
					__skipSelectAfterInsert: true,
					execParams: {
						ID: realtyObjectID,
						koattNum: 157,
						code: codeRealty++,
						realtyType: 'HOUSE',
						totalArea: currRealty['PLZ1'] || 0,
						summerArea: currRealty['PLL1'] || null,
						livingArea: currRealty['PLG1'] || null,
						location: 'INLOCAL',
						documentOwnership: realtyOwnership[currPIB1['PBYD1']] || '-',
						registryData: new Date(1902, 1, 2),
						address: addressRealty || '-',
						owner: headPayerID,
						notes: currPIB1['DODINFOR'] || null,
						oldID: KODG,
						oldTable: 'kniga1_1, kniga1_3'
					}
				});
			}

			//Інформація про власників
			if (groupData5[KODG] && groupData5[KODG].length) {
				currRoomOwner = groupData5[KODG][0];
				currRoomOwner = getLastYearRecord(groupData5[KODG], currRoomOwner);
				ds_owner.run('insert', {
					__skipSelectAfterInsert: true,
					execParams: {
						ID: ds_owner.generateID(),
						year: 2018,
						personType: 'CO_OWNER',
						payerID: headPayerID,
						realtyObjectID: realtyObjectID,
						part: currRoomOwner['VLASNIST'],
						notes: (currRoomOwner['NPGO'] && `№ПГО співвласників ${currRoomOwner['NPGO']}`) || null,
						objAccountingID: objAccountingID
					}
				});
			}


			//Земля
			if (landPlotID) {
				ds_pgoLand.run('insert', {
					__skipSelectAfterInsert: true,
					execParams: {
						ID: ds_pgoLand.generateID(),
						year: 2018,
						payerID: headPayerID,
						landPlotID: landPlotID,
						cadastralNumber: currLandPIB['KNOMER'] || null,
						landCategory: currLandPIB['ZEM1'] ? 'NOT_AGRICULTURAL' : 'AGRICULTURAL',
						location: 'INLOCAL',
						useType: (currLandPIB['ZEM2'] && 'OSGMANAGE') || (currLandPIB['ZEM3'] && 'SGPRODUCTMANAGE') || (currLandPIB['ZEM5'] && 'SMALLHOLDING') || (currLandPIB['ZEM6'] && 'GARDENMANAGE') || null,
						landPurpose: (currLandPIB['ZEM4'] && 'PASTURES') || null,
						totalArea: currLandPIB['ZEM'] || 0,
						documentOwnership: currLandPIB['NOMAKT'] || '-',
						registryData: checkDate(currPIB2['DATAAKT']) || new Date(1902, 1, 2),
						position: currLandPIB['MAS'] || null,
						notes: currLandPIB['PIDSTAVA'] || null,
						objAccountingID: objAccountingID
					}
				});
			}


			//Відомості про житловий об'єкт, Сільске господарство, техніка
			if (Object.keys(currRealty).length) {

				//Відомості про житловий об'єкт
				if (currRealty) {
					ds_room.run('insert', {
						__skipSelectAfterInsert: true,
						execParams: {
							ID: ds_room.generateID(),
							year: 2018,
							buildYear: currPIB1['RBYD1'] || null,
							roomType: 'LIVE_HOUSE',
							wallMaterial: (currPIB1['MSBYD1'] && wallMaterial[currPIB1['MSBYD1']]) || null,
							roofMaterial: (currPIB1['MDYD1'] && roofMaterial[currPIB1['MDYD1']]) || null,
							checkDate: new Date(2018, 0, 1),
							totalArea: currRealty['PLZ1'] || 0,
							summerArea: currRealty['PLL1'] || null,
							livingArea: currRealty['PLG1'] || null,
							livingRoomCount: currRealty['NKIM1'] || null,
							aqueduct: currRealty['VOD1'] || 0,
							sewerage: currRealty['KAN1'] || 0,
							heating: (currRealty['OPAL1'] && 'INDIVID') || null,
							hotWater: currRealty['VODH1'] || 0,
							bath: currRealty['VAN1'] || 0,
							naturalGas: currRealty['GAZP1'] || 0,
							liquefiedGas: currRealty['GAZSK1'] || 0,
							electricPlate: currRealty['ELP1'] || 0,
							objAccountingID: objAccountingID,
							oldID: KODG,
							oldTable: 'kniga1_3'
						}
					});
				}

				//Сільске господарство, техніка
				agricultureID = ds_agriculture.generateID();
				ds_agriculture.run('insert', {
					__skipSelectAfterInsert: true,
					execParams: {
						ID: agricultureID,
						year: 2018,
						"cattleTotal": currRealty['HUD'] || null,
						"bull": currRealty['HUD1'] || null,
						"cow": currRealty['HUD2'] || null,
						"heiferOneTwo": currRealty['HUD3'] || null,
						"heiferTwoMore": currRealty['HUD4'] || null,
						"calveOneYear": currRealty['HUD5'] || null,
						"pigsTotal": currRealty['SV'] || null,
						"sowsNineMore": currRealty['SV1'] || null,
						"repairPigFourMore": currRealty['SV2'] || null,
						"pigletTwoLess": currRealty['SV3'] || null,
						"sheepTotal": currRealty['VIV'] || null,
						"sheepYearMore": currRealty['VIV1'] || null,
						"goatTotal": currRealty['KOZ'] || null,
						"goatYearMore": currRealty['KOZ1'] || null,
						"horseTotal": currRealty['KON'] || null,
						"mareThreeYearMore": currRealty['KON1'] || null,
						"horseYearMore": currRealty['KON2'] || null,
						"birdTotal": currRealty['PTAH'] || null,
						"hen": currRealty['PTAH1'] || null,
						"rabbitTotal": currRealty['KRIL'] || null,
						"rabbits": currRealty['KRIL1'] || null,
						"beesTotal": currRealty['BJOL'] || null,
						"notes": (currPIB1['RAX1'] && `${currPIB1['RAX1']}`) || null,
						objAccountingID: objAccountingID
					}
				});

				if (currRealty['HUT1'] && !Ext.isEmpty(currPIB1['MN1'])) {
					ds_animal.run('insert', {
						__skipSelectAfterInsert: true,
						execParams: {
							ID: ds_animal.generateID(),
							name: animalType[currPIB1['MN1']],
							count: currRealty['HUT1'],
							agricultureID: agricultureID
						}
					});
				}

				if ((currRealty['HUT2'] && !Ext.isEmpty(currPIB1['MN2']))) {
					ds_animal.run('insert', {
						__skipSelectAfterInsert: true,
						execParams: {
							ID: ds_animal.generateID(),
							name: animalType[currPIB1['MN2']],
							count: currRealty['HUT2'],
							agricultureID: agricultureID
						}
					});
				}

				if (currRealty['TR'] || currRealty['TR1'] || currRealty['VANT'] || currRealty['KOMB'] || currRealty['KOMB1']) {
					ds_machine.run('insert', {
						__skipSelectAfterInsert: true,
						execParams: {
							ID: ds_machine.generateID(),
							year: 2018,
							tractorTotal: currRealty['TR'] || null,
							miniTractor: currRealty['TR1'] || null,
							truck: currRealty['VANT'] || null,
							combineTotal: currRealty['KOMB'] || null,
							harvesterCombine: currRealty['KOMB1'] || null,
							notes: currRealty['DODINFOR5'] || null,
							objAccountingID: objAccountingID
						}
					});
				}

			}
		}
	});

};
me.entity.addMethod("invankivImport");


me.importKorukiv = function () {
	let dsUser = UB.DataStore('uba_user'),
		ds_payer = UB.DataStore('inv_payers'),
		ds_regunit = UB.DataStore('inv_regUnit'),
		ds_country = UB.DataStore('inv_countryDict'),
		ds_street = UB.DataStore('pgo_localStreet');

	dsUser.runSQL(`select A1.ID, A1.[PR] as lastName, A1.IM as firstName, A1.PB as middleName, A1.[NOM_EDDR] as EDDRecordNum, A1.PD_VYD as docType, A1.PD_SER as docSeries, A1.[PD_NOM] as docNum, 
A1.[PD_DV] as docDateFrom, A1.[PD_DD] as docDateTo, A1.[PD_OV] as docIssuedBy, A1.[POP_PIB] as prevLastName, A1.[DN] as birthDate, A1.[DS] as deathDate, A1.[ST] as gender, A1.[MN_KR] as countryB,
A1.[MN_OBL] as areaB, A1.[MN_RN] as regionB, A1.[MN_NP] as settlementB, A1.[VISK_KATEGOR] as accBoard, A1.[BAT_PIB] as authorizedFullName,
A2.[MR_OBL] as areaAddR, A2.[MR_RN] as regionAddR, A2.MR_NP as settlementAddR, A2.[MR_TYP_GEON] as streetTypeAddR, A2.[MR_GEON] as streetAddR, A2.MR_BUD as houseNumAddR, A2.[MR_KV] as flatNumAddR
from GOLOVNA A1 left join ADRESY A2 on A2.[ID_GOLOVNA]=A1.[ID]`, {});

	let data = JSON.parse(dsUser.asJSONObject),
		area = {
			"Автономна Республіка Крим": "Автономна республіка крим",
			"Вінницька обл.": "Вінницька",
			"Донецька обл.": "Донецька",
			"Житомирська обл.": "Житомирська",
			"Запорізька обл.": "Запорізька",
			"Київська ": "Київська",
			"Київська обл.": "Київська",
			"Кіровоградська обл.": "Кіровоградська",
			"Луганська обл.": "Луганська",
			"м.Київ": "м. Київ",
			"Одеська обл.": "Одеська",
			"Полтавська обл.": "Полтавська",
			"Рівненська обл.": "Рівненська",
			"Сумська обл.": "Сумська",
			"Харківська обл.": "Харківська",
			"Херсонська обл.": "Херсонська",
			"Черкаська обл.": "Черкаська",
			"Чернівецька обл.": "Чернівецька",
			"Чернігівська обл.": "Чернігівська"
		},
		region = {
			"Баришівський р-н": "Баришівський район",
			"Бериславський р-н": "Бериславський район",
			"Білоцерківський р-н": "Білоцерківський район",
			"Борзнянський р-н": "Борзнянський район",
			"Броварський р-н": "Броварський район",
			"Васильківський р-н": "Васильківський",
			"Вовчанський р-н": "Вовчанський",
			"Городнянський р-н": "Городнянський",
			"Дубровицький р-н": "Дубровицький район",
			"Знам’янський р-н": "Знам'янський район",
			"Іллінецький р-н": "Іллінецький район",
			"Кегичівський р-н": "Кегичівський район",
			"Корюківський р-н": "Корюківський район",
			"Кролевецький р-н": "Кролевецький район",
			"Лиманський р-н": "",
			"Лутугинський р-н": "",

			"Менський р-н": "Менський район",
			"Миронівський р-н": "Миронівський район",
			"Ріпкинський р-н": "Ріпкинський район",
			"Сновський р-н": "",
			"Сосницький р-н": "Сосницький район",
			"Сторожинецький р-н": "Сторожинецький район",
			"Харківський р-н": "Харківський район",
			"Чернігівський р-н": "Чернігівський район",
			"Шевченківський ": "Шевченківський район"
		},
		settlement = {
			"м. Чернігів": {type: "Місто", name: "Чернігів"},
			"м.Алушта": {type: "Місто", name: "Алушта"},
			"м.Борзна": {type: "Місто", name: "Борзна"},
			"м.Бровари": {type: "Місто", name: "Бровари"},
			"м.Брянка": {type: "Місто", name: "Брянка"},
			"м.Буча": {type: "Місто", name: "Буча"},
			"м.Вишневе": {type: "Місто", name: "Вишневе"},
			"м.Вінниця": {type: "Місто", name: "Вінниця"},
			"м.Глухів": {type: "Місто", name: "Глухів"},
			"м.Гола Пристань": {type: "Місто", name: "Гола Пристань"},
			"м.Городня": {type: "Місто", name: "Городня"},
			"м.Довжанськ": {type: "Місто", name: "Довжанськ"},
			"м.Жданівка": {type: "Місто", name: "Жданівка"},
			"м.Житомир": {type: "Місто", name: "Житомир"},
			"м.Запоріжжя": {type: "Місто", name: "Запоріжжя"},
			"м.Ірпінь": {type: "Місто", name: "Ірпінь"},
			"м.Київ": {type: "Місто", name: "Київ"},
			"м.Кондрово": {type: "Місто", name: "Кондрово"},
			"м.Корюківка": {type: "Місто", name: "Корюківка"},
			"м.Мена": {type: "Місто", name: "Мена"},
			"м.Миргород": {type: "Місто", name: "Миргород"},
			"м.Ніжин": {type: "Місто", name: "Ніжин"},
			"м.Новгород-Сіверський": {type: "Місто", name: "Новгород-Сіверський"},
			"м.Одеса": {type: "Місто", name: "Одеса"},
			"м.Петрово-Красносілля": {type: "Місто", name: "Петрово-Красносілля"},
			"м.Полтава": {type: "Місто", name: "Полтава"},
			"м.Рівне": {type: "Місто", name: "Рівне"},
			"м.Семенівка": {type: "Місто", name: "Семенівка"},
			"м.Славутич": {type: "Місто", name: "Славутич"},
			"м.Сміла": {type: "Місто", name: "Сміла"},
			"м.Сновськ": {type: "Місто", name: "Сновськ"},
			"м.Суми": {type: "Місто", name: "Суми"},
			"м.Фастів": {type: "Місто", name: "Фастів"},
			"м.Харків": {type: "Місто", name: "Харків"},
			"м.Черкаси": {type: "Місто", name: "Черкаси"},
			"м.Чернігв": {type: "Місто", name: "Чернігв"},
			"м.Чернігів": {type: "Місто", name: "Чернігів"},
			"с-ще Довга Гребля": {type: "Селище", name: "Довга Гребля"},
			"с-ще Докучаєвське": {type: "Селище", name: "Докучаєвське"},
			"с-ще Новорайськ": {type: "Селище", name: "Новорайськ"},
			"с. Тютюнниця": {type: "Село", name: "Тютюнниця"},
			"с.Андроники": {type: "Село", name: "Андроники"},
			"с.Білошицька Слобода": {type: "Село", name: "Білошицька Слобода"},
			"с.Блистова": {type: "Село", name: "Блистова"},
			"с.Бобрик": {type: "Село", name: "Бобрик"},
			"с.Бреч": {type: "Село", name: "Бреч"},
			"с.Буда": {type: "Село", name: "Буда"},
			"с.Величківка": {type: "Село", name: "Величківка"},
			"с.Високе": {type: "Село", name: "Високе"},
			"с.Вільшане": {type: "Село", name: "Вільшане"},
			"с.Воловики": {type: "Село", name: "Воловики"},
			"с.Гуринівка": {type: "Село", name: "Гуринівка"},
			"с.Гутище": {type: "Село", name: "Гутище"},
			"с.Данилівка": {type: "Село", name: "Данилівка"},
			"с.Дачне": {type: "Село", name: "Дачне"},
			"с.Домашлин": {type: "Село", name: "Домашлин"},
			"с.Забарівка": {type: "Село", name: "Забарівка"},
			"с.Заляддя": {type: "Село", name: "Заляддя"},
			"с.Іванівка": {type: "Село", name: "Іванівка"},
			"с.Камка": {type: "Село", name: "Камка"},
			"с.Киїнка": {type: "Село", name: "Киїнка"},
			"с.Кирилівка": {type: "Село", name: "Кирилівка"},
			"с.Киселівка": {type: "Село", name: "Киселівка"},
			"с.Княжичі": {type: "Село", name: "Княжичі"},
			"с.Козилівка": {type: "Село", name: "Козилівка"},
			"с.Колки": {type: "Село", name: "Колки"},
			"с.Костючки": {type: "Село", name: "Костючки"},
			"с.Кугуки": {type: "Село", name: "Кугуки"},
			"с.Куковичі": {type: "Село", name: "Куковичі"},
			"с.Лашуки": {type: "Село", name: "Лашуки"},
			"с.Лубенець": {type: "Село", name: "Лубенець"},
			"с.Лупасове": {type: "Село", name: "Лупасове"},
			"с.Матвіївка": {type: "Село", name: "Матвіївка"},
			"с.Маховики": {type: "Село", name: "Маховики"},
			"с.Мощенка": {type: "Село", name: "Мощенка"},
			"с.Наумівка": {type: "Село", name: "Наумівка"},
			"с.Недра": {type: "Село", name: "Недра"},
			"с.Нова Буда": {type: "Село", name: "Нова Буда"},
			"с.Нова Гуринівка": {type: "Село", name: "Нова Гуринівка"},
			"с.Озереди": {type: "Село", name: "Озереди"},
			"с.Олександрівка": {type: "Село", name: "Олександрівка"},
			"с.Олешня": {type: "Село", name: "Олешня"},
			"с.Олійники": {type: "Село", name: "Олійники"},
			"с.Охрамієвичі": {type: "Село", name: "Охрамієвичі"},
			"с.Пархомівка": {type: "Село", name: "Пархомівка"},
			"с.Переділ": {type: "Село", name: "Переділ"},
			"с.Перелюб": {type: "Село", name: "Перелюб"},
			"с.Петрова Слобода": {type: "Село", name: "Петрова Слобода"},
			"с.Підлипне": {type: "Село", name: "Підлипне"},
			"с.Піски": {type: "Село", name: "Піски"},
			"с.Рейментарівка": {type: "Село", name: "Рейментарівка"},
			"с.Рибинськ": {type: "Село", name: "Рибинськ"},
			"с.Романівська Буда": {type: "Село", name: "Романівська Буда"},
			"с.Ропча": {type: "Село", name: "Ропча"},
			"с.Рудня": {type: "Село", name: "Рудня"},
			"с.Савинки": {type: "Село", name: "Савинки"},
			"с.Самотуги": {type: "Село", name: "Самотуги"},
			"с.Самсонівка": {type: "Село", name: "Самсонівка"},
			"с.Сахутівка": {type: "Село", name: "Сахутівка"},
			"с.Святопетрівське": {type: "Село", name: "Святопетрівське"},
			"с.Синявка": {type: "Село", name: "Синявка"},
			"с.Смяч": {type: "Село", name: "Смяч"},
			"с.Соснівка": {type: "Село", name: "Соснівка"},
			"с.Софіївська Борщагівка": {type: "Село", name: "Софіївська Борщагівка"},
			"с.Спаське": {type: "Село", name: "Спаське"},
			"с.Сухоліси": {type: "Село", name: "Сухоліси"},
			"с.Сядрине": {type: "Село", name: "Сядрине"},
			"с.Тельне": {type: "Село", name: "Тельне"},
			"с.Трепівка": {type: "Село", name: "Трепівка"},
			"с.Трудовик": {type: "Село", name: "Трудовик"},
			"с.Турівка": {type: "Село", name: "Турівка"},
			"с.Тютюнниця": {type: "Село", name: "Тютюнниця"},
			"с.Ховдіївка": {type: "Село", name: "Ховдіївка"},
			"с.Хотіївка": {type: "Село", name: "Хотіївка"},
			"с.Хрипівка": {type: "Село", name: "Хрипівка"},
			"с.Центральне": {type: "Село", name: "Центральне"},
			"с.Широке": {type: "Село", name: "Широке"},
			"с.Шишка": {type: "Село", name: "Шишка"},
			"с.Шишківка": {type: "Село", name: "Шишківка"},
			"смт Глеваха": {type: "Селище міського типу", name: "Глеваха"},
			"смт Кегичівка": {type: "Селище міського типу", name: "Кегичівка"},
			"смт Ріпки": {type: "Селище міського типу", name: "Ріпки"},
			"смт Сосниця": {type: "Селище міського типу", name: "Сосниця"},
			"смт Успенка": {type: "Селище міського типу", name: "Успенка"},
			"смт Холми": {type: "Селище міського типу", name: "Холми"},
			"смтКоцюбинське": {type: "Селище міського типу", name: "Коцюбинське"}
		},
		streetType = {
			"бульв.": 'бульвар',
			"вул.": 'вулиця',
			"пров.": 'провулок',
			"Провулок": 'провулок',
			"проїзд": 'проїзд',
			"просп.": 'проспект',
			"шосе": 'шосе'
		},
		regUnitType = {
			'ПГУ': 'PASSPORT',
			'СВ': 'CERTIF'
		},
		regUnit = {},
		regUnitCode = 0,
		streetCode = {},
		gender = {
			1: 'MALE',
			2: 'FEMALE'
		},
		country = {
			'Україна': 333658698055681
		},
		street = {},
		settlementDict = _.keyBy(UB.Repository('pgo_settlementDict').attrs('ID', 'governmentStatus', 'governmentName').selectAsObject(), city => city.governmentStatus + city.governmentName),
		streetTypeDict = _.keyBy(UB.Repository('pgo_streetType').attrs('ID', 'name').selectAsObject(), city => city.name);

	_.forEach(data, function (item, i) {
		if (item.docType && (item.docType === 'ПГУ' || item.docType === 'СВ') && item.docIssuedBy && !regUnit[item.docIssuedBy]) {
			let currID = ds_regunit.generateID();
			ds_regunit.run('insert', {
				__skipSelectAfterInsert: true,
				execParams: {
					ID: currID,
					code: (++regUnitCode).toString(),
					name: item.docIssuedBy,
					type: regUnitType[item.docType]
				}
			});

			regUnit[item.docIssuedBy] = currID;
		}

		if (item.countryB && !country[item.countryB]) {
			let currID = ds_country.generateID();
			ds_country.run('insert', {
				__skipSelectAfterInsert: true,
				execParams: {
					ID: currID,
					name: item.countryB
				}
			});

			country[item.countryB] = currID;
		}

		if (item.settlementAddR && item.streetTypeAddR && item.streetAddR && !streetCode[item.settlementAddR + item.streetAddR]) {
			streetCode[item.settlementAddR + item.streetAddR] = 0;
		}

		if (item.settlementAddR && item.streetTypeAddR && item.streetAddR && settlementDict[settlement[item.settlementAddR].type + settlement[item.settlementAddR].name] && !street[item.streetTypeAddR + item.streetAddR]) {
			let currID = ds_street.generateID();
			ds_street.run('insert', {
				__skipSelectAfterInsert: true,
				execParams: {
					ID: currID,
					settlementDictID: settlementDict[settlement[item.settlementAddR].type + settlement[item.settlementAddR].name].ID,
					street: item.streetAddR,
					code: (streetCode[item.settlementAddR + item.streetAddR] > 8 && '0' || '00') + (++streetCode[item.settlementAddR + item.streetAddR]),
					streetType: streetTypeDict[streetType[item.streetTypeAddR]].ID,
				}
			});

			street[item.settlementAddR + item.streetAddR] = currID;
		}

		ds_payer.run('insert', {
			__skipSelectAfterInsert: true,
			execParams: {
				ID: ds_payer.generateID(),
				personType: 'PHYSICAL',
				lastName: item.lastName,
				firstName: item.firstName,
				middleName: item.middleName || null,
				passportSeries: item.docType === 'ПГУ' && item.docSeries || null,
				passportNumber: item.docType === 'ПГУ' && item.docNum || null,
				passportIssueDate: item.docType === 'ПГУ' && (item.docDateFrom ? new Date(item.docDateFrom) : null) || null,
				passportIssuedBy: item.docType === 'ПГУ' && regUnit[item.docIssuedBy] || null,
				passportValidToDate: item.docType === 'ПГУ' && (item.docDateTo ? new Date(item.docDateTo) : null) || null,
				birthDate: item.birthDate && new Date(item.birthDate) || null,
				notes: (item.docType !== 'ПГУ' && item.docType !== 'СВ') && `${item.docType || ''} ${item.docSeries || null} ${item.docNum || null} ${item.docDateFrom && Ext.Date.format(item.docDateFrom, 'd.m.Y') || ''} ${item.docIssuedBy || null}` || null,
				gender: gender[item.gender],
				birthCertificate: item.docType === 'СВ' && (item.docSeries || item.docNum ? `${item.docSeries || ''} ${item.docNum || ''}` : null) || null,
				birthCertifDate: item.docType === 'СВ' && (item.docDateFrom ? new Date(item.docDateFrom) : null) || null,
				birthCertifIssuedBy: item.docType === 'СВ' && regUnit[item.docIssuedBy] || null,
				accBoard: item.accBoard || null,
				countryB: country[item.countryB] || null,
				areaB: area[item.areaB] || null,
				regionB: region[item.regionB] || null,
				settlementB: item.settlementB && (settlement[item.settlementB] && settlementDict[settlement[item.settlementB].type + settlement[item.settlementB].name] ? settlementDict[settlement[item.settlementB].type + settlement[item.settlementB].name].ID : null) || null,
				areaAddR: area[item.areaAddR] || null,
				regionAddR: region[item.regionAddR] || null,
				settlementAddR: item.settlementAddR && (settlement[item.settlementAddR] && settlementDict[settlement[item.settlementAddR].type + settlement[item.settlementAddR].name] ? settlementDict[settlement[item.settlementAddR].type + settlement[item.settlementAddR].name].ID : null) || null,
				streetTypeAddR: item.streetTypeAddR && streetTypeDict[streetType[item.streetTypeAddR]] ? streetTypeDict[streetType[item.streetTypeAddR]].ID : null,
				streetAddR: item.streetAddR && street[item.settlementAddR + item.streetAddR] || null,
				houseNumAddR: !Ext.isEmpty(item.houseNumAddR) && item.houseNumAddR || null,
				flatNumAddR: !Ext.isEmpty(item.flatNumAddR) && item.flatNumAddR || null,
				authorizedFullName: item.authorizedFullName || null,
				prevLastName: item.prevLastName || null,
				EDDRecordNum: item.EDDRecordNum || null,
				deathDate: item.deathDate && new Date(item.deathDate) || null,

			}
		});
	});
}
me.entity.addMethod("importKorukiv");

me.updateInvPayersForKorukiv = function (ctx) {
	const regInfo = UB.DataStore('comm_regInfoCurr')
	const regUnitID = 332428301631489
	UB.Repository('inv_payers')
		.attrs('ID', 'areaAddR', 'regionAddR', 'settlementAddR', 'streetTypeAddR', 'streetAddR', 'houseNumAddR',
			'flatNumAddR', 'settlementDistrictAddR')
		.selectAsObject().forEach(payer => {
		const regInfoID = regInfo.generateID()
		regInfo.run('insert', {
			__skipSelectAfterInsert: true,
			execParams: {
				ID: regInfoID,
				regUnit: regUnitID,
				regDate: new Date(),
				area: payer.areaAddR || null,
				region: payer.regionAddR || null,
				settlement: payer.settlementAddR || null,
				streetType: payer.streetTypeAddR || null,
				settlementDistrict: payer.settlementDistrictAddR || null,
				street: payer.streetAddR || null,
				houseNum: payer.houseNumAddR || null,
				flatNum: payer.flatNumAddR || null,
				payerID: payer.ID
			}
		})

		const inv_payersDs = UB.DataStore('inv_payers')
		inv_payersDs.run("update",
			{
				__skipSelectAfterUpdate: true,
				__skipOptimisticLock: true,
				execParams: {
					ID: payer.ID,
					regInfoCurrID: regInfoID,
					mi_modifyDate: new Date()
				}
			});
	})

}
me.entity.addMethod("updateInvPayersForKorukiv");
