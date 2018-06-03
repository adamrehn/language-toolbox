#include "LanguageModuleImp.h"
#include "AstGenerator.h"
#include "IOCaptureCodegen.h"
#include "UnitTestCodegen.h"

grpc::Status LanguageModuleImp::GetCapabilities(ServerContext* context, const Empty* request, LanguageCapabilities* response)
{
	response->set_language("cxx");
	response->set_capabilities(Capabilities::GENERATE_ASTS | Capabilities::IO_MATCHING | Capabilities::UNIT_TESTING);
	return grpc::Status::OK;
}

grpc::Status LanguageModuleImp::GetSandboxDetails(ServerContext* context, const Empty* request, SandboxDetails* response)
{
	response->set_image("adamrehn/language-toolbox-sandbox-cxx");
	response->add_command("bash");
	response->add_command("-c");
	response->add_command("cat > /tmp/a.out && chmod a+x /tmp/a.out && /tmp/a.out");
	return grpc::Status::OK;
}

grpc::Status LanguageModuleImp::GenerateAst(ServerContext* context, const GenerateAstRequest* request, GenerateAstResponse* response)
{
	//Attempt to generate the AST
	try
	{
		response->set_error("");
		response->set_ast(AstGenerator::generateAst(request->source()));
	}
	catch (std::runtime_error& e)
	{
		response->set_error(e.what());
		response->set_ast("");
	}
	
	return grpc::Status::OK;
}

grpc::Status LanguageModuleImp::CodegenIOCapture(ServerContext* context, const CodegenIOCaptureRequest* request, CodegenIOCaptureResponse* response)
{
	//Attempt to perform codegen
	try
	{
		response->set_error("");
		response->set_data(IOCaptureCodegen::performCodegen(&this->codegen, request->source(), request->invocation(), request->stdin()));
	}
	catch (std::runtime_error& e)
	{
		response->set_error(e.what());
		response->set_data("");
	}
	
	return grpc::Status::OK;
}

grpc::Status LanguageModuleImp::CodegenUnitTests(ServerContext* context, const CodegenUnitTestsRequest* request, CodegenUnitTestsResponse* response)
{
	//Retrieve the list of unit tests
	vector<UnitTest> tests;
	for (int i = 0; i < request->tests_size(); ++i) {
		tests.push_back(request->tests(i));
	}
	
	//Attempt to perform codegen
	try
	{
		response->set_error("");
		response->set_data(UnitTestCodegen::performCodegen(&this->codegen, request->source(), tests));
	}
	catch (std::runtime_error& e)
	{
		response->set_error(e.what());
		response->set_data("");
	}
	
	return grpc::Status::OK;
}
