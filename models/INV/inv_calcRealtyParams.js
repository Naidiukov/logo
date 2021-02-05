const me = inv_calcRealtyParams;
// const _ = require('lodash');

me.beforeafterinsert = function (ctx) {
	if (!ctx.mParams.execParams.isNotInsertGrid) {
		let data = UB.Repository('inv_calcRealtyParamsDict')
				.attrs('ID')
				.where('parentID', 'isNotNull')
				.selectAsObject(),
			ds_calcParamsGrid = UB.DataStore('inv_calcRealtyParamsGrid');

		for (let i = 0; i < data.length; i++) {
			ds_calcParamsGrid.run("insert", {
				__skipSelectAfterInsert: true,
				execParams: {
					ID: ds_calcParamsGrid.generateID(),
					calcParamsDictID: data[i].ID,
					calcParamsID: ctx.mParams.execParams.ID
				}
			});
		}
	}
};

me.entity.addMethod("beforeafterinsert");