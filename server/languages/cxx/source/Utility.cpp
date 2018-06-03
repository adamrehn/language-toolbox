#include "Utility.h"
#include <fstream>

string Utility::strReplace(const string& find, const string& replace, string subject)
{
	size_t uPos = 0;
	size_t uFindLen = find.length();
	size_t uReplaceLen = replace.length();
	
	if (uFindLen == 0) {
		return subject;
	}
	
	while ((uPos = subject.find(find, uPos)) != string::npos)
	{
		subject.replace(uPos, uFindLen, replace);
		uPos += uReplaceLen;
	}
	
	return subject;
}

string Utility::readFile(const string& filename)
{
	std::ifstream infile(filename.c_str(), std::ios::binary);
	std::string contents;
	if (infile.is_open())
	{
		const size_t bufSize = 1024;
		char buffer[bufSize];
		size_t bytesRead = 0;
		while ( (bytesRead = infile.read(buffer, bufSize).gcount()) != 0 ) {
			contents.append(buffer, bytesRead);
		}
		
		infile.close();
	}
	
	return contents;
}

bool Utility::writeFile(const string& filename, const string& data)
{
	std::ofstream outfile(filename.c_str(), std::ios::binary);
	if (outfile.is_open())
	{
		outfile.write(data.data(), data.length());
		outfile.close();
		return true;
	}
	
	return false;
}
