#include <grpc++/grpc++.h>
#include <stdexcept>
#include <iostream>
#include <memory>
#include <string>

#include "../gen/language.grpc.pb.h"
#include "LanguageModuleImp.h"
using grpc::Server;
using grpc::ServerBuilder;

//Attempts to parse a string representation of a port number
int parsePort(const std::string& p)
{
	try {
		return std::stoi(p);
	}
	catch (...) {
		throw std::runtime_error("invalid port number \"" + p + "\"");
	}
}

int main (int argc, char* argv[])
{
	try
	{
		//Check that a port number was specified
		if (argc < 2) {
			throw std::runtime_error("must specify port number to listen on");
		}
		
		//Check that a template directory path was specified
		if (argc < 3) {
			throw std::runtime_error("must specify template directory path");
		}
		
		//Verify that the specified port number is valid
		int port = parsePort(argv[1]);
		
		//Attempt to start the gRPC server
		ServerBuilder builder;
		LanguageModuleImp service(argv[2]);
		builder.AddListeningPort("0.0.0.0:" + std::to_string(port), grpc::InsecureServerCredentials());
		builder.RegisterService(&service);
		std::unique_ptr<Server> server(builder.BuildAndStart());
		
		//Debug output
		std::clog << "Starting gRPC server on port " << port << "..." << std::endl;
		
		//Block the main thread until the server terminates
		server->Wait();
	}
	catch (std::runtime_error& e) {
		std::clog << "Error: " << e.what() << std::endl;
	}
	
	return 0;
}
