#include <iostream>

int passthrough(int x)
{
	std::cout << "This output should be discarded." << std::endl;
	return x;
}
