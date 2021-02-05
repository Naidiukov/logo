
const me = pgo_objAccounting;
const commonService = require("../../models/ADM/_services/commonService.js");
const services = require('../INV/public/services');
const _ = require('lodash');
const UB = require('@unitybase/ub');
const Session = UB.Session;

me.beforeinsert = function (ctx) {
    var params = ctx.mParams.execParams,
        dsHistory = UB.DataStore('pgo_objHistory'),
        dsObjLog = UB.DataStore('pgo_objLog');
    if (me.checkDuplicateObjCode(params)) {
        throw new Error('<<< Номер об’єкта ПГО має бути унікальним в межах населеного пункту! >>>');
    } else {

        let pgoDictID = UB.Repository("pgo_settlementDict")
                .attrs(["pgoDictID"])
                .where("[ID]", '=', params.locationID)
                .selectAsObject()[0],
            streetName = params.streetID ? UB.Repository("pgo_localStreet")
                .attrs(["street", "streetType.name"])
                .where("[ID]", '=', params.streetID)
                .selectAsObject()[0] : '';
        params.pgoBookPage = me.getBookPage(pgoDictID.pgoDictID);
        dsObjLog.run('insert', {
            execParams: {
                ID: dsObjLog.generateID(),
                changeDate: new Date(),
                actionType: 'INSERT',
                entityName: me.entity.description,
                streetID: streetName['streetType.name'] + ' ' + streetName.street,
                houseNum: params.houseNum,
                flatNum: params.flatNum,
                employeeID: Session.userID
            }
        });


    }
};

me.afterinsert = function (ctx) {
    /*var params = ctx.mParams.execParams,
        dsHistory = UB.DataStore('pgo_objHistory');
    dsHistory.run('insert', {
        execParams: {
            ID: dsHistory.generateID(),
            checkDate: new Date(),
            actionType: 'INSERT',
            objState: params.objState,
            pgoType: params.pgoType,
            pgoObjNum: params.pgoObjNum,
            employeeID: Session.userID,
            objAccountingID: params.ID
        }
    });*/
};
me.afterupdate = function (ctx) {

};
me.afterdelete = function (ctx) {

};

// needed for history to work correctly
me.beforeupdate = function (ctx) {
    var params = ctx.mParams.execParams,
        dsHistory = UB.DataStore('pgo_objHistory'),
        dsObjLog = UB.DataStore('pgo_objLog');

    if (params.objState || params.pgoType || params.pgoObjNum) {
        dsHistory.run('insert', {
            execParams: {
                ID: dsHistory.generateID(),
                checkDate: new Date(),
                actionType: 'EDIT',
                objState: params.objState ? params.objState : null,
                pgoType: params.pgoType ? params.pgoType : null,
                pgoObjNum: params.pgoObjNum ? params.pgoObjNum : null,
                employeeID: Session.userID,
                objAccountingID: params.ID
            }
        });
    }
    else if (params.streetID || params.houseNum || params.flatNum) {
        let streetName = params.streetID ? UB.Repository("pgo_localStreet")
            .attrs(["street", "streetType.name"])
            .where("[ID]", '=', params.streetID)
            .selectAsObject()[0] : '';
        dsObjLog.run('insert', {
            execParams: {
                ID: dsObjLog.generateID(),
                changeDate: new Date(),
                actionType: 'EDIT',
                entityName: me.entity.description,
                streetID: params.streetID != undefined ? streetName['streetType.name'] + ' ' + streetName.street : null,
                houseNum: params.houseNum != undefined ? params.houseNum : null,
                flatNum: params.flatNum != undefined ? params.flatNum : null,
                employeeID: Session.userID
            }
        });
    }
};
me.beforedelete = function (ctx) {
    var params = ctx.mParams.execParams,
        dsObjLog = UB.DataStore('pgo_objLog');

    let objAcc = UB.Repository("pgo_objAccounting")
        .attrs(["streetID.name", "streetID.streetType.name", "houseNum", "flatNum"])
        .where("[ID]", '=', params.ID)
        .selectAsObject()[0];

    dsObjLog.run('insert', {
        execParams: {
            ID: dsObjLog.generateID(),
            changeDate: new Date(),
            actionType: 'DELETE',
            entityName: me.entity.description,
            streetID: objAcc.streetID ? objAcc['streetID.streetType.name'] + ' ' + objAcc['streetID.name'] : '',
            houseNum: objAcc.houseNum,
            flatNum: objAcc.flatNum,
            employeeID: Session.userID
        }
    });
};

me.afterbeforeupdate = function (ctx) {

};

me.afterbeforedelete = function (ctx) {

};

me.getBookPage = function (pgoDictID) {
    var dsObjAccounting = UB.DataStore('pgo_objAccounting'),
        newBookCode = '';
    dsObjAccounting.runSQL("select max(A1.pgoBookPage) as code from pgo_objAccounting A1 left join pgo_settlementDict A2 on A2.ID=A1.locationID where A2.pgoDictID=:pgoDictID:", {pgoDictID: pgoDictID});
    newBookCode = JSON.parse(dsObjAccounting.asJSONObject);
    return newBookCode[0]['code'] ? newBookCode[0]['code'] + 1 : 1;
};

me.getObjCode = function (ctx) {
    var params = ctx.mParams.execParams,
        dsObjAccounting = UB.DataStore('pgo_objAccounting');

    var settlementNum = UB.Repository("pgo_localSettlement")
        .attrs(["code"])
        .where("[settlementDictID]", '=', params.settlementDictID)
        .selectAsObject();


    dsObjAccounting.runSQL("select count(*) as code from pgo_objAccounting where locationID = :settlementDictID:", {settlementDictID: params.settlementDictID});
    var pgoObjMaxCode = JSON.parse(dsObjAccounting.asJSONObject)[0]['code'] + 1,
        maxCOdeLengyh = pgoObjMaxCode.toString().length;
    for (let i = 0; i < 4 - maxCOdeLengyh; i++) {
        pgoObjMaxCode = '0' + pgoObjMaxCode.toString();
    }

    var objCode = settlementNum[0] ? `${settlementNum[0]['code']}${pgoObjMaxCode}-${params.pgoType}` : false;
    if (!objCode) {
        var ngoDictID = UB.Repository("pgo_settlementDict")
                .attrs(["pgoDictID"])
                .where("[ID]", '=', params.settlementDictID)
                .selectScalar(),
            localReqID = UB.Repository("pgo_localRequisites")
                .attrs(["ID"])
                .where("[pgoDictID]", '=', ngoDictID)
                .selectAsObject()[0];
        ctx.mParams.localReqID = localReqID && localReqID.ID ? localReqID.ID : false;
    }
    ctx.mParams.objCode = objCode;
};

