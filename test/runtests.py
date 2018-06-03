#!/usr/bin/env python3
from harness import TestHarness
import argparse, glob, os

if __name__ == '__main__':
	
	# Parse any supplied command-line arguments
	parser = argparse.ArgumentParser()
	parser.add_argument('--port', default=50051, type=int, help='Port number of the server')
	parser.add_argument('--suite', default=None, help='Specific test suite to run (default is to run all)')
	parser.add_argument('--verbose', action='store_true', help='Verbose output')
	args = parser.parse_args()
	
	# Create the test harness
	harness = TestHarness(args.port, args.verbose)
	
	# Report the server capabilities
	harness.reportCapabilities()
	
	# Load and run all of our tests
	scriptDir = os.path.dirname(os.path.abspath(__file__))
	dataDir = os.path.join(scriptDir, 'tests')
	harness.loadAndRun(dataDir, args.suite)
