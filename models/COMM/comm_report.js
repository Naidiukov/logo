const me = comm_report;
const _ = require('lodash');
const UB = require('@unitybase/ub');
const Session = UB.Session;


var XlsxTemplate = require('xlsx-template');
var fs = require('fs');
var path = require('path');
// var LocalDataStore = require('@unitybase/base').LocalDataStore;
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
var url = require('url');

me.generateExcel = function (fake, req, resp) {
	let ID;

	var param = req.parameters.split('&');
	param = param.map((elem) => {
		var newEl = {},
			spVal = elem.split('=');
		if (spVal[0] == 'ID') {
			ID = spVal[1]
		}

		newEl.name = spVal[0];
		newEl.value = spVal[1];
		return newEl;
	});


	var report = UB.Repository("comm_report")
		.attrs(["*"])
		.where("[ID]", '=', ID)
		.selectAsObject()[0];
	var fileName = '';
	switch (report.repType) {
		case 'FORM31':
			fileName = 'Form3.1.xlsx';
			break;
		case 'FORM34':
			fileName = 'Form3.4.xlsx';
			break;
		case 'FORM35':
			fileName = 'Form3.5.xlsx';
			break;
		case 'REGLPLACE':
			fileName = 'pro_reyestraciyu_miscya_prozhyvannya.xlsx';
			break;
		case 'REGLPLACEREM':
			fileName = 'pro_znyattya_z_reyestraciyi_miscya_prozhyvannya.xlsx';
			break;
		case 'PERSONCARD':
			fileName = 'adresna_kartka_osoby.xlsx';
			break;
	}
	var templatePath = path.join(process.configPath, 'excelTemplate', fileName);
	var templateFile = fs.readFileSync(templatePath, {encoding: 'bin'});
	// Create a template
	var template = new XlsxTemplate(templateFile);

	// Replacements take place on first sheet
	var sheetNumber = 1;


	// Set up some placeholder values matching the placeholders in the template
	var values = JSON.parse(report.reportData);
	values.createDate = getDate(report.dateRep, true);
	// Perform substitution
	template.substitute(sheetNumber, values);

	// Get binary data
	var resultDoc = template.generate({type: 'ArrayBuffer'});
	//ctx.mParams.resultData = resultDoc;

	resp.writeEnd(resultDoc);
	resp.writeHead('Content-type: application/vnd.ms-excel', 'Content-Disposition: inline; filename="' + fileName + '"');
	resp.statusCode = 200;
};

