#ifndef _TEMP_DIRECTORY_H
#define _TEMP_DIRECTORY_H

#include <string>
using std::string;

//RAII wrapper for creating an auto-deleting temporary directory
class TempDirectory
{
	public:
		TempDirectory();
		~TempDirectory();
		string getPath() const;
		
	private:
		string path;
};

#endif
