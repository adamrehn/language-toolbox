class Utility:
	
	@staticmethod
	def readFile(filename):
		'''
		Reads the contents of a file
		'''
		with open(filename, 'rb') as f:
			return f.read().decode('utf-8')
	
	@staticmethod
	def extractFlags(flags, items):
		'''
		Extracts the list of values that are present in a flags bitfield
		'''
		return list([item for item in items.keys() if flags & items[item]])