me.saveDataForms = function (ctx) {
	var params = ctx.mParams,
		reportParams = {
			dateFrom: getDate(params.dateFrom, true),
			dateTo: getDate(params.dateTo, true),
            settlement: params.isSettlement ? params.settlementRaw : params.localRequisitesRaw
		},
		dateFrom = params.dateFrom,
		dateTo = params.dateTo,
		fieldsAlias = {
			'payerID.lastName': 'lastName',
			'payerID.firstName': 'firstName',
			'payerID.middleName': 'middleName',
			'payerID.birthDateFormatted': 'birthDate',
			'payerID.EDDRecordNum': 'EDDRecordNum',
			'payerID.countryB.name': 'countryBName',
			'payerID.areaB': 'areaB',
			'payerID.regionB': 'regionB',
			'streetType.name': 'streetTypeName',
			'street.street': 'streetName',
			'regDateFormatted': 'regDate',
			'docType.name': 'docTypeName'
		};

	var reportArr = UB.Repository('comm_regInfoCurr')
		.attrs(['payerID.lastName', 'payerID.firstName', 'payerID.middleName', 'payerID.birthDateFormatted', 'payerID.EDDRecordNum', 'regDateFormatted',
			'payerID.countryB.name', 'payerID.areaB', 'payerID.regionB',
			'area', 'region', 'settlement.governmentShortName',
			'streetType.name', 'street.street', 'houseNum', 'flatNum', 'docType.name'])
        .where("[settlement]", 'in', params.isSettlement ? [params.settlement] : UB.Repository("pgo_localSettlement").attrs(['settlementDictID']).where('[localRequisitesID]', '=', params.localRequisites))
		.where("[state]", '=', 'REGISTERED')
		.orderBy('[regDate]');

	switch (params.repType) {
		case 'FORM31': {
			dateFrom.setFullYear(dateFrom.getFullYear() - 18);
			dateTo.setFullYear(dateTo.getFullYear() - 18);
			reportArr.attrs(['payerID.prevLastName', 'payerID.settlementB.pgoDictID.localGovernment', 'settlement.pgoDictID.localGovernment'])
				.where("[payerID.birthDate]", '>=', dateFrom)
				.where("[payerID.birthDate]", '<=', dateTo);

			fieldsAlias['payerID.prevLastName'] = 'prevLastName';
			fieldsAlias['settlement.pgoDictID.localGovernment'] = 'localGovName';
			fieldsAlias['payerID.settlementB.pgoDictID.localGovernment'] = 'localGovBName';
			break;
		}
		case 'FORM34': {
			reportArr.attrs(['payerID.prevLastName'])
				.attrs(['payerID.areaFrom', 'payerID.regionFrom', 'payerID.settlementFrom', 'payerID.settlementB.pgoDictID.localGovernment', 'settlement.pgoDictID.localGovernment', 'isDoc'])
				.where("[regDate]", '>=', dateFrom)
				.where("[regDate]", '<=', dateTo)
				.where("[isAdultReg]", '=', 1);

			fieldsAlias['payerID.prevLastName'] = 'prevLastName';
			fieldsAlias['payerID.areaFrom'] = 'areaFrom';
			fieldsAlias['payerID.regionFrom'] = 'regionFrom';
			fieldsAlias['payerID.settlementFrom'] = 'settlementFrom';
			fieldsAlias['settlement.pgoDictID.localGovernment'] = 'localGovName';
			fieldsAlias['payerID.settlementB.pgoDictID.localGovernment'] = 'localGovBName';
			break;
		}
		case 'REGLPLACE': {
			reportArr.attrs(['payerID.genderName', 'removeDateFormatted', 'payerID.nationality.name', 'series', 'num', 'issueDateFormatted', 'docRegUnit.name',
				'validToFormatted', 'payerID.natalPlaceB',
				'payerID.areaFrom', 'payerID.regionFrom', 'payerID.settlementFrom', 'payerID.streetTypeFrom', 'payerID.streetFrom', 'payerID.houseNumFrom', 'payerID.flatNumFrom', 'payerID.postIndexFrom'])
				.where("[regDate]", '>=', dateFrom)
				.where("[regDate]", '<=', dateTo);
			fieldsAlias['payerID.genderName'] = 'genderName';
			fieldsAlias['removeDateFormatted'] = 'removeDate';
			fieldsAlias['issueDateFormatted'] = 'issueDate';
			fieldsAlias['validToFormatted'] = 'validTo';
			fieldsAlias['payerID.nationality.name'] = 'nationalityName';
			fieldsAlias['docRegUnit.name'] = 'docRegUnitName';
			fieldsAlias['payerID.natalPlaceB'] = 'natalPlaceB';
			fieldsAlias['payerID.areaFrom'] = 'areaFrom';
			fieldsAlias['payerID.regionFrom'] = 'regionFrom';
			fieldsAlias['payerID.settlementFrom'] = 'settlementFrom';
			fieldsAlias['payerID.streetTypeFrom'] = 'streetTypeFrom';
			fieldsAlias['payerID.streetFrom'] = 'streetFrom';
			fieldsAlias['payerID.houseNumFrom'] = 'houseNumFrom';
			fieldsAlias['payerID.flatNumFrom'] = 'flatNumFrom';
			fieldsAlias['payerID.postIndexFrom'] = 'postIndexFrom';
			break;
		}
	}

	if (params.repType == 'FORM31' || params.repType == 'FORM34') {

        var pgo_localRequisites = UB.Repository("pgo_localRequisites")
            .attrs(['headFullName']);
        if (params.isSettlement)
            pgo_localRequisites.where('[pgoDictID]', 'in', UB.Repository("pgo_settlementDict").attrs(['pgoDictID']).where('[ID]', '=', params.settlement));
        else pgo_localRequisites.where('ID', '=', params.localRequisites)
        let headFullName = pgo_localRequisites.selectAsObject()[0];
		if (headFullName && headFullName.headFullName) reportParams.headFullName = headFullName.headFullName;

		reportArr.attrs(['payerID.settlementB.governmentName', 'payerID.settlementB.governmentStatus', 'settlement.governmentName', 'settlement.governmentStatus']);
		Object.assign(fieldsAlias, {
			'payerID.settlementB.governmentName': 'settlementBName',
			'payerID.settlementB.governmentStatus': 'settlementBStatus',
			'settlement.governmentName': 'settlementName',
			'settlement.governmentStatus': 'settlementStatus',
		})
	}
	else {
		reportArr.attrs('payerID.settlementB.governmentShortName');
        Object.assign(fieldsAlias, {
            'payerID.settlementB.governmentShortName': 'settlementBName',
            'settlement.governmentShortName': 'settlementName'
        });
	}

	reportParams.report = reportArr.selectAsObject(fieldsAlias);

	// reportParams.report = LocalDataStore.selectResultToArrayOfObjects(reportArr, fieldsAlias);

	let item;

	for (let i = 0; i < reportParams.report.length; i++) {
		item = reportParams.report[i];
		item.rowID = i + 1;
		if (params.repType == 'REGLPLACE') {
			let birthPlace = [],
				regAddress = [],
				fromAddress = [];
			if (item.countryBName == 'Україна') {
				birthPlace.push(item['countryBName'], item['areaB'], item['regionB'], item['settlementBName']);
				item.birthPlace = _.compact(birthPlace).join(', ');
			}
			else {
				item.birthPlace = item.natalPlaceB;
			}

			regAddress.push(item['area'], item['region'], item['settlementName'], item['streetTypeName'], item['streetName'], item['houseNum'], item['flatNum']);
			item.regAddress = _.compact(regAddress).join(', ');

			fromAddress.push(item['areaFrom'], item['regionFrom'], item['settlementFrom'], item['streetTypeFrom'], item['streetFrom'], item['houseNumFrom'], item['flatNumFrom'], item['postIndexFrom']);
			item.fromAddress = _.compact(fromAddress).join(', ');
		}
        if (params.repType == 'FORM34') {
            if (item.areaB && !/(к||К)рим$$/g.test(item.areaB)) item.areaB += ' обл.';
            if (item.regionB) item.regionB = item.regionB.replace('район', 'р-н');
            if (item.settlementBStatus && item.settlementBName) item.settlementBName = item.settlementBStatus.substr(0, 1).toLowerCase() + '. ' + item.settlementBName;

            if (item.area && !/(к||К)рим$$/g.test(item.area)) item.area += ' обл.';
            if (item.region) item.region = item.region.replace('район', 'р-н');
            if (item.settlementStatus && item.settlementName) item.settlementName = item.settlementStatus.substr(0, 1).toLowerCase() + '. ' + item.settlementName;

		}
	}


	let dsReport = UB.DataStore('comm_report'),
		reportID = dsReport.generateID();
	dsReport.run('insert', {
		execParams: {
			ID: reportID,
			dateFrom: params.dateFrom,
			dateTo: params.dateTo,
			repType: params.repType,
			reportData: JSON.stringify(reportParams),
			dateRep: new Date()

		}
	});
	ctx.mParams.reportID = reportID;
};

