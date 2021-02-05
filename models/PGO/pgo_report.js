
const me = pgo_report;


const XlsxTemplate = require('xlsx-template');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const UB = require('@unitybase/ub');

me.generatePGOBook = function (fake, req, resp) {
    var params = {};
    var param = req.parameters.split('&');
    param = param.map((elem) => {
        var newEl = {},
            spVal = elem.split('=');
        if (spVal[0] == 'locality') {
            params.locality = spVal[1]
        }
        if (spVal[0] == 'yearFrom') {
            params.yearFrom = spVal[1]
        }
        if (spVal[0] == 'yearTo') {
            params.yearTo = spVal[1]
        }
        if (spVal[0] == 'isAllBook') {
            params.isAllBook = spVal[1] == '1'
        }
        if (spVal[0] == 'accountingID') {
            params.accountingID = spVal[1]
        }
        if (spVal[0] == 'pgoBook') {
            params.pgoBook = spVal[1]
        }

        newEl.name = spVal[0];
        newEl.value = spVal[1];
        return newEl;
    });

    var objColl = [];

    function parseDotToObject(v, k, obj) {
        var ind = k.indexOf('.')
        if (ind > 0) {
            var objName = k.substr(0, ind)
            var kName = k.substr(ind + 1, k.length)
            if (objColl.indexOf(objName) == -1) {
                objColl.push(objName);
                obj[objName] = {};
            }
            if (kName.indexOf('.') > 0) {
                obj[objName] = parseDotToObject(v, kName, obj[objName])
            }
            else obj[objName][kName] = v;
        }
        return obj;
    }

    function convertObjWithDotToObjWithObj(objects) {
        _.forEach(objects, function (object) {
            objColl = [];
            _.forEach(object, function (v, k, obj) {
                obj = parseDotToObject(v, k, obj);
            })
        })
    }

    var templatePath = path.join(process.configPath, 'excelTemplate', 'Book.xlsm');
    var templateFile = fs.readFileSync(templatePath, {encoding: 'bin'});
    // Create a template
    var template = new XlsxTemplate(templateFile);

    // Replacements take place on first sheet
    var year1 = parseInt(params.yearFrom);
    var year2 = year1 + 1;
    var year3 = year1 + 2;
    var year4 = year1 + 3;
    var year5 = year1 + 4;
    var pgo_settlementDict = UB.Repository("pgo_settlementDict")
        .attrs(["*"])
        .where("[ID]", '=', params.locality)
        .selectAsObject()[0];
    var Requisites = UB.Repository("pgo_localRequisites")
        .attrs(["*", 'pgoDictID.localGovernment', 'pgoDictID.regionName', 'pgoDictID.areaName', 'streetID.street'])
        .where("[pgoDictID]", '=', pgo_settlementDict.pgoDictID)
        .selectAsObject();
    if (!Requisites || Requisites.length == 0) {
        throw new Error('<<<Заповніть реквізити місцевої ради>>>');
    }
    var pgo_localRequisites = Requisites[0];
    pgo_localRequisites.yearFrom = params.yearFrom;
    pgo_localRequisites.yearTo = params.yearTo;
    pgo_localRequisites.year1 = year1;
    pgo_localRequisites.year2 = year2;
    pgo_localRequisites.year3 = year3;
    pgo_localRequisites.year4 = year4;
    pgo_localRequisites.year5 = year5;
    var accounting = UB.Repository("pgo_objAccounting")
        .attrs(["*", 'headPayerID.fullName', 'locationID.governmentFullName', 'streetID.street'])
        .where("[locationID]", '=', params.locality)
        .where("[pgoBook]", '=', params.pgoBook)
        .where("[objState]", '=', 'OBJ_INPGO')
        .orderBy('[pgoBookPage]')
        .selectAsObject();
    if (accounting&&accounting.length>0) {
        var pgo_objAccounting = []
        if (params.accountingID) {
            var ind = _.findIndex(accounting, {ID: parseInt(params.accountingID)})
            if (ind > 0 && ind < (accounting.length - 1)) {
                pgo_objAccounting.push(accounting[ind - 1])
                pgo_objAccounting.push(accounting[ind])
                pgo_objAccounting.push(accounting[ind + 1])
            }
            else if (ind == 0) {
                params.isAllBook = true
                pgo_objAccounting.push(accounting[ind])
               if(accounting.length>1) pgo_objAccounting.push(accounting[ind + 1])
            } else {
                pgo_objAccounting.push(accounting[ind - 1])
                pgo_objAccounting.push(accounting[ind])
            }
        }
        else
            pgo_objAccounting = accounting;
        pgo_localRequisites.pgoBook = pgo_objAccounting[0].pgoBook;
        //*Count -- к-ть строк в таблиці, починається з 2 бо 1 для шапки
        //Члени домогосподарства
        var householdMember = [], householdMemberCount = 2;
        var arriveDepart = [], arriveDepartCount = 2;
        //Інформація про власників
        var roomOwner = [], roomOwnerCount = 2;
        //Відомості про житловий об’єкт
        var livingRoom = [], livingRoomCount = 2;
        //Земля
        var landPlot = [], landPlotCount = 2;
        //Відомості про поголів’я
        var agriculture = [], agricultureCount = 2;
        //Сільськогосподарська техніка
        var agricultureMachine = [], agricultureMachineCount = 2;
        //Дати обходу об’єкта
        var CheckDate = [], CheckDateCount = 2;
        _.forEach(pgo_objAccounting, function (obj) {
            obj['retireDate'] = (new Date(obj['retireDate'])).toLocaleDateString('uk-UA', {year: 'numeric', month: 'long'});
            obj['arriveDate'] = (new Date(obj['arriveDate'])).toLocaleDateString('uk-UA', {year: 'numeric', month: 'long'});
            //Члени домогосподарства
            var pgo_householdMember = UB.Repository("pgo_householdMember")
                .attrs(["*", 'payerID.lastName', 'payerID.middleName', 'payerID.firstName', 'payerID.birthDate', 'payerID.birthCertifIssuedBy', 'payerID.birthCertificate', 'payerID.birthCertifDate', 'payerID.gender', 'exemptionID.exemptionCat', 'cognationID.name'])
                .where("[objAccountingID]", '=', obj.ID)
                .orderBy('[isHead]', 'desc')
                .selectAsObject();
            if (pgo_householdMember) {
                obj.householdMemberRowFrom = householdMemberCount;

                _.forEach(pgo_householdMember, function (el) {

                    if(el['birthDate'] && _.indexOf(el['birthDate'], 'T')!=-1) el['birthDate'] = (new Date(el['birthDate'])).toLocaleDateString();
                    else el['birthDate'] = el['birthDate'] ? (new Date(el['birthDate'].replace('Z', 'T00:00:00.000Z'))).toLocaleDateString() : '';

                    if(el['payerID.birthDate'] && _.indexOf(el['payerID.birthDate'], 'T')!=-1) el['payerID.birthDate'] = (new Date(el['payerID.birthDate'])).toLocaleDateString();
                    else el['payerID.birthDate'] = el['payerID.birthDate'] ? (new Date(el['payerID.birthDate'].replace('Z', 'T00:00:00.000Z'))).toLocaleDateString() : '';
                    el['gender'] = el['gender'] == 'MALE' ? 'Чоловіча' : (el['gender'] == 'FEMALE' ? 'Жіноча' : '');
                    var pgo_arriveDepartInform = UB.Repository("pgo_arriveDepartInform")
                        .attrs(["*"])
                        .where("[houseMemberID]", '=', el.ID)
                        .orderBy('[departureDate]', 'desc')
                        .limit(2)
                        .selectAsObject();
                    if (pgo_arriveDepartInform) {
                        el.arriveDepartRowFrom = arriveDepartCount;
                        _.forEach(pgo_arriveDepartInform, function (elm) {
                            elm['departureDate'] = elm['departureDate'] ? (new Date(elm['departureDate'])).toLocaleDateString() : '';
                            elm['returnDate'] = elm['returnDate'] ? (new Date(elm['returnDate'])).toLocaleDateString() : '';
                            elm['regDate'] = elm['regDate'] ? (new Date(elm['regDate'])).toLocaleDateString() : '';
                            elm['certIssueDate'] = elm['certIssueDate'] ? (new Date(elm['certIssueDate'])).toLocaleDateString() : '';
                            arriveDepart.push(elm)
                        });
                        arriveDepartCount += pgo_arriveDepartInform.length;
                        el.arriveDepartRowTo = arriveDepartCount - 1;
                    }
                    householdMember.push(el)
                });
                householdMemberCount += pgo_householdMember.length;
                obj.householdMemberRowTo = householdMemberCount - 1;
            }
            //Інформація про власників
            var pgo_roomOwnerInfo = UB.Repository("pgo_roomOwnerInfo")
                .attrs(["*", 'payerID.fullName'])
                .where("[objAccountingID]", '=', obj.ID)
                .where("[year]", '>=', year1)
                .where("[year]", '<=', year5)
                .selectAsObject();
            if (pgo_roomOwnerInfo) {
                obj.roomOwnerRowFrom = roomOwnerCount;
                let owners = _.filter(pgo_roomOwnerInfo, {personType: 'OWNER'})
                obj.ownerName = (owners & owners.length > 0) ? owners[0]['payerID.fullName'] : ''
                _.forEach(pgo_roomOwnerInfo, function (el) {
                    var enumName = UB.Repository("ubm_enum")
                        .attrs(["*"])
                        .where("[eGroup]", '=', 'PGO_PERSON_TYPE')
                        .where("[code]", '=', el.personType)
                        .selectAsObject()[0];
                    el.personTypeName = enumName.name
                    roomOwner.push(el)
                });
                roomOwnerCount += pgo_roomOwnerInfo.length;
                obj.roomOwnerRowTo = roomOwnerCount - 1;
            }
            //Відомості про житловий об’єкт
            var pgo_livingRoomInfo = UB.Repository("pgo_livingRoomInfo")
                .attrs(["*"])
                .where("[objAccountingID]", '=', obj.ID)
                .where("[year]", '>=', year1)
                .where("[year]", '<=', year5)
                .orderByDesc('[year]')
                .limit(5)
                .selectAsObject();
            if (pgo_livingRoomInfo) {
                obj.livingRoomRowFrom = livingRoomCount;
                _.forEach(pgo_livingRoomInfo, function (el) {
                    el.aqueduct = el.aqueduct ? 'Так' : 'Ні'
                    el.sewerage = el.sewerage ? 'Так' : 'Ні'
                    el.heating = el.heating ? 'Так' : 'Ні'
                    el.hotWater = el.hotWater ? 'Так' : 'Ні'
                    el.bath = el.bath ? 'Так' : 'Ні'
                    el.naturalGas = el.naturalGas ? 'Так' : 'Ні'
                    el.liquefiedGas = el.liquefiedGas ? 'Так' : 'Ні'
                    el.electricPlate = el.electricPlate ? 'Так' : 'Ні'
                    el['checkDate'] = (new Date(el['checkDate'])).toLocaleDateString('uk-UA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    livingRoom.push(el)
                });
                livingRoomCount += pgo_livingRoomInfo.length;
                obj.livingRoomRowTo = livingRoomCount - 1;
            }
            //Земля
            var pgo_landPlot = UB.Repository("pgo_landPlot")
                .attrs(["*"])
                .where("[objAccountingID]", '=', obj.ID)
                .where("[year]", '>=', year1)
                .where("[year]", '<=', year5)
                .selectAsObject();
            if (pgo_landPlot) {
                obj.landPlotRowFrom = landPlotCount;
                /*_.forEach(pgo_landPlot, function (el) {
                 landPlot.push(el)
                 });*/
                var landByYear = _.groupBy(pgo_landPlot, 'year')
                _.forEach(landByYear, function (lObj) {
                    var landYObj = {}
                    landYObj.year = lObj[0].year
                    landYObj.totalArea = _.sumBy(lObj, 'totalArea')
                    landYObj.sgTotalArea = _.sumBy(lObj, function (o) {
                        return o.landCategory == 'CONSTRGARAGES' ? o.totalArea : 0
                    })
                    var byUseType = _.groupBy(lObj, 'useType')
                    landYObj.r1 = _.sumBy(byUseType['COTTAGECONSTR'], 'totalArea') + _.sumBy(byUseType['CONSTRGARAGES'], 'totalArea')
                    landYObj.r2 = _.sumBy(byUseType['OSGMANAGE'], 'totalArea')
                    landYObj.r3 = _.sumBy(byUseType['SGPRODUCTMANAGE'], 'totalArea')
                    landYObj.r4 = _.sumBy(lObj, function (o) {
                        return o.leased ? o.totalArea : 0
                    })
                    landYObj.r6 = _.sumBy(byUseType['SMALLHOLDING'], function (o) {
                        return o.leased ? o.totalArea : 0
                    })
                    landYObj.r7 = _.sumBy(byUseType['GARDENMANAGE'], function (o) {
                        return o.leased ? o.totalArea : 0
                    })

                    var byPurpose = _.groupBy(lObj, 'landPurpose')
                    landYObj.sg1 = _.sumBy(byPurpose['AGRICULTURAL'], 'totalArea')
                    landYObj.sg2 = _.sumBy(byPurpose['PERENNIAL_PLANTING'], 'totalArea')
                    landYObj.sg3 = _.sumBy(byPurpose['HAY'], 'totalArea') + _.sumBy(byPurpose['PASTURES'], 'totalArea')
                    landYObj.r5 = _.sumBy(byPurpose['HAY'], function (o) {
                        return o.leased ? o.totalArea : 0
                    }) + _.sumBy(byPurpose['PASTURES'], function (o) {
                        return o.leased ? o.totalArea : 0
                    })
                    landPlot.push(landYObj)
                })
                landPlotCount += pgo_landPlot.length;
                obj.landPlotNote = (_.map(landByYear, 'notes')).join('; ');
                obj.landPlotRowTo = landPlotCount - 1;
            }
            //Відомості про поголів’я
            var pgo_agriculture = UB.Repository("pgo_agriculture")
                .attrs(["*"])
                .where("[objAccountingID]", '=', obj.ID)
                .where("[year]", '>=', year1)
                .where("[year]", '<=', year5)
                .selectAsObject();
            if (pgo_agriculture) {
                obj.agricultureRowFrom = agricultureCount;
                _.forEach(pgo_agriculture, function (el) {
                    agriculture.push(el)
                });
                obj.agricultureNote = (_.map(pgo_agriculture, 'notes')).join('; ');
                agricultureCount += pgo_agriculture.length;
                obj.agricultureRowTo = agricultureCount - 1;
            }
            //Сільськогосподарська техніка
            var pgo_agricultureMachine = UB.Repository("pgo_agricultureMachine")
                .attrs(["*"])
                .where("[objAccountingID]", '=', obj.ID)
                .where("[year]", '>=', year1)
                .where("[year]", '<=', year5)
                .selectAsObject();
            if (pgo_agricultureMachine) {
                obj.agricultureMachineRowFrom = agricultureMachineCount;
                _.forEach(pgo_agricultureMachine, function (el) {
                    agricultureMachine.push(el)
                });
                obj.agricultureMachineNote = (_.map(pgo_agricultureMachine, 'notes')).join('; ');
                agricultureMachineCount += pgo_agricultureMachine.length;
                obj.agricultureMachineRowTo = agricultureMachineCount - 1;
            }
            //Дати обходу об’єкта
            var pgo_objCheckDate = UB.Repository("pgo_objCheckDate")
                .attrs(["*"])
                .where("[objAccountingID]", '=', obj.ID)
                .where("[checkDate]", '>=', new Date(year1, 0, 1))
                .where("[checkDate]", '<=', new Date(year5, 11, 31))
                .selectAsObject();
            if (pgo_objCheckDate) {
                obj.CheckDateRowFrom = CheckDateCount;
                _.forEach(pgo_objCheckDate, function (el) {
                    el['checkDate'] = (new Date(el['checkDate'])).toLocaleDateString();
                    el['year'] = el['checkDate'].substr(6);
                    CheckDate.push(el)
                });
                CheckDateCount += pgo_objCheckDate.length;
                obj.CheckDateRowTo = CheckDateCount - 1;
            }

        })

        convertObjWithDotToObjWithObj([pgo_localRequisites])
        convertObjWithDotToObjWithObj(pgo_objAccounting)
        convertObjWithDotToObjWithObj(householdMember)
        convertObjWithDotToObjWithObj(arriveDepart)
        convertObjWithDotToObjWithObj(roomOwner)
        convertObjWithDotToObjWithObj(livingRoom)
        convertObjWithDotToObjWithObj(landPlot)
        convertObjWithDotToObjWithObj(agriculture)
        convertObjWithDotToObjWithObj(agricultureMachine)
        convertObjWithDotToObjWithObj(CheckDate)
        // Perform substitution
        template.substitute(1, {book: pgo_localRequisites});
        template.substitute(5, {book: pgo_localRequisites});
        template.substitute(7, {pgo: pgo_objAccounting});
        template.substitute(8, {
            param: {
                isAllBook: params.isAllBook,
                DateTo: params.yearTo,
                DateFrom: params.yearFrom,
                pgoRowCount: pgo_objAccounting.length,
                year: year1
            }
        });
        template.substitute(9, {householdMember: householdMember});
        template.substitute(10, {arriveDepart: arriveDepart});
        template.substitute(11, {roomOwner: roomOwner});
        template.substitute(12, {livingRoom: livingRoom});
        template.substitute(13, {landPlot: landPlot});
        template.substitute(14, {agriculture: agriculture});
        template.substitute(15, {agricultureMachine: agricultureMachine});
        template.substitute(16, {CheckDate: CheckDate});
    } else {
        template.substitute(1, {book: pgo_localRequisites});
        template.substitute(8, {param: {isAllBook: params.isAllBook, DateTo: params.yearTo, DateFrom: params.yearFrom, pgoRowCount: 0, year: year1}});
    }
    // Get binary data
    var resultDoc = template.generate({type: 'ArrayBuffer'});
    //ctx.mParams.resultData = resultDoc;

    resp.writeEnd(resultDoc);
    resp.writeHead('Content-type: application/vnd.ms-excel.sheet.macroEnabled.12', 'Content-Disposition: inline; filename="myfile.xlsm"');
    resp.statusCode = 200;
};


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

    if (!ID)
        return;
    var report = UB.Repository("pgo_report")
        .attrs(["*"])
        .where("[ID]", '=', ID)
        .selectAsObject()[0];
    var fileName = '';
    switch (report.repType) {
        case 'JYTLO':
            fileName = 'zhytlofond(rychna).xlsx';
            break;
        case 'SILRADA':
            fileName = 'silrada.xlsx';
            break;
        case 'SCHOOL':
            fileName = 'School.xlsx';
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
    // Perform substitution
    template.substitute(sheetNumber, values);

    // Get binary data
    var resultDoc = template.generate({type: 'ArrayBuffer'});
    //ctx.mParams.resultData = resultDoc;

    resp.writeEnd(resultDoc);
    resp.writeHead('Content-type: application/vnd.ms-excel', 'Content-Disposition: inline; filename="myfile.xlsx"');
    resp.statusCode = 200;
};


me.saveDataSilrada = function (ctx) {
    var params = ctx.mParams;
    var pgo_settlementDict = UB.Repository("pgo_settlementDict")
        .attrs(["*"])
        .where("[ID]", '=', params.locality)
        .selectAsObject()[0];
    var Requisites = UB.Repository("pgo_localRequisites")
        .attrs(["*", 'pgoDictID.localGovernment', 'pgoDictID.regionName', 'pgoDictID.areaName', 'streetID.street'])
        .where("[pgoDictID]", '=', pgo_settlementDict.pgoDictID)
        .selectAsObject();
    if (!Requisites || Requisites.length == 0) {
        throw new Error('<<<Заповніть реквізити місцевої ради>>>');
    }
    var pgo_localRequisites = Requisites[0]
    var edrpou =  pgo_localRequisites['edrpou'] ? pgo_localRequisites['edrpou'].toString().split('') : ['', '', '', '', '', '', '', ''];

    var pgo_objAccounting = UB.Repository("pgo_objAccounting")
        .attrs(["*"])
        .where("[locationID]", '=', params.locality)
        .where("[objState]", '=', 'OBJ_INPGO')
        .selectAsObject();

    var accArr = [];
    _.forEach(pgo_objAccounting, function (obj) {
        accArr.push(obj.ID);
    });
    var pgo_landPlot = UB.Repository("pgo_landPlot")
        .attrs(["*", 'objAccountingID.pgoType'])
        .where("[objAccountingID]", 'in', accArr)
        .where("[year]", '=', params.year)
        .selectAsObject();
    var landAccArr = [];
    var landSGAccArr = [];
    var t2r2c1 = [];
    var t2r3c1 = [];
    var t2r4c1 = [];
    var SGType = ['OSGMANAGE', 'SGPRODUCTMANAGE'];
    var BuildType = ['CONSTRGARAGES', 'COTTAGECONSTR', 'SMALLHOLDING'];
    _.forEach(pgo_landPlot, function (obj) {
        landAccArr.push(obj.objAccountingID);
        if (SGType.indexOf(obj.useType))
            landSGAccArr.push(obj.objAccountingID);
        if (BuildType.indexOf(obj.useType)) t2r2c1.push(obj);
        if (obj.useType == 'OSGMANAGE') t2r3c1.push(obj);
        if (obj.useType == 'SGPRODUCTMANAGE') t2r4c1.push(obj);
    });
    function getHouseHoldLive(obj, col) {
        var o = {};
        o[col] = 'HOUSEHOLD_LIVE';
        return _.filter(obj, o);
    }

    var t2r5c1 = _.filter(t2r4c1, {'leased': true});
    var t2r1c2 = getHouseHoldLive(pgo_landPlot, 'objAccountingID.pgoType');
    var t2r1c3 = _.filter(t2r1c2, function (obj) {
        return landSGAccArr.indexOf(obj.objAccountingID) > 0;
    });
    var t1r1c2 = getHouseHoldLive(pgo_objAccounting, 'pgoType');
    var t1r2c2 = _.filter(t1r1c2, function (obj) {
        return landAccArr.indexOf(obj.ID) > 0;
    });
    var t1r1c3 = _.filter(t1r2c2, function (obj) {
        return landSGAccArr.indexOf(obj.ID) > 0;
    });

    var tab1 = {
        r101: {c1: pgo_objAccounting.length, c2: t1r1c2.length, c3: t1r1c3.length},
        r102: {c1: landAccArr.length, c2: t1r2c2.length}
    };
    var tab2 = {
        r201: {
            c1: _.sumBy(pgo_landPlot, 'totalArea'),
            c2: _.sumBy(t2r1c2, 'totalArea'),
            c3: _.sumBy(t2r1c3, 'totalArea')
        },
        r202: {
            c1: _.sumBy(t2r2c1, 'totalArea'),
            c2: _.sumBy(getHouseHoldLive(t2r2c1, 'objAccountingID.pgoType'), 'totalArea')
        },
        r203: {
            c1: _.sumBy(t2r3c1, 'totalArea'),
            c2: _.sumBy(getHouseHoldLive(t2r3c1, 'objAccountingID.pgoType'), 'totalArea')
        },
        r204: {
            c1: _.sumBy(t2r4c1, 'totalArea'),
            c2: _.sumBy(getHouseHoldLive(t2r4c1, 'objAccountingID.pgoType'), 'totalArea')
        },
        r205: {
            c1: _.sumBy(t2r5c1, 'totalArea'),
            c2: _.sumBy(getHouseHoldLive(t2r5c1, 'objAccountingID.pgoType'), 'totalArea')
        }
    }

    function upFirst(text) {
        return _.upperFirst(_.lowerCase(text));
    }

    var result = JSON.stringify({
        year: params.year,
        data: {
            e1: edrpou[0],
            e2: edrpou[1],
            e3: edrpou[2],
            e4: edrpou[3],
            e5: edrpou[4],
            e6: edrpou[5],
            e7: edrpou[6],
            e8: edrpou[7],
            name: upFirst(pgo_localRequisites['pgoDictID.localGovernment']),
            index: pgo_localRequisites.postIndex ? pgo_localRequisites.postIndex : '',
            address: upFirst(pgo_localRequisites['pgoDictID.areaName']) + ' область, ' + upFirst(pgo_localRequisites['pgoDictID.regionName']) + ', ',
            address2: pgo_localRequisites['streetID.street'] ? pgo_localRequisites['streetID.street'] : '' + ' ' + pgo_localRequisites.houseNum ? pgo_localRequisites.houseNum : '',
            headFullName: pgo_localRequisites.headFullName ? pgo_localRequisites.headFullName : '',
            headPhoneNumber: pgo_localRequisites.headPhoneNumber ? pgo_localRequisites.headPhoneNumber : '',
            clerkFullName: pgo_localRequisites.clerkFullName ? pgo_localRequisites.clerkFullName : '',
            email: pgo_localRequisites.email ? pgo_localRequisites.email : ''
        },
        tab1: tab1,
        tab2: tab2
    });
    var dsReport = UB.DataStore('pgo_report');
    var reportID = dsReport.generateID()
    dsReport.run('insert', {
        execParams: {
            ID: reportID,
            repType: params.repType,
            year: params.year,
            locationID: params.locality,
            dateRep: new Date(),
            reportData: result
        }
    });
    ctx.mParams.reportID = reportID;
};

me.saveDataJytlo = function (ctx) {
    var params = ctx.mParams,
        reportParams = {year: params.year},
        objAccounting = UB.Repository("pgo_objAccounting")
            .attrs(["*", "locationID.pgoDictID"])
            .where("[locationID]", '=', params.locality)
            .where("[objState]", '=', 'OBJ_INPGO')
            .selectAsObject(),
        localRequisites,
        settlementDict,
        edrpou;

    reportParams.houseArea = {
        sum: {totalArea: 0, livingArea: 0},
        livingHouse: {totalArea: 0, livingArea: 0},
        individHouse: {totalArea: 0, livingArea: 0},
        hostel: {totalArea: 0, livingArea: 0},
        notLiving: {totalArea: 0, livingArea: 0}
    };

    reportParams.rooms = {
        total: {count: 0, totalArea: 0, livingArea: 0},
        one: {count: 0, totalArea: 0, livingArea: 0},
        two: {count: 0, totalArea: 0, livingArea: 0},
        three: {count: 0, totalArea: 0, livingArea: 0},
        four: {count: 0, totalArea: 0, livingArea: 0},
        five: {count: 0, totalArea: 0, livingArea: 0},
        six: {count: 0, totalArea: 0, livingArea: 0},
        seven: {count: 0, totalArea: 0, livingArea: 0},
        eight: {count: 0, totalArea: 0, livingArea: 0}
    };

    reportParams.roomTools = {
        aqueduct: {count: 0, totalArea: 0, hostelArea: 0, notLivingArea: 0},
        hotWater: {count: 0, totalArea: 0, hostelArea: 0, notLivingArea: 0},
        sewerage: {count: 0, totalArea: 0, hostelArea: 0, notLivingArea: 0},
        indHeating: {count: 0, totalArea: 0, hostelArea: 0, notLivingArea: 0},
        centrHeating: {count: 0, totalArea: 0, hostelArea: 0, notLivingArea: 0},
        ovenHeating: {count: 0, totalArea: 0, hostelArea: 0, notLivingArea: 0},
        naturalGas: {count: 0, totalArea: 0, hostelArea: 0, notLivingArea: 0},
        liquefiedGas: {count: 0, totalArea: 0, hostelArea: 0, notLivingArea: 0}
    };

    reportParams.oldEmergRoom = {
        oldFund: {count: 0, totalArea: 0, personCount: 0},
        emergencyFund: {count: 0, totalArea: 0, personCount: 0}
    };

    reportParams.floorCount = {
        total: 0,
        three: 0,
        fourNine: 0,
        tenSixteen: 0,
        sixteen: 0,
        hostel: 0,
        individ: 0,
        notLive: 0
    };

    settlementDict = UB.Repository("pgo_settlementDict")
        .attrs(["*"])
        .where("[ID]", '=', params.locality)
        .selectAsObject()[0];
    localRequisites = UB.Repository("pgo_localRequisites")
        .attrs(["*", "pgoDictID.localGovernment", "pgoDictID.regionName", "pgoDictID.areaName", "streetID.street"])
        .where("[pgoDictID]", '=', settlementDict["pgoDictID"])
        .selectAsObject()[0];
    if (!localRequisites) {
        throw new Error('<<<Заповніть реквізити місцевої ради>>>');
    }
    if (objAccounting.length) {

        reportParams.headFullName = localRequisites.headFullName ? localRequisites.headFullName : '';
        reportParams.clerkFullName = localRequisites.clerkFullName ? localRequisites.clerkFullName : '';
        reportParams.email = localRequisites.email ? localRequisites.email : '';
        reportParams.phone = localRequisites.headPhoneNumber ? localRequisites.headPhoneNumber : '';

        edrpou = localRequisites['edrpou'] ? localRequisites['edrpou'].toString().split('') : ['', '', '', '', '', '', '', ''];
        reportParams.edrpou = {
            one: edrpou[0],
            two: edrpou[1],
            three: edrpou[2],
            four: edrpou[3],
            five: edrpou[4],
            six: edrpou[5],
            seven: edrpou[6],
            eight: edrpou[7]
        };
        let formatCase = function (word) {
                return word.substr(0, 1).toUpperCase() + word.substr(1, word.length).toLowerCase();
            },
            areaName = localRequisites["pgoDictID.areaName"] ? formatCase(localRequisites["pgoDictID.areaName"]) : '',
            regionName = localRequisites["pgoDictID.regionName"] ? formatCase(localRequisites["pgoDictID.regionName"]) : '',
            governmentName = settlementDict['governmentName'] ? formatCase(settlementDict['governmentName']) : '',
            governmentStatus = settlementDict['governmentStatus'] ? formatCase(settlementDict['governmentStatus']) : '',
            localGovernment = localRequisites["pgoDictID.localGovernment"] ? formatCase(localRequisites["pgoDictID.localGovernment"]) : '',
            postIndex = localRequisites['postIndex'] ? localRequisites['postIndex'] : '',
            street = localRequisites["streetID.street"] ? localRequisites["streetID.street"] : '',
            houseNum = localRequisites['houseNum'] ? localRequisites['houseNum'] : '';
        reportParams.localRequisites = {localGovernment: localGovernment};
        reportParams.localRequisites['fullAddress1'] = `${postIndex}, ${areaName} область, ${regionName}, `;
        reportParams.localRequisites['fullAddress2'] = `${governmentStatus} ${governmentName},`;
        reportParams.localRequisites['house'] = `${street}, ${houseNum}`;

        reportParams.governmentName = `${governmentStatus} ${governmentName}`;

        //I. Площа житлових приміщень на 1 січня ${year} року
        reportParams.houseArea = {
            sum: {totalArea: 0, livingArea: 0},
            livingHouse: {totalArea: 0, livingArea: 0},
            individHouse: {totalArea: 0, livingArea: 0},
            hostel: {totalArea: 0, livingArea: 0},
            notLiving: {totalArea: 0, livingArea: 0}
        };
        let livingRooms = UB.Repository("pgo_livingRoomInfo")
                .attrs(["*"])
                .where("[year]", '=', params.year)
              .exists(
                UB.Repository('pgo_objAccounting')
                  .correlation('ID', 'objAccountingID')
                  .where("[locationID]", '=', params.locality)
                  .where("[objState]", '=', 'OBJ_INPGO')
              )
                .selectAsObject(),
            flats = UB.Repository("pgo_livingRoomInfo")
                .attrs(["*"])
                .where("[year]", '=', params.year)
                .where("[roomType]", '=', 'FLAT')
              .exists(
                UB.Repository('pgo_objAccounting')
                  .correlation('ID', 'objAccountingID')
                  .where("[locationID]", '=', params.locality)
                  .where("[objState]", '=', 'OBJ_INPGO')
              )
                .selectAsObject(),
            groupByLivingHouse = _.groupBy(livingRooms, 'objAccountingID'),
            groupByFlats = _.groupBy(flats, 'objAccountingID'),
            currHouses;
        _.forEach(objAccounting, function (obj) {
            currHouses = groupByLivingHouse[obj.ID];
            _.forEach(currHouses, function (house) {
                switch (house.roomType) {
                    case 'LIVE_HOUSE':
                        reportParams.houseArea.livingHouse.totalArea += !isNaN(parseInt(house.totalArea)) ? parseInt(house.totalArea) : 0;
                        reportParams.houseArea.livingHouse.livingArea += !isNaN(parseInt(house.livingArea)) ? parseInt(house.livingArea) : 0;
                        break;

                    case 'INDIVID_HOUSE':
                        reportParams.houseArea.individHouse.totalArea += !isNaN(parseInt(house.totalArea)) ? parseInt(house.totalArea) : 0;
                        reportParams.houseArea.individHouse.livingArea += !isNaN(parseInt(house.livingArea)) ? parseInt(house.livingArea) : 0;

                        reportParams.houseArea.livingHouse.totalArea += !isNaN(parseInt(house.totalArea)) ? parseInt(house.totalArea) : 0;
                        reportParams.houseArea.livingHouse.livingArea += !isNaN(parseInt(house.livingArea)) ? parseInt(house.livingArea) : 0;

                        break;

                    case 'HOSTEL':
                        reportParams.houseArea.hostel.totalArea += !isNaN(parseInt(house.totalArea)) ? parseInt(house.totalArea) : 0;
                        reportParams.houseArea.hostel.livingArea += !isNaN(parseInt(house.livingArea)) ? parseInt(house.livingArea) : 0;
                        break;

                    case 'NOTLIVE_HOUSE':
                        reportParams.houseArea.notLiving.totalArea += !isNaN(parseInt(house.totalArea)) ? parseInt(house.totalArea) : 0;
                        reportParams.houseArea.notLiving.livingArea += !isNaN(parseInt(house.livingArea)) ? parseInt(house.livingArea) : 0;
                        break;
                }
            });
        });
        reportParams.houseArea.sum.totalArea = reportParams.houseArea.livingHouse.totalArea + reportParams.houseArea.hostel.totalArea + reportParams.houseArea.notLiving.totalArea;
        reportParams.houseArea.sum.livingArea = reportParams.houseArea.livingHouse.livingArea + reportParams.houseArea.hostel.livingArea + reportParams.houseArea.notLiving.livingArea;

        //II. Наявність квартир на 1 січня ${year} року

        let dsLivingRoom = UB.DataStore('pgo_livingRoomInfo');
        dsLivingRoom.runSQL("select coalesce(SUM(A1.livingRoomCount),0) as roomsum, COUNT(A1.livingRoomCount) as roomcount, coalesce(SUM(A1.totalArea),0) as sumtotalarea, coalesce(SUM(A1.livingArea),0) as sumlivingarea, 1 as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.livingRoomCount=1 AND A1.roomType='FLAT' AND A1.year=:year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO' " +
            " UNION select coalesce(SUM(A1.livingRoomCount),0) as roomsum, COUNT(A1.livingRoomCount) as roomcount, coalesce(SUM(A1.totalArea),0) as sumtotalarea, coalesce(SUM(A1.livingArea),0) as sumlivingarea, 2 as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID  where A1.livingRoomCount=2 AND A1.roomType='FLAT' AND A1.year=:year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO' " +
            " UNION select coalesce(SUM(A1.livingRoomCount),0) as roomsum, COUNT(A1.livingRoomCount) as roomcount, coalesce(SUM(A1.totalArea),0) as sumtotalarea, coalesce(SUM(A1.livingArea),0) as sumlivingarea, 3 as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID  where A1.livingRoomCount=3 AND A1.roomType='FLAT' AND A1.year=:year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO' " +
            " UNION select coalesce(SUM(A1.livingRoomCount),0) as roomsum, COUNT(A1.livingRoomCount) as roomcount, coalesce(SUM(A1.totalArea),0) as sumtotalarea, coalesce(SUM(A1.livingArea),0) as sumlivingarea, 4 as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID  where A1.livingRoomCount=4 AND A1.roomType='FLAT' AND A1.year=:year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO' " +
            " UNION select coalesce(SUM(A1.livingRoomCount),0) as roomsum, COUNT(A1.livingRoomCount) as roomcount, coalesce(SUM(A1.totalArea),0) as sumtotalarea, coalesce(SUM(A1.livingArea),0) as sumlivingarea, 5 as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID  where A1.livingRoomCount=5 AND A1.roomType='FLAT' AND A1.year=:year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO' " +
            " UNION select coalesce(SUM(A1.livingRoomCount),0) as roomsum, COUNT(A1.livingRoomCount) as roomcount, coalesce(SUM(A1.totalArea),0) as sumtotalarea, coalesce(SUM(A1.livingArea),0) as sumlivingarea, 6 as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID  where A1.livingRoomCount=6 AND A1.roomType='FLAT' AND A1.year=:year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO' " +
            " UNION select coalesce(SUM(A1.livingRoomCount),0) as roomsum, COUNT(A1.livingRoomCount) as roomcount, coalesce(SUM(A1.totalArea),0) as sumtotalarea, coalesce(SUM(A1.livingArea),0) as sumlivingarea, 7 as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID  where A1.livingRoomCount=7 AND A1.roomType='FLAT' AND A1.year=:year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO' " +
            " UNION select coalesce(SUM(A1.livingRoomCount),0) as roomsum, COUNT(A1.livingRoomCount) as roomcount, coalesce(SUM(A1.totalArea),0) as sumtotalarea, coalesce(SUM(A1.livingArea),0) as sumlivingarea, 8 as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID  where A1.livingRoomCount>7 AND A1.roomType='FLAT' AND A1.year=:year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO' ", {year: params.year, locality: params.locality});

        let countRoom = JSON.parse(dsLivingRoom.asJSONObject);
        reportParams.rooms = {
            total: {count: 0, totalArea: 0, livingArea: 0},
            one: {count: 0, totalArea: 0, livingArea: 0},
            two: {count: 0, totalArea: 0, livingArea: 0},
            three: {count: 0, totalArea: 0, livingArea: 0},
            four: {count: 0, totalArea: 0, livingArea: 0},
            five: {count: 0, totalArea: 0, livingArea: 0},
            six: {count: 0, totalArea: 0, livingArea: 0},
            seven: {count: 0, totalArea: 0, livingArea: 0},
            eight: {count: 0, totalArea: 0, livingArea: 0}
        };
        _.forEach(countRoom, function (room) {
            reportParams.rooms.total.count += room.roomcount;
            reportParams.rooms.total.totalArea += room.sumtotalarea;
            reportParams.rooms.total.livingArea += room.sumlivingarea;

            switch (parseInt(room.type)) {
                case 1:
                    reportParams.rooms.one.count += room.roomcount;
                    reportParams.rooms.one.totalArea += room.sumtotalarea;
                    reportParams.rooms.one.livingArea += room.sumlivingarea;
                    break;
                case 2:
                    reportParams.rooms.two.count += room.roomcount;
                    reportParams.rooms.two.totalArea += room.sumtotalarea;
                    reportParams.rooms.two.livingArea += room.sumlivingarea;
                    break;
                case 3:
                    reportParams.rooms.three.count += room.roomcount;
                    reportParams.rooms.three.totalArea += room.sumtotalarea;
                    reportParams.rooms.three.livingArea += room.sumlivingarea;
                    break;
                case 4:
                    reportParams.rooms.four.count += room.roomcount;
                    reportParams.rooms.four.totalArea += room.sumtotalarea;
                    reportParams.rooms.four.livingArea += room.sumlivingarea;
                    break;
                case 5:
                    reportParams.rooms.five.count += room.roomcount;
                    reportParams.rooms.five.totalArea += room.sumtotalarea;
                    reportParams.rooms.five.livingArea += room.sumlivingarea;
                    break;
                case 6:
                    reportParams.rooms.six.count += room.roomcount;
                    reportParams.rooms.six.totalArea += room.sumtotalarea;
                    reportParams.rooms.six.livingArea += room.sumlivingarea;
                    break;
                case 7:
                    reportParams.rooms.seven.count += room.roomcount;
                    reportParams.rooms.seven.totalArea += room.sumtotalarea;
                    reportParams.rooms.seven.livingArea += room.sumlivingarea;
                    break;
                case 8:
                    reportParams.rooms.eight.count += room.roomcount;
                    reportParams.rooms.eight.totalArea += room.sumtotalarea;
                    reportParams.rooms.eight.livingArea += room.sumlivingarea;
                    break;
            }
        });
        //III. Обладнання житлового фонду на 1 січня ${year} року

        dsLivingRoom.runSQL("select coalesce(SUM(A1.aqueduct),0) as count, coalesce(SUM(A1.totalArea),0) as totalArea, (select coalesce(SUM(A1.totalArea),0) from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.aqueduct=1 and A1.year=:year: and A1.roomType='HOSTEL' AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO') as hostelArea, (select coalesce(SUM(A1.totalArea),0) from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where aqueduct=1 and A1.year=:year: and A1.roomType='NOTLIVE_HOUSE' AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO') as notLivingArea,'3000' as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.aqueduct=1 and A1.year=:year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO'" +
            " union select coalesce(SUM(A1.hotWater),0) as count, coalesce(SUM(A1.totalArea),0) as totalArea, (select coalesce(SUM(A1.totalArea),0) from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.hotWater=1 and A1.year=:year: and A1.roomType='HOSTEL' AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO') as hostelArea, (select coalesce(SUM(A1.totalArea),0) from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where hotWater=1 and A1.year=:year: and A1.roomType='NOTLIVE_HOUSE' AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO') as notLivingArea, '3100' as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.hotWater=1 and A1.year=:year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO'" +
            " union select coalesce(SUM(A1.sewerage),0) as count, coalesce(SUM(A1.totalArea),0) as totalArea, (select coalesce(SUM(A1.totalArea),0) from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.sewerage=1 and A1.year=:year: and A1.roomType='HOSTEL' AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO') as hostelArea, (select coalesce(SUM(A1.totalArea),0) from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where sewerage=1 and A1.year=:year: and A1.roomType='NOTLIVE_HOUSE' AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO') as notLivingArea, '3200' as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.sewerage=1 and A1.year=:year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO'" +
            " union select coalesce(COUNT(A1.heating),0) as count, coalesce(SUM(A1.totalArea),0) as totalArea, (select coalesce(SUM(A1.totalArea),0) from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.heating='INDIVID' and A1.year=:year: and A1.roomType='HOSTEL' AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO') as hostelArea, (select coalesce(SUM(A1.totalArea),0) from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where heating='INDIVID' and A1.year=:year: and A1.roomType='NOTLIVE_HOUSE' AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO') as notLivingArea, '3300' as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.heating='INDIVID' and A1.year=:year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO'" +
            " union select coalesce(COUNT(A1.heating),0) as count, coalesce(SUM(A1.totalArea),0) as totalArea, (select coalesce(SUM(A1.totalArea),0) from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.heating='CENTRAL' and A1.year=:year: and A1.roomType='HOSTEL' AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO') as hostelArea, (select coalesce(SUM(A1.totalArea),0) from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where heating='CENTRAL' and A1.year=:year: and A1.roomType='NOTLIVE_HOUSE' AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO') as notLivingArea, '3400' as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.heating='CENTRAL' and A1.year=:year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO'" +
            " union select coalesce(COUNT(A1.heating),0) as count, coalesce(SUM(A1.totalArea),0) as totalArea, (select coalesce(SUM(A1.totalArea),0) from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.heating='OVEN' and A1.year=:year: and A1.roomType='HOSTEL' AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO') as hostelArea, (select coalesce(SUM(A1.totalArea),0) from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where heating='OVEN' and A1.year=:year: and A1.roomType='NOTLIVE_HOUSE' AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO') as notLivingArea, '3500' as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.heating='OVEN' and A1.year=:year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO'" +
            " union select coalesce(SUM(A1.naturalGas),0) as count, coalesce(SUM(A1.totalArea),0) as totalArea, (select coalesce(SUM(A1.totalArea),0) from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.naturalGas=1 and A1.year=:year: and A1.roomType='HOSTEL' AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO') as hostelArea, (select coalesce(SUM(A1.totalArea),0) from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where naturalGas=1 and A1.year=:year: and A1.roomType='NOTLIVE_HOUSE' AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO') as notLivingArea, '3600' as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.naturalGas=1 and A1.year=:year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO'" +
            " union select coalesce(SUM(A1.liquefiedGas),0) as count, coalesce(SUM(A1.totalArea),0) as totalArea, (select coalesce(SUM(A1.totalArea),0) from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.liquefiedGas=1 and A1.year=:year: and A1.roomType='HOSTEL' AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO') as hostelArea, (select coalesce(SUM(A1.totalArea),0) from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where liquefiedGas=1 and A1.year=:year: and A1.roomType='NOTLIVE_HOUSE' AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO') as notLivingArea, '3700' as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.liquefiedGas=1 and A1.year=:year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO'", {year: params.year, locality: params.locality});

        let roomTools = JSON.parse(dsLivingRoom.asJSONObject);

        reportParams.roomTools = {
            aqueduct: {count: 0, totalArea: 0, hostelArea: 0, notLivingArea: 0},
            hotWater: {count: 0, totalArea: 0, hostelArea: 0, notLivingArea: 0},
            sewerage: {count: 0, totalArea: 0, hostelArea: 0, notLivingArea: 0},
            indHeating: {count: 0, totalArea: 0, hostelArea: 0, notLivingArea: 0},
            centrHeating: {count: 0, totalArea: 0, hostelArea: 0, notLivingArea: 0},
            ovenHeating: {count: 0, totalArea: 0, hostelArea: 0, notLivingArea: 0},
            naturalGas: {count: 0, totalArea: 0, hostelArea: 0, notLivingArea: 0},
            liquefiedGas: {count: 0, totalArea: 0, hostelArea: 0, notLivingArea: 0}
        };

        _.forEach(roomTools, function (room) {
            switch (parseInt(room.type)) {
                case 3000:
                    reportParams.roomTools.aqueduct.count += room.count;
                    reportParams.roomTools.aqueduct.totalArea += room.totalarea;
                    reportParams.roomTools.aqueduct.hostelArea += room.hostelarea;
                    reportParams.roomTools.aqueduct.notLivingArea += room.notlivingarea;
                    break;
                case 3100:
                    reportParams.roomTools.hotWater.count += room.count;
                    reportParams.roomTools.hotWater.totalArea += room.totalarea;
                    reportParams.roomTools.hotWater.hostelArea += room.hostelarea;
                    reportParams.roomTools.hotWater.notLivingArea += room.notlivingarea;
                    break;
                case 3200:
                    reportParams.roomTools.sewerage.count += room.count;
                    reportParams.roomTools.sewerage.totalArea += room.totalarea;
                    reportParams.roomTools.sewerage.hostelArea += room.hostelarea;
                    reportParams.roomTools.sewerage.notLivingArea += room.notlivingarea;
                    break;
                case 3300:
                    reportParams.roomTools.centrHeating.count += room.count;
                    reportParams.roomTools.centrHeating.totalArea += room.totalarea;
                    reportParams.roomTools.centrHeating.hostelArea += room.hostelarea;
                    reportParams.roomTools.centrHeating.notLivingArea += room.notlivingarea;
                    break;
                case 3400:
                    reportParams.roomTools.indHeating.count += room.count;
                    reportParams.roomTools.indHeating.totalArea += room.totalarea;
                    reportParams.roomTools.indHeating.hostelArea += room.hostelarea;
                    reportParams.roomTools.indHeating.notLivingArea += room.notlivingarea;
                    break;
                case 3500:
                    reportParams.roomTools.ovenHeating.count += room.count;
                    reportParams.roomTools.ovenHeating.totalArea += room.totalarea;
                    reportParams.roomTools.ovenHeating.hostelArea += room.hostelarea;
                    reportParams.roomTools.ovenHeating.notLivingArea += room.notlivingarea;
                    break;
                case 3600:
                    reportParams.roomTools.naturalGas.count += room.count;
                    reportParams.roomTools.naturalGas.totalArea += room.totalarea;
                    reportParams.roomTools.naturalGas.hostelArea += room.hostelarea;
                    reportParams.roomTools.naturalGas.notLivingArea += room.notlivingarea;
                    break;
                case 3700:
                    reportParams.roomTools.liquefiedGas.count += room.count;
                    reportParams.roomTools.liquefiedGas.totalArea += room.totalarea;
                    reportParams.roomTools.liquefiedGas.hostelArea += room.hostelarea;
                    reportParams.roomTools.liquefiedGas.notLivingArea += room.notlivingarea;
                    break;
            }
        });

        //V. Ветхі та аварійні житлові будинки на 1 січня ${year} року
        dsLivingRoom.runSQL(`SELECT
  coalesce(COUNT(A1.oldFund), 0)                                                                               AS count,
  coalesce(sum(A1.totalArea),
         0)                                                                                                  AS totalarea,
  coalesce((SELECT COUNT(A2.ID)
   FROM pgo_arriveDepartInform A2
     JOIN pgo_householdMember A3 ON A3.ID = A2.houseMemberID
   WHERE ((A2.regDate IS NOT NULL AND A2.departureDate IS NULL AND A2.fullDeparture = 0) OR
          (A2.returnDate IS NOT NULL AND A2.fullDeparture = 0)) AND A3.objAccountingID =
                                                                    A1.objAccountingID), 0)                      AS personcount,
  'oldFund'                                                                                                  AS type
FROM pgo_livingRoomInfo A1 INNER JOIN pgo_objaccounting A02 on A02.ID=A1.objaccountingid
WHERE A1.oldFund = 1 AND A1.year= :year: AND A02.locationID = :locality: AND A02.objState = 'OBJ_INPGO'
  GROUP BY A1.objaccountingid
UNION SELECT
        coalesce(COUNT(A1.emergencyFund), 0)                                                                         AS count,
        coalesce(sum(A1.totalArea),
               0)                                                                                                  AS totalarea,
        coalesce((SELECT COUNT(A2.ID)
         FROM pgo_arriveDepartInform A2
           JOIN pgo_householdMember A3 ON A3.ID = A2.houseMemberID
         WHERE ((A2.regDate IS NOT NULL AND A2.departureDate IS NULL AND A2.fullDeparture = 0) OR
                (A2.returnDate IS NOT NULL AND A2.fullDeparture = 0)) AND A3.objAccountingID =
                                                                          A1.objAccountingID), 0)                     AS personcount,
        'emergencyFund'                                                                                            AS type
      FROM pgo_livingRoomInfo A1 INNER JOIN pgo_objaccounting A02 on A02.ID=A1.objaccountingid
      WHERE A1.emergencyFund = 1 AND A1.year= :year: AND A02.locationID = :locality: AND A02.objState = 'OBJ_INPGO'
GROUP BY A1.objaccountingid`, {year: params.year, locality: params.locality});

        let oldEmergencyFund = JSON.parse(dsLivingRoom.asJSONObject);

        reportParams.oldEmergRoom = {
            oldFund: {count: 0, totalArea: 0, personCount: 0},
            emergencyFund: {count: 0, totalArea: 0, personCount: 0}
        };

        _.forEach(oldEmergencyFund, function (room) {
            switch (room.type) {
                case 'oldFund':
                    reportParams.oldEmergRoom.oldFund.count += room.count || 0;
                    reportParams.oldEmergRoom.oldFund.totalArea += room.totalarea || 0;
                    reportParams.oldEmergRoom.oldFund.personCount += room.personcount || 0;
                    break;
                case 'emergencyFund':
                    reportParams.oldEmergRoom.emergencyFund.count += room.count || 0;
                    reportParams.oldEmergRoom.emergencyFund.totalArea += room.totalarea || 0;
                    reportParams.oldEmergRoom.emergencyFund.personCount += room.personcount || 0;
                    break;
            }
        });


        //VІ. Кількість житлових будинків на 1 січня ${year} року
        dsLivingRoom.runSQL("select coalesce(COUNT(A1.ID),0) as count, '3' as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.floorCount<4 and A1.year = :year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO'" +
            " union select coalesce(COUNT(A1.ID),0) as count, '4-9' as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.floorCount>=4 and A1.floorCount<10 and A1.year = :year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO'" +
            " union select coalesce(COUNT(A1.ID),0) as count, '10-16' as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.floorCount>=10 and A1.floorCount<17 and A1.year = :year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO'" +
            " union select coalesce(COUNT(A1.ID),0) as count, '16' as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.floorCount>=16 and A1.year = :year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO'" +
            " union select coalesce(COUNT(A1.ID),0) as count, 'hostel' as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.roomType='HOSTEL' and A1.year = :year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO'" +
            " union select coalesce(COUNT(A1.ID),0) as count, 'individ' as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.roomType='INDIVID_HOUSE' and A1.year = :year: AND A2.locationID = :locality: AND A2.objState = 'OBJ_INPGO'" +
            " union select coalesce(COUNT(A1.ID),0) as count, 'notLive' as type from pgo_livingRoomInfo A1 INNER JOIN pgo_objAccounting A2 on A2.ID=A1.objAccountingID where A1.year = :year: AND A2.locationID != :locality: AND A2.objState != 'OBJ_INPGO'", {year: params.year, locality: params.locality});

        let floorCount = JSON.parse(dsLivingRoom.asJSONObject);

        reportParams.floorCount = {
            total: 0,
            three: 0,
            fourNine: 0,
            tenSixteen: 0,
            sixteen: 0,
            hostel: 0,
            individ: 0,
            notLive: 0
        };

        _.forEach(floorCount, function (room) {
            switch (room.type) {
                case '3':
                    reportParams.floorCount.total += room.count;
                    reportParams.floorCount.three += room.count;
                    break;
                case '4-9':
                    reportParams.floorCount.total += room.count;
                    reportParams.floorCount.fourNine += room.count;
                    break;
                case '10-16':
                    reportParams.floorCount.total += room.count;
                    reportParams.floorCount.tenSixteen += room.count;
                    break;
                case '16':
                    reportParams.floorCount.total += room.count;
                    reportParams.floorCount.sixteen += room.count;
                    break;
                case 'hostel':
                    reportParams.floorCount.hostel += room.count;
                    break;
                case 'individ':
                    reportParams.floorCount.individ += room.count;
                    break;
                case 'notLive':
                    reportParams.floorCount.notLive += room.count;
                    break;
            }
        });
    }


    let dsReport = UB.DataStore('pgo_report'),
        reportID = dsReport.generateID();
    dsReport.run('insert', {
        execParams: {
            ID: reportID,
            repType: 'JYTLO',
            reportData: JSON.stringify(reportParams),
            dateRep: new Date(),
            year: params.year,
            locationID: params.locality

        }
    });
    ctx.mParams.reportID = reportID;
};


me.saveDataSchool = function (ctx) {
    var params = ctx.mParams;
    var pgo_settlementDict = UB.Repository("pgo_settlementDict")
        .attrs(["*", 'pgoDictID.localGovernment'])
        .where("[ID]", '=', params.locality)
        .selectAsObject()[0];
    var pgo_householdMember = JSON.parse(UB.Repository("pgo_householdMember")
        .attrs(["objAccountingID.pgoObjNum", 'payerID.birthDate', 'payerID.fullName', 'payerID.areaAddR', 'payerID.regionAddR', 'payerID.settlementAddR.governmentShortName', 'payerID.streetTypeAddR.name', 'payerID.streetAddR.street', 'payerID.houseNumAddR', 'payerID.flatNumAddR'])
        .where("[objAccountingID.locationID]", '=', params.locality)
        .where("[payerID.birthDate]", '>=', new Date(params.year - 16, 8, 1))
        .where("[payerID.birthDate]", '<', new Date(params.year - 6, 8, 1))
        .select().asJSONObject.replace(/payerID\./g, '').replace(/objAccountingID\./g, ''));
    _.forEach(pgo_householdMember, function (obj) {
        obj.birthDate = (new Date(obj.birthDate)).toLocaleDateString();
        obj.addressFull = _.compact([((obj['areaAddR'] && obj['areaAddR'] + ' обл.') || ''), obj['regionAddR'], obj['settlementAddR.governmentShortName']]).join(', ');
        obj.street = obj['streetTypeAddR.name'] && obj['streetAddR.street'] ? `${obj['streetTypeAddR.name']} ${obj['streetAddR.street']}` : obj['streetAddR.street'];
        obj.addressFull = _.compact([obj.addressFull, obj.street, obj['houseNumAddR'], obj['flatNumAddR']]).join(', ')
    });
    function upFirst(text) {
        return _.upperFirst(_.lowerCase(text));
    }

    var result = JSON.stringify({
        name: upFirst(pgo_settlementDict['pgoDictID.localGovernment']),
        table: pgo_householdMember
    });
    var dsReport = UB.DataStore('pgo_report');
    var reportID = dsReport.generateID()
    dsReport.run('insert', {
        execParams: {
            ID: reportID,
            repType: params.repType,
            year: params.year,
            locationID: params.locality,
            dateRep: new Date(),
            reportData: result
        }
    });
    ctx.mParams.reportID = reportID;
};
me.entity.addMethod("saveDataSchool");
me.entity.addMethod("saveDataSilrada");
me.entity.addMethod("saveDataJytlo");
me.entity.addMethod("generatePGOBook");
me.entity.addMethod("generateExcel");
