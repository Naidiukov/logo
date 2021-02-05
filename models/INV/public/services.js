/**
 * Created by david.chkhaidze on 11.10.2017.
 */
const _ = require('lodash');
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
var setCtrlVisibility = function (fields, form) {
        let currField;
        _.forEach(fields, function (fld) {
            currField = form.getField(fld.name) || form.queryById(fld.name);
            if (fld.isVisible) {
                currField.show();
                if (fld.hasOwnProperty('isBlank')) currField.setAllowBlank(fld.isBlank);
                if (fld.nullVal) currField.setValue(null);
            } else {
                currField.hide();
                if (fld.hasOwnProperty('isBlank')) currField.setAllowBlank(fld.isBlank);
                if (fld.nullVal) currField.setValue(null);
            }
        })
    },
    setWhereList = function (fld, byName, fieldName, value) {
        if (!fld.store.ubRequest.whereList) fld.store.ubRequest.whereList = {};
        fld.store.ubRequest.whereList[byName] = {
            expression: `[${fieldName}]`,
            condition: "=",
            values: {}
        };
        fld.store.ubRequest.whereList[byName].values[fieldName] = value ? value : -1;
    };
var setRegUnitByUser = function (fld) {
    let currVal = fld.getValue();
    if (fld.store.ubRequest.whereList) {
        fld.store.ubRequest.whereList.byUser = {
            expression: 'mi_createUser',
            condition: "=",
            values: {mi_createUser: $App.connection.userData().UserID}
        };
    }
    else {
        fld.store.ubRequest.whereList = {
            byUser: {
                expression: 'mi_createUser',
                condition: "=",
                values: {mi_createUser: $App.connection.userData().UserID}
            }
        };
    }
    fld.fireEvent('afterQuerySend')
};

var unsetRegUnitByUser = function (fld) {
    if (fld.store.ubRequest.whereList && fld.store.ubRequest.whereList.byUser) delete fld.store.ubRequest.whereList.byUser;
};

var setRecordNull = function (arr, form) {
    for (let i = 0; i < arr.length; i++) {
        form.record.set(arr[i], null);
    }
};

function coordsToLatLng(coords) {
  const myCRS = new L.Proj.CRS('myCRS', '+proj=tmerc +lat_0=0 +lon_0=33 +k=1 +x_0=6500000 +y_0=0 +ellps=krass +towgs84=25,-141,-78.5,-0,0.35,0.736,0 +units=m +no_defs');
  return myCRS.unproject(new L.Point(coords[0], coords[1]))
}

function getObjCoords(res) {
    res = res.geometry.coordinates[0].flat()
    const coordsArr = {x: [], y: []}
    let minX, minY, maxX, maxY

    res.forEach(item => {
        coordsArr.x.push(item[0])
        coordsArr.y.push(item[1])
    })
    minX = Math.min(...coordsArr.x)
    minY = Math.min(...coordsArr.y)
    maxX = Math.max(...coordsArr.x)
    maxY = Math.max(...coordsArr.y)
    return [coordsToLatLng([minX, minY]), coordsToLatLng([maxX, maxY])]
}

async function openSubjectFormByCadastr(cadastralNumber) {
    if (!cadastralNumber) return $App.dialogError("Для даного об'єкту картки не існує")
    const res = await UB.Repository('inv_subject')
      .attrs('mi_unityEntity', 'ID')
      .where('cadastralNumber', '=', cadastralNumber)
      .selectSingle()
    if (res) $App.doCommand({
        cmdType: 'showForm',
        formCode: res.mi_unityEntity,
        entity: res.mi_unityEntity,
        instanceID: res.ID,
        target: $App.viewport.centralPanel,
        tabId: "subject" + Ext.id(),
    })

}

if (UB.isServer) {
    exports.getDate = getDate;
} else
    Ext.define('INV.services', {
        statics: {
            getDate: getDate,
            setCtrlVisibility: setCtrlVisibility,
            setWhereList: setWhereList,
            setRegUnitByUser: setRegUnitByUser,
            unsetRegUnitByUser: unsetRegUnitByUser,
            setRecordNull: setRecordNull,
            coordsToLatLng: coordsToLatLng,
            getObjCoords,
            openSubjectFormByCadastr
        }
    });
