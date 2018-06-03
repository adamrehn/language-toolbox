from .Utility import Utility
import re

# Base class for markdown elements
class MarkdownElement(object):
	
	# Returns the TOC line for the element, if any
	def tocLine(self, minLevel, existingAnchors):
		return None
	
	# Returns the markdown string for the element
	def __str__(self):
		return None

# Represents a heading element
class MarkdownHeading(MarkdownElement):
	def __init__(self, level, text):
		self.level = level
		self.text = text
	
	def _slugify(self, existingAnchors):
		
		# Escape any invalid characters
		baseAnchor = re.sub('[^a-zA-Z0-9 \\-]', '', self.text.lower()).replace(' ', '-')
		
		# Prevent name clashes by ensuring the anchor name is unique
		anchor = baseAnchor
		suffix = 1
		while anchor in existingAnchors:
			anchor = baseAnchor + '-{}'.format(suffix)
			suffix += 1
		
		existingAnchors.add(anchor)
		return anchor
	
	def tocLine(self, minLevel, existingAnchors):
		if self.level >= minLevel:
			indent = '    ' * (self.level - minLevel) 
			return '{}- [{}](#{})'.format(indent, self.text, self._slugify(existingAnchors))
		else:
			return None
	
	def __str__(self):
		prefix = '#' * self.level
		return '{} {}'.format(prefix, self.text)

# Represents a paragraph element
class MarkdownParagraph(MarkdownElement):
	def __init__(self, text):
		self.text = text
	
	def __str__(self):
		return self.text

# Represents a list element
class MarkdownList(MarkdownElement):
	def __init__(self, items):
		self.items = items
	
	def __str__(self):
		return '\n'.join(['- ' + item for item in self.items])

# Represents a table element
class MarkdownTable(MarkdownElement):
	def __init__(self, columns, rows, fallback):
		self.columns = columns
		self.rows = rows
		self.fallback = fallback
	
	def __str__(self):
		if len(self.rows) == 0:
			return self.fallback
		else:
			html = '<table><thead><tr>' + ''.join(['<th>{}</th>'.format(col) for col in self.columns]) + '</tr></thead><tbody>'
			for row in self.rows:
				html += '<tr>' + ''.join(['<td>{}</td>'.format(re.sub('`(.+?)`', '<code>\\1</code>', cell)) for cell in row]) + '</tr>'
			html += '</tbody></table>'
			return html


class MarkdownDocument(object):
	
	def __init__(self):
		self._tocToken = '_______TOC_______'
		self.elements = []
	
	def save(self, filename, tocMinLevel = 2):
		'''
		Saves the markdown document to file, injecting the TOC
		'''
		toc = self._generateTOC(tocMinLevel)
		markdown = '\n\n'.join([str(elem) for elem in self.elements])
		markdown = markdown.replace('\n' + self._tocToken + '\n', '\n## Table of contents\n\n' + toc + '\n\n')
		Utility.writeFile(filename, markdown)
	
	def toc(self):
		'''
		Adds a Table of Contents to the document
		'''
		self.paragraph(self._tocToken)
	
	def heading(self, level, text):
		'''
		Adds a heading element to the document
		'''
		self.elements.append(MarkdownHeading(level, text))
	
	def paragraph(self, text):
		'''
		Adds a paragraph element to the document
		'''
		self.elements.append(MarkdownParagraph(text))
	
	def list(self, items):
		'''
		Adds a list element to the document
		'''
		self.elements.append(MarkdownList(items))
	
	def table(self, columns, rows, fallback):
		'''
		Adds a table element to the document
		'''
		self.elements.append(MarkdownTable(columns, rows, fallback))
	
	def padding(self, lines):
		'''
		Adds the specified number of lines of whitespace to the document
		'''
		self.paragraph('<br>' * lines)
	
	def _generateTOC(self, minLevel):
		existingAnchors = set()
		tocLines = [elem.tocLine(minLevel, existingAnchors) for elem in self.elements]
		return '\n'.join([line for line in tocLines if line is not None])
