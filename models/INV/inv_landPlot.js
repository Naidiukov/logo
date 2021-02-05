
const me = inv_landPlot;
const XlsxTemplate = require('xlsx-template');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const UB = require('@unitybase/ub');
// const App = UB.App;
const Session = UB.Session;

me.beforeinsert = function (ctx) {
    var params = ctx.mParams.execParams,
        dsObjLog = UB.DataStore('inv_objLog'),
        ownerFullName = params.owner ? UB.Repository('inv_payers')
                .attrs(['fullName'])
                .where('[ID]', '=', params.owner)
                .selectAsObject()[0].fullName : '';

    dsObjLog.run('insert', {
        execParams: {
            ID: dsObjLog.generateID(),
            changeDate: new Date(),
            actionType: 'INSERT',
            oType: 'Земельна ділянка',
            landCategory: params.landCategory,
            landPurpose: params.landPurpose,
            cadastralNumber: params.cadastralNumber,
            totalArea: params.totalArea,
            address: params.position,
            documentOwnership: params.documentOwnership,
            registryData: params.registryData,
            owner: ownerFullName,
            location: params.location,
            useType: params.useType,
            terminationDate: params.terminationDate,
            employeeID: Session.userID
        }
    });
};

me.afterinsert = function (ctx) {

};

me.afterupdate = function (ctx) {
    var params = ctx.mParams.execParams,
        dsObjLog = UB.DataStore('inv_objLog'),
        ownerFullName = params.owner ? UB.Repository('inv_payers')
                .attrs(['fullName'])
                .where('[ID]', '=', params.owner)
                .selectAsObject()[0].fullName : '';

    dsObjLog.run('insert', {
        execParams: {
            ID: dsObjLog.generateID(),
            changeDate: new Date(),
            actionType: 'EDIT',
            oType: 'Земельна ділянка',
            landCategory: params.landCategory != undefined ? params.landCategory : null,
            landPurpose: params.landPurpose != undefined ? params.landPurpose : null,
            cadastralNumber: params.cadastralNumber != undefined ? params.cadastralNumber : null,
            totalArea: params.totalArea != undefined ? params.totalArea : null,
            address: params.address != undefined ? params.address : null,
            documentOwnership: params.documentOwnership != undefined ? params.documentOwnership : null,
            registryData: params.registryData != undefined ? params.registryData : null,
            owner: ownerFullName != undefined ? ownerFullName : null,
            location: params.location != undefined ? params.location : null,
            useType: params.useType != undefined ? params.useType : null,
            terminationDate: params.terminationDate != undefined ? params.terminationDate : null,
            employeeID: Session.userID
        }
    });

    if(!params.dontUpdate) {
        let dsPgoLandPlot = UB.DataStore('pgo_landPlot'),
            updateArrNull = ['cadastralNumber', 'landPurpose', 'notes', 'useType', 'position'],
            updateArrNotNull = ['documentOwnership', 'landCategory', 'location', 'registryData', 'totalArea'],
            paramsToUpdate = {dontUpdate: true},
            currDate = new Date(),
            invLandPlot = UB.Repository('inv_landPlot')
                .attrs(['cadastralNumber', 'documentOwnership', 'landCategory', 'landPurpose', 'location', 'notes', 'registryData', 'totalArea', 'useType', 'position'])
                .where('[ID]', '=', params.ID)
                .selectAsObject()[0],
            pgoLandPlot = UB.Repository('pgo_landPlot')
                .attrs(['ID'])
                .where('landPlotID', '=', params.ID)
                .where('year', '=', currDate.getFullYear())
                .selectAsObject();
        for (let i = 0; i < updateArrNull.length; i++) {
            paramsToUpdate[updateArrNull[i]] = invLandPlot[updateArrNull[i]] ? invLandPlot[updateArrNull[i]] : null;
        }
        for (let i = 0; i < updateArrNotNull.length; i++) {
            paramsToUpdate[updateArrNotNull[i]] = invLandPlot[updateArrNotNull[i]];
        }
        _.forEach(pgoLandPlot, function (item) {
            paramsToUpdate.ID = item.ID;
            dsPgoLandPlot.run('update', {
                __skipSelectAfterUpdate: true,
                __skipOptimisticLock: true,
                execParams: paramsToUpdate
            })
        })
    }
};
me.afterdelete = function (ctx) {

};

// needed for history to work correctly
me.beforeupdate = function (ctx) {

};
me.beforedelete = function (ctx) {
    var params = ctx.mParams.execParams,
        dsObjLog = UB.DataStore('inv_objLog');

    let landPlot = UB.Repository("inv_landPlot")
        .attrs(["landCategory", "landPurpose", "cadastralNumber", "totalArea", "documentOwnership", "registryData", "owner.fullName", "location", "useType", "terminationDate"])
        .where("[ID]", '=', params.ID)
        .selectAsObject()[0];
    dsObjLog.run('insert', {
        execParams: {
            ID: dsObjLog.generateID(),
            changeDate: new Date(),
            actionType: 'DELETE',
            oType: 'Земельна ділянка',
            landCategory: landPlot.landCategory,
            landPurpose: landPlot.landPurpose,
            cadastralNumber: landPlot.cadastralNumber,
            totalArea: landPlot.totalArea,
            documentOwnership: landPlot.documentOwnership,
            registryData: landPlot.registryData,
            owner: landPlot['owner.fullName'],
            location: landPlot.location,
            useType: landPlot.useType,
            terminationDate: landPlot.terminationDate,
            employeeID: Session.userID
        }
    });
};

me.afterbeforeupdate = function (ctx) {

};

me.afterbeforedelete = function (ctx) {

};

me.getObjAttNewID = function (ctx) {
    var notifAttachDS = UB.DataStore("inv_objAttachment");
    ctx.mParams.attachID = notifAttachDS.generateID();
};

me.getContrAttNewID = function (ctx) {
    var notifAttachDS = UB.DataStore("inv_contractAttachment");
    ctx.mParams.attachID = notifAttachDS.generateID();
};

