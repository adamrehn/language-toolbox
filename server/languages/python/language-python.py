#!/usr/bin/env python3
from module import service, LanguageModuleImp, Utility
from concurrent import futures
import grpc, sys, time

# Check that a port number was specified
if len(sys.argv) > 1:
	
	# Verify that the specified port number is valid
	port = Utility.parsePort(sys.argv[1])
	
	# Debug output
	print('Starting gRPC server on port {}...'.format(port))
	sys.stdout.flush()
	
	# Start the gRPC server
	server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
	service.add_LanguageModuleServicer_to_server(LanguageModuleImp(), server)
	server.add_insecure_port('[::]:{}'.format(port))
	server.start()
	
	# Stop the server when requested
	try:
		while True:
			time.sleep(600)
	except KeyboardInterrupt:
		server.stop(0)
else:
	print('Error: must specify port number to listen on.')