me.checkDuplicateObjCode = function (ctx) {
    var params = ctx.mParams ? ctx.mParams.execParams : ctx;

    var pgoCode = UB.Repository("pgo_objAccounting")
        .attrs(["pgoObjNum"])
        .where("[pgoObjNum]", '=', params.pgoObjNum)
        .where("[locationID]", '=', params.locationID)
        .where("[ID]", 'notEqual', params.ID)
        .selectAsObject();
    if (ctx.mParams) ctx.mParams.isDuplicate = !!pgoCode[0];
    else return !!pgoCode[0];
};
function repairDate(date, notStr) {
	let newDate = '';
	function isValidDate(d) {
		return d instanceof Date && !isNaN(d);
	}
	if ((date && _.indexOf(date, 'T') != -1) || isValidDate(new Date(date))) {
		newDate = notStr ? new Date(date) : Ext.Date.format(new Date(date), 'd.m.Y');
	}
	else if (date) {
		newDate = notStr ? new Date(date.replace('Z', 'T00:00:00.000Z')) : Ext.Date.format(new Date(date.replace('Z', 'T00:00:00.000Z')), 'd.m.Y');
	}
	return newDate;
}

function changeFirstCase(word, upper, firstOnly) {
	if (!upper) {
		if (firstOnly) return word ? word.substr(0, 1).toLowerCase() : '';
		else return word ? word.substr(0, 1).toLowerCase() + word.substr(1, word.length).toLowerCase() : '';

	} else {
		if (firstOnly) return word ? word.substr(0, 1).toUpperCase() : '';
		else return word ? word.substr(0, 1).toUpperCase() + word.substr(1, word.length).toLowerCase() : '';
	}
}

function shortName(fullName) {
	let arr = fullName.split(' ');
	return arr.length < 3 ? fullName : `${arr[1].substr(0, 1)}. ${arr[2].substr(0, 1)}. ${arr[0]}`
}