me.getExcelData = function (ctx) {
    var params = ctx.mParams.execParams,
        sum = {
            total: {planSum: 0, factSum: 0, debtSum: 0},
            land: {
                planSum: {total: 0, phys: 0, leg: 0},
                factSum: {total: 0, phys: 0, leg: 0},
                debtSum: {total: 0, phys: 0, leg: 0}
            },
            realty: {
                planSum: {total: 0, phys: 0, leg: 0},
                factSum: {total: 0, phys: 0, leg: 0},
                debtSum: {total: 0, phys: 0, leg: 0}
            },
            rentLand: {
                planSum: {total: 0, phys: 0, leg: 0},
                factSum: {total: 0, phys: 0, leg: 0},
                debtSum: {total: 0, phys: 0, leg: 0}
            },
            rentRealty: {
                planSum: {total: 0, phys: 0, leg: 0},
                factSum: {total: 0, phys: 0, leg: 0},
                debtSum: {total: 0, phys: 0, leg: 0}
            }
        },
        landData,
        realtyData,
        landDataPersonType,
        realtyDataPersonType;
    var dataTaxes = UB.Repository("inv_taxes")
        .attrs(["sumYear", "actualSum", "debt", "objectID", "objectID.oType", "objectID.owner.personType", "objectID.owner.fullName"])
        .where("[reportYear]", '=', params.year)
        .where("[objectID.koattNum]", '=', params.koattNum)
        .selectAsObject();
debugger
    landData = _.filter(dataTaxes, function (item) {
        return item['objectID.oType'] == 'landPlot';
    });
    realtyData = _.filter(dataTaxes, function (item) {
        return item['objectID.oType'] == 'realtyObject';
    });
    landDataPersonType = _.groupBy(landData, 'objectID.owner.personType');
    realtyDataPersonType = _.groupBy(realtyData, 'objectID.owner.personType');

    _.forEach(landDataPersonType['PHYSICAL'], function (item) {
        sum.total.planSum += item.sumYear ? item.sumYear : 0;
        sum.total.factSum += item.actualSum ? item.actualSum : 0;
        sum.total.debtSum += item.debt ? item.debt : 0;


        sum.land.planSum.total += item.sumYear ? item.sumYear : 0;
        sum.land.planSum.phys += item.sumYear ? item.sumYear : 0;

        sum.land.factSum.total += item.actualSum ? item.actualSum : 0;
        sum.land.factSum.phys += item.actualSum ? item.actualSum : 0;

        sum.land.debtSum.total += item.debt ? item.debt : 0;
        sum.land.debtSum.phys += item.debt ? item.debt : 0;
    });

    _.forEach(landDataPersonType['LEGAL'], function (item) {
        sum.total.planSum += item.sumYear ? item.sumYear : 0;
        sum.total.factSum += item.actualSum ? item.actualSum : 0;
        sum.total.debtSum += item.debt ? item.debt : 0;


        sum.land.planSum.total += item.sumYear ? item.sumYear : 0;
        sum.land.planSum.leg += item.sumYear ? item.sumYear : 0;

        sum.land.factSum.total += item.actualSum ? item.actualSum : 0;
        sum.land.factSum.leg += item.actualSum ? item.actualSum : 0;

        sum.land.debtSum.total += item.debt ? item.debt : 0;
        sum.land.debtSum.leg += item.debt ? item.debt : 0;
    });

    _.forEach(realtyDataPersonType['PHYSICAL'], function (item) {
        sum.total.planSum += item.sumYear ? item.sumYear : 0;
        sum.total.factSum += item.actualSum ? item.actualSum : 0;
        sum.total.debtSum += item.debt ? item.debt : 0;


        sum.realty.planSum.total += item.sumYear ? item.sumYear : 0;
        sum.realty.planSum.phys += item.sumYear ? item.sumYear : 0;

        sum.realty.factSum.total += item.actualSum ? item.actualSum : 0;
        sum.realty.factSum.phys += item.actualSum ? item.actualSum : 0;

        sum.realty.debtSum.total += item.debt ? item.debt : 0;
        sum.realty.debtSum.phys += item.debt ? item.debt : 0;
    });

    _.forEach(realtyDataPersonType['LEGAL'], function (item) {
        sum.total.planSum += item.sumYear ? item.sumYear : 0;
        sum.total.factSum += item.actualSum ? item.actualSum : 0;
        sum.total.debtSum += item.debt ? item.debt : 0;


        sum.realty.planSum.total += item.sumYear ? item.sumYear : 0;
        sum.realty.planSum.leg += item.sumYear ? item.sumYear : 0;

        sum.realty.factSum.total += item.actualSum ? item.actualSum : 0;
        sum.realty.factSum.leg += item.actualSum ? item.actualSum : 0;

        sum.realty.debtSum.total += item.debt ? item.debt : 0;
        sum.realty.debtSum.leg += item.debt ? item.debt : 0;
    });

    var dataContractObjs = UB.Repository("inv_agreementObjs")
        .attrs(["agreementID", "agreementID.renter.personType", "objectID.oType"])
        //.where("[year]", '=', params.year)
        .where("[objectID.koattNum]", '=', params.koattNum)
        .selectAsObject();

    var agreementIDs = _.map(dataContractObjs, 'agreementID'),
        agreementKeyBy = _.keyBy(dataContractObjs, 'agreementID');

    var dataContract = UB.Repository("inv_rentPayment")
            .attrs(["agreementID", "sumYear", "actualSum", "debt"])
            .where("[year]", '=', params.year)
            .where("[agreementID]", 'in', agreementIDs)
            .selectAsObject(),

        rentPaymentGroupBy = _.groupBy(dataContract, 'agreementID');

    _.forEach(agreementKeyBy, function (contract, i) {
        contract.rentPayments = rentPaymentGroupBy[i];
        if (rentPaymentGroupBy[i]) {
            if (contract['objectID.oType'] && contract['objectID.oType'] == 'landPlot') {
                if (contract['agreementID.renter.personType'] && contract['agreementID.renter.personType'] == 'PHYSICAL') {
                    _.forEach(contract.rentPayments, function (item) {
                        sum.total.planSum += item.sumYear ? item.sumYear : 0;
                        sum.total.factSum += item.actualSum ? item.actualSum : 0;
                        sum.total.debtSum += item.debt ? item.debt : 0;


                        sum.rentLand.planSum.total += item.sumYear ? item.sumYear : 0;
                        sum.rentLand.planSum.phys += item.sumYear ? item.sumYear : 0;

                        sum.rentLand.factSum.total += item.actualSum ? item.actualSum : 0;
                        sum.rentLand.factSum.phys += item.actualSum ? item.actualSum : 0;

                        sum.rentLand.debtSum.total += item.debt ? item.debt : 0;
                        sum.rentLand.debtSum.phys += item.debt ? item.debt : 0;
                    })
                }
                else if (contract['agreementID.renter.personType'] && contract['agreementID.renter.personType'] == 'LEGAL') {
                    _.forEach(contract.rentPayments, function (item) {
                        sum.total.planSum += item.sumYear ? item.sumYear : 0;
                        sum.total.factSum += item.actualSum ? item.actualSum : 0;
                        sum.total.debtSum += item.debt ? item.debt : 0;


                        sum.rentLand.planSum.total += item.sumYear ? item.sumYear : 0;
                        sum.rentLand.planSum.leg += item.sumYear ? item.sumYear : 0;

                        sum.rentLand.factSum.total += item.actualSum ? item.actualSum : 0;
                        sum.rentLand.factSum.leg += item.actualSum ? item.actualSum : 0;

                        sum.rentLand.debtSum.total += item.debt ? item.debt : 0;
                        sum.rentLand.debtSum.leg += item.debt ? item.debt : 0;
                    })
                }
            }
            else if (contract['objectID.oType'] && contract['objectID.oType'] == 'realtyObject') {
                if (contract['agreementID.renter.personType'] && contract['agreementID.renter.personType'] == 'PHYSICAL') {
                    _.forEach(contract.rentPayments, function (item) {
                        sum.total.planSum += item.sumYear ? item.sumYear : 0;
                        sum.total.factSum += item.actualSum ? item.actualSum : 0;
                        sum.total.debtSum += item.debt ? item.debt : 0;


                        sum.rentRealty.planSum.total += item.sumYear ? item.sumYear : 0;
                        sum.rentRealty.planSum.phys += item.sumYear ? item.sumYear : 0;

                        sum.rentRealty.factSum.total += item.actualSum ? item.actualSum : 0;
                        sum.rentRealty.factSum.phys += item.actualSum ? item.actualSum : 0;

                        sum.rentRealty.debtSum.total += item.debt ? item.debt : 0;
                        sum.rentRealty.debtSum.phys += item.debt ? item.debt : 0;
                    })
                }
                else if (contract['agreementID.renter.personType'] && contract['agreementID.renter.personType'] == 'LEGAL') {
                    _.forEach(contract.rentPayments, function (item) {
                        sum.total.planSum += item.sumYear ? item.sumYear : 0;
                        sum.total.factSum += item.actualSum ? item.actualSum : 0;
                        sum.total.debtSum += item.debt ? item.debt : 0;


                        sum.rentRealty.planSum.total += item.sumYear ? item.sumYear : 0;
                        sum.rentRealty.planSum.leg += item.sumYear ? item.sumYear : 0;

                        sum.rentRealty.factSum.total += item.actualSum ? item.actualSum : 0;
                        sum.rentRealty.factSum.leg += item.actualSum ? item.actualSum : 0;

                        sum.rentRealty.debtSum.total += item.debt ? item.debt : 0;
                        sum.rentRealty.debtSum.leg += item.debt ? item.debt : 0;
                    })
                }
            }
        }
    });

    ctx.mParams.resData = JSON.stringify(sum);
};

