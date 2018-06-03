#ifndef _IO_CAPTURE_CODEGEN_H
#define _IO_CAPTURE_CODEGEN_H

#include "CodegenManager.h"
#include "../gen/common.pb.h"

#include <string>
using std::string;

class IOCaptureCodegen
{
	public:
		static string performCodegen(CodegenManager* codegen, const string& source, const string& invocation, const string& stdinData);
};

#endif
