#include "CodegenManager.h"
#include "TempDirectory.h"
#include "Utility.h"

#include <boost/process.hpp>
namespace process = boost::process;

CodegenManager::CodegenManager(const string& templateDir)
{
	this->redirectHeader = Utility::readFile(templateDir + "/redirect.h");
	this->redirectCode = Utility::readFile(templateDir + "/redirect.cpp");
	this->templateCode = Utility::readFile(templateDir + "/template.cpp");
	this->cmakeLists = Utility::readFile(templateDir + "/CMakeLists.txt");
}

string CodegenManager::performCodegen(const string& prefixCode, const string& mainCode)
{
	//Create an auto-deleting temporary directory to hold our codegen build
	TempDirectory tempDir;
	
	//Populate the template source code
	string codegenSource = this->templateCode;
	codegenSource = Utility::strReplace("//$$__PREFIX_CODE__$$", prefixCode, codegenSource);
	codegenSource = Utility::strReplace("//$$__MAIN_CODE__$$", mainCode, codegenSource);
	
	//Write our template files to the temp directory
	Utility::writeFile(tempDir.getPath() + "/redirect.h", this->redirectHeader);
	Utility::writeFile(tempDir.getPath() + "/redirect.cpp", this->redirectCode);
	Utility::writeFile(tempDir.getPath() + "/template.cpp", codegenSource);
	Utility::writeFile(tempDir.getPath() + "/CMakeLists.txt", this->cmakeLists);
	
	//Attempt to perform codegen
	auto cmake = process::search_path("cmake");
	Utility::execute(tempDir.getPath(), cmake, ".");
	ProcessOutput output = Utility::execute(tempDir.getPath(), cmake, "--build", ".", "--target", "install");
	if (output.code != 0) {
		throw std::runtime_error("codegen failed with exit code " + std::to_string(output.code) + " and stdout: \"" + output.stdout + "\" and stderr: \"" + output.stderr + "\"");
	}
	
	//Retrieve the generated executable data
	return Utility::readFile(tempDir.getPath() + "/bin/out");
}
