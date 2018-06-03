from . import common_pb2 as common_messages
from . import server_pb2 as server_messages
from . import server_pb2_grpc as service
from google.protobuf import json_format
import glob, grpc, json, os

from .ProgressPrinter import ProgressPrinter
from .VerboseOutput import VerboseOutput
from .Utility import Utility

class TestHarness:
	
	def _getRpcDetails(self, rpc):
		'''
		For the specified RPC, return a tuple containing:
		- The method stub
		- The input message type
		- A verbose output printer callback
		'''
		mappings = {
			'ListCapabilities': (self._stub.ListCapabilities, common_messages.Empty,                   VerboseOutput.ListCapabilities),
			'GenerateAst':      (self._stub.GenerateAst,      common_messages.GenerateAstRequest,      VerboseOutput.GenerateAst),
			'PerformAstMatch':  (self._stub.PerformAstMatch,  server_messages.PerformAstMatchRequest,  VerboseOutput.PerformAstMatch),
			'PerformIOMatch':   (self._stub.PerformIOMatch,   server_messages.PerformIOMatchRequest,   VerboseOutput.PerformIOMatch),
			'PerformUnitTests': (self._stub.PerformUnitTests, server_messages.PerformUnitTestsRequest, VerboseOutput.PerformUnitTests)
		}
		return mappings[rpc]
	
	def __init__(self, port, verbose):
		'''
		Creates the testing harness and attempts to connect to the server
		'''
		self._channel = grpc.insecure_channel('localhost:{}'.format(port))
		self._stub = service.ServerStub(self._channel)
		
		# Initialise our progress printer
		self.printer = ProgressPrinter(verbose)
		
		# Debug output
		print('Connecting to server on port {}...\n'.format(port))
	
	def reportCapabilities(self):
		'''
		Reports the programming languages and capabilities that the server supports
		'''
		stub, messageType, verbosePrinter = self._getRpcDetails('ListCapabilities')
		print(verbosePrinter(stub(messageType())))
	
	def loadAndRun(self, rootDir, specificSuite):
		'''
		Loads and runs all of the test descriptors in the specified directory
		'''
		
		# If a specific suite was requested, verify that it exists
		if specificSuite != None and os.path.exists(os.path.join(rootDir, specificSuite + '.json')) == False:
			raise Exception('The requested test suite "{}" cannot be found.'.format(specificSuite))
		
		# Iterate over each JSON descriptor file in the specified directory
		for descriptorFile in sorted(glob.glob(os.path.join(rootDir, '*.json'))):
			descriptor = json.loads(Utility.readFile(descriptorFile))
			
			# Extract the name of the test suite (just the JSON filename without extension)
			suite = os.path.basename(descriptorFile).replace('.json', '')
			
			# If a specific suite was requested, skip all other suites
			if specificSuite != None and suite != specificSuite:
				continue
			
			# Iterate over each of the test cases in the current descriptor file
			totalCases = len(descriptor['cases'])
			for testNum, testCase in enumerate(descriptor['cases']):
				
				# Retrieve the RPC stub and input message type
				stub, messageType, verbosePrinter = self._getRpcDetails(testCase['rpc'])
				
				# Populate any template fields in the input message
				inputData = testCase['input']
				if 'source' in inputData:
					sourceFile = os.path.join(rootDir, inputData['source'])
					inputData['source'] = Utility.readFile(sourceFile)
				
				# Retrieve the expected output
				expected = testCase['expected']
				
				# Create the input message for the RPC
				inputMessage = json_format.Parse(json.dumps(inputData), messageType())
				
				# Invoke the RPC and extract the output message data
				outputMessage = stub(inputMessage)
				outputData = json.loads(json_format.MessageToJson(outputMessage, including_default_value_fields=True))
				
				# Some response fields are JSON strings that we need to sort by key for comparison purposes
				for key, value in outputData.items():
					if isinstance(value, str) and value.startswith('{'):
						outputData[key] = json.dumps(json.loads(value), sort_keys=True)
				
				# Print verbose output (if enabled)
				self.printer.verbose(verbosePrinter(outputMessage), suite, testNum, totalCases)
				
				# Iterate over the keys that we care about for testing purposes and verify that the actual values matches the expected ones
				result = [json.dumps(outputData[key], sort_keys=True) == json.dumps(expected[key], sort_keys=True) for key in expected]
				failed = len([r for r in result if r == False])
				
				# Report the test results
				if failed > 0:
					self.printer.failure('Failed test for RPC {} with {} code file {},\n\nOutput:\n\t{}\n\nExpected:\n\t{}'.format(
						testCase['rpc'],
						testCase['input']['language'],
						sourceFile,
						json.dumps(outputData, sort_keys=True),
						json.dumps(expected, sort_keys=True)
					), suite, testNum, totalCases)
				else:
					self.printer.success('Passed test for RPC {} with {} code file {}'.format(
						testCase['rpc'],
						testCase['input']['language'],
						sourceFile,
					), suite, testNum, totalCases)
