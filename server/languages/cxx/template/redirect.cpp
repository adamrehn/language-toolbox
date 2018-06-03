#include <fstream>
#include <stdexcept>
#include <unistd.h>
#include <cstdio>

bool _______redirect_stdin(const char* data, unsigned long int length)
{
	//Write the stdin data to a temporary file
	const char* tempFilePath = "/tmp/stdin.txt";
	std::ofstream tempOut(tempFilePath, std::ios::binary);
	if (tempOut.is_open())
	{
		tempOut.write(data, length);
		tempOut.close();
		
		//Redirect stdin to the temporary file
		FILE* tempIn = fopen(tempFilePath, "rb");
		if (tempIn != nullptr)
		{
			if (dup2(fileno(tempIn), fileno(stdin)) != -1) {
				return true;
			}
		}
	}
	
	return false;
}