me.createReport = function (fake, req, resp) {
    let url = require('url'),
        param = url.parse(req.url, true).query,
        params = JSON.parse(param.params),
        reportParams = param.reportParams && JSON.parse(param.reportParams) || {},
        pgoCode = UB.Repository("pgo_settlementDict")
            .attrs(["pgoDictID", "governmentStatus", "governmentName"])
            .where("[ID]", '=', params.locationID)
            .selectAsObject()[0],
        settings = JSON.parse(UB.Repository('ubs_settings')
            .attrs(['settingValue'])
            .where('[settingKey]', '=', 'PGO.pgo_objAccounting.getSignerType').selectScalar()),
        localRequisites = JSON.parse(UB.Repository("pgo_localRequisites")
            .attrs(["edrpou", "pgoDictID.localGovernment", "pgoDictID.areaName", "pgoDictID.regionName", "localGovGenitive", "regionGenitive", "areaGenitive", "streetID.street", "houseNum", "settlementDictID.governmentName", "settlementDictID.governmentStatus", "postIndex", "headPhoneNumber", "headFullName", settings.signerField, "plannerFullName"])
            .where("[pgoDictID]", '=', pgoCode.pgoDictID)
            .select().asJSONObject.replace(/pgoDictID\./g, 'pgo_').replace(/settlementDictID\.governmentName/g, 'settlement'))[0],
        objAcc = UB.Repository("pgo_objAccounting")
            .attrs(["houseNum", "flatNum", "streetID.streetType.name", "streetID.street", "pgoBook" , "pgoBookPage", "pgoObjNum"])
            .where("[ID]", '=', params.objAccountingID)
            .selectAsObject()[0],
        livingRoom = UB.Repository("pgo_livingRoomInfo")
            .attrs(["totalArea", "livingArea" , "buildYear", "year"])
            .where("[objAccountingID]", '=', params.objAccountingID)
            .where("[year]", '=', (new Date()).getFullYear())
            .selectAsObject()[0];

    reportParams.local = {
        localGovernment: (localRequisites['pgo_localGovernment']).toUpperCase(),
        edrpou: localRequisites.edrpou,
        localGovGenitive: localRequisites.localGovGenitive,
        areaName: localRequisites['pgo_areaName'],
        regionName: localRequisites['pgo_regionName'],
        regionGenitive: localRequisites.regionGenitive,
        areaGenitive: localRequisites.areaGenitive,
        street: localRequisites['streetID.street'],
        houseNum: localRequisites.houseNum,
        settlementState: changeFirstCase(localRequisites['settlementDictID.governmentStatus'], false, true),
        settlement: localRequisites.settlement,
        postIndex: localRequisites.postIndex,
        headPhoneNumber: localRequisites.headPhoneNumber,
        headShortName: localRequisites.headFullName ? shortName(localRequisites.headFullName) : '',
        clerkShortName: localRequisites[settings.signerField] ? shortName(localRequisites[settings.signerField]) : '',
        plannerShortName: localRequisites.plannerFullName ? shortName(localRequisites.plannerFullName) : ''
    };
        reportParams.living = {
            year: livingRoom ?  livingRoom.year : '',
            createYear: livingRoom ? livingRoom.buildYear : ''
        };

    if (params.reportType == 'formNum3' || params.reportType == 'familyMembers' || params.reportType == 'excerptsOutFamilyMembers' ) {
        let houseMembers = JSON.parse(UB.Repository("pgo_householdMember")
                .attrs(["payerID.fullName", "payerID.passportSeries", "cognationID.name", "birthDate"])
                .where("[objAccountingID]", '=', params.objAccountingID)
                .where("[isHead]", '=', 0)
                .orderBy('orderNum')
                .select().asJSONObject.replace(/payerID\./g, 'p_').replace(/cognationID\./g, 'c_')),
            headMember = JSON.parse(UB.Repository("pgo_householdMember")
                .attrs(["payerID.fullName", "cognationID.name", "birthDate"])
                .where("[objAccountingID]", '=', params.objAccountingID)
                .where("[isHead]", '=', 1)
                .select().asJSONObject.replace(/payerID\./g, 'p_').replace(/cognationID\./g, 'c_'))[0];
        _.forEach(houseMembers, function (member) {
            member.birthDate = repairDate(member.birthDate);
        });
        if (headMember) {
            headMember.birthDate = headMember.birthDate ? (repairDate(headMember.birthDate, true)).getFullYear() : '';
        }
        reportParams.members = {
            houseMembers: houseMembers,
            headMember: headMember
        };
    } else if (params.reportType == 'osgConstrFree' || params.reportType == 'constrFree' || params.reportType == 'objPostIndex' || params.reportType == 'objHouseIndex') {
        let land = UB.Repository("pgo_landPlot")
            .attrs(["cadastralNumber", "totalArea", "documentOwnership", "registryData"])
            .where("[ID]", '=', params.landID)
            .selectAsObject()[0];
        reportParams.land = {
            cadastral: land.cadastralNumber,
            totalArea: land.totalArea,
            document: land.documentOwnership,
            regDate: land.registryData ? Ext.Date.format(new Date(land.registryData), 'd.m.Y') : ''
        }
    } else if (params.reportType == 'physLandPlot') {
        let selectedMember = UB.Repository("inv_payers")
            .attrs(["fullName", "birthDate", "idnCode", "passportSeries", "passportNumber", "idCardNumber"])
            .where("[ID]", '=', params.payerID)
            .selectAsObject()[0];

        selectedMember.birthDate = repairDate(selectedMember.birthDate);


        reportParams.member = {
            fullName: selectedMember['fullName'] ? shortName(selectedMember['fullName']) : '',
            passport: `${selectedMember['passportSeries']} ${selectedMember['passportNumber']}`.trim(),
            birthDate: selectedMember['birthDate'],
            newPassport: selectedMember['idCardNumber']
        };
        let memberCode = selectedMember['idnCode'] ? selectedMember['idnCode'] : selectedMember['passportSeries'] ? `${selectedMember['passportSeries']}${selectedMember['passportNumber']}` : selectedMember['idCardNumber'],
            memberArr = memberCode && (memberCode.toString()).split('') || [];
        if (memberCode) {
            for (let i = 0; i < memberArr.length; i++)
                reportParams.member[`s${i}`] = memberArr[i];
        }
    } else if (params.reportType == 'formNum204') {
        let houseMembers = JSON.parse(UB.Repository("pgo_householdMember")
                .attrs(["payerID.fullName", "cognationID.name", "birthDate", "payerID.passportSeriesAndNumber", "payerID.idCardNumber", "payerID.birthCertificate"])
                .where("[objAccountingID]", '=', params.objAccountingID)
                .where("[ID]", 'notEqual', params.applicantID)
                .orderBy('orderNum')
                .select().asJSONObject.replace(/payerID\./g, 'p_').replace(/cognationID\./g, 'c_')),
            applicantMember = JSON.parse(UB.Repository("pgo_householdMember")
                .attrs(["birthDate", "payerID.fullName", "payerID.passportSeriesAndNumber", "payerID.idCardNumber", "payerID.birthCertificate"])
                .where("[objAccountingID]", '=', params.objAccountingID)
                .where("[ID]", '=', params.applicantID)
                .select().asJSONObject.replace(/payerID\./g, 'p_'))[0];
        applicantMember.fullName = params.applicant;

        _.forEach(houseMembers, function (member) {
            member.birthDate = repairDate(member.birthDate);

            // member.series = member['p_passportSeriesAndNumber'] ? member['p_passportSeriesAndNumber'] : member['p_idCardNumber'] ? member['p_idCardNumber'] : member['p_birthCertificate'];
            member.series = (member['p_passportSeriesAndNumber'] && member['p_passportSeriesAndNumber'].trim()) || (member['p_idCardNumber'] && member['p_idCardNumber'].trim()) || (member['p_birthCertificate'] && member['p_birthCertificate'].trim());
        });

        if (applicantMember) applicantMember.birthDate = repairDate(applicantMember.birthDate);
        // applicantMember.series = applicantMember['p_passportSeriesAndNumber'] ? applicantMember['p_passportSeriesAndNumber'] : applicantMember['p_idCardNumber'] ? applicantMember['p_idCardNumber'] : applicantMember['p_birthCertificate'];
        applicantMember.series = (applicantMember['p_passportSeriesAndNumber'] && applicantMember['p_passportSeriesAndNumber'].trim()) || (applicantMember['p_idCardNumber'] && applicantMember['p_idCardNumber'].trim()) || (applicantMember['p_birthCertificate'] && applicantMember['p_birthCertificate'].trim());

        reportParams.members = {
            houseMembers: houseMembers,
            applicantMember: applicantMember,
            count: houseMembers.length + 1
        };
    } else if (params.reportType == 'landPlotSize') {
        let yearSum = UB.Repository("pgo_landPlot")
            .attrs(["SUM([totalArea])", "year"])
            .where("[objAccountingID]", '=', params.objAccountingID)
            .groupBy(['year'])
            .orderByDesc('year')
            .limit(1)
            .selectAsObject();
        reportParams.yearSum = yearSum[0] ? yearSum[0]["SUM([totalArea])"] : '';
        if (yearSum[0]) {
            let smallHolding = UB.Repository("pgo_landPlot")
                    .attrs(["SUM([totalArea])"])
                    .where("[objAccountingID]", '=', params.objAccountingID)
                    .where("[useType]", '=', 'SMALLHOLDING')
                    .where("[year]", '=', yearSum[0].year)
                    .selectAsObject()[0],
                osgManage = UB.Repository("pgo_landPlot")
                    .attrs(["SUM([totalArea])"])
                    .where("[objAccountingID]", '=', params.objAccountingID)
                    .where("[useType]", '=', 'OSGMANAGE')
                    .where("[year]", '=', yearSum[0].year)
                    .selectAsObject()[0];

            if (smallHolding) reportParams.smallHolding = smallHolding["SUM([totalArea])"];
            if (osgManage) reportParams.osgManage = osgManage["SUM([totalArea])"];
        }
    }

    let settlement = changeFirstCase(pgoCode['governmentStatus'], false, true);
    if (!!settlement) settlement = `${settlement}. ${changeFirstCase(pgoCode['governmentName'], true, false)}`;
    reportParams.pgo = {
        houseNum: objAcc.houseNum,
        flatNum: objAcc.flatNum,
        pgoBook: objAcc.pgoBook,
        pgoObjNum: objAcc.pgoObjNum,
        pgoBookPage: objAcc.pgoBookPage,
        address: [objAcc["streetID.streetType.name"], objAcc['streetID.street']].join(' '),
        settlement: settlement,
        totalArea: livingRoom ? livingRoom.totalArea : 0,
        livingArea: livingRoom ? livingRoom.livingArea : 0,
    };

    var path = require('path');
    var Docxtemplater = require('docxtemplater');
    var fs = require('fs');
    var JSZip = require('jszip');

    var fileName = params.reportType + '.docx',
        templatePath = path.join(process.configPath, 'docTemplate', fileName);
    var content = fs.readFileSync(templatePath, {encoding: 'bin'});
    var zip = new JSZip(content);
    var doc = new Docxtemplater();
    doc.nullGetter = function (part) {
        if (Ext.isEmpty(part.module)) {
            return "";
        }

        return "";
    };
    doc.loadZip(zip);

    doc.setData(reportParams);
    doc.setOptions({
        parser: function (tag) {
            // tag is "user"
            return {
                'get': function (scope) {
                    if (tag.indexOf('.') !== -1) {
                        let tags = tag.split('.'),
                            currProp = scope[tags[0]];

                        for (let i = 1; i < tags.length; i++) {
                            currProp = currProp[tags[i]];
                        }

                        return !Ext.isEmpty(currProp) ? currProp : '';
                    }
                    else {
                        return !Ext.isEmpty(scope[tag]) ? scope[tag] : '';
                    }
                }
            };
        },
        paragraphLoop:true
    });
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
    resp.writeHead('Content-type:  application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition: inline; filename="' + fileName + '"');
    resp.statusCode = 200;

}

