import { WinstonLogProvider } from './WinstonLogProvider';
import { PortAllocator } from './PortAllocator';
import { LogProvider } from './LogProvider';
import { ServerCore } from './ServerCore'
const grpc : any = require('grpc');

//The port number that we listen on
const PORT = 50051;

async function main()
{
	//Create a Winston-based logging instance
	let logger : LogProvider = new WinstonLogProvider();
	
	//Create a port allocator to generate sequential port numbers for child process gRPC servers
	let ports = new PortAllocator(PORT + 1);
	
	try
	{
		//Dynamically generate the code for our protobuf service description
		let proto = grpc.load(__dirname + '/../../../proto/server.proto');
		
		//Create the server core
		let core = await ServerCore.createServer(proto, ports, logger);
		
		//Create and start the RPC server, binding it to the server core
		let server = new grpc.Server();
		server.addService(proto.Server.service, core.getRpcImplementations());
		server.bind(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure());
		server.start();
	}
	catch (err) {
		logger.error(err.message, {stack: err.stack});
	}
}

main();