me.saveDataForm31 = function (ctx) {
	var params = ctx.mParams,
		reportParams = {
			dateFrom: getDate(params.dateFrom, true),
			dateTo: getDate(params.dateTo, true),
            settlement: params.isSettlement ? params.settlementRaw : params.localRequisitesRaw
		},
		dateFrom = params.dateFrom,
		dateTo = params.dateTo,
		fieldsAlias = {
			'birthDateFormatted': 'birthDate',
			'countryB.name': 'countryBName',
			'settlementB.governmentStatus': 'settlementBStatus',
			'settlementB.governmentName': 'settlementBName',
			'settlementB.pgoDictID.localGovernment': 'localGovBName',
			'settlementAddR.governmentStatus': 'settlementAddRStatus',
			'settlementAddR.governmentName': 'settlementAddRName',
			'settlementAddR.pgoDictID.localGovernment': 'localGovAddRName',
			'streetTypeAddR.name': 'streetTypeAddRName',
			'streetAddR.street': 'streetAddRName'
		};

	dateFrom.setFullYear(dateFrom.getFullYear() - 18);
	dateTo.setFullYear(dateTo.getFullYear() - 18);

	var reportArr = UB.Repository('inv_payers')
		.attrs(['lastName', 'firstName', 'middleName', 'birthDateFormatted', 'EDDRecordNum', 'prevLastName',
			'countryB.name', 'areaB', 'regionB', 'settlementB.governmentStatus', 'settlementB.governmentName', 'natalPlaceB', 'settlementB.pgoDictID.localGovernment',
			'areaAddR', 'regionAddR', 'settlementAddR.governmentStatus', 'settlementAddR.governmentName', 'settlementAddR.pgoDictID.localGovernment',
			'streetTypeAddR.name', 'streetAddR.street', 'houseNumAddR', 'flatNumAddR', 'docType', 'rDocType'])
        .where("[settlementAddR]",  'in', params.isSettlement ? [params.settlement] : UB.Repository("pgo_localSettlement").attrs(['settlementDictID']).where('[localRequisitesID]', '=', params.localRequisites))
		.where("[birthDate]", '>=', dateFrom)
		.where("[birthDate]", '<=', dateTo);

	reportParams.report = reportArr.selectAsObject(fieldsAlias);

	// reportParams.report = LocalDataStore.selectResultToArrayOfObjects(reportArr, fieldsAlias);


    var pgo_localRequisites = UB.Repository("pgo_localRequisites")
        .attrs(['headFullName']);
    if (params.isSettlement)
        pgo_localRequisites.where('[pgoDictID]', 'in', UB.Repository("pgo_settlementDict").attrs(['pgoDictID']).where('[ID]', '=', params.settlement));
    else pgo_localRequisites.where('ID', '=', params.localRequisites)
    let headFullName = pgo_localRequisites.selectAsObject()[0];
	if (headFullName && headFullName.headFullName) reportParams.headFullName = headFullName.headFullName;

	for (let i = 0; i < reportParams.report.length; i++) {
		reportParams.report[i].rowID = i + 1;
		//reportParams.report[i].docTypeName = reportParams.report[i].rDocType ? reportParams.report[i].rDocType : reportParams.report[i].docType;
        if (reportParams.report[i].areaB && !/(к||К)рим$$/g.test(reportParams.report[i].areaB)) reportParams.report[i].areaB += ' обл.';
        if (reportParams.report[i].regionB) reportParams.report[i].regionB = reportParams.report[i].regionB.replace('район', 'р-н');
        if (reportParams.report[i].settlementBStatus && reportParams.report[i].settlementBName) reportParams.report[i].settlementBName = reportParams.report[i].settlementBStatus.substr(0, 1).toLowerCase() + '. ' + reportParams.report[i].settlementBName;

        if (reportParams.report[i].areaAddR && !/(к||К)рим$$/g.test(reportParams.report[i].areaAddR)) reportParams.report[i].areaAddR += ' обл.';
        if (reportParams.report[i].regionAddR) reportParams.report[i].regionAddR = reportParams.report[i].regionAddR.replace('район', 'р-н');
        if (reportParams.report[i].settlementAddRStatus && reportParams.report[i].settlementAddRName) reportParams.report[i].settlementAddRName = reportParams.report[i].settlementAddRStatus.substr(0, 1).toLowerCase() + '. ' + reportParams.report[i].settlementAddRName;

		reportParams.report[i].docType = 'Наявність встановлено';
	}

	let dsReport = UB.DataStore('comm_report'),
		reportID = dsReport.generateID();
	dsReport.run('insert', {
		execParams: {
			ID: reportID,
			dateFrom: params.dateFrom,
			dateTo: params.dateTo,
			repType: params.repType,
			reportData: JSON.stringify(reportParams),
			dateRep: new Date()

		}
	});
	ctx.mParams.reportID = reportID;
};

