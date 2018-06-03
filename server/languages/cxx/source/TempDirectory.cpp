#include "TempDirectory.h"
#include <stdexcept>
#include <llvm/Support/FileSystem.h>
#include <boost/filesystem.hpp>
namespace fs = boost::filesystem;

TempDirectory::TempDirectory()
{
	//Attempt to create a unique directory
	llvm::SmallString<256> result;
	if (llvm::sys::fs::createUniqueDirectory("", result).value() != 0) {
		throw std::runtime_error("could not create temporary directory");
	}
	
	this->path = result.str();
}

TempDirectory::~TempDirectory()
{
	//Attempt to recursively delete the directory, ignoring any errors
	boost::system::error_code error;
	fs::remove_all(fs::path(this->path), error);
}

string TempDirectory::getPath() const {
	return this->path;
}
