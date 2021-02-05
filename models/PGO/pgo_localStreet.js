
const me = pgo_localStreet;
const _ = require('lodash');
const UB = require('@unitybase/ub');


me.addStreets = function (ctx) {
    var params = ctx.mParams.execParams,
        addData = JSON.parse(params.addData),
        codes = _.map(addData, function (item) {
            if (item.code < 10 && item['code'].length == 1) return '0' + item.code; else return item.code
        }),
        streets = _.map(addData, 'street');

    var dslocalStreet = UB.DataStore('pgo_localStreet');
    var dataTaxes = UB.Repository("pgo_localStreet")
            .attrs(["ID"])
            .where("[code]", 'in', codes, 'byCodes')
            .where("[street]", 'in', streets, 'byStreets')
            .where("[settlementDictID]", '=', params.settlementDictID)
            .logic('([byCodes] or [byStreets])')
            .selectAsObject(),
        isDuplicate = false,
        isBadCode = !!_.find(addData, function (item) {
            return parseInt(item.code) == 0
        }),
        groupedCode = _.groupBy(addData, 'code');
    if (dataTaxes.length) {
        isDuplicate = true;
    } else if (isBadCode) {
        ctx.mParams.isBadCode = true;
    } else if (_.find(groupedCode, function (item) {
            return item.length > 1;
        })) {
        ctx.mParams.isDuplicateIn = true;
    }
    else {
        _.forEach(addData, function (item) {
            if (item.code < 10 && item['code'].length == 1) item.code = '0' + item.code;
            dslocalStreet.run('insert', {
                execParams: {
                    ID: dslocalStreet.generateID(),
                    settlementDictID: item.settlementDictID,
                    street: item.street,
                    code: item.code,
                    illuminati: item.illuminati,
                    distance: item.distance,
                    coverageID: item.coverageID
                }
            });
        });
    }
    ctx.mParams.isDuplicate = isDuplicate;
};

me.checkCodeStreet = function (ctx) {
    var params = ctx.mParams.execParams;
    if(params.ID){
        duplicates = UB.Repository("pgo_localStreet")
            .attrs(["code", "street"])
            .where("[ID]", 'notEqual', params.ID)
            .where("[code]", '=', params.code, 'byCodes')
            .where("[street]", '=', params.street, 'byStreets')
            .where("[streetType]", '=', params.streetType, 'byStreetType')
            .where("[settlementDictID]", '=', params.settlementDictID)
            .logic('([byCodes] or ([byStreets] and [byStreetType]))')
            .selectAsObject()[0]
    }else{
        duplicates = UB.Repository("pgo_localStreet")
            .attrs(["code", "street"])
            .where("[code]", '=', params.code, 'byCodes')
            .where("[street]", '=', params.street, 'byStreets')
            .where("[streetType]", '=', params.streetType, 'byStreetType')
            .where("[settlementDictID]", '=', params.settlementDictID)
            .logic('([byCodes] or ([byStreets] and [byStreetType]))')
            .selectAsObject()[0]
    }
    var duplicates,
        duplField = false;
    if (duplicates) {
        if (params.code === duplicates.code) duplField = 'Код';
        else if (params.street === duplicates.street) duplField = 'Тип вулиці та Вулиця';
    }
    ctx.mParams.duplField = duplField;
};

me.getStreetNewID = function (ctx) {
    var localStreetDS = UB.DataStore("pgo_localStreet");
    ctx.mParams.streetID = localStreetDS.generateID();
};

me.addUpdateStreet = function (ctx) {
    var params = ctx.mParams.execParams,
        data = params ? params.data : undefined,
        localStreetDS = UB.DataStore("pgo_localStreet"),
        streetID = data.ID;

    if(data){
        if (streetID) {
            localStreetDS.run('update', {
                __skipSelectAfterUpdate: true,
                __skipOptimisticLock: true,
                execParams: {
                    ID: streetID,
                    settlementDictID: data.settlementDictID,
                    street: data.street,
                    code: data.code,
                    streetType: data.streetType,
                    illuminati: data.illuminati,
                    distance: data.distance || null,
                    coverageID: data.coverageID || null
                }
            });
        }
        else {
            streetID = localStreetDS.generateID();
            localStreetDS.run('insert', {
                execParams: {
                    ID: streetID,
                    settlementDictID: data.settlementDictID,
                    street: data.street,
                    code: data.code,
                    streetType: data.streetType,
                    illuminati: data.illuminati,
                    distance: data.distance ? data.distance : null,
                    coverageID: data.coverageID ? data.coverageID : null
                }
            });
            ctx.mParams.streetID = streetID;
        }
    }
};

me.importStreet = function () {
    Session.runAsAdmin(function () {
        let /*villageID = 3220882601,*/ //с. Гнідин
          dsUser = UB.DataStore('uba_user'),
          dsLocalStreet = UB.DataStore('pgo_localStreet');

        const vushenkiID = UB.Repository('pgo_settlementDict').attrs('ID').where('koattNum', '=', 3220881301).selectScalar()
        const petropavlID = UB.Repository('pgo_settlementDict').attrs('ID').where('koattNum', '=', 3220881303).selectScalar()

        const coverageDict = UB.Repository('pgo_coverage').attrs('ID', 'code').selectAsObject()
        const coverageObj = {}
        coverageDict.forEach(item => {
            coverageObj[item.code] = item.ID
        })
        dsUser.runSQL("SELECT ID, CNAME AS street, (CASE WHEN ILLUMINATI='T' THEN 1 ELSE 0 END) as illuminati, coverageID, villageid from STREET", {});

        let data = JSON.parse(dsUser.asJSONObject);
        _.forEach(data, function (item, i) {
            Object.keys(item).forEach(fld => {
                if (item[fld] && typeof item[fld] === 'string') item[fld] = item[fld].trim()
            })
            dsLocalStreet.run('insert', {
                execParams: {
                    // ID: dsLocalStreet.generateID(),
                    settlementDictID: item.villageid == 2 ? petropavlID : vushenkiID,
                    street: item.street ? item.street : ' ',
                    code: (i + 1) < 10 ? '0' + (i + 1) : (i + 1).toString(),
                    streetType: 333581754728449,
                    coverageID: item.coverageid ? coverageObj[item.coverageid] : null,
                    illuminati: item.illuminati,
                    distance: 0,
                    oldID: item.id,
                    oldTable: 'STREET_VUSHENKI'
                }
            });
        });
    })
};


me.entity.addMethod("addStreets");
me.entity.addMethod("checkCodeStreet");
me.entity.addMethod("getStreetNewID");
me.entity.addMethod("addUpdateStreet");
me.entity.addMethod("importStreet");
