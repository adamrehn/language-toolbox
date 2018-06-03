#ifndef _AST_GENERATOR_H
#define _AST_GENERATOR_H

#include <string>
using std::string;

class AstGenerator
{
	public:
		static string generateAst(const string& code);
};

#endif
