from .DefinitionTable import DefinitionTable
from .MarkdownDocument import MarkdownDocument
from .ProtoDetails import ProtoDetails
from .TemporaryDirectory import TemporaryDirectory
import os, subprocess

class DocumentationGenerator(object):
	
	def __init__(self, docDir, protoDir):
		'''
		Creates a new DocumentationGenerator for the specified directories:
		
		- `docDir` is the path to the documentation output directory
		- `protoDir` is the path to the directory containing the .proto files, relative to the documentation output directory
		'''
		self.docDir = os.path.abspath(docDir)
		self.protoDirRel = protoDir
		self.protoDirAbs = os.path.abspath(os.path.join(self.docDir, self.protoDirRel))
	
	def generate(self):
		'''
		Performs documentation generation
		'''
		
		# Parse the .proto files and process the definitions
		self.protos = self._parseProtoFiles()
		
		# Retrieve the list of non-scalar typenames (messages and enums)
		userTypes = list(self.protos.messages.keys()) + list(self.protos.enums.keys())
		
		# Create our markdown document and add the header boilerplate
		self.markdown = MarkdownDocument()
		self.markdown.heading(1, 'Language Toolbox API Documentation')
		self.markdown.toc()
		
		# Generate the documentation for each service definition
		# (We sort in reverse-alphabetical order to force the Server service to be listed first)
		serviceNames = reversed(sorted(self.protos.services.keys()))
		for service in [self.protos.services[serviceName] for serviceName in serviceNames]:
			
			# Add whitespace before each service, since GitHub strips custom CSS
			self.markdown.padding(3)
			
			# Add the overall service details
			self.markdown.heading(2, service['name'] + ' Service')
			self.markdown.paragraph('*Service defined in [{}]({}).*'.format(service['file'], os.path.join(self.protoDirRel, service['file'])))
			self.markdown.paragraph(service['description'])
			
			# Generate the documentation for each RPC method
			for rpc in service['methods']:
				
				# Add whitespace before each RPC, since GitHub strips custom CSS
				self.markdown.padding(2)
				
				# Add the RPC details
				self.markdown.heading(3, rpc['name'] + ' RPC')
				self.markdown.paragraph(rpc['description'])
				
				# Add the input data details
				requestType = self.protos.messages[rpc['requestType']]
				self._processMessage(requestType, 'input', userTypes)
				
				# Add the output data details
				responseType = self.protos.messages[rpc['responseType']]
				self._processMessage(responseType, 'output', userTypes)
		
		# Save the markdown to file
		markdownFile = os.path.join(self.docDir, 'documentation.md')
		self.markdown.save(markdownFile)
	
	def _processMessage(self, message, role, userTypes):
		
		# Generate the paragraph and table for the top-level message
		messageTable = DefinitionTable(message, userTypes)
		self.markdown.paragraph('#### RPC {} data takes the form of the `{}` message type, which has the structure:'.format(role, message['name']))
		self.markdown.table(messageTable.columns, messageTable.rows, messageTable.fallback)
		
		# Generate the tables for each of the message's dependencies
		deps = self.protos.dependencies(message)
		for dep in deps:
			depTable = DefinitionTable(dep, userTypes)
			contents = 'structure' if dep['type'] == 'message' else 'members'
			self.markdown.paragraph('The `{}` {} type has the {}:'.format(dep['name'], dep['type'], contents))
			self.markdown.table(depTable.columns, depTable.rows, depTable.fallback)
	
	def _parseProtoFiles(self):
		
		# Create a self-deleting temporary directory to hold the intermediate JSON file
		with TemporaryDirectory() as tempDir:
			
			# Use protoc-gen-doc (https://github.com/pseudomuto/protoc-gen-doc) to parse our .proto files
			jsonFile = os.path.join(tempDir.path, 'protos.json')
			subprocess.call([
				'docker',
				'run',
				'--rm',
				'-v{}:/out'.format(tempDir.path),
				'-v{}:/protos'.format(self.protoDirAbs),
				'pseudomuto/protoc-gen-doc',
				'--doc_opt=json,protos.json'
			])
			
			# Parse the generated JSON data and process the service definitions from all files
			return ProtoDetails(jsonFile)
