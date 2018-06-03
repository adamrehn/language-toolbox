#ifndef _LANGUAGE_MODULE_H
#define _LANGUAGE_MODULE_H

#include "CodegenManager.h"
#include "../gen/language.grpc.pb.h"
using grpc::ServerContext;

class LanguageModuleImp : public LanguageModule::Service
{
	public:
		LanguageModuleImp(const string& templateDir) : codegen(templateDir) {}
		
		grpc::Status GetCapabilities(ServerContext* context, const Empty* request, LanguageCapabilities* response) override;
		grpc::Status GetSandboxDetails(ServerContext* context, const Empty* request, SandboxDetails* response) override;
		grpc::Status GenerateAst(ServerContext* context, const GenerateAstRequest* request, GenerateAstResponse* response) override;
		grpc::Status CodegenIOCapture(ServerContext* context, const CodegenIOCaptureRequest* request, CodegenIOCaptureResponse* response) override;
		grpc::Status CodegenUnitTests(ServerContext* context, const CodegenUnitTestsRequest* request, CodegenUnitTestsResponse* response) override;
		
	private:
		CodegenManager codegen;
};

#endif
