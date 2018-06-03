from contextlib import AbstractContextManager
import tempfile

class TemporaryDirectory(AbstractContextManager):
	
	def __init__(self):
		self.path = None
	
	def __enter__(self):
		self.path = tempfile.mkdtemp()
		return self
	
	def __exit__(self, exc_type, exc_val, exc_tb):
		try:
			shutil.rmtree(tempDir)
		except:
			pass
		return None