me.importPeopleData = function (ctx) {
    Session.runAsAdmin(function () {
        var dsUser = UB.DataStore('uba_user');

        var dsPayer = UB.DataStore('inv_payers'),
          colTownValue = '',
          colStrValue,
          addrFormaat = [],
          fullName = [],
          fullPassport;
        const ukraineID = UB.Repository('inv_countryDict').attrs('ID').where('code', '=', '01').selectScalar()
        const regUnitPassportArr = UB.Repository('inv_regUnit').attrs('ID', 'name').where('type', '=', 'PASSPORT').selectAsObject()
        const regUnitPassportObj = {}
        regUnitPassportArr.forEach(item => {
            regUnitPassportObj[item.name] = item.ID
        })

        const regUnitCertifArr = UB.Repository('inv_regUnit').attrs('ID', 'name').where('type', '=', 'CERTIF').selectAsObject()
        const regUnitCertifObj = {}
        regUnitCertifArr.forEach(item => {
            regUnitCertifObj[item.name] = item.ID
        })

        const inv_regUnit_DS = UB.DataStore('inv_regUnit');

/*        const inv_countryDict_DS = UB.DataStore('inv_countryDict')
        inv_countryDict_DS.runSQL(`select A1.ID, A1.cname from COUNTRY A1`, {})

        const inv_countryDictArr = JSON.parse(inv_countryDict_DS.asJSONObject);
        inv_countryDictArr.forEach(item => {
            const newCountryID = inv_countryDict_DS.generateID()
            inv_countryDict_DS.run('insert', {
                execParams: {
                    ID: newCountryID,
                    code: item.code.toString(),
                    name: item.cname.trim()
                }
            })
        })*/


        dsUser.runSQL(`select A1.ID as oldID, A1.cname as pCNAME, A5.CNAME as vCNAME, A5.short as vshortname, A1.dbirth, A1.passport as passp,
        A1.identif, A1.primit, A1.A_STREET, A1.A_HOUSE, A1.A_KV, A4.CNAME as sCNAME, A4_1.CNAME as svillagecname, A3.NUMBER as hNUMBER, A1.l_notlive, 
        (CASE WHEN A1.sexID='2' THEN 'MALE' WHEN A1.sexID='1' THEN 'FEMALE' ELSE null END) as gender, 
        A1.dpassport, A1.whopasspor, A1.nationid, A1.svid, A1.dsvid, A1.KEM, A6.cname as b_country, A7.cname as b_region, A8.cname as b_district,
        A1.b_village, A1.ddeath, A1.svid_d, A1.svidd_d, A1.kemd
        from PEOPLE A1 left join FAMILY A2 on A2.ID=A1.familyID left join HOUSE A3 on A3.ID=A2.houseID 
        left join STREET A4 on A4.ID=A3.streetID left join VILLAGE A4_1 on A4_1.ID=A4.VILLAGEID left join BIRTH_VILLAGE A5 on A5.ID=A1.A_VILLAGE
        left join COUNTRY A6 on A6.ID=A1.b_country left join REGION A7 on A7.ID=A1.b_region left join DISTRICT A8 on A8.ID = A1.b_district`, {});
        var data = JSON.parse(dsUser.asJSONObject);

        _.forEach(data, function (item) {
            Object.keys(item).forEach(fld => {
                if (item[fld] && typeof item[fld] === 'string') item[fld] = item[fld].trim()
            })
            addrFormaat = [];
            fullName = [];
            fullName = item.pcname ? _.compact((item.pcname).split(' ')) : null;
            fullPassport = null
            let idCardNumber = null
            if (item.passp) {
                if (isNaN(Number(item.passp))) fullPassport =  _.compact((item.passp).split(' '))
                if (!isNaN(Number(item.passp))) idCardNumber = item.passp
            }

            if (item.l_notlive == 'T') {
               /* if (item.a_street && item.a_street != '') addrFormaat.push(item.a_street);
                if (item.a_house && item.a_house != '') addrFormaat.push(item.a_house);
                if (item.a_kv && item.a_kv != '') addrFormaat.push(item.a_kv);*/
                colStrValue = _.compact([item.a_street, item.a_house, item.a_kv]).join(', ');
            }
            else {
                /*if (item.scname && item.scname != '') addrFormaat.push(item.scname);
                if (item.hnumber && item.hnumber != '') addrFormaat.push(item.hnumber);*/
                colStrValue = _.compact([item.scname, item.hnumber]).join(', ');
            }

            if (item.whopasspor) {
                const unitName = item.whopasspor.trim()
                if (!regUnitPassportObj[unitName]) {
                    const newRegUnitID = inv_regUnit_DS.generateID()
                    inv_regUnit_DS.run('insert', {
                        execParams: {
                            ID: newRegUnitID,
                            name: unitName,
                            nameNom: unitName,
                            type: 'PASSPORT'
                        }
                    })
                    regUnitPassportObj[unitName] = newRegUnitID
                }
                item.whopasspor = regUnitPassportObj[unitName]
            }

            let birthCertifArr = []
            if (item.svid) birthCertifArr = _.compact(item.svid.split(' '))

            if (item.kem) {
                const unitName = item.kem.trim()
                if (!regUnitCertifObj[unitName]) {
                    const newRegUnitID = inv_regUnit_DS.generateID()
                    inv_regUnit_DS.run('insert', {
                        execParams: {
                            ID: newRegUnitID,
                            name: unitName,
                            nameNom: unitName,
                            type: 'CERTIF'
                        }
                    })
                    regUnitCertifObj[unitName] = newRegUnitID
                }
                item.kem = regUnitCertifObj[unitName]
            }

            if (item.kemd) {
                const unitName = item.kemd.trim()
                if (!regUnitCertifObj[unitName]) {
                    const newRegUnitID = inv_regUnit_DS.generateID()
                    inv_regUnit_DS.run('insert', {
                        execParams: {
                            ID: newRegUnitID,
                            name: unitName,
                            nameNom: unitName,
                            type: 'CERTIF'
                        }
                    })
                    regUnitCertifObj[unitName] = newRegUnitID
                }
                item.kemd = regUnitCertifObj[unitName]
            }

            let birthPlace = _.compact([item.b_country, (item.b_region ? item.b_region + ' область' : null), (item.b_district ? item.b_district + ' район' : null), item.b_village]).join(', ')

            let deathCertifArr = []
            if (item.svid_d) deathCertifArr = _.compact(item.svid_d.split(' '))

            dsPayer.run('insert', {
                execParams: {
                    ID: dsPayer.generateID(),
                    personType: 'PHYSICAL',
                    lastName: fullName[0] ? fullName[0] : '',
                    firstName: fullName[1] ? fullName[1] : '',
                    middleName: fullName[2] ? fullName[2] : '',
                    idnCode: item.identif ? item.identif : '',
                    birthDate: item.dbirth ? new Date(item.dbirth) : null,
                    passportSeries: fullPassport ? fullPassport[0] : '',
                    passportNumber: fullPassport ? fullPassport[1] : '',
                    idCardNumber: idCardNumber || null,
                    nationality: item.nationid == 1 || item.nationid == 3 ? ukraineID : null,
                    gender: item.gender || null,
                    passportIssueDate: item.dpassport ? new Date(item.dpassport) : null,
                    passportIssuedBy: item.whopasspor || null,

                    birthCertificateSeries: birthCertifArr[0] && birthCertifArr[0].length < 11 ? birthCertifArr[0] : null,
                    birthCertificateNum: _.compact([(birthCertifArr[0] && birthCertifArr[0].length > 11 ? birthCertifArr[0] : null), birthCertifArr[1] || null]).join(' '),
                    birthCertifDate: item.dsvid ? new Date(item.dsvid) : null,
                    birthCertifIssuedBy: item.kem || null,

                    deathCertificateSeries: deathCertifArr[0] && deathCertifArr[0].length < 11 ? deathCertifArr[0] : null,
                    deathCertificateNum: _.compact([(deathCertifArr[0] && deathCertifArr[0].length > 11 ? deathCertifArr[0] : null), deathCertifArr[1] || null]).join(' '),
                    deathCertifDate: item.svidd_d ? new Date(item.svidd_d) : null,
                    deathCertifIssuedBy: item.kemd || null,
                    deathDate: item.ddeath ? new Date(item.ddeath) : null,

                    birthPlaceAtuID: item.l_notlive == 'F' && item.svillagecname || null,
                    birthPlace: item.l_notlive == 'F' && colStrValue ? colStrValue : '',

                    natalPlace: birthPlace || null,

                    addressAtuID: item.l_notlive == 'T' && _.compact([item.vcname, item.vshortname]).join(' ') || null,
                    address: item.l_notlive == 'T' && colStrValue ? colStrValue : '',

                    notes: item.primit ? item.primit : '',
                    oldID: item.oldid ? item.oldid : '',
                    oldTable: 'PEOPLE_VUSHENKI'
                }
            });
        });
    })

};