me.saveDataFormsR = function (ctx) {
	var params = ctx.mParams,
		reportParams = {
			dateFrom: getDate(params.dateFrom, true),
			dateTo: getDate(params.dateTo, true),
            settlement: params.isSettlement ? params.settlementRaw : params.localRequisitesRaw
		},
		dateFrom = params.dateFrom,
		dateTo = params.dateTo,
		fieldsAlias = {
			'payerID.lastName': 'lastName',
			'payerID.firstName': 'firstName',
			'payerID.middleName': 'middleName',
			'payerID.birthDateFormatted': 'birthDate',
			'payerID.countryB.name': 'countryBName',
			'payerID.areaB': 'areaB',
			'payerID.regionB': 'regionB',
			'payerID.EDDRecordNum': 'EDDRecordNum',
			'streetType.name': 'streetTypeName',
			'street.street': 'streetName',
			'removeDateFormatted': 'removeDate'
		};


	let attrs = ['payerID.lastName', 'payerID.firstName', 'payerID.middleName', 'payerID.birthDateFormatted', 'payerID.EDDRecordNum', 'removeDateFormatted',
		'area', 'region', 'streetType.name', 'street.street', 'houseNum', 'flatNum',
		'payerID.countryB.name', 'payerID.areaB', 'payerID.regionB'];

	var reportArr = UB.Repository("comm_regInfoCurr")
		.attrs(attrs)
		.where("[state]", '=', 'DISMISSED')
		.where("[removeDate]", '>=', dateFrom)
		.where("[removeDate]", '<=', dateTo)
        .where("[settlement]",  'in', params.isSettlement ? [params.settlement] : UB.Repository("pgo_localSettlement").attrs(['settlementDictID']).where('[localRequisitesID]', '=', params.localRequisites));
	if (params.repType == 'FORM35') {
		reportArr.attrs(['payerID.prevLastName', 'rReason.name', 'rArea', 'rRegion', 'rSettlement.governmentShortName', 'rStreetType.name', 'rStreet.street', 'rHouseNum', 'rFlatNum', 'payerID.settlementB.governmentStatus', 'payerID.settlementB.governmentName',
			'settlement.governmentStatus', 'settlement.governmentName'])
			.where("[isAdultRemove]", '=', 1);

		var pgo_localRequisites = UB.Repository("pgo_localRequisites")
			.attrs(['headFullName']);
		if (params.isSettlement)
			pgo_localRequisites.where('[pgoDictID]', 'in', UB.Repository("pgo_settlementDict").attrs(['pgoDictID']).where('[ID]', '=', params.settlement));
		else pgo_localRequisites.where('ID', '=', params.localRequisites)
		let headFullName = pgo_localRequisites.selectAsObject()[0];
		if (headFullName && headFullName.headFullName) reportParams.headFullName = headFullName.headFullName;

		fieldsAlias['payerID.prevLastName'] = 'prevLastName';
		fieldsAlias['rReason.name'] = 'rReasonName';
		fieldsAlias['rSettlement.governmentShortName'] = 'rSettlementName';
		fieldsAlias['rStreetType.name'] = 'rStreetTypeName';
		fieldsAlias['rStreet.street'] = 'rStreetName';
		fieldsAlias['payerID.settlementB.governmentStatus'] = 'settlementBStatus';
		fieldsAlias['payerID.settlementB.governmentName'] = 'settlementBName';

		fieldsAlias['settlement.governmentStatus'] = 'settlementStatus';
		fieldsAlias['settlement.governmentName'] = 'settlementName';


	}
	if (params.repType == 'REGLPLACEREM') {
		reportArr.attrs(['payerID.deathDateFormatted', 'payerID.genderName', 'payerID.nationality.name', 'payerID.natalPlaceB',
			'rDocType.name', 'rSeries', 'rNum', 'rIssueDateFormatted', 'rDocRegUnit.name', 'rValidToFormatted', 'payerID.settlementB.governmentShortName', 'settlement.governmentShortName',
			'rCountry.name', 'rArea', 'rRegion', 'rSettlement.governmentStatus', 'rSettlement.governmentName', 'rStreetType.name', 'rStreet.street', 'rHouseNum', 'rFlatNum']);
		Object.assign(fieldsAlias, {
			'payerID.deathDateFormatted': 'deathDate',
			'payerID.genderName': 'genderName',
			'payerID.nationality.name': 'nationalityName',
			'payerID.natalPlaceB': 'natalPlaceB',
			'rIssueDateFormatted': 'rIssueDate',
			'rDocRegUnit.name': 'rDocRegUnitName',
			'rValidToFormatted': 'rValidTo',
			'payerID.settlementB.governmentShortName': 'settlementBShortName',
			'settlement.governmentShortName': 'settlement',
			'rDocType.name': 'rDocTypeName'
		});
	}

	reportArr = reportArr.selectAsObject(fieldsAlias);

	// reportArr = LocalDataStore.selectResultToArrayOfObjects(reportArr, fieldsAlias);

	for (let i = 0; i < reportArr.length; i++) {
		let item = reportArr[i];
		item.rowID = i + 1;
		item.rSettlementFullName = _.compact([item['rSettlementName'], item['rStreetTypeName'], item['rStreetName'], item['rHouseNum'], item['rFlatNum']]).join(', ');
		if (params.repType == 'FORM35') {
			if (item.areaB && !/(к||К)рим$$/g.test(item.areaB)) item.areaB += ' обл.';
			if (item.regionB) item.regionB = item.regionB.replace('район', 'р-н');
			if (item.settlementBStatus && item.settlementBName) item.settlementBShortName = item.settlementBStatus.substr(0, 1).toLowerCase() + '. ' + item.settlementBName;

			if (item.area && !/(к||К)рим$$/g.test(item.area)) item.area += ' обл.';
			if (item.region) item.region = item.region.replace('район', 'р-н');
			if (item.settlementStatus && item.settlementName) item.settlementName = item.settlementStatus.substr(0, 1).toLowerCase() + '. ' + item.settlementName;

			if (item.rArea && !/(к||К)рим$$/g.test(item.rArea)) item.rArea += ' обл.';
			if (item.rRegion) item.rRegion = item.rRegion.replace('район', 'р-н');

		}
		if (params.repType == 'REGLPLACEREM') {
			if (item.countryBName == 'Україна') {
				item.birthPlace = _.compact([item['countryBName'], item['areaB'], item['regionB'], item['settlementBShortName']]).join(', ');
			}
			else {
				item.birthPlace = item.natalPlaceB;
			}
			item.fromAddress = _.compact([item['area'], item['region'], item['settlement'], item['streetTypeName'], item['streetName'], item['houseNum'], item['flatNum']]).join(', ');

			if (item.rArea && !/(к||К)рим$$/g.test(item.rArea)) item.rArea += ' обл.';
			if (item.rRegion) item.rRegion = item.rRegion.replace('район', 'р-н');
			if (item['rSettlement.governmentStatus'] && item['rSettlement.governmentName']) item.rSettlementName = item['rSettlement.governmentStatus'].substr(0, 1).toLowerCase() + '. ' + item['rSettlement.governmentName'];
			if (item['rHouseNum']) item['rHouseNum'] = 'буд. ' + item['rHouseNum'];
			if (item['rFlatNum']) item['rFlatNum'] = 'кв. ' + item['rFlatNum'];

			item.toAddress = _.compact([item['rCountry.name'], item.rArea, item.rRegion, item.rSettlementName,
				(item['rStreet.street'] && item['rStreetType.name'] + ' ' + item['rStreet.street'] || null), item['rHouseNum'], item['rFlatNum']]).join(', ');
		}

	}

	reportParams.report = reportArr;
	let dsReport = UB.DataStore('comm_report'),
		reportID = dsReport.generateID();
	dsReport.run('insert', {
		execParams: {
			ID: reportID,
			dateFrom: params.dateFrom,
			dateTo: params.dateTo,
			repType: params.repType,
			reportData: JSON.stringify(reportParams),
			dateRep: new Date()

		}
	});
	ctx.mParams.reportID = reportID;
};

