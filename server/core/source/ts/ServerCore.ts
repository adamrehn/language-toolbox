import { DockerSandbox, SandboxOutput } from './DockerSandbox';
import { LanguageModule } from './LanguageModule';
import { ModuleManager } from './ModuleManager';
import { PortAllocator } from './PortAllocator';
import { LogProvider } from './LogProvider';
import * as grpc from 'grpc';
import * as path from 'path';

type RpcImplementation = (m : LanguageModule, call : grpc.ServerUnaryCall<any>) => Promise<any>;

class RpcDetails
{
	public capability : number;
	public language : (request : any) => string;
	public implementation : RpcImplementation;
	
	public constructor(capability : number, language : (request : any) => string, implementation : RpcImplementation)
	{
		this.capability = capability;
		this.language = language;
		this.implementation = implementation;
	}
}

export class ServerCore
{
	private serverProto : any;
	private logger : LogProvider;
	private modules : ModuleManager;
	
	//This class should not be instantiated directly, instead use ServerCore.createServer()
	protected constructor(serverProto : any, logger : LogProvider, modules : ModuleManager)
	{
		this.serverProto = serverProto;
		this.logger = logger;
		this.modules = modules;
	}
	
	//Creates a new ServerCore instance
	public static async createServer(serverProto : any, ports : PortAllocator, logger : LogProvider)
	{
		try
		{
			//Load our language modules
			let languagesDir = path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'languages');
			let modules = await ModuleManager.createFromDir(languagesDir, ports, logger);
			
			//Emit a log message with the list of detected languages
			logger.info('Loaded language modules for languages: ' + modules.listLanguages().join(', '));
			
			//Populate our ServerCore instance
			return new ServerCore(serverProto, logger, modules);
		}
		catch (err)
		{
			//Propagate any errors
			throw err;
		}
	}
	
	//Returns the mapping from RPC names to details
	public getRpcMappings() : {[name : string]: RpcDetails}
	{
		const capabilities = this.serverProto.Capabilities;
		const mappings = {
			
			'GenerateAst': new RpcDetails(
				capabilities.GENERATE_ASTS,
				
				(request : any) => request.language,
				
				(m : LanguageModule, call : grpc.ServerUnaryCall<any>) => {
					return m.GenerateAst(call.request.source);
				}
			),
			
			'PerformAstMatch': new RpcDetails(
				capabilities.GENERATE_ASTS,
				
				(request : any) => request.language,
				
				(m : LanguageModule, call : grpc.ServerUnaryCall<any>) => {
					return m.PerformAstMatch(call.request.source, call.request.patterns);
				}
			),
			
			'PerformIOMatch': new RpcDetails(
				capabilities.IO_MATCHING,
				
				(request : any) => request.language,
				
				(m : LanguageModule, call : grpc.ServerUnaryCall<any>) => {
					return m.PerformIOMatch(call.request.source, call.request.invocation, call.request.stdin, call.request.combine, call.request.patternsStdOut, call.request.patternsStdErr, call.request.customTokens, call.request.timeout);
				}
			),
			
			'PerformCompoundIOMatch': new RpcDetails(
				capabilities.IO_MATCHING,
				
				(request : any) => request.common.language || request.requests[0].language,
				
				(m : LanguageModule, call : grpc.ServerUnaryCall<any>) => {
					return m.PerformCompoundIOMatch(call.request.common, call.request.requests);
				}
			),
			
			'PerformUnitTests': new RpcDetails(
				capabilities.UNIT_TESTING,
				
				(request : any) => request.language,
				
				(m : LanguageModule, call : grpc.ServerUnaryCall<any>) => {
					return m.PerformUnitTests(call.request.source, call.request.setup, call.request.teardown, call.request.tests, call.request.timeout);
				}
			)
		};
		
		return mappings;
	}
	
	//Returns the RPC service implementations mapping for gRPC
	public getRpcImplementations() : {[name : string]: grpc.handleCall<any,any>}
	{
		//Create the mappings for ListCapabilities and InvokeCustomSandbox, which are always supported
		let implementations : {[name : string]: grpc.handleCall<any,any>} = {
			'ListCapabilities': this.ListCapabilities.bind(this),
			'InvokeCustomSandbox': this.InvokeCustomSandbox.bind(this)
		};
		
		//Add the mappings for each of the remaining RPCs, ensuring they are called via verifyAndInvoke()
		let mappings = this.getRpcMappings();
		for (let rpcName of Object.keys(mappings)) {
			implementations[rpcName] = this.verifyAndInvoke.bind(this, rpcName, mappings[rpcName]);
		}
		
		return implementations;
	}
	
	//Verifies that the requested language module supports the requested RPC call, and invokes it if it does
	public async verifyAndInvoke(rpcName : string, rpc : RpcDetails, call : grpc.ServerUnaryCall<any>, callback : grpc.sendUnaryData<any>)
	{
		try
		{
			//If the requested language module does not support the requested RPC, report the error
			let language = rpc.language(call.request);
			if (this.isSupported(call, language, rpc.capability) === false) {
				this.reportUnimplemented(rpcName, call, callback);
			}
			else
			{
				//Retrieve the module and invoke the RPC
				let module = this.modules.getModule(language);
				let promise = rpc.implementation(module, call);
				let result = await promise;
				callback(null, result);
			}
		}
		catch (err) {
			this.reportUnhandledError(err, callback);
		}
	}
	
	//Determines if the requested language module supports the requested RPC call
	private isSupported(call : grpc.ServerUnaryCall<any>, language : string, capability : number)
	{
		try
		{
			let module = this.modules.getModule(language);
			let capabilities = (<number>(module.GetCapabilities().capabilities));
			return ((capabilities & capability) != 0);
		}
		catch (err) {
			return false;
		}
	}
	
	//Reports that the requested language module does not support the requested RPC call
	private reportUnimplemented(rpcName : string, call : grpc.ServerUnaryCall<any>, callback : grpc.sendUnaryData<any>)
	{
		callback({
			name: '',
			message: `The ${rpcName}() RPC request is not supported for the language "${call.request.language}"`,
			code: grpc.status.UNIMPLEMENTED
		}, {});
	}
	
	//Reports internal errors resulting from RPCs that are supposed to catch and transmit their errors cleanly
	private reportUnhandledError(err : Error, callback : grpc.sendUnaryData<any>)
	{
		callback({
			name: '',
			message: `${err}`,
			code: grpc.status.INTERNAL
		}, {});
	}
	
	//ListCapabilities() RPC implementation
	public ListCapabilities(call : grpc.ServerUnaryCall<any>, callback : grpc.sendUnaryData<any>)
	{
		//Iterate over our loaded language modules and query their capabilities
		let capabilities = this.modules.listLanguages().map((language : string) => {
			return this.modules.getModule(language).GetCapabilities();
		});
		
		//Return the list to the client
		callback(null, capabilities);
	}
	
	//InvokeCustomSandbox() RPC implementation
	public InvokeCustomSandbox(call : grpc.ServerUnaryCall<any>, callback : grpc.sendUnaryData<any>)
	{
		//Attempt to execute the supplied code in the custom sandbox image
		let sandbox = new DockerSandbox();
		let promise = sandbox.run(
			{'image': call.request.image, 'command': call.request.command},
			call.request.stdin,
			call.request.combine,
			call.request.timeout
		);
		
		//Return the result to the client
		promise.then((output : SandboxOutput) =>
		{
			callback(null, {
				'error': '',
				'stdout': output.stdout,
				'stderr': output.stderr
			});
		})
		.catch((err : Error) => {
			callback(null, {'error': err.message});
		});
	}
}