me.importLandData = function (ctx) {
    Session.runAsAdmin(function () {
        var dsUser = UB.DataStore('uba_user');

        const vushenkiID = UB.Repository('inv_landDict').attrs('ID').where('koattNum', '=', 3220881301).selectScalar()
        const petropavlID = UB.Repository('inv_landDict').attrs('ID').where('koattNum', '=', 3220881303).selectScalar()
        let landCode = (UB.Repository('inv_subject').attrs('max([code])').selectScalar() || 0) + 1

        var dsLand = UB.DataStore('inv_landPlot'),
          koattNum = null,
          dateIfNull = new Date(1902, 1, 2),
          town = '',
          landCategory = 'AGRICULTURAL',
          notAgrCultTypes = {0: true, 1: true, 5: true, 11: true, 12: true},
          location = 'INLOCAL',
          useType = '',
          landPurpose = '';


        dsUser.runSQL("SELECT A1.ID AS oldID, A1.LANDTYPEID, trim(A1.DESCRIPT) AS cadastralNumber, A1.AMOUNT AS totalArea, trim(A1.NUMBER) as NUMBER, trim(A1.OWNERS) AS notes,A1.ACT_DATE AS regDate, trim(trim(A1.SERIA) || ' ' || trim(A1.CNUM)) as document, trim(A2.CNAME) AS streetName, A3.ID AS payerID, A2.villageid FROM LAND A1 LEFT JOIN STREET A2 ON A2.ID= A1.STREETID LEFT JOIN inv_payers A3 ON A3.oldID=A1.PEOPLEID and A3.oldTable='PEOPLE_VUSHENKI'", {});
        var data = _.groupBy(JSON.parse(dsUser.asJSONObject), item => `${item.landtypeid}${item.cadastralnumber}${item.totalarea}${item.number}${item.notes}${item.regdate}${item.document}${item.streetname}${item.payerid}${item.villageid}`);

        var land = '';

        _.forEach(data, function (group) {
            const item = group[0]
            Object.keys(item).forEach(fld => {
                if (item[fld] && typeof item[fld] === 'string') item[fld] = item[fld].trim()
            })
            landCategory = 'AGRICULTURAL';
            notAgrCultTypes = {0: true, 1: true, 5: true, 11: true, 12: true};
            location = 'INLOCAL';
            useType = '';
            landPurpose = '';


            if (item.villageid == 2) {
                town = 'с. Петропавлівське'
                koattNum = petropavlID
            } else {
                town = 'с. Вишеньки'
                koattNum = vushenkiID
            }
            //Місцезнаходження
            land = town;
            if (item.streetname) land = `${land}, ${item.streetname}`;
            else if (item.number) land = `${land}, ${item.number}`;

            //Категорія земель
            if (notAgrCultTypes[item.landtypeid]) landCategory = 'NOT_AGRICULTURAL';
            //Розташування
            if (item.landtypeid == 10 || !item.villageid) location = 'OUTLOCAL';

            //Вид використання
            switch (item.landtypeid) {
                case 1:
                    useType = 'SMALLHOLDING';
                    break;
                case 2:
                case 8:
                case 9:
                    useType = 'OSGMANAGE';
                    break;
                case 3:
                    useType = 'SGPRODUCTMANAGE';
                    break;
                case 10:
                    useType = 'GARDENMANAGE';
                    break;
                case 11:
                    useType = 'CONSTRGARAGES';
                    break;
            }

            if (item.landtypeid == 6) landPurpose = 'AGRICULTURAL';
            if (item.landtypeid == 7) landPurpose = 'PERENNIAL_PLANTING';

            const isCadastral = /^([0-9]*|:)*$/g.test(item.cadastralnumber) && item.cadastralnumber.length < 23
            item.cadastralnumber = item.cadastralnumber && isCadastral ? item.cadastralnumber : null

            const execParams = {
                ID: dsLand.generateID(),
                koattNum: koattNum,
                code: landCode++,
                landCategory: landCategory ? landCategory : 'AGRICULTURAL',
                landPurpose: landPurpose ? landPurpose : null,
                cadastralNumber: item.cadastralnumber && /^([0-9]*|:)*$/g.test(item.cadastralnumber)? item.cadastralnumber : null,
                totalArea: item.totalarea ? item.totalarea : 0,
                documentOwnership: item.document ? item.document : '-',
                registryData: item.regdate ? new Date(item.regdate) : dateIfNull,
                position: land ? land : null,
                owner: item.payerid ? item.payerid : null,
                location: location,
                useType: useType ? useType : null,
                notes: _.compact([(item.notes ? item.notes : ''), (isCadastral ? '' : item.cadastralnumber)]).join('; '),
                oldID: item.oldid ? item.oldid : '',
                oldTable: 'LAND_VUSHENKI'
            }
            const isExists = UB.Repository('inv_landPlot').attrs('ID')
              .where('koattNum', '=', execParams.koattNum)
              .where('landCategory', '=', execParams.landCategory)
              .where('landPurpose', '=', execParams.landPurpose)
              .where('cadastralNumber', '=', execParams.cadastralNumber)
              .where('totalArea', '=', execParams.totalArea)
              .where('documentOwnership', '=', execParams.documentOwnership)
              .where('registryData', '=', execParams.registryData)
              .where('position', '=', execParams.position)
              .where('owner', '=', execParams.owner)
              .where('location', '=', execParams.location)
              .where('useType', '=', execParams.useType)
              .where('notes', '=', execParams.notes)
              .limit(1)
              .selectScalar()

            if (!isExists) {
                dsLand.run('insert', {
                    execParams: execParams
                });
            }
        });
    })
};