me.saveDataPersonCard = function (ctx) {
	var params = ctx.mParams,
		reportParams = {
			dateFrom: '',
			dateTo: '',
			settlement: params.settlementRaw,
			street: params.streetRaw,
			houseNum: params.houseNum,
			flatNum: params.flatNum ? params.flatNum : '_______'
		};

	var reportArr1 = UB.Repository("inv_payers")
			.attrs(['fullName', 'birthDateFormatted', 'ID'])
			.where("[settlementAddR]", '=', params.settlement)
			.where("[streetAddR]", '=', params.street)
			.where("[houseNumAddR]", '=', params.houseNum)
			.notExists(UB.Repository('comm_regInfoCurr')
				.correlation('payerID', 'ID', '=')),
		reportArr2 = UB.Repository("comm_regInfoCurr")
			.attrs(['docType.name', 'payerID.fullName', 'payerID.birthDateFormatted', 'series', 'num', 'payerID',
				'issueDateFormatted', 'docRegUnit.name', 'regDateFormatted', 'removeDateFormatted'])
			.where("[settlement]", '=', params.settlement)
			.where("[street]", '=', params.street)
			.where("[houseNum]", '=', params.houseNum)
			.where('[state]', 'in', ['REGISTERED', 'DISMISSED'])
			.orderBy('payerID');

	if (params.flatNum !== undefined && params.flatNum !== null && !!params.flatNum) {
		reportArr1.where("[flatNumAddR]", '=', params.flatNum);
		reportArr2.where("[flatNum]", '=', params.flatNum);
	}

	reportArr1 = reportArr1.selectAsObject({
		'birthDateFormatted': 'birthDate',
		'ID': 'payerID'
	});
	reportArr2 = reportArr2.selectAsObject({
		'payerID.fullName': 'fullName',
		'payerID.birthDateFormatted': 'birthDate',
		'issueDateFormatted': 'issueDate',
		'docRegUnit.name': 'issuedBy',
		'regDateFormatted': 'regDate',
		'removeDateFormatted': 'removeDate',
		'docType.name': 'docTypeName'
	});

	/*reportArr1 = LocalDataStore.selectResultToArrayOfObjects(reportArr1, {
	 'birthDateFormatted': 'birthDate',
	 'ID': 'payerID'
	 });
	 reportArr2 = LocalDataStore.selectResultToArrayOfObjects(reportArr2, {
	 'payerID.fullName': 'fullName',
	 'payerID.birthDateFormatted': 'birthDate',
	 'issueDateFormatted': 'issueDate',
	 'docRegUnit.name': 'issuedBy',
	 'regDateFormatted': 'regDate',
	 'removeDateFormatted': 'removeDate'
	 });*/

	let i = 0;

	for (i = 0; i < reportArr1.length; i++) {
		reportArr1[i].rowID = i + 1;
	}


	for (let j = 0; j < reportArr2.length; j++) {
		reportArr2[j].rowID = i + j + 1;
		reportArr2[j].passportData = (_.compact([`${reportArr2[j].series ? reportArr2[j].series : ''} ${reportArr2[j].num ? reportArr2[j].num : ''}`, reportArr2[j].issueDate, reportArr2[j].issuedBy])).join(', ');
		reportArr1.push(reportArr2[j]);
	}

	reportParams.report = reportArr1;

	let dsReport = UB.DataStore('comm_report'),
		reportID = dsReport.generateID();
	dsReport.run('insert', {
		execParams: {
			ID: reportID,
			dateFrom: null,
			dateTo: null,
			repType: params.repType,
			reportData: JSON.stringify(reportParams),
			dateRep: new Date()

		}
	});
	ctx.mParams.reportID = reportID;
};

