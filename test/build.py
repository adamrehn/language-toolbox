#!/usr/bin/env python3
from grpc_tools import protoc
from os import path
import glob, re, os

# Reads the contents of a file
def readFile(filename):
	with open(filename, 'rb') as f:
		return f.read().decode('utf-8')

# Writes the contents of a file
def writeFile(filename, data):
	with open(filename, 'wb') as f:
		f.write(data.encode('utf-8'))


# Compute absolute directory paths based on the location of this script
os.chdir(path.dirname(path.abspath(__file__)))
protoDir = path.abspath('../server/proto')
outputDir = path.abspath('./harness/')

# Run the protobuf compiler to generate the protobuf/gRPC code for our proto files
protoc.main([
	'grpc_tools.protoc',
	'--proto_path={}'.format(protoDir),
	'--python_out={}'.format(outputDir),
	'--grpc_python_out={}'.format(outputDir),
	path.join(protoDir, 'server.proto'), path.join(protoDir, 'common.proto')
])

# Fix up the relative include paths needed for nesting the generated files in our package
generatedFiles = glob.glob(path.join(outputDir, '*_pb2*'))
for file in generatedFiles:
	code = readFile(file)
	code = re.sub('\\n(import .+?_pb2)', '\\nfrom . \\1', code)
	writeFile(file, code)
