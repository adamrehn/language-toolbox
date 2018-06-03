try:
	_______lastResult = $$__INVOCATION__$$
	_______unitTestResultVectors[-1]["result"].append({"output":repr(_______lastResult), "type":type(_______lastResult).__name__, "exception":False})
except Exception as err:
	_______unitTestResultVectors[-1]["result"].append({"output":repr(err), "type":type(err).__name__, "exception":True})
