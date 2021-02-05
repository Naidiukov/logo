
var not = '!';
var and = '&';
var or = '|';
var left = '(';
var right = ')';
var delims = [not, and, or, left, right];

function indexOfAny(source, delims, pos) {
	var result=-1;
	delims.forEach(function(delim) {
		var idx = source.indexOf(delim, pos);
		if ((idx >=0) && ((idx < result) || (result == -1)))
			result = idx;
	});
	return result;
}

function convertToRPN(equation) {
	var result=[];

	var priorityBase = 0;
	var opStack = [];
	var pos = 0;
	var nextDelimPos = 0;
	while (pos < equation.length) {
		nextDelimPos = indexOfAny(equation, delims, pos);
		var item = ((nextDelimPos != -1)?equation.substr(pos, nextDelimPos-pos):equation.substr(pos)).trim();
		var delim = (nextDelimPos != -1)?equation[nextDelimPos]:null;

		var priority = priorityBase;
		switch (delim) {
			case not:
				priority += 3;
				break;
			case and:
				priority += 2;
				if (item != "") result.push(item);
				break;
			case or:
				priority += 1;
				if (item != "") result.push(item);
				break;
			case left:
				priorityBase += 10;
				priority = priorityBase;
				break;
			case right:
				priorityBase -= 10;
				priority = priorityBase;
				if (item != "") result.push(item);
				break;
			default:
				if (item != "") result.push(item);
				break;
		}
		while ((opStack.length > 0)&&(opStack[opStack.length-1].priority >= priority))
			result.push(opStack.pop().item);
		if ((delim != null)&&(delim != left)&&(delim != right))
			opStack.push({ priority: priority, item: delim });
		pos = (nextDelimPos != -1)?nextDelimPos + 1:equation.length;
	}

	return result;
}

function evalRPN(equationRPN, getValue) {
	var exStack=[];
	equationRPN.forEach(function(item) {
		switch (item[0]) {
			case and:
				var andArg2 = exStack.pop();
				var andArg1 = exStack.pop();
				var andResult = ((andArg1.result !== null)?andArg1.result:getValue(andArg1.item))&&((andArg2.result !== undefined)?andArg2.result:getValue(andArg2.item));
				exStack.push({ item: item, result: andResult });
				break;
			case or:
				var orArg2=exStack.pop();
				var orArg1=exStack.pop();
				var orResult=((orArg1.result !== null)?orArg1.result:getValue(orArg1.item))||((orArg2.result !== null)?orArg2.result:getValue(orArg2.item));
				exStack.push({ item: item, result: orResult });
				break;
			case not:
				var notArg = exStack.pop();
				var notResult = !((notArg.result !== null)?notArg.result:getValue(notArg.item));
				exStack.push({ item: item, result: notResult });
				break;
			default:
				exStack.push({ item: item, result: null });
				break;
		}
	});
	if (exStack.length > 0) {
		var arg=exStack.pop();
		return (arg.result !== null)?arg.result:getValue(arg.item);
	} else return true;
}

function evalEquation(equation, getValue) {
	return evalRPN(convertToRPN(equation), getValue);
}

function checkAccess(functionCode, dataRelatedCheck, getIsSuperUser, getFunctionCodes) {
	var isSuperUser = getIsSuperUser();
	if (isSuperUser) {
		if (!evalEquation(functionCode, function() { return true; }))
			return false;
	} else {
		var functionCodes = getFunctionCodes();
		if (!evalEquation(functionCode, function(s) { return functionCodes.indexOf(s)>=0; }))
			return false;
		if (dataRelatedCheck != null)
			return dataRelatedCheck();
	}
	return true;
}

function checkServerAccess(functionCode, dataRelatedCheck) {
	function getIsSuperUser() {
		return Session.uData.roles.split(",").indexOf('Admin') >= 0;
	}
	function getFunctionCodes() {
		return Session.uData.functionCodes;
	}
	return checkAccess(functionCode, dataRelatedCheck, getIsSuperUser, getFunctionCodes);
}

function checkClientAccess(functionCode, dataRelatedCheck) {
	function getIsSuperUser() {
		return $App.connection.userData().roles.split(",").indexOf('Admin') >= 0;
	}
	function getFunctionCodes() {
		return $App.connection.userData().functionCodes;
	}
	return checkAccess(functionCode, dataRelatedCheck, getIsSuperUser, getFunctionCodes);
}

if (UB.isServer) {
	exports.checkAccess = checkServerAccess;
	exports.hasFullDecNumAccess = function () {
		return checkServerAccess("03.07_01");
	};
} else
	Ext.define('PGO.AccessManager', {
		statics: {
			checkAccess: checkClientAccess
		}
	});