from . import common_pb2 as common_messages
from . import language_pb2 as language_messages
from . import language_pb2_grpc as service

from os import path
from os.path import abspath, dirname, join
from .AstTransformer import AstTransformer
from .Utility import Utility
import ast, json, sys

# Retrieve the enum values for the list of processing capabilities
CAPABILITIES = dict(common_messages.Capabilities.items())

class LanguageModuleImp(service.LanguageModuleServicer):
	
	def __init__(self):
		
		# Read our I/O matching and unit test template code
		scriptDir = dirname(abspath(__file__))
		dataDir = join(scriptDir, 'data')
		self.ioHarness = Utility.readFile(join(dataDir, 'IOMatchingHarness.py'))
		self.testHarness = Utility.readFile(join(dataDir, 'UnitTestHarness.py'))
		self.testCaseTemplate = Utility.readFile(join(dataDir, 'TestCaseTemplate.py'))
	
	def GetCapabilities(self, request, context):
		return common_messages.LanguageCapabilities(
			language = 'python',
			capabilities = CAPABILITIES['GENERATE_ASTS'] | CAPABILITIES['IO_MATCHING'] | CAPABILITIES['UNIT_TESTING']
		)
	
	def GetSandboxDetails(self, request, context):
		return language_messages.SandboxDetails(
			image = 'adamrehn/language-toolbox-sandbox-python',
			command = ['bash', '-c', 'cat > /tmp/temp.py && python3 /tmp/temp.py']
		)
	
	def GenerateAst(self, request, context):
		parsed = ast.parse(request.source)
		transform = AstTransformer()
		transformed = transform.visit(parsed)
		return common_messages.GenerateAstResponse(ast=json.dumps(transformed))
	
	def CodegenIOCapture(self, request, context):
		
		# Inject the source code and stdin data into our template code
		combinedCode = self.ioHarness.replace('$$__USER_CODE__$$', request.source + '\n\n' + request.invocation)
		combinedCode = combinedCode.replace('$$__STDIN_DATA__$$', request.stdin.replace("'''", "\\'\\'\\'"))
		return language_messages.CodegenIOCaptureResponse(error="", data=combinedCode.encode('utf-8'))
	
	def CodegenUnitTests(self, request, context):
		
		# Iterate over each unit test and generate the source code for its test cases
		testCaseCode = ''
		for test in request.tests:
			testCaseCode += '_______unitTestResultVectors.append({"result": []})\n'
			testCaseCode += test.setup + '\n'
			for case in test.cases:
				testCaseCode += case.setup + '\n'
				testCaseCode += self.testCaseTemplate.replace('$$__INVOCATION__$$', '{}({})'.format(test.invocation, ','.join(case.inputs)))
				testCaseCode += case.teardown + '\n'
			testCaseCode += test.teardown + '\n'
		
		# Inject the generated code into our template code
		combinedCode = self.testHarness.replace('$$__USER_CODE__$$', request.source)
		combinedCode = combinedCode.replace('$$__TEST_CASE_CODE__$$', testCaseCode)
		return language_messages.CodegenUnitTestsResponse(error="", data=combinedCode.encode('utf-8'))
