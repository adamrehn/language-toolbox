from termcolor import colored
import colorama

class ProgressPrinter:
	
	def __init__(self, verbose):
		'''
		Creates a printer for logging test progress with coloured output
		'''
		colorama.init()
		self._verbose = verbose
	
	def success(self, output, suite, current, total):
		'''
		Reports the success of an individual test case
		'''
		self._print('green', output, suite, current, total)
	
	def failure(self, output, suite, current, total):
		'''
		Reports the failure of an individual test case
		'''
		self._print('red', output, suite, current, total)
	
	def verbose(self, output, suite, current, total):
		'''
		Prints verbose information about an individual test case
		'''
		if self._verbose == True:
			self._print('yellow', output, suite, current, total)
	
	def _print(self, colour, output, suite, current, total):
		print(colored('\n[{} Test {} of {}] {}'.format(suite, current+1, total, output), color=colour))
