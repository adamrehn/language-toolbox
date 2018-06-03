(function()
{
	//Buffer all output to prevent test cases writing to stdout or stderr
	let stdoutOrig = process.stdout.write;
	let stderrOrig = process.stderr.write;
	process.stdout.write = (chunk, encoding, callback) => { return true; };
	process.stderr.write = (chunk, encoding, callback) => { return true; };
	
	
	//The user source code will be injected here
	$$__USER_CODE__$$
	
	
	//The code that is leveraged by our test case invocation code
	let _______unitTestResultVectors = [];
	
	
	//Our test case invocation code will be injected here
	$$__TEST_CASE_CODE__$$
	
	
	//Restore stdout to its original value and print the result vector
	process.stdout.write = stdoutOrig;
	process.stderr.write = stderrOrig;
	console.log(JSON.stringify(_______unitTestResultVectors));
}
());