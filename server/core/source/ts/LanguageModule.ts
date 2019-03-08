import { SubprocessManagerBase } from './SubprocessManagerBase';
import { DockerSandbox, SandboxOutput } from './DockerSandbox';
import { spawn, SpawnOptions } from 'child_process';
import { LogProvider } from './LogProvider';
import { Utility } from './Utility';
import { setTimeout } from 'timers';
import { readFileSync } from 'fs';
import * as jp from 'jsonpath';
import * as path from 'path';

//Parse the server and language module proto files at load-time
const grpc : any = require('grpc');
const serverProto = grpc.load(__dirname + '/../../../proto/server.proto')
const langProto = grpc.load(__dirname + '/../../../proto/language.proto')

//The placeholder for the port number that module descriptors should use in their command
const PORT_PLACEHOLDER = '${PORT}';

//The number of milliseconds we wait for a child process's gRPC server to start
const WAIT_TIME = 2000;

export class LanguageModule extends SubprocessManagerBase
{
	private logger : LogProvider;
	private workingDir : string;
	private command : string[];
	private port : number = 0;
	private rpcClient : any = null;
	private capabilities : any = null;
	private sandboxDetails : any = null;
	
	public constructor(descriptorFile : string, logger : LogProvider)
	{
		//Create our event emitter and store a reference to the logger
		super();
		this.logger = logger;
		
		try
		{
			//Extract the directory path from the descriptor file path
			this.workingDir = path.dirname(descriptorFile);
			
			//Attempt to read the descriptor file
			let descriptorData = readFileSync(descriptorFile, {encoding: 'utf-8'});
			
			//Verify that the data is a valid ModuleDescriptor message
			let descriptor = langProto.ModuleDescriptor.decodeJSON(descriptorData);
			
			//Extract the descriptor fields
			this.command = descriptor.command;
			
			//Verify that the module's command string contains both a base command and a placeholder for the port number
			if (this.command.length < 2 || this.command.indexOf(PORT_PLACEHOLDER) == -1) {
				throw new Error();
			}
		}
		catch (err) {
			throw new Error(`the file ${descriptorFile} is not a valid language module descriptor`);
		}
	}
	
	//Attempts to start the child process and establish a connection to its gRPC server, returning the module's language on success
	public start(port : number)
	{
		return new Promise<boolean>((resolve : Function, reject : Function) =>
		{
			//If the child process is already running, emit an error
			if (this.isRunning() === true)
			{
				reject(new Error('Cannot start a new child process while the previous one is still running.'));
				return;
			}
			
			//Store the port number and replace the placeholder in the command with the correct value
			this.port = port;
			let commandFilled = this.command.map((arg : string) => { return ((arg.toUpperCase() == PORT_PLACEHOLDER) ? this.port.toString() : arg); });
			
			//Split the base command from the arguments
			let baseCommand = <string>(commandFilled.shift());
			let args = commandFilled;
			
			//Set the HOME environment variable to the appropriate value for our non-root user since `spawn` doesn't do this for us
			process.env['HOME'] = '/tmp'
			
			//Spawn the child process as our non-root user
			this.process = spawn(baseCommand, args, {cwd: this.workingDir, uid: 1000, gid: 1000});
			
			//Emit an error if the child process could not be started
			this.process.once('error', (err : Error) => {
				reject(new Error('Failed to start child process.'));
			});
			
			//Close the stdin of the child process
			this.process.stdin.end();
			
			//Log child process stdout data
			this.process.stdout.on('data', (data : Buffer) =>
			{
				let suffix = (this.capabilities !== null) ? this.capabilities.language : path.basename(this.workingDir);
				this.logger.verbose(`[child stdout ${suffix}]: "${data.toString().trim()}"`);
			});
			
			//Log child process stderr data
			this.process.stderr.on('data', (data : Buffer) =>
			{
				let suffix = (this.capabilities !== null) ? this.capabilities.language : path.basename(this.workingDir);
				this.logger.verbose(`[child stderr ${suffix}]: "${data.toString().trim()}"`);
			});
			
			//Register our event handler for process termination
			this.process.on('exit', (code : number, signal? : number) =>
			{
				this.process = null;
				this.events.emit('close', code);
			});
			
			//If the process terminates before this promise is fulfilled, emit an error
			const terminationChecker = (code : number) => {
				reject(new Error(`child process terminated prematurely with exit code ${code}`));
			};
			this.events.once('close', terminationChecker);
			
			//Wait briefly so the gRPC server has time to start, and then attempt to establish a connection
			setTimeout(() =>
			{
				try
				{
					//Attempt to connect to the child gRPC server
					this.rpcClient = new langProto.LanguageModule(`localhost:${this.port}`, grpc.credentials.createInsecure());
					
					//Remove the termination checker callback
					this.events.removeListener('close', terminationChecker);
					
					//Attempt to query the module about its language capabilities
					this.rpcClient.GetCapabilities({}, (err : Error, response : any) =>
					{
						if (err) {
							reject(new Error(`failed to retrieve language module capabilities (${err.message})`));
						}
						else
						{
							//Store the result of the capabilities query and report success
							this.capabilities = response;
							resolve(true);
						}
					});
				}
				catch (err)
				{
					//Remove the termination checker callback and kill the child process
					this.events.removeListener('close', terminationChecker);
					this.kill();
					
					//Emit an error to indicate that the language module could not be started
					reject(new Error('failed to connect to child process gRPC server'));
				}
			},
			WAIT_TIME);
		});
	}
	
