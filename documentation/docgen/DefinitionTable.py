class DefinitionTable(object):
	
	def __init__(self, definition, userTypes):
		'''
		Generates a table describing the structure of a message or enum definition
		'''
		if definition['type'] == 'message':
			self._message(definition, userTypes)
		else:
			self._enum(definition)
	
	# Formats the type of a message fild
	def _type(self, field, userTypes):
		quantity = 'Array of ' if field['label'] == 'repeated' else ''
		typename = '`{}`'.format(field['type']) if field['type'] in userTypes else field['type']
		return quantity + ' ' + typename
	
	# Formats a message
	def _message(self, message, userTypes):
		self.fallback = '*This message type contains no fields.*'
		self.columns = ['Field', 'Type', 'Description']
		self.rows = [
			[field['name'], self._type(field, userTypes), field['description']]
			for field in message['fields']
		]
	
	# Formats an enum
	def _enum(self, enum):
		self.fallback = '*This enum type contains no values.*'
		self.columns = ['Member', 'Value', 'Description']
		self.rows = [
			[value['name'], value['number'], value['description']]
			for value in enum['values']
		]