me.createPayerReport = function (fake, req, resp) {
	let url = require('url'),
		param = url.parse(req.url, true).query,
		params = JSON.parse(param.params);
	//reportParams = param.reportParams && JSON.parse(param.reportParams) || {};

	let payerData = UB.Repository('inv_payers')
			.attrs('birthDate', 'settlementAddR', 'settlementAddR.pgoDictID', 'settlementAddR.pgoDictID.areaName', 'settlementAddR.pgoDictID.regionName',
				'settlementAddR.governmentStatus', 'settlementAddR.governmentName',
				'streetTypeAddR', 'streetTypeAddR.name', 'streetAddR', 'streetAddR.street', 'houseNumAddR', 'flatNumAddR',
				'fullName')
			.selectById(params.payerID),
		membersData = UB.Repository('comm_cognationInfo')
			.attrs('fullName.birthDate', 'fullName.fullName', 'cognation.name')
			.where('payerID', '=', params.payerID);
	if (payerData.settlementAddR) {
		membersData = membersData.where('fullName.settlementAddR', '=', payerData.settlementAddR)
			.where('fullName.streetTypeAddR', '=', payerData.streetTypeAddR || null)
			.where('fullName.streetAddR', '=', payerData.streetAddR || null)
			.where('fullName.houseNumAddR', '=', payerData.houseNumAddR || null)
			.where('fullName.flatNumAddR', '=', payerData.flatNumAddR || null);
	}
	membersData = membersData.selectAsObject({
		'fullName.birthDate': 'birthDate',
		'fullName.fullName': 'p_fullName',
		'cognation.name': 'c_name'
	});
	let settings = JSON.parse(UB.Repository('ubs_settings')
			.attrs(['settingValue'])
			.where('[settingKey]', '=', 'PGO.pgo_objAccounting.getSignerType').selectScalar()),
		localRequisites = UB.Repository("pgo_localRequisites")
			.attrs(["regionGenitive", "areaGenitive", "headFullName", settings.signerField])
			.where("[pgoDictID]", '=', payerData['settlementAddR.pgoDictID'])
			.selectAsObject();

	if (payerData.birthDate) payerData.birthDate = (repairDate(payerData.birthDate, true)).getFullYear();
	membersData.forEach((member) => {
		member.birthDate = (repairDate(member.birthDate, true)).getFullYear();
	});
	let reportParams = {
		formParams: {
			issued: params.issued,
			year: params.year,
			certif: params.certif
		},
		local: {
			regionGenitive: localRequisites.regionGenitive,
			areaGenitive: localRequisites.areaGenitive,
			headShortName: localRequisites.headFullName ? shortName(localRequisites.headFullName) : '',
			clerkShortName: localRequisites[settings.signerField] ? shortName(localRequisites[settings.signerField]) : ''
		},
		pgo: {
			settlement: payerData['settlementAddR.governmentName'] && `${changeFirstCase(payerData['settlementAddR.governmentStatus'], false, true)}. ${changeFirstCase(payerData['settlementAddR.governmentName'], true, false)}` || '',
			address: payerData['streetAddR'] && `${payerData["streetTypeAddR.name"]} ${payerData['streetAddR.street']}` || ''
		},
		members: {
			houseMembers: membersData.length && membersData || [{
				p_fullName: payerData.fullName,
				birthDate: payerData.birthDate
			}]
		}
	}

	var path = require('path');
	var Docxtemplater = require('docxtemplater');
	var fs = require('fs');
	var JSZip = require('jszip');

	var fileName = 'familyMembers.docx',
		templatePath = path.join(process.configPath, 'docTemplate', fileName);
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

	doc.setData(reportParams);
	doc.setOptions({
		parser: function (tag) {
			// tag is "user"
			return {
				'get': function (scope) {
					if (tag.indexOf('.') !== -1) {
						let tags = tag.split('.'),
							currProp = scope[tags[0]];

						for (let i = 1; i < tags.length; i++) {
							currProp = currProp[tags[i]];
						}

						return !Ext.isEmpty(currProp) && currProp || '';
					}
					else {
						return !Ext.isEmpty(scope[tag]) && scope[tag] || '';
					}
				}
			};
		},
		paragraphLoop: true
	});
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
	resp.writeHead('Content-type:  application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition: inline; filename="' + fileName + '"');
	resp.statusCode = 200;
};

me.getObjAttNewID = function (ctx) {
    var notifAttachDS = UB.DataStore("pgo_objAttachment");
    ctx.mParams.attachID = notifAttachDS.generateID();
};

me.renumObjs = function (ctx) {
    let dsObjAccounting = UB.DataStore('pgo_objAccounting');

    dsObjAccounting.runSQL("select A2.ID, (A2.governmentStatus || ' ' || A2.governmentName) as governmentfullname, A3.code as punktCode " +
        "from pgo_objAccounting A1 left join pgo_settlementDict A2 on A2.[ID]=A1.[locationID] left join pgo_localSettlement A3 on A3.[settlementDictID]=A2.[ID] " +
        "left join pgo_localStreet A4 on A4.[ID]=A1.[streetID] left join pgo_ngoDict A5 on A5.ID=A2.pgoDictID where A1.objState='OBJ_INPGO' and punktCode is null " +
        "group by governmentfullname", {});

    let settleWithNullCode = JSON.parse(dsObjAccounting.asJSONObject);

    if (settleWithNullCode.length) throw new Error('<<< Відстуній код для таких населених пунктів: ' + _.map(settleWithNullCode, 'governmentfullname').join(', ') + '. >>>');

    else {
        dsObjAccounting.runSQL("select A1.locationID as locationid, A1.ID as pgoid, (A3.governmentStatus || ' ' || A3.governmentName) as governmentfullname, A2.code as punktcode," +
            "(case when A1.pgoType='HOUSEHOLD_LIVE' then 1 when A1.pgoType='HOUSEHOLD_STAY' then 2 when A1.pgoType='HOUSE_OWN' then 3 when A1.pgoType='LAND_OWN' then 4 " +
            "when A1.pgoType='ADANDONED_OBJ' then 5 else 1 end) as pgotype from pgo_objAccounting A1 left join pgo_localSettlement A2 on A2.settlementDictID=A1.locationID " +
            "left join pgo_settlementDict A3 on A3.ID=A2.settlementDictID left join pgo_localStreet A4 on A4.ID=A1.streetID left join pgo_ngoDict A5 on A5.ID=A3.pgoDictID " +
            "where A1.objState='OBJ_INPGO' " +
            "order by A5.ID, A2.code, A4.code, length(A1.houseNum), A1.houseNum, case  when A1.flatNum is null then 1 else 0 end", {});

        let sortedObjAcc = JSON.parse(dsObjAccounting.asJSONObject);
        if (sortedObjAcc.length) {
            var currObj,
                locationID = sortedObjAcc[0].locationid,
                j = 0,
                renumeredObjs = [],
                pgoObjNum = '';

            for (let i = 0; i < sortedObjAcc.length; i++) {
                currObj = sortedObjAcc[i];
                if (locationID === currObj.locationid) {
                    j++
                } else {
                    locationID = currObj.locationid;
                    j = 1;
                }
                //locationID === currObj.locationID ? j++ : j = 1;
                pgoObjNum = `${currObj.punktcode}`;
                for (let k = j.toString().length; k < 4; k++) {
                    pgoObjNum = pgoObjNum + '0';
                }
                pgoObjNum = `${pgoObjNum}${j}-${currObj.pgotype}`;
                dsObjAccounting.run('update', {
                    __skipSelectAfterUpdate: true,
                    __skipOptimisticLock: true,
                    execParams: {
                        ID: currObj.pgoid,
                        pgoObjNum: pgoObjNum
                    }
                });
            }
        }
    }
};

