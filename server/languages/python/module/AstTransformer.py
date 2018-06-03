import ast, sys

ast.FunctionDef

class AstTransformer():
	
	# Processes an individual AST node attribute
	def _processAttribute(self, attrib):
		return self.visit(attrib) if isinstance(attrib, ast.AST) else attrib
	
	# Processes an AST node attribute that might be a list
	def _processAttributeList(self, attrib):
		return list([self._processAttribute(a) for a in attrib]) if isinstance(attrib, list) else self._processAttribute(attrib)
	
	def visit(self, node):
		transformed = {'type': node.__class__.__name__}
		for key, value in node.__dict__.items():
			transformed[key] = self._processAttributeList(value)
		
		return transformed