	//Attempts to restart the child process if it crashed after having previously started successfully
	public restart() {
		return this.start(this.port);
	}
	
	//Returns the capabilities description for this language module
	public GetCapabilities() {
		return this.capabilities;
	}
	
	//Retrieves the sandbox details for this language module
	public GetSandboxDetails()
	{
		return new Promise<any>((resolve : Function, reject : Function) =>
		{
			//If we have already cached the sandbox details, use the cached version
			if (this.sandboxDetails !== null)
			{
				resolve(this.sandboxDetails);
				return;
			}
			
			//Retrieve the sandbox details and cache the result
			this.rpcClient.GetSandboxDetails({}, (err : Error, response : any) =>
			{
				if (err) {
					reject(err);
				}
				else
				{
					this.sandboxDetails = response;
					resolve(this.sandboxDetails);
				}
			});
		});
	}
	
	//Performs AST generation
	public GenerateAst(source : string)
	{
		return new Promise<any>((resolve : Function, reject : Function) =>
		{
			this.rpcClient.GenerateAst({'language': '', 'source': source}, (err : Error, response : any) =>
			{
				if (err) {
					reject(err);
				}
				else {
					resolve(response);
				}
			});
		});
	}
	
	//Performs AST matching
	public async PerformAstMatch(source : string, patterns : string[])
	{
		try
		{
			//Generate the AST
			let ast = await this.GenerateAst(source);
			let nodes = JSON.parse(ast.ast);
			
			//Apply the JSONPath patterns and retrieve the list of matches
			let matches : {}[] = [];
			for (let pattern of patterns)
			{
				matches.push({'matches': jp.nodes(nodes, pattern).map((match : any) => {
					return {'object': JSON.stringify(match.value), 'path': match.path.map((component : any) => `${component}`)};
				})});
			}
			
			return {'error': '', 'ast': ast.ast, 'matches': matches};
		}
		catch (err)
		{
			//Transmit any errors to the client
			return {'error': err.message, 'ast': '', 'matches': []};
		}
	}
	
	//Performs regex-based I/O matching
	public async PerformIOMatch(source : string, invocation : string, stdin : string, combine : boolean, patternsStdOut : string[], patternsStdErr : string[], customTokens : boolean, timeout : number)
	{
		try
		{
			//Attempt to perform codegen
			let codegenResult = await this.CodegenIOMatching(source, invocation, stdin);
			if (codegenResult.error != "") {
				throw new Error(codegenResult.error);
			}
			
			//Attempt to execute the generated code in our sandbox container
			let executionResult = await this.ExecuteSandboxedCode(codegenResult.data, combine, timeout);
			
			//Lambda to apply a set of regular expressions to the sandbox stdout (treating the output as a UTF-8 string)
			const applyPatterns = (output : Buffer, patterns : string[]) =>
			{
				let decoded = output.toString('utf-8');
				return patterns.map((pattern : string) =>
				{
					let matches = decoded.match(pattern);
					return {'groups': (matches !== null) ? matches : []};
				});
			};
			
			//If custom token expansion is enabled, expand any tokens in our regular expressions
			if (customTokens === true)
			{
				patternsStdOut = Utility.expandRegexes(patternsStdOut);
				patternsStdErr = Utility.expandRegexes(patternsStdErr);
			}
			
			//Apply our regular expressions to the sandbox stdout and stderr
			let matchesStdOut = applyPatterns(executionResult.stdout, patternsStdOut);
			let matchesStdErr = applyPatterns(executionResult.stderr, patternsStdErr);
			
			//Return both the raw output and the match results
			return {'error': '', 'stdout': executionResult.stdout, 'stderr': executionResult.stderr, 'matchesStdOut': matchesStdOut, 'matchesStdErr': matchesStdErr};
		}
		catch (err)
		{
			//Transmit any errors to the client
			return {'error': err.message, 'stdout': new Uint8Array(0), 'stderr': new Uint8Array(0), 'matchesStdOut': [], 'matchesStdErr': []};
		}
	}
	