me.importRealtyData = function (ctx) {
    Session.runAsAdmin(function () {

        var dsUser = UB.DataStore('uba_user');

        const vushenkiID = UB.Repository('inv_landDict').attrs('ID').where('koattNum', '=', 3220881301).selectScalar()
        const petropavlID = UB.Repository('inv_landDict').attrs('ID').where('koattNum', '=', 3220881303).selectScalar()
        let realtyCode = (UB.Repository('inv_subject').attrs('max([code])').selectScalar() || 0) + 1

        var dsRealty = UB.DataStore('inv_realtyObject'),
          dsPayers = UB.DataStore('inv_payers'),
          koattNum = null,
          dateIfNull = new Date(1902, 1, 2),
          town = '',
          location = 'INLOCAL',
          ifLiving = 'HOUSE',
          ifNotLiving = 'OTHER_BUILDING',
          owner = null;


        dsUser.runSQL("SELECT A3.ID AS houseID, A3.NUMBER, A3.LIVING, A3.NUM_KV, A4.CNAME, A2.GENERALARE AS totalArea, " +
          "A5.DSALE, A5.DOCUMENT, A4.villageid from FAMILY A1 LEFT JOIN FAMILYCONTROL A2 ON A2.FAMILYID=A1.ID " +
          "LEFT JOIN HOUSE A3 ON A3.ID=A1.HOUSEID LEFT JOIN STREET A4 ON A4.ID=A3.STREETID LEFT JOIN SALE A5 ON A5.FAMILYID=A1.ID"/* GROUP BY A3.ID"*/, {});
        var data = JSON.parse(dsUser.asJSONObject);

        var house = '';
        //
        _.forEach(data, function (item, i) {
            Object.keys(item).forEach(fld => {
                if (item[fld] && typeof item[fld] === 'string') item[fld] = item[fld].trim()
            })
            dsPayers.runSQL("SELECT A1.ID, A3.HOUSEID as houseID FROM inv_payers A1 LEFT JOIN PEOPLE A2 ON A2.ID::text=A1.OLDID LEFT JOIN FAMILY A3 ON A3.ID=A2.FAMILYID WHERE A3.HOUSEID=:houseID: AND A1.oldTable='PEOPLE_VUSHENKI'", {houseID: item.houseid});
            owner = JSON.parse(dsPayers.asJSONObject)[0];

            if (item.villageid) {
                if (item.villageid == 2) {
                    town = 'с. Петропавлівське'
                    koattNum = petropavlID
                }
                else {
                    town = 'с. Вишеньки'
                    koattNum = vushenkiID
                }
            }
            house = town;
            if (item.cname) house = `${house}, вул. ${item.cname}`;
            if (item.number) house = `${house}, ${item.number}`;
            if (item.num_kv) house = `${house}, кв. ${item.num_kv}`;

            dsRealty.run('insert', {
                execParams: {
                    ID: dsRealty.generateID(),
                    koattNum: koattNum,
                    code: realtyCode++,
                    realtyType: item.living == 'T' ? ifLiving : ifNotLiving,
                    totalArea: item.totalarea ? item.totalarea : 0,
                    location: location,
                    documentOwnership: item.document ? item.document : '-',
                    registryData: item.dsale ? new Date(item.dsale) : dateIfNull,
                    address: house,
                    oldID: item.houseid ? item.houseid : '',
                    owner: owner && owner.ID ? owner.ID : null,
                    oldTable: 'HOUSE_VUSHEKI'
                }
            });
        });
    })
};

