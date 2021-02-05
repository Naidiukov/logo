
var me = inv_regUnit;

me.beforeinsert = function (ctx) {
    let params = ctx.mParams.execParams,
        maxCode = UB.Repository("inv_regUnit")
            .attrs(["max([code])"])
            // .where("[mi_createUser]", '=', Session.userID)
            .selectScalar();

    if (maxCode) {
            maxCode = (parseInt(maxCode) + 1).toString();
    } else maxCode = '01';
    params.code = maxCode;
};

me.afterinsert = function (ctx) {

};
me.afterupdate = function (ctx) {

};
me.afterdelete = function (ctx) {

};

// needed for history to work correctly
me.beforeupdate = function (ctx) {
};
/*me.beforedelete = function (ctx) {
    let params = ctx.mParams.execParams,
        regUnit = UB.Repository('inv_regUnit')
            .attrs(['ID'])
            .where('[ID]', '=', params.ID)
            .where('[mi_createUser]', '=', Session.userID)
            .selectAsObject()[0];
            if(!regUnit){
                throw new Error('<<<На видалення доступні лише створені Вами записи.>>>');
            }
};*/

me.afterbeforeupdate = function (ctx) {

};

me.afterbeforedelete = function (ctx) {

};

// me.beforeselect = function (ctx) {
//     let params = ctx.mParams;
//
//     // if(Session.uData && Session.uData.roles != 'Admin'){
//
//     //}
//     if(params.whereList){
//         let whereList = Object.keys(params.whereList);
//
//         let count = _.filter(whereList, function (item) {
//                 return item != 'byType';
//             }),
//             logicalPredicates = '([byUser]',
//             logicalPredicates1 = [];
//         if (count) {
//
//         }
//         _.forEach(Object.keys(params.whereList), function (item) {
//             if (item != 'byType') {
//                 logicalPredicates1.push(`[${item}]`);
//             }
//         });
//         if (count.length) {
//             logicalPredicates+= ` or (${logicalPredicates1.join(' and ')})`;
//             logicalPredicates += ')';
//         } else logicalPredicates += ')';
//         params.whereList.byUser = {
//             expression: 'mi_createUser',
//             condition: "=",
//             values: {mi_createUser: Session.uData.UserID}
//         };
//         params.logicalPredicates = [logicalPredicates];
//     }
//     else {
//         params.whereList = {
//             byUser: {
//                 expression: 'mi_createUser',
//                 condition: "=",
//                 values: {mi_createUser: Session.uData.UserID}
//             }
//         }
//
//     }
//
// };

me.checkUniqueAuth = function (ctx) {
    var params = ctx.mParams.execParams;
    var checkIsRegAuth = params.isRegAuth ? UB.Repository("inv_regUnit")
                .attrs(["ID"])
                .where("[ID]", '!=', params.ID)
                .where("[isRegAuth]", '=', 1)
                .selectAsObject()[0] : false,
        checkCode = UB.Repository("inv_regUnit")
            .attrs(["ID"])
            .where("[ID]", '!=', params.ID)
            // .where("[mi_createUser]", '=', params.mi_createUser)
            .where("[code]", '=', params.code)
            .selectAsObject()[0];

    ctx.mParams.isRegAuth = !!checkIsRegAuth;
    ctx.mParams.isCode = !!checkCode;
};

//me.entity.addMethod("beforeselect");
me.entity.addMethod("beforeinsert");
me.entity.addMethod("afterinsert");
me.entity.addMethod("afterupdate");
me.entity.addMethod("afterdelete");
me.entity.addMethod("beforeupdate");
// me.entity.addMethod("beforedelete");
me.entity.addMethod("afterbeforeupdate");
me.entity.addMethod("afterbeforedelete");

me.entity.addMethod("checkUniqueAuth");