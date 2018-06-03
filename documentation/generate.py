#!/usr/bin/env python3
from docgen import DocumentationGenerator
import os, subprocess, tempfile

# The output directory and the relative path to the directory containing our .proto files
docsDir = os.path.dirname(os.path.abspath(__file__))
protoDir = os.path.join('..', 'server', 'proto')

# Generate our API documentation
docs = DocumentationGenerator(docsDir, protoDir)
docs.generate()
