function ioStuff()
{
	console.log('This is stdout data.');
	console.error('This is stderr data.');
	
	let data = '';
	
	process.stdin.once('readable', () =>
	{
		let chunk;
		while (chunk = process.stdin.read()) {
			data += chunk;
		}
		
		console.log('The stdin data: ' + data);
	});
}
