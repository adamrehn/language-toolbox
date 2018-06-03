(function()
{
	//Use JSON to decode the stdin data
	let _______stdinData = JSON.parse('{"data":"$$__STDIN_DATA__$$"}')['data'];
	
	//Wrap the stdin data in a Readable stream (based on this example code: <https://stackoverflow.com/a/22085851>)
	const _______Readable = require('stream').Readable;
	var _______stdinStream = new _______Readable();
	_______stdinStream._read = () => {};
	_______stdinStream.push(_______stdinData);
	_______stdinStream.push(null);
	
	//Redirect process.stdin to our custom stream
	process.stdin.wrap(_______stdinStream);
	
	//The user source code will be injected here
	$$__USER_CODE__$$
}
());