me.copyPGO = function (ctx) {
    let params = ctx.mParams.execParams,
        copyDate = services.getDate(params.copyDate),
        year = copyDate.getFullYear(),
        dsOwnerRoom = UB.DataStore('pgo_roomOwnerInfo'),
        dsLivingRoom = UB.DataStore('pgo_livingRoomInfo'),
        dsLandPlot = UB.DataStore('pgo_landPlot'),
        dsAgriculture = UB.DataStore('pgo_agriculture'),
        dsAnimals = UB.DataStore('pgo_agricultureCellAnimal'),
        dsAgricultureMachine = UB.DataStore('pgo_agricultureMachine'),
        pgoObjs = UB.Repository('pgo_objAccounting')
            .attrs(['ID'])
            .where('[objState]', '=', 'OBJ_INPGO')
            .selectAsObject();
    _.forEach(pgoObjs, function (pgo) {
        let roomOwner = UB.Repository('pgo_roomOwnerInfo')
                .attrs(['*'])
                .where('[objAccountingID]', '=', pgo.ID)
                .where("[year]", '=', (parseInt(year) - 1))
                .selectAsObject(),
            //checkDate
            livingRoom = UB.Repository('pgo_livingRoomInfo')
                .attrs(['*'])
                .where('[objAccountingID]', '=', pgo.ID)
                .where("[year]", '=', (parseInt(year) - 1))
                .selectAsObject(),
            landPlot = UB.Repository('pgo_landPlot')
                .attrs(['*'])
                .where('[objAccountingID]', '=', pgo.ID)
                .where("[year]", '=', (parseInt(year) - 1))
                .selectAsObject(),
            agriculture = UB.Repository('pgo_agriculture')
                .attrs(['*'])
                .where('[objAccountingID]', '=', pgo.ID)
                .where("[year]", '=', (parseInt(year) - 1))
                .selectAsObject(),
            agricultureAnimals = UB.Repository("pgo_agricultureCellAnimal")
                .attrs(["*", "agricultureID.objAccountingID"])
                .where("[agricultureID.objAccountingID]", '=', pgo.ID)
                .where("[agricultureID.year]", '=', (parseInt(params.year) - 1))
                .selectAsObject(),
            agricultureAnimalsGroupBy = _.groupBy(agricultureAnimals, 'agricultureID.objAccountingID'),
            agricultureMachine = UB.Repository('pgo_agricultureMachine')
                .attrs(['*'])
                .where('[objAccountingID]', '=', pgo.ID)
                .where("[year]", '=', (parseInt(year) - 1))
                .selectAsObject();
        _.forEach(roomOwner, function (item) {
            dsOwnerRoom.run('insert', {
                execParams: {
                    ID: dsOwnerRoom.generateID(),
                    year: year,
                    personType: item.personType,
                    payerID: item.payerID,
                    realtyObjectID: item.realtyObjectID,
                    part: item.part,
                    notes: item.notes,
                    objAccountingID: pgo.ID
                }
            });
        });

        _.forEach(livingRoom, function (item) {
            dsLivingRoom.run('insert', {
                execParams: {
                    ID: dsLivingRoom.generateID(),
                    year: year,
                    buildYear: item.buildYear,
                    roomType: item.roomType,
                    wallMaterial: item.wallMaterial,
                    roofMaterial: item.roofMaterial,
                    checkDate: copyDate,
                    totalArea: item.totalArea,
                    summerArea: item.summerArea,
                    livingArea: item.livingArea,
                    ownershipArea: item.livingArea,
                    floorCount: item.floorCount,
                    livingRoomCount: item.livingRoomCount,
                    aqueduct: item.aqueduct,
                    sewerage: item.sewerage,
                    heating: item.heating,
                    hotWater: item.hotWater,
                    bath: item.bath,
                    naturalGas: item.naturalGas,
                    liquefiedGas: item.liquefiedGas,
                    electricPlate: item.electricPlate,
                    oldFund: item.oldFund,
                    emergencyFund: item.emergencyFund,
                    objAccountingID: pgo.ID
                },
                noSync: true
            });
        });

        _.forEach(landPlot, function (item) {
            dsLandPlot.run('insert', {
                execParams: {
                    ID: dsLandPlot.generateID(),
                    year: year,
                    payerID: item.payerID,
                    landPlotID: item.landPlotID,
                    cadastralNumber: item.cadastralNumber,
                    landCategory: item.landCategory,
                    location: item.location,
                    useType: item.useType,
                    landPurpose: item.landPurpose,
                    leased: item.leased,
                    totalArea: item.totalArea,
                    documentOwnership: item.documentOwnership,
                    registryData: item.registryData,
                    position: item.position,
                    notes: item.notes,
                    dontUpdate: true,
                    objAccountingID: pgo.ID
                },
                noSync: true
            });
        });

        _.forEach(agriculture, function (item) {
            let newAgrID = dsAgriculture.generateID();
            dsAgriculture.run('insert', {
                execParams: {
                    ID: newAgrID,
                    year: year,
                    cattleTotal: item.cattleTotal,
                    bull: item.bull,
                    cow: item.cow,
                    heiferOneTwo: item.heiferOneTwo,
                    heiferTwoMore: item.heiferTwoMore,
                    calveOneYear: item.calveOneYear,
                    pigsTotal: item.pigsTotal,
                    sowsNineMore: item.sowsNineMore,
                    repairPigFourMore: item.repairPigFourMore,
                    pigletTwoLess: item.pigletTwoLess,
                    sheepTotal: item.sheepTotal,
                    sheepYearMore: item.sheepYearMore,
                    goatTotal: item.goatTotal,
                    goatYearMore: item.goatYearMore,
                    horseTotal: item.horseTotal,
                    mareThreeYearMore: item.mareThreeYearMore,
                    horseYearMore: item.horseYearMore,
                    birdTotal: item.birdTotal,
                    hen: item.hen,
                    rabbitTotal: item.rabbitTotal,
                    rabbits: item.rabbits,
                    beesTotal: item.beesTotal,
                    notes: item.notes,
                    objAccountingID: pgo.ID

                }
            });
            _.forEach(agricultureAnimalsGroupBy[item.objAccountingID], function (animal) {
                dsAnimals.run('insert', {
                    execParams: {
                        ID: dsAnimals.generateID(),
                        name: animal.name,
                        count: animal.count,
                        agricultureID: newAgrID
                    }
                });
            });
        });

        _.forEach(agricultureMachine, function (item) {
            dsAgricultureMachine.run('insert', {
                execParams: {
                    ID: dsAgricultureMachine.generateID(),
                    year: year,
                    tractorTotal: item.tractorTotal,
                    miniTractor: item.miniTractor,
                    truck: item.truck,
                    combineTotal: item.combineTotal,
                    harvesterCombine: item.harvesterCombine,
                    notes: item.notes,
                    objAccountingID: pgo.ID
                }
            });
        });
    })
};

