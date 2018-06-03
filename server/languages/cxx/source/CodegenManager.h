#ifndef _CODEGEN_MANAGER_H
#define _CODEGEN_MANAGER_H

#include <string>
using std::string;

class CodegenManager
{
	public:
		CodegenManager(const string& templateDir);
		string performCodegen(const string& prefixCode, const string& mainCode);
		
	private:
		string redirectHeader;
		string redirectCode;
		string templateCode;
		string cmakeLists;
};

#endif
