try {
	let _______lastResult = $$__INVOCATION__$$;
	_______unitTestResultVectors[_______unitTestResultVectors.length-1]["result"].push({"output": `${_______lastResult}`, "type": _______lastResult.constructor.name, "exception": false});
}
catch (err) {
	_______unitTestResultVectors[_______unitTestResultVectors.length-1]["result"].push({"output": `${err}`, "type": err.constructor.name, "exception": true});
}