me.importPGO = function () {
  Session.runAsAdmin(function () {
    let dsUser = UB.DataStore('uba_user'),
      dsObjAccounting = UB.DataStore('pgo_objAccounting');

    const vushenkiID = UB.Repository('pgo_settlementDict').attrs('ID').where('koattNum', '=', 3220881301).selectScalar()
    const petropavlID = UB.Repository('pgo_settlementDict').attrs('ID').where('koattNum', '=', 3220881303).selectScalar()

    dsUser.runSQL("select A2.ID AS oldID, A2.PERSONACCO as pgoObjNum, A2.PAGE AS pgoBookPage, A2.ECBOOKHID AS pgoBook," +
      " A3.ID AS streetID, A1.NUMBER AS houseNum, A1.NUM_KV AS flatNum, A1.IZB_OKR AS constituency, A1.IZB_UCH AS district, A3.settlementDictID as locationid" +
      " from house A1 join econbook A2 ON A1.ECONBOOKID=A2.ID join pgo_localStreet A3 ON A3.oldID=A1.STREETID AND A3.oldTable='STREET_VUSHENKI'", {});

    let data = JSON.parse(dsUser.asJSONObject),
      currObjNum = '',
      objNum = '',
      posSlash = 0,
      posMinus = 0,
      pgoTypes = {1: 'HOUSEHOLD_LIVE', 2: 'HOUSEHOLD_STAY', 3: 'HOUSE_OWN', 4: 'LAND_OWN', 5: 'ADANDONED_OBJ'},
      currPgoType = 'HOUSEHOLD_LIVE';

    _.forEach(data, function (item) {
      Object.keys(item).forEach(fld => {
        if (item[fld] && typeof item[fld] === 'string') item[fld] = item[fld].trim()
      })
      currObjNum = item.pgoobjnum;
      objNum = null;
      currPgoType = 'HOUSEHOLD_LIVE';
      if (currObjNum) {
        posSlash = currObjNum.search('/');
        posMinus = currObjNum.search('-');
        if (posMinus != -1 && posSlash == -1) {
          if (currObjNum.length == 5) {
            objNum = `010${currObjNum}`;
          } else if (currObjNum.length == 6) {
            objNum = `01${currObjNum}`;
          }
        } else if (posSlash != -1) {
          posSlash < posMinus ? objNum = `01${currObjNum.substr(posSlash + 1, 1)}${currObjNum.substr(1, posSlash - 1)}${currObjNum.substring(posMinus, currObjNum.length)}`
            : objNum = `01${currObjNum.substr(posSlash + 1, 1)}${currObjNum.substr(1, posSlash - 1)}`;
        }

        currPgoType = posMinus != -1 ? pgoTypes[objNum.substr(posMinus + 1, 1)] : 'HOUSEHOLD_LIVE';
      }

      dsObjAccounting.run('insert', {
        execParams: {
          ID: dsObjAccounting.generateID(),
          pgoType: currPgoType,
          pgoBookPage: item.pgobookpage ? item.pgobookpage : 0,
          pgoBook: item.pgobook ? item.pgobook : 0,
          locationID: item.locationid,
          streetID: item.streetid, // ? item.streetID : 333392990044161,
          houseNum: item.housenum && item.housenum != '' ? item.housenum : 0,
          flatNum: item.flatnum && item.flatnum != '' ? item.flatnum : null,
          pgoObjNum: objNum || currObjNum,
          constituency: item.CONSTITUENCY ? item.constituency : null,
          district: item.district ? item.district : null,
          oldID: item.oldid,
          oldTable: 'HOUSE_VUSHENKI'
        }
      });
    });
  })
};

me.importFamily = function () {
  Session.runAsAdmin(function () {
    let dsUser = UB.DataStore('uba_user'),
      dsHouseHoldMember = UB.DataStore('pgo_householdMember'),
      dateIfNull = new Date(1902, 1, 2);

    dsUser.runSQL("select A1.ID as payerID, A2.FAMILYID, A1.oldID, (CASE WHEN A2.ishead='T' THEN 1 ELSE 0 END) AS isHead," +
      "(CASE WHEN A2.sexID='2' THEN 'MALE' WHEN A2.sexID='1' THEN 'FEMALE' ELSE null END) as gender," +
      " A2.dbirth," +
      // " (date(substr(A2.dbirth, 7, 4) || '-' || substr(A2.dbirth, 4,2)|| '-' || substr(A2.dbirth, 1,2))) as dbirth, " +
      "A1.privilegePhysID, A1.privilegeStartDate, A5.ID as objAccountingID, (select ID from pgo_cognation where ID=A2.cognatid) as cognationID, A2.work as workPlace" +
      " from inv_payers A1 join people A2 on A2.ID::text=A1.oldID join FAMILY A3 ON A3.ID=A2.FAMILYID JOIN HOUSE A4 ON A4.ID=A3.HOUSEID " +
      "join pgo_objAccounting A5 on A5.oldID=A4.ECONBOOKID::text AND A5.oldtable='HOUSE_VUSHENKI' " +
      "where A1.personType='PHYSICAL' and A1.oldTable='PEOPLE_VUSHENKI'", {});

    let data = JSON.parse(dsUser.asJSONObject);

    _.forEach(data, function (item) {
      Object.keys(item).forEach(fld => {
        if (item[fld] && typeof item[fld] === 'string') item[fld] = item[fld].trim()
      })
      if (item.cognationid && (item.cognationid == 21 || item.cognationid == 22)) item.ishead = 1;
      else item.ishead = 0;
      dsHouseHoldMember.run('insert', {
        execParams: {
          // ID: dsHouseHoldMember.generateID(),
          payerID: item.payerid,
          isHead: item.ishead,
          gender: item.gender ? item.gender : null,
          birthDate: item.dbirth ? new Date(item.dbirth) : dateIfNull,
          cognationID: item.cognationid ? item.cognationid : null,
          workPlace: item.workplace ? item.workplace : '',
          objAccountingID: item.objaccountingid,
          oldID: item.oldid,
          oldTable: 'PEOPLE_VUSHENKI'
        }
      });
    });
  })
};
function toBool(val) {
  return val == 'T' ? 1 : 0
}