me.getNewCode = function (ctx) {
    var params = ctx.mParams.execParams;

    var newCode = me.doGetNewCode(params.formCode);

    ctx.mParams.newCode = newCode[0]['code'];
};

me.doGetNewCode = function (formCode) {
    var dsObj = UB.DataStore(formCode),
        newCode = '';

    dsObj.runSQL("SELECT max(code) as code from inv_subject", {});
    return JSON.parse(dsObj.asJSONObject);

};


me.getNewCode1 = function (ctx) {
    var params = ctx.mParams.execParams,
        dsObj = UB.DataStore('inv_realtyObject'),
        dsLand = UB.DataStore('inv_landPlot'),
        dsSubj = UB.DataStore('inv_subject'),
        newCode = 0;

    dsObj.runSQL("select ID from inv_landPlot where code is null;", {});
    newCode = JSON.parse(dsObj.asJSONObject);
    let currCode = 6220;
    _.forEach(newCode, function (item) {
        let uba_user_execParams = {
            ID: item.ID,
            code: currCode,
            mi_modifyDate: new Date(),
            mi_modifyUser: 10
        };
        dsLand.run("update", {__skipOptimisticLock: true, execParams: uba_user_execParams});
        //dsSubj.run("update", { execParams: uba_user_execParams });
        currCode = currCode + 1;
    });
    ctx.mParams.newCode = currCode;
};

me.getReceiptXlsx = function (fake, req, resp) {
    var reqParams = req.read();
    var receiptParams = JSON.parse(reqParams);

    var templatePath = path.join(process.configPath, 'excelTemplate', 'tax_notice-decision.xlsx');
    var templateFile = fs.readFileSync(templatePath, {encoding: 'bin'});
    // Create a template
    var template = new XlsxTemplate(templateFile);


    var sheetNumber = 1;
    template.substitute(sheetNumber, receiptParams);
    var resultDoc = template.generate({type: 'ArrayBuffer'});

    resp.writeEnd(resultDoc);
    resp.writeHead('Content-type: application/vnd.ms-excel', 'Content-Disposition: inline; filename="tax_notice-decision.xlsx"');
    resp.statusCode = 200;
};