	//Performs multiple I/O matches and aggregates the results
	public async PerformCompoundIOMatch(common : any, requests : any[])
	{
		try
		{
			//Perform each of our nested requests
			let results : any[] = [];
			for (let request of requests)
			{
				//Perform the request, using the common field values as appropriate
				let response = await this.PerformIOMatch(
					(request.source.length > 0) ? request.source : common.source,
					(request.invocation.length > 0) ? request.invocation : common.invocation,
					(request.stdin.length > 0) ? request.stdin : common.stdin,
					(common.combine === true) ? common.combine : request.combine,
					(request.patternsStdOut.length > 0) ? request.patternsStdOut : common.patternsStdOut,
					(request.patternsStdErr.length > 0) ? request.patternsStdErr : common.patternsStdErr,
					(common.customTokens === true) ? common.customTokens : request.customTokens,
					(request.timeout > 0) ? request.timeout : common.timeout
				);
				
				//Propagate any errors
				if (response['error'].length > 0) {
					return {'error': response['error'], 'request': request, 'results': []};
				}
				
				//Add the results to our aggregated list
				results.push(response);
			}
			
			//Return the aggregated results
			return {'error': '', 'results': results};
		}
		catch (err)
		{
			//Transmit any errors to the client
			//(Note that we should only ever reach this line if something went wrong internally)
			return {'error': err.message, 'results': []};
		}
	}
	
	//Runs unit tests
	public async PerformUnitTests(source : string, setup : string, teardown : string, tests : any, timeout : number)
	{
		try
		{
			//Attempt to perform codegen
			let codegenResult = await this.CodegenUnitTests(source, setup, teardown, tests);
			if (codegenResult.error != "") {
				throw new Error(codegenResult.error);
			}
			
			//Attempt to execute the unit tests in our sandbox container
			let executionResult = await this.ExecuteSandboxedCode(codegenResult.data, false, timeout);
			
			try
			{
				//Validate the unit test output as a valid list of result vectors
				let output = `{"error": "", "passed": 0, "failed": 0, "results": ${executionResult.stdout.toString()}}`;
				let results : any[] = Array.from(serverProto.PerformUnitTestsResponse.decodeJSON(output).results);
				
				//Populate the "passed" field for each test case of each unit test
				for (let [index, test] of tests.entries())
				{
					let expected = Array.from(test.cases).map((testCase : any) => { return Utility.sortedJson(testCase.expected); });
					let actual = Array.from(results[index].result).map((testResult : any) => { return Utility.sortedJson(testResult); });
					results[index].passed = expected.map((expect : any, index : number) => { return expect == actual[index]; });
				}
				
				//Determine the total number of test cases we have across all of the specified tests
				let arraySum = (prev : any, curr : any) => { return prev + curr; };
				let casesPerTest : any[] = tests.map((test : any) => { return Array.from(test.cases).length; });
				let totalCases = casesPerTest.reduce(arraySum);
				
				//Determine how many test cases passed for each unit test
				let passedPerTest = tests.map((test : any, index : number) => {
					return (results[index].passed.filter((passed : boolean) => passed)).length;
				});
				
				//Determine the total number of passed and failed test cases
				let totalPassed = passedPerTest.reduce(arraySum);
				let totalFailed = totalCases - totalPassed;
				
				//Construct a fresh PerformUnitTestsResponse object with our populated result data
				return {'error': '', 'passed': totalPassed, 'failed': totalFailed, 'results': results};
			}
			catch (err) {
				throw new Error(`invalid unit test output, test code has likely tampered with stdout (error: ${err})`);
			}
		}
		catch (err)
		{
			//Transmit any errors to the client
			return {'error': err.message, 'passed': 0, 'failed': 0, 'results': []};
		}
	}
	
	//Performs codegen for performing I/O matching
	private CodegenIOMatching(source : string, invocation : string, stdin : string)
	{
		return new Promise<any>((resolve : Function, reject : Function) =>
		{
			this.rpcClient.CodegenIOCapture({
				'source': source,
				'invocation': invocation,
				'stdin': stdin
			},
			(err : Error, response : any) =>
			{
				if (err) {
					reject(err);
				}
				else {
					resolve(response);
				}
			});
		});
	}
	
	//Performs codegen for running unit tests
	private CodegenUnitTests(source : string, setup : string, teardown : string, tests : any)
	{
		return new Promise<any>((resolve : Function, reject : Function) =>
		{
			this.rpcClient.CodegenUnitTests({
				'source': source,
				'setup': setup,
				'teardown': teardown,
				'tests': tests
			},
			(err : Error, response : any) =>
			{
				if (err) {
					reject(err);
				}
				else {
					resolve(response);
				}
			});
		});
	}
	
	//Executes the results of a codegen RPC in our sandbox container
	private async ExecuteSandboxedCode(code : Buffer, combine : boolean, timeout : number)
	{
		try
		{
			//Retrieve our sandbox details and attempt to run the sandbox container
			let details = await this.GetSandboxDetails();
			let sandbox = new DockerSandbox();
			return await sandbox.run(details, code, combine, timeout);
		}
		catch (err)
		{
			//Propagate any errors
			throw err;
		}
	}
}
