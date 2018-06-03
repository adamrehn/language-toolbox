#include "UnitTestCodegen.h"

#include <boost/algorithm/string/join.hpp>
#include <sstream>

string UnitTestCodegen::performCodegen(CodegenManager* codegen, const string& source, const vector<UnitTest>& tests)
{
	//Generate the top-level code that follows the supplied source code
	std::stringstream headerCode;
	headerCode << source;
	headerCode << R"(

#include <json/json.h>
#include <iostream>
#include <sstream>
#include <string>
#include <cstdio>
#include <cstdlib>
#include <unistd.h>
#include <typeinfo>
#include <cxxabi.h>

template <typename T>
std::string toString(const T& i)
{
	std::stringstream buf;
	buf << i;
	return buf.str();
}

std::string demangle(const std::string& mangled)
{
	int status = 0;
	char* result = abi::__cxa_demangle(mangled.c_str(), nullptr, nullptr, &status);
	if (status == 0)
	{
		std::string demangled(result);
		free(result);
		return demangled;
	}
	
	//Demangling failed
	return mangled;
}

)";
	
	//Generate the unit test boilerplate to populate the body of the main() method
	std::stringstream mainCode;
	mainCode << R"(
	Json::Value results(Json::arrayValue);
	Json::Value currResult;
	Json::Value currCase;
	FILE* devNull = fopen("/dev/null", "w");
	int origStdout = dup(fileno(stdout));
	int origStderr = dup(fileno(stderr));
	dup2(fileno(devNull), fileno(stdout));
	dup2(fileno(devNull), fileno(stderr));
	)";
	
	//Generate the code for each of the unit tests
	for (auto test : tests)
	{
		mainCode << "currResult = Json::Value(Json::objectValue);\n\t";
		mainCode << "currResult[\"result\"] = Json::Value(Json::arrayValue);\n\t";
		mainCode << test.setup() << "\n";
		for (int i = 0; i < test.cases_size(); ++i)
		{
			auto testCase = test.cases(i);
			auto inputs = testCase.inputs();
			mainCode << testCase.setup() << "\n";
			mainCode << "currCase = Json::Value(Json::objectValue);\n";
			mainCode << "try { auto lastResult = " << test.invocation() << "(" << boost::algorithm::join(inputs, ",") << ");\n";
			mainCode << "currCase[\"output\"] = toString(lastResult);\n";
			mainCode << "currCase[\"type\"] = demangle(typeid(lastResult).name());\n";
			mainCode << "currCase[\"exception\"] = false;\n";
			mainCode << "}";
			mainCode << "catch (std::runtime_error& e) {\n";
			mainCode << "currCase[\"output\"] = e.what();\n";
			mainCode << "currCase[\"type\"] = demangle(typeid(e).name());\n";
			mainCode << "currCase[\"exception\"] = true;\n";
			mainCode << "}";
			mainCode << "currResult[\"result\"].append(currCase);\n";
			mainCode << testCase.teardown() << "\n";
		}
		mainCode << "results.append(currResult);\n\t";
		mainCode << test.teardown() << "\n";
	}
	
	//Complete the boilerplate code
	mainCode << "dup2(origStdout, fileno(stdout));\n\t";
	mainCode << "dup2(origStderr, fileno(stderr));\n\t";
	mainCode << "std::cout << results.toStyledString() << std::endl;\n\t";
	
	//Perform codegen
	return codegen->performCodegen(headerCode.str(), mainCode.str());
}