me.importRoom = function () {
  Session.runAsAdmin(function () {
    let dsUser = UB.DataStore('uba_user'),
      dsLivingRoomInfo = UB.DataStore('pgo_livingRoomInfo'),
      dateIfNull = new Date(1902, 1, 2);

    dsUser.runSQL("select extract(year from A4.DCONTROL) AS year, A3.YEARBUILD as buildYear," +
      "(CASE WHEN A3.NUM_KV IS NOT NULL THEN 'FLAT' WHEN A3.DORMITORY='T' THEN 'HOSTEL' WHEN A3.LIVING='T' THEN 'LIVE_HOUSE' WHEN A3.NOTLIVING='T' THEN 'NOTLIVE_HOUSE' ELSE 'INDIVID_HOUSE' END) AS roomType," +
      "A3.WALLMATID as wallMaterial, A3.ROOFID as roofMaterial, A4.DCONTROL as checkDate, A5.GENERALARE AS totalArea, A5.DWELLING as livingArea, A3.FLOORALL AS floorCount, A5.ROOMS as livingRoomCount," +
      "A4.PLUMBING AS aqueduct, A4.SEWAGE AS sewerage," +
      "(CASE WHEN A4.HEATINGID='1' THEN 'OVEN' WHEN A4.HEATINGID='2' THEN 'CENTRAL' WHEN A4.HEATINGID='3' THEN 'INDIVID' WHEN A4.HEATINGID='4' THEN 'INDIVID' END) AS heating," +
      "A4.HOTWATER AS hotWater, A4.BATHROOM AS bath," +
      "(CASE WHEN A4.GASTYPEID='2' THEN 1 ELSE 0 END) AS naturalGas, (CASE WHEN A4.GASTYPEID='1' THEN 1 ELSE 0 END) AS liquefiedGas," +
      "A4.FLOOR_ELEC AS electricPlate, (CASE WHEN A3.DECREPIT='T' THEN 1 ELSE 0 END) AS oldFund, (CASE WHEN A3.CRASH='T' THEN 1 ELSE 0 END) AS emergencyFund, A6.ID AS objAccountingID, A4.ID as oldID" +
      " from family A2 join house A3 on A3.ID=A2.HOUSEID join controlhouse A4 on A4.HOUSEID=A3.ID join FAMILYCONTROL A5 on A5.FAMILYID=A2.ID join pgo_objAccounting A6 on A6.oldID=A3.ECONBOOKID::text AND A6.oldTable='HOUSE_VUSHENKI' " +
      " left join pgo_roofMaterial A7 on A7.oldID=A3.ROOFID", {});

    let data = JSON.parse(dsUser.asJSONObject);

    _.forEach(data, function (item, i) {
      Object.keys(item).forEach(fld => {
        if (item[fld] && typeof item[fld] === 'string') item[fld] = item[fld].trim()
      })
      dsLivingRoomInfo.run('insert', {
        execParams: {
          ID: dsLivingRoomInfo.generateID(),
          year: item.year ? item.year : 1902,
          buildYear: item.buildyear ? item.buildyear : 1902,
          roomType: item.roomtype,
          wallMaterial: item.wallmaterial ? item.wallmaterial : null,
          roofMaterial: item.roofmaterial ? item.roofmaterial : null,
          checkDate: item.checkdate ? item.checkdate : dateIfNull,
          totalArea: item.totalarea ? item.totalarea : 0,
          livingArea: item.livingarea,
          floorCount: item.floorcount,
          livingRoomCount: item.livingroomcount,
          aqueduct: toBool(item.aqueduct),
          sewerage: toBool(item.sewerage),
          heating: item.heating,
          hotWater: toBool(item.hotwater),
          bath: toBool(item.bath),
          naturalGas: item.naturalgas,
          liquefiedGas: item.liquefiedgas,
          electricPlate: toBool(item.electricplate),
          oldFund: item.oldfund,
          emergencyFund: item.emergencyfund,
          objAccountingID: item.objaccountingid,
          oldID: item.oldid,
          oldTable: 'CONTROLHOUSE_VUSHENKI'
        }
      });
    });
  })
};

me.importAnimal = function () {
  Session.runAsAdmin(function () {
    let dsUser = UB.DataStore('uba_user'),
      dsAgriculture = UB.DataStore('pgo_agriculture'),
      dsAgricultureAnimal = UB.DataStore('pgo_agricultureCellAnimal');

    dsUser.runSQL("select extract(year from A1.DCONTROL) as year, A1.ANITYPEID as animalID, A1.AMOUNT as total, A3.ID as objAccountingID from animal A1 join family A2 on A2.ID=A1.FAMILYID join pgo_objAccounting A3 on A3.oldID=A2.HOUSEID::text AND A3.oldTable='HOUSE_VUSHENKI' order by objAccountingID", {});

    let data = JSON.parse(dsUser.asJSONObject),
      groupedData = _.groupBy(data, 'objaccountingid'),
      animal = {},
      dsAgricultureID;

    _.forEach(groupedData, function (item, i) {
      animal = {
        cattleTotal: null,
        bull: null,
        cow: null,
        heiferOneTwo: null,
        heiferTwoMore: null,
        calveOneYear: null,
        pigsTotal: null,
        sowsNineMore: null,
        repairPigFourMore: null,
        pigletTwoLess: null,
        sheepTotal: null,
        sheepYearMore: null,
        goatTotal: null,
        goatYearMore: null,
        horseTotal: null,
        mareThreeYearMore: null,
        horseYearMore: null,
        birdTotal: null,
        hen: null,
        rabbitTotal: null,
        rabbits: null,
        beesTotal: null,
        animalsTotal: [],
        objAccountingID: null
      };
      _.forEach(item, function (animals) {
        Object.keys(animals).forEach(fld => {
          if (animals[fld] && typeof animals[fld] === 'string') animals[fld] = animals[fld].trim()
        })
        const animalsTotal = parseInt(animals.total)
        switch (parseInt(animals.animalid)) {
          case 1: {
            animal.bull = animal.bull ? animal.bull + animalsTotal : animalsTotal;
            break;
          }
          case 2: {
            animal.cow = animal.cow ? animal.cow + animalsTotal : animalsTotal;
            break;
          }
          case 3: {
            animal.heiferOneTwo = animal.heiferOneTwo ? animal.heiferOneTwo + animalsTotal : animalsTotal;
            break;
          }
          case 4: {
            animal.heiferTwoMore = animal.heiferTwoMore ? animal.heiferTwoMore + animalsTotal : animalsTotal;
            break;
          }
          case 5: {
            animal.calveOneYear = animal.calveOneYear ? animal.calveOneYear + animalsTotal : animalsTotal;
            break;
          }
          case 6: {
            animal.sowsNineMore = animal.sowsNineMore ? animal.sowsNineMore + animalsTotal : animalsTotal;
            break;
          }
          case 7: {
            animal.repairPigFourMore = animal.repairPigFourMore ? animal.repairPigFourMore + animalsTotal : animalsTotal;
            break;
          }
          case 8: {
            animal.pigletTwoLess = animal.pigletTwoLess ? animal.pigletTwoLess + animalsTotal : animalsTotal;
            break;
          }
          case 9: {
            animal.sheepTotal = animal.sheepTotal ? animal.sheepTotal + animalsTotal : animalsTotal;
            animal.sheepYearMore = animal.sheepYearMore ? animal.sheepYearMore + animalsTotal : animalsTotal;
            break;
          }
          case 10: {
            animal.goatTotal = animal.goatTotal ? animal.goatTotal + animalsTotal : animalsTotal;
            animal.goatYearMore = animal.goatYearMore ? animal.goatYearMore + animalsTotal : animalsTotal;
            break;
          }
          case 11: {
            animal.mareThreeYearMore = animal.mareThreeYearMore ? animal.mareThreeYearMore + animalsTotal : animalsTotal;
            break;
          }
          case 12: {
            animal.horseYearMore = animal.horseYearMore ? animal.horseYearMore + animalsTotal : animalsTotal;
            break;
          }
          case 13: {
            animal.birdTotal = animal.birdTotal ? animal.birdTotal + animalsTotal : animalsTotal;
            animal.hen = animal.hen ? animal.hen + animalsTotal : animalsTotal;
            break;
          }
          case 14: {
            animal.rabbitTotal = animal.rabbitTotal ? animal.rabbitTotal + animalsTotal : animalsTotal;
            animal.rabbits = animal.rabbits ? animal.rabbits + animalsTotal : animalsTotal;
            break;
          }
          case 15: {
            break;
          }
          case 16: {
            animal.beesTotal = animal.beesTotal ? animal.beesTotal + animalsTotal : animalsTotal;
            break;
          }
          case 17: {
            animal.birdTotal = animal.birdTotal ? animal.birdTotal + animalsTotal : animalsTotal;
            break;
          }
          case 18: {
            animal.animalsTotal.push({name: 'собаки', count: animalsTotal});
            break;
          }
          case 19: {
            animal.animalsTotal.push({name: 'коти', count: animalsTotal});
            break;
          }
          case 20: {
            animal.pigsTotal = animal.pigsTotal ? animal.pigsTotal + animalsTotal : animalsTotal;
            break;
          }
          case 21: {
            animal.horseTotal = animal.horseTotal ? animal.horseTotal + animalsTotal : animalsTotal;
            break;
          }

        }
      });
      dsAgricultureID = dsAgriculture.generateID();
      dsAgriculture.run('insert', {
        execParams: {
          ID: dsAgricultureID,
          year: item[0].year ? item[0].year : 1902,
          cattleTotal: animal.cattleTotal,
          bull: animal.bull,
          cow: animal.cow,
          heiferOneTwo: animal.heiferOneTwo,
          heiferTwoMore: animal.heiferTwoMore,
          calveOneYear: animal.calveOneYear,
          pigsTotal: animal.pigsTotal,
          sowsNineMore: animal.sowsNineMore,
          repairPigFourMore: animal.repairPigFourMore,
          pigletTwoLess: animal.pigletTwoLess,
          sheepTotal: animal.sheepTotal,
          sheepYearMore: animal.sheepYearMore,
          goatTotal: animal.goatTotal,
          goatYearMore: animal.goatYearMore,
          horseTotal: animal.horseTotal,
          mareThreeYearMore: animal.mareThreeYearMore,
          horseYearMore: animal.horseYearMore,
          birdTotal: animal.birdTotal,
          hen: animal.hen,
          rabbitTotal: animal.rabbitTotal,
          rabbits: animal.rabbits,
          beesTotal: animal.beesTotal,
          objAccountingID: i
        }
      });

      if (animal['animalsTotal'].length) {
        _.forEach(animal['animalsTotal'], function (animals) {
          dsAgricultureAnimal.run('insert', {
            execParams: {
              ID: dsAgricultureAnimal.generateID(),
              name: animals.name,
              count: animals.count,
              agricultureID: dsAgricultureID
            }
          });
        });
      }
    });
  })
};

