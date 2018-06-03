//Parse the language module proto file at load-time
import * as esprima from 'esprima';
import * as grpc from 'grpc';
const proto : any = grpc.load(__dirname + '/../../../../proto/language.proto');

//Read our unit test template code at load-time
import { readFileSync } from 'fs';
const IO_CAPTURE_HARNESS = readFileSync(__dirname + '/../template/IOCaptureHarness.js', {encoding: 'utf-8'});
const TEST_HARNESS       = readFileSync(__dirname + '/../template/UnitTestHarness.js',  {encoding: 'utf-8'});
const TEST_CASE_TEMPLATE = readFileSync(__dirname + '/../template/TestCaseTemplate.js', {encoding: 'utf-8'});

export class LanguageModuleImp
{
	public static GetCapabilities(call : grpc.ServerUnaryCall<any>, callback : grpc.sendUnaryData<any>)
	{
		callback(null, {
			'language': 'javascript',
			'capabilities': proto.Capabilities['GENERATE_ASTS'] | proto.Capabilities['IO_MATCHING'] | proto.Capabilities['UNIT_TESTING']
		});
	}
	
	public static GetSandboxDetails(call : grpc.ServerUnaryCall<any>, callback : grpc.sendUnaryData<any>)
	{
		callback(null, {
			'image': 'adamrehn/language-toolbox-sandbox-javascript',
			'command': ['bash', '-c', 'cat > /tmp/temp.js && node /tmp/temp.js']
		});
	}
	
	public static GenerateAst(call : grpc.ServerUnaryCall<any>, callback : grpc.sendUnaryData<any>)
	{
		try
		{
			let ast = esprima.parseScript(call.request.source);
			callback(null, {
				'error': '',
				'ast': JSON.stringify(ast)
			});
		}
		catch (err)
		{
			callback(null, {
				'error': `${err}`,
				'ast': ''
			});
		}
	}
	
	public static CodegenIOCapture(call : grpc.ServerUnaryCall<any>, callback : grpc.sendUnaryData<any>)
	{
		try
		{
			//Inject the stdin data in JSON-encoded form
			let stdinData = JSON.stringify(call.request.stdin);
			stdinData = stdinData.substr(1, stdinData.length - 2).replace(/\\/g, '\\\\');
			let combinedCode = IO_CAPTURE_HARNESS.replace('$$__STDIN_DATA__$$', stdinData);
			
			//Inject the generated code into our template code
			combinedCode = combinedCode.replace('$$__USER_CODE__$$', call.request.source + '\n\n' + call.request.invocation);
			callback(null, {
				'error': '',
				'data': Buffer.from(combinedCode, 'utf-8')
			});
		}
		catch (err)
		{
			callback(null, {
				'error': `${err}`,
				'data': ''
			});
		}
	}
	
	public static CodegenUnitTests(call : grpc.ServerUnaryCall<any>, callback : grpc.sendUnaryData<any>)
	{
		try
		{
			//Iterate over each unit test and generate the source code for its test cases
			let testCaseCode = '';
			for (let test of call.request.tests)
			{
				testCaseCode += '_______unitTestResultVectors.push({"result": []})\n';
				testCaseCode += test.setup + '\n';
				for (let testCase of test.cases)
				{
					testCaseCode += testCase.setup + '\n';
					testCaseCode += TEST_CASE_TEMPLATE.replace('$$__INVOCATION__$$', `${test.invocation}(${testCase.inputs.join(',')})`);
					testCaseCode += testCase.teardown + '\n';
				}
				testCaseCode += test.teardown + '\n';
			}
			
			//Inject the generated code into our template code
			let combinedCode = TEST_HARNESS.replace('$$__USER_CODE__$$', call.request.source);
			combinedCode = combinedCode.replace('$$__TEST_CASE_CODE__$$', testCaseCode);
			callback(null, {
				'error': '',
				'data': Buffer.from(combinedCode, 'utf-8')
			});
		}
		catch (err)
		{
			callback(null, {
				'error': `${err}`,
				'data': ''
			});
		}
	}
}
