const me = inv_calcParams;
// const _ = require('lodash');

me.beforeafterinsert = function (ctx) {
	if (!ctx.mParams.execParams.isNotInsertGrid) {
		let data = UB.Repository('inv_calcParamsDict')
				.attrs('ID')
				.where('parentID', 'isNotNull')
				.selectAsObject(),
			ds_calcParamsGrid = UB.DataStore('inv_calcParamsGrid');

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

me.test = function () {
 var fs = require('fs'),
   iconvlite = require('iconv-lite'),
	 file = fs.readFileSync(path.join(process.configPath, 'vp3111E0.txt')),
	 str = iconvlite.decode(file, 'win1251');

 let splitByHeadBodyFoot = str.split('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -'),
	 header = splitByHeadBodyFoot[0],
	 body = splitByHeadBodyFoot[1],
	 footer = splitByHeadBodyFoot[2],
	 splitBodyBySplit = body.split('-----------------------------------------------------------------------------------------'),
	 splitBodyByNewLine,
	 payDate,
	 paySum,
	 payer,
	 payPurpose,
	 payCode;
  splitBodyBySplit.splice(splitBodyBySplit.length - 1, 1);
  debugger
 splitBodyBySplit.forEach((item)=>{
   splitBodyByNewLine = item.split('\n');
   splitBodyByNewLine.splice(splitBodyByNewLine.length - 1, 1);
   payCode = splitBodyByNewLine[2].substring(0,3).trim();
   paySum = splitBodyByNewLine[2].substring(51,69).trim();
   payer = splitBodyByNewLine[4].trim();
   splitBodyByNewLine.splice(0,5);
   payPurpose = splitBodyByNewLine.join(' ');
 });
 debugger
};

me.entity.addMethod("beforeafterinsert");