class Utility:
	"""
	Contains utility functionality
	"""
	
	@staticmethod
	def readFile(filename):
		"""
		Reads the entire contents of a file
		"""
		with open(filename, 'rb') as f:
			return f.read().decode('utf-8')
	
	@staticmethod
	def parsePort(str):
		"""
		Parses a string representation of a port number and ensures that the port is greater than 1024
		"""
		try:
			port = int(str)
			if port <= 1024:
				raise Exception()
			return port
		except:
			raise Exception('Error: "{}" is not a valid port number'.format(str))