me.insertSettlement = function () {
	let dsNgoDict = UB.DataStore('pgo_ngoDict'),
		dsSettlement = UB.DataStore('pgo_settlementDict');

	dsNgoDict.runSQL("select rada,rayon,oblast from OBLASTI1 GROUP BY rada,rayon,oblast", {});
	dsSettlement.runSQL("select * from OBLASTI1", {});

	let data1 = JSON.parse(dsNgoDict.asJSONObject),
		data2 = JSON.parse(dsSettlement.asJSONObject);

	for (let i = 0; i < data1.length; i++) {
		let currData = data1[i],
			newNgoID = dsNgoDict.generateID();

		dsNgoDict.run('insert', {
			execParams: {
				ID: newNgoID,
				localGovernment: currData.rada,
				regionName: currData.rayon,
				areaName: currData.oblast
			}
		});

		let currSettlement = _.filter(data2, {
			rada: currData.rada,
			rayon: currData.rayon,
			oblast: currData.oblast
		});

		for (let j = 0; j < currSettlement.length; j++) {
			let currSettle = currSettlement[j];
			dsSettlement.run('insert', {
				execParams: {
					ID: dsSettlement.generateID(),
					koattNum: currSettle.koatuu,
					governmentStatus: currSettle.status,
					governmentName: currSettle['_np'],
					pgoDictID: newNgoID
				}
			});
		}
	}
	// _.forEach(data1, function (item) {
	//     let newNgoID = dsNgoDict.generateID();
	//
	//     dsNgoDict.run('insert', {
	//         execParams: {
	//             ID: newNgoID,
	//             localGovernment: item.rada,
	//             regionName: item.rayon,
	//             areaName: item.oblast
	//         }
	//     });
	//
	//     let currSettlement = _.filter(data2, {
	//         rada: item.rada,
	//         rayon: item.rayon,
	//         oblast: item.oblast
	//     });
	//
	//     _.forEach(currSettlement, function (punkt) {
	//         dsSettlement.run('insert', {
	//             execParams: {
	//                 ID: dsSettlement.generateID(),
	//                 koattNum: punkt.koatuu,
	//                 governmentStatus: punkt.status,
	//                 governmentName: punkt['_np'],
	//                 pgoDictID: newNgoID
	//             }
	//         });
	//     })
	//
	// })

};

me.insertNgoDict = function () {
	let dsNgoDict = UB.DataStore('inv_landDict');

	dsNgoDict.runSQL("select koatuu, status, _np, rada, rik, vart from OBLASTI1", {});

	let data1 = JSON.parse(dsNgoDict.asJSONObject);

	for (let i = 0; i < data1.length; i++) {
		let currData = data1[i];

		dsNgoDict.run('insert', {
			execParams: {
				ID: dsNgoDict.generateID(),
				koattNum: currData.koatuu,
				governmentStatus: currData.status,
				governmentName: currData['_np'],
				localGovernment: currData.rada,
				lastYear: currData.rik ? currData.rik : 0,
				NGO: currData.vart ? currData.vart : 0
			}
		});
	}
};


me.entity.addMethod("saveDataForms");
me.entity.addMethod("saveDataForm31");
me.entity.addMethod("saveDataFormsR");
me.entity.addMethod("saveDataPersonCard");
me.entity.addMethod("generateExcel");
me.entity.addMethod("insertSettlement");
me.entity.addMethod("insertNgoDict");
