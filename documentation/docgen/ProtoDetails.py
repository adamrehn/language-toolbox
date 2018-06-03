from .Utility import Utility
import collections, json, re

class ProtoDetails(object):
	
	def __init__(self, jsonFile):
		'''
		Parses the supplied JSON file and populates a new ProtoDetails instance with the data
		'''
		self.messages = {}
		self.services = {}
		self.enums = {}
		
		# Parse the generated JSON data and aggregate definitions from all .proto files
		jsonData = json.loads(Utility.readFile(jsonFile))
		for file in jsonData['files']:
			self._processDefinitions(file['name'], file['messages'], self.messages, 'message')
			self._processDefinitions(file['name'], file['services'], self.services, 'service')
			self._processDefinitions(file['name'], file['enums'], self.enums, 'enum')
	
	def dependencies(self, message):
		'''
		Retrieves the messages and enums on which a message definition depends
		'''
		
		# Iteratively retrieve dependencies
		deps = []
		queue = collections.deque([message])
		descriptionDepRegex = re.compile('`(.+?)`')
		while len(queue) > 0:
			
			# Add the current item to our set of dependencies (unless it is the original message)
			current = queue.popleft()
			if current['name'] != message['name'] and current not in deps:
				deps.append(current)
			
			# If the item is a message, discover any dependencies
			if current['type'] == 'message':
				directDeps = []
				for field in current['fields']:
					
					# If the field type is a user-defined message or enum, add it as a dependency
					dep = self._getMessageOrEnum(field['type'])
					if dep is not None:
						directDeps.append(dep)
					
					# If the field's description refers to a user-defined message or enum, also add it
					matches = descriptionDepRegex.search(field['description'])
					if matches != None:
						dep = self._getMessageOrEnum(matches.group(1))
						if dep is not None:
							directDeps.append(dep)
					
				queue.extend(directDeps)
		
		return deps
	
	def _processDefinitions(self, sourceFile, definitions, targetDict, typeStr):
		for definition in definitions:
			key = definition['name']
			definition['file'] = sourceFile
			definition['type'] = typeStr
			targetDict[key] = definition
	
	def _getMessageOrEnum(self, name):
		if name in self.messages:
			return self.messages[name]
		elif name in self.enums:
			return self.enums[name]
		else:
			return None
