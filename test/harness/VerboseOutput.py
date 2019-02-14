from . import common_pb2 as common_messages
from contextlib import redirect_stdout
from .Utility import Utility
import json, io

class VerboseOutput:
	
	@staticmethod
	def _extractCapabilities(capabilities):
		'''
		Extracts the list of capabilities from the LanguageCapabilities message bitfield
		'''
		capabilitiesDict = dict(common_messages.Capabilities.items())
		return Utility.extractFlags(capabilities, capabilitiesDict)
	
	@staticmethod
	def _stringifyTestCaseResult(result):
		'''
		Returns a string representation of a TestCaseResult object
		'''
		return json.dumps({
			"output": result.output,
			"type": result.type,
			"exception": result.exception
		})
	
	@staticmethod
	def ListCapabilities(response):
		'''
		Verbose output printer for ListCapabilities() RPC results
		'''
		buf = io.StringIO()
		with redirect_stdout(buf):
			print('Server capabilities:')
			for item in response.capabilities:
				capabilitiesList = ', '.join(VerboseOutput._extractCapabilities(item.capabilities))
				print('\t{} ({})'.format(item.language, capabilitiesList))
		return buf.getvalue().strip()
	
	@staticmethod
	def GenerateAst(response):
		'''
		Verbose output printer for GenerateAst() RPC results
		'''
		buf = io.StringIO()
		with redirect_stdout(buf):
			print('Generate AST results:')
			print('\tError: {}'.format(response.error))
			print('\tAST: {}'.format(response.ast))
		return buf.getvalue().strip()
	
	@staticmethod
	def PerformAstMatch(response):
		'''
		Verbose output printer for PerformAstMatch() RPC results
		'''
		buf = io.StringIO()
		with redirect_stdout(buf):
			print('Perform AST Match results:')
			print('\tError: {}'.format(response.error))
			print('\tAST: {}'.format(response.ast))
			print('\tMatches: {}'.format(response.matches))
		return buf.getvalue().strip()
	
	@staticmethod
	def PerformIOMatch(response):
		'''
		Verbose output printer for PerformIOMatch() RPC results
		'''
		buf = io.StringIO()
		with redirect_stdout(buf):
			print('Perform I/O Matching results:')
			print('\tError: {}'.format(response.error))
			print('\tstdout: {}'.format(response.stdout))
			print('\tstderr: {}'.format(response.stderr))
			print('\tStdout Matches: {}'.format(response.matchesStdOut))
			print('\tStderr Matches: {}'.format(response.matchesStdErr))
		return buf.getvalue().strip()
	
	@staticmethod
	def PerformCompoundIOMatch(response):
		'''
		Verbose output printer for PerformCompoundIOMatch() RPC results
		'''
		buf = io.StringIO()
		with redirect_stdout(buf):
			print('Perform compound I/O Matching results:')
			print('\tError: {}'.format(response.error))
			print('\tResults:\n')
		return buf.getvalue() + '\n'.join([VerboseOutput.PerformIOMatch(result) for result in response.results])
	
	@staticmethod
	def PerformUnitTests(response):
		'''
		Verbose output printer for PerformUnitTests() RPC results
		'''
		buf = io.StringIO()
		with redirect_stdout(buf):
			print('Unit test results:')
			print('\tError: {}'.format(response.error))
			print('\tPassed: {}'.format(response.passed))
			print('\tFailed: {}'.format(response.failed))
			print('\tResult vectors:')
			for vec in response.results:
				print('\t\t[{}]'.format(','.join(list([VerboseOutput._stringifyTestCaseResult(result) for result in vec.result]))))
		return buf.getvalue().strip()
	
	@staticmethod
	def InvokeCustomSandbox(response):
		'''
		Verbose output printer for InvokeCustomSandbox() RPC results
		'''
		buf = io.StringIO()
		with redirect_stdout(buf):
			print('Invoke custom sandbox results:')
			print('\tError: {}'.format(response.error))
			print('\tstdout: {}'.format(response.stdout))
			print('\tstderr: {}'.format(response.stderr))
		return buf.getvalue().strip()
