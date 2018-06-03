#include "IOCaptureCodegen.h"
#include "Utility.h"

#include <sstream>

string IOCaptureCodegen::performCodegen(CodegenManager* codegen, const string& source, const string& invocation, const string& stdinData)
{
	//Generate the top-level code that follows the supplied source code
	std::stringstream headerCode;
	headerCode << source;
	headerCode << R"(

#include <iostream>
#include <stdexcept>
#include <sstream>
#include <string>
#include "redirect.h"
)";
	
	//Sanitise the stdin data to ensure our raw string literal delimeter does not appear within in
	string rawDelim = "_______d_e_l_i_m";
	string sanitised = Utility::strReplace(rawDelim, "", stdinData);
	
	//Generate the boilerplate code to populate the body of the main() method
	std::stringstream mainCode;
	mainCode << "std::string stdinData = R\"" << rawDelim << "(" << sanitised << ")" << rawDelim << "\";";
	mainCode << R"(
	try
	{
		if (_______redirect_stdin(stdinData.data(), stdinData.length()) == false) {
			throw std::runtime_error("failed to redirect stdin");
		}
		
		)" << invocation << R"(
	}
	catch (std::exception& e) {
		std::clog << "Error: " << e.what() << std::endl;
	}
	)";
	
	//Perform codegen
	return codegen->performCodegen(headerCode.str(), mainCode.str());
}
