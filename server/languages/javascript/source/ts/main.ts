import { LanguageModuleImp } from './LanguageModuleImp'
const grpc : any = require('grpc');

async function main()
{
	if (process.argv.length > 2)
	{
		try
		{
			//Verify that the specified port number is valid
			let port = Number.parseInt(process.argv[2]);
			if (isNaN(port) === true) {
				throw new Error(`invalid port number "${process.argv[2]}"`);
			}
			
			//Dynamically generate the code for our protobuf service description
			let proto = grpc.load(__dirname + '/../../../../proto/language.proto');
			
			//Debug output
			console.log(`Starting gRPC server on port ${port}...`);
			
			//Create and start the RPC server, binding it to our language module implementation
			let server = new grpc.Server();
			server.addService(proto.LanguageModule.service, {
				'GetCapabilities': LanguageModuleImp.GetCapabilities,
				'GetSandboxDetails': LanguageModuleImp.GetSandboxDetails,
				'GenerateAst': LanguageModuleImp.GenerateAst,
				'CodegenIOCapture': LanguageModuleImp.CodegenIOCapture,
				'CodegenUnitTests': LanguageModuleImp.CodegenUnitTests
			});
			server.bind(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure());
			server.start();
		}
		catch (err) {
			console.error(err.message, {stack: err.stack});
		}
	}
	else {
		console.log('Error: must specify port number to listen on.');
	}
}

main();