me.importMachine = function () {
  Session.runAsAdmin(function () {
    let dsUser = UB.DataStore('uba_user'),
      dsAgricultureMachine = UB.DataStore('pgo_agricultureMachine');

    dsUser.runSQL("select (CASE WHEN A1.TECHTYPEID=3 THEN 'truck' WHEN A1.TECHTYPEID=6 THEN 'tractorTotal' END) as type, A1.year, A1.AMOUNT AS total, A4.ID as objAccountingID from technique A1 join people A2 on A2.ID=A1.peopleid join family A3 on A3.ID=A2.familyID join pgo_objAccounting A4 on A4.oldID=A3.HOUSEID::text AND  A4.oldTable='HOUSE_VUSHENKI'", {});

    let data = JSON.parse(dsUser.asJSONObject);

    _.forEach(data, function (item, i) {
      Object.keys(item).forEach(fld => {
        if (item[fld] && typeof item[fld] === 'string') item[fld] = item[fld].trim()
      })
      dsAgricultureMachine.run('insert', {
        execParams: {
          ID: dsAgricultureMachine.generateID(),
          year: item.year ? item.year : 1902,
          tractorTotal: item.type == 'tractorTotal' ? item.total : null,
          truck: item.type = 'truck' ? item.total : null,
          objAccountingID: item.objaccountingid
        }
      });
    });
  })
};

me.importLand = function () {
  Session.runAsAdmin(function () {
    let dsUser = UB.DataStore('uba_user'),
      dsLandPlot = UB.DataStore('pgo_landPlot');

    dsUser.runSQL("select A1.ID as landPlotID, A1.owner, A1.cadastralNumber, A1.landCategory, A1.location, A1.useType, A1.landPurpose, A1.totalArea, A1.documentOwnership, A1.registryData, A1.position, A1.notes, A2.objAccountingID " +
      "from inv_landPlot A1 JOIN pgo_householdMember A2 on A2.payerID=A1.owner AND A2.oldTable='PEOPLE_VUSHENKI'", {});

    let data = JSON.parse(dsUser.asJSONObject);

    _.forEach(data, function (item, i) {
      Object.keys(item).forEach(fld => {
        if (item[fld] && typeof item[fld] === 'string') item[fld] = item[fld].trim()
      })
      dsLandPlot.run('insert', {
        execParams: {
          ID: dsLandPlot.generateID(),
          year: 2021,
          payerID: item.owner,
          landPlotID: item.landplotid,
          cadastralNumber: item.cadastralnumber,
          landCategory: item.landcategory,
          location: item.location,
          useType: item.usetype,
          landPurpose: item.landpurpose,
          totalArea: item.totalarea,
          documentOwnership: item.documentownership,
          registryData: item.registrydata,
          position: item.position,
          notes: item.notes,
          objAccountingID: item.objaccountingid
        }
      });
    });
  })
};

me.selectPgoBook = function (ctx) {
    var locationID = ctx.mParams.whereList.byLocationID.values["locationID"];

    var accounting = UB.Repository("pgo_objAccounting")
        .attrs(["pgoBook"])
        .where("[locationID]", '=', locationID)
        .where("[objState]", '=', 'OBJ_INPGO')
        .selectAsObject();
    if (accounting.length) {
        var pgoBooks = _.orderBy(_.uniqBy(accounting, 'pgoBook'), ['pgoBook'], ['asc']);
        var data = [];
        _.forEach(pgoBooks, function (obj) {
            data.push([obj.pgoBook, obj.pgoBook])
        });
        commonService.initStore(ctx.dataStore, {
            fields: ctx.mParams.fieldList,
            rowCount: data.length,
            data: data
        }, ctx.mParams.fieldList);
        ctx.mParams.__totalRecCount = data.length
    } else {
        ctx.dataStore.initialize([], ['pgoBook']);
    }
    ctx.preventDefault();
};


me.entity.addMethod("selectPgoBook");
me.entity.addMethod("beforeinsert");
me.entity.addMethod("afterinsert");
me.entity.addMethod("afterupdate");
me.entity.addMethod("afterdelete");
me.entity.addMethod("beforeupdate");
me.entity.addMethod("beforedelete");
me.entity.addMethod("afterbeforeupdate");
me.entity.addMethod("afterbeforedelete");

me.entity.addMethod("getBookPage");
me.entity.addMethod("getObjCode");
me.entity.addMethod("checkDuplicateObjCode");
me.entity.addMethod("createReport");
me.entity.addMethod("createPayerReport");
me.entity.addMethod("getObjAttNewID");
me.entity.addMethod("renumObjs");
me.entity.addMethod("copyPGO");