me.importNewPeopleData = function (ctx) {
    var params = ctx.mParams.execParams;
    var dsUser = UB.DataStore('uba_user');

    var dsPayer = UB.DataStore('inv_payers'),
        colTownValue = '',
        colStrValue = [],
        addrFormaat = [],
        fullName = [],
        badDate = [],
        isLegal = false,
        formatedDate = new Date();

    dsUser.runSQL("select ID, fullName, trim(idnCode) as idnCode, address, privilegeCat, privilegeStartDate from newPEOPLE" +
        " where idnCode is not null group by fullName", {});
    var data = JSON.parse(dsUser.asJSONObject);

    _.forEach(data, function (item) {
        if (item.fullName) {
            addrFormaat = [];
            fullName = [];
            colStrValue = [];
            badDate = [];
            isLegal = false;
            badDate = item.privilegeStartDate ? _.compact((item.privilegeStartDate).split('.')) : undefined;
            formatedDate = badDate ? new Date(badDate[2], parseInt(badDate[1]) - 1, badDate[0]) : undefined;
            item['idnCode'] = item['idnCode'] ? item['idnCode'].toString() : undefined;
            if (formatedDate) formatedDate.setMinutes(-formatedDate.getTimezoneOffset());
            if (item['idnCode'] && (item['idnCode'].length > 8 || isNaN(parseInt(item['idnCode'])))) fullName = item.fullName ? _.compact((item.fullName).split(' ')) : null;
            else if (item['idnCode'] && (item['idnCode'].length <= 8)) {
                fullName = [item.fullName];
                isLegal = true;
            }
            else if (!item['idnCode']) {
                colStrValue = _.compact((item.fullName).split(' '));
                if (colStrValue && colStrValue.length != 3) {
                    fullName = [item.fullName];
                    isLegal = true;
                }
                else {
                    fullName = item.fullName ? _.compact((item.fullName).split(' ')) : null;
                }
            }
            if (!isLegal)
                dsPayer.run('insert', {
                    execParams: {
                        ID: dsPayer.generateID(),
                        personType: 'PHYSICAL',
                        lastName: fullName[0] ? fullName[0] : '',
                        firstName: fullName[1] ? fullName[1] : '',
                        middleName: fullName[2] ? fullName[2] : '',
                        privilegePhysID: item.privilegeCat ? 332499754876929 : null,
                        privilegeStartDate: formatedDate ? formatedDate : null,
                        idnCode: item.idnCode ? item.idnCode : '',
                        address: item.address ? item.address : '',
                        oldID: item.ID ? item.ID : '',
                        oldTable: 'newPeople'
                    }
                });
            else {
                dsPayer.run('insert', {
                    execParams: {
                        ID: dsPayer.generateID(),
                        personType: 'LEGAL',
                        name: fullName[0] ? fullName[0] : '',
                        edrpou: item.idnCode ? item.idnCode : '',
                        address: item.address ? item.address : '',
                        oldID: item.ID ? item.ID : '',
                        oldTable: 'newPeople'
                    }
                });
            }
        }
    });

};

me.importNewLandData = function (ctx) {
    var params = ctx.mParams.execParams;
    var dsUser = UB.DataStore('uba_user');

    var dsLand = UB.DataStore('inv_landPlot'),
        koattNum = 152, //село Гнідин
        dateIfNull = new Date(1902, 1, 2),
        landCategory = 'AGRICULTURAL',
        location = 'OUTLOCAL',
        useType = '',
        landPurpose = '',
        document = '';

    dateIfNull.setMinutes(-dateIfNull.getTimezoneOffset());

    dsUser.runSQL("select A1.ID, A1.location, A1.totalArea, A1.koattu, A1.zone, A1.kvartal, A1.sectionNum, (COALESCE(A1.koattu,'') || ':' || COALESCE(A1.zone,'') || ':' || COALESCE(A1.kvartal,'') || ':' || COALESCE(A1.sectionNum,'')) as cadastral, A1.useType, A1.notSg, A1.regDate, A1.ownershipDocument, A1.num, A2.ID as payerID " +
        "from newPEOPLE A1 left join inv_payers A2 on A2.oldID=A1.ID " +
        "where A2.oldTable='newPeople'", {});
    var data = JSON.parse(dsUser.asJSONObject);

    var badDate = [],
        formatedDate = undefined,
        cadastral = '';

    _.forEach(data, function (item, i) {
        badDate = [];
        item.regDate = item.regDate ? item.regDate.trim() : null;
        formatedDate = undefined;
        cadastral = '';
        badDate = item.regDate ? _.compact((item.regDate.trim()).split('.')) : undefined;
        formatedDate = badDate ? new Date(badDate[2], parseInt(badDate[1]) - 1, badDate[0]) : undefined;
        landCategory = 'AGRICULTURAL';
        useType = '';
        landPurpose = '';
        document = '';


        if (formatedDate) formatedDate.setMinutes(-formatedDate.getTimezoneOffset());

        item.koattu = item.koattu ? item.koattu.toString() : null;
        item.zone = item.zone ? item.zone.toString() : null;
        item.kvarta = item.kvarta ? item.kvarta.toString() : null;
        item.sectionNum = item.sectionNum ? item.sectionNum.toString() : null;

        if (item.koattu && item.zone && item.kvartal && item.sectionNum) cadastral = item.cadastral;
        item.useType = item['useType'] ? item['useType'].trim() : undefined;
        switch (item.useType) {
            case 'Для ведення ОСГ':
                useType = 'OSGMANAGE';
                break;
            case 'Для ведення садівництва':
                useType = 'GARDENMANAGE';
                break;
            case 'Для ведення товарного СГ виробництва':
                useType = 'SGPRODUCTMANAGE';
                break;
            case 'Для дачного будівництв':
                useType = 'COTTAGECONSTR';
                break;
            case 'Присадибна ділянка':
                useType = 'SMALLHOLDING';
                break;
        }

        item.ownershipDocument = item.ownershipDocument ? item.ownershipDocument.toString() : null;
        item.num = item.num ? item.num.toString() : null;
        if (item.notSg) landCategory = 'NOT_AGRICULTURAL';
        if (item.ownershipDocument || item.num) {
            document = _.compact([item.ownershipDocument, item.num]).join(' ');
        }

        dsLand.run('insert', {
            execParams: {
                ID: dsLand.generateID(),
                koattNum: koattNum,
                landCategory: landCategory ? landCategory : 'AGRICULTURAL',
                landPurpose: landPurpose ? landPurpose : null,
                cadastralNumber: cadastral ? cadastral : null,
                totalArea: item.totalArea ? item.totalArea : 0,
                documentOwnership: document ? document : '-',
                registryData: formatedDate && !isNaN(formatedDate.getMonth()) ? formatedDate : dateIfNull,
                position: item.location ? item.location : null,
                owner: item.payerID ? item.payerID : null,
                location: location,
                useType: useType ? useType : null,
                oldID: item.ID ? item.ID : '',
                oldTable: 'newPeople'
            }
        });
    });
};

me.importNewPeopleLegalData = function (ctx) {
    var params = ctx.mParams.execParams;
    var dsUser = UB.DataStore('uba_user');

    var dsPayer = UB.DataStore('inv_payers'),
        colStrValue = [];

    dsUser.runSQL("SELECT A1.ID, trim(A1.fullName) AS fullName, A1.idnCode, trim(A1.address) AS address " +
        "FROM newPeopleLegal A1 WHERE A1.idnCode IS NOT NULL AND A1.idnCode<>' ' " +
        "AND NOT EXISTS (SELECT A2.* FROM newPeople A2 WHERE A2.idnCode=A1.idnCode) GROUP BY fullName", {});
    var data = JSON.parse(dsUser.asJSONObject);

    _.forEach(data, function (item) {
        if (item.fullName) {
            colStrValue = [];
            item['idnCode'] = item['idnCode'] ? item['idnCode'].toString() : undefined;

            dsPayer.run('insert', {
                execParams: {
                    ID: dsPayer.generateID(),
                    personType: 'LEGAL',
                    name: item.fullName ? item.fullName : '',
                    edrpou: item.idnCode ? item.idnCode : '',
                    address: item.address ? item.address : '',
                    oldID: item.ID ? item.ID : '',
                    oldTable: 'newPeopleLegal'
                }
            });

        }
    });

};

