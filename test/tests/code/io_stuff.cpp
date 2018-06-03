#include <iostream>
#include <string>

void ioStuff()
{
	std::cout << "This is stdout data." << std::endl;
	std::clog << "This is stderr data." << std::endl;
	
	std::string data = "";
	std::getline(std::cin, data);
	std::cout << "The stdin data: " << data << std::endl;
}
