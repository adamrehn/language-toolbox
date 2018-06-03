#ifndef _UNIT_TEST_CODEGEN_H
#define _UNIT_TEST_CODEGEN_H

#include "CodegenManager.h"
#include "../gen/common.pb.h"

#include <string>
#include <vector>
using std::string;
using std::vector;

class UnitTestCodegen
{
	public:
		static string performCodegen(CodegenManager* codegen, const string& source, const vector<UnitTest>& tests);
};

#endif