me.importNewLandLegalData = function (ctx) {
    var params = ctx.mParams.execParams;
    var dsUser = UB.DataStore('uba_user');

    var dsLand = UB.DataStore('inv_landPlot'),
        koattNum = 152, //село Гнідин
        dateIfNull = new Date(1902, 1, 2),
        landCategory = 'AGRICULTURAL',
        location = 'OUTLOCAL',
        useType = '',
        landPurpose = '',
        document = '';

    dateIfNull.setMinutes(-dateIfNull.getTimezoneOffset());

    dsUser.runSQL("select A1.ID, A1.totalArea, A1.koattu, A1.zone, A1.kvartal, A1.sectionNum, (COALESCE(A1.koattu,'') || ':' || COALESCE(A1.zone,'') || ':' || COALESCE(A1.kvartal,'') || ':' || COALESCE(A1.sectionNum,'')) as cadastral, A1.useType, A1.notSg, A1.regDate, A1.ownershipDocument, A1.num, trim(COALESCE(A1.ownershipDocument,'') || ' ' || COALESCE(A1.num,'')) as document " +
        "from newPeopleLegal A1 left join inv_payers A2 on A2.oldID=A1.ID " +
        "where A2.oldTable='newPeopleLegal'", {});
    var data = JSON.parse(dsUser.asJSONObject);

    var badDate = [],
        formatedDate = undefined,
        cadastral = '';

    _.forEach(data, function (item, i) {
        badDate = [];
        item.regDate = item.regDate ? item.regDate.trim() : null;
        formatedDate = undefined;
        cadastral = '';
        badDate = item.regDate ? _.compact((item.regDate.trim()).split('.')) : undefined;
        formatedDate = badDate ? new Date(badDate[2], parseInt(badDate[1]) - 1, badDate[0]) : undefined;
        landCategory = 'AGRICULTURAL';
        useType = '';
        landPurpose = '';
        document = '';


        if (formatedDate) formatedDate.setMinutes(-formatedDate.getTimezoneOffset());

        item.koattu = item.koattu ? item.koattu.toString() : null;
        item.zone = item.zone ? item.zone.toString() : null;
        item.kvarta = item.kvarta ? item.kvarta.toString() : null;
        item.sectionNum = item.sectionNum ? item.sectionNum.toString() : null;

        if (item.koattu && item.zone && item.kvartal && item.sectionNum) cadastral = item.cadastral;
        item.useType = item['useType'] ? item['useType'].trim() : undefined;
        switch (item.useType) {
            case 'Для ведення ОСГ':
                useType = 'OSGMANAGE';
                break;
            case 'Для ведення садівництва':
                useType = 'GARDENMANAGE';
                break;
            case 'Для ведення товарного СГ виробництва':
                useType = 'SGPRODUCTMANAGE';
                break;
            case 'Для дачного будівництв':
                useType = 'COTTAGECONSTR';
                break;
            case 'Присадибна ділянка':
                useType = 'SMALLHOLDING';
                break;
        }

        item.ownershipDocument = item.ownershipDocument ? item.ownershipDocument.toString() : null;
        item.num = item.num ? item.num.toString() : null;
        if (item.notSg) landCategory = 'NOT_AGRICULTURAL';
        if (item.ownershipDocument || item.num) {
            document = _.compact([item.ownershipDocument, item.num]).join(' ');
        }

        dsLand.run('insert', {
            execParams: {
                ID: dsLand.generateID(),
                koattNum: koattNum,
                landCategory: landCategory ? landCategory : 'AGRICULTURAL',
                landPurpose: landPurpose ? landPurpose : null,
                cadastralNumber: cadastral ? cadastral : null,
                totalArea: item.totalArea ? item.totalArea : 0,
                documentOwnership: document ? document : '-',
                registryData: formatedDate && !isNaN(formatedDate.getMonth()) ? formatedDate : dateIfNull,
                location: location,
                useType: useType ? useType : null,
                oldID: item.ID ? item.ID : '',
                oldTable: 'newPeopleLegal'
            }
        });
    });
};

me.importRegUnit = function () {
    var dsUser = UB.DataStore('uba_user'),
        dsRegUnit = UB.DataStore('inv_regUnit'),
        data;

    dsUser.runSQL("select passportIssuedBy as col1 from inv_payers where passportIssuedBy is not null group by passportIssuedBy union select birthCertifIssuedBy as col1 from inv_payers where birthCertifIssuedBy is not null group by birthCertifIssuedBy union select deathCertifIssuedBy as col1 from inv_payers where deathCertifIssuedBy is not null group by deathCertifIssuedBy", {});
    data = JSON.parse(dsUser.asJSONObject);

    for (let i = 0; i < data.length; i++) {
        let currData = data[i];
        dsRegUnit.run('insert', {
            execParams: {
                ID: dsRegUnit.generateID(),
                code: i < 10 ? '0' + (i + 1) : i + 1,
                name: currData.col1,
                isRegAuth: false
            }
        });
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

me.entity.addMethod("getObjAttNewID");
me.entity.addMethod("getContrAttNewID");
me.entity.addMethod("getExcelData");

me.entity.addMethod("importPeopleData");
me.entity.addMethod("importNewPeopleData");
me.entity.addMethod("importLandData");
me.entity.addMethod("importNewLandData");
me.entity.addMethod("importRealtyData");
me.entity.addMethod("importNewPeopleLegalData");
me.entity.addMethod("importNewLandLegalData");

me.entity.addMethod("doGetNewCode");
me.entity.addMethod("getNewCode");
me.entity.addMethod("getNewCode1");
me.entity.addMethod("importRegUnit");
me.entity.addMethod("getReceiptXlsx");
