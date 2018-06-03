#ifndef _UTILITY_H
#define _UTILITY_H

#include <boost/process.hpp>
namespace process = boost::process;

#include <string>
using std::string;

struct ProcessOutput
{
	string stdout;
	string stderr;
	int code;
};

class Utility
{
	public:
		
		template <typename ...Args>
		static ProcessOutput execute(const string& workingDir, Args&&...args)
		{
			//Execute the process and read the output data asynchronously
			boost::asio::io_service ioService;
			std::future<std::string> stdoutFuture;
			std::future<std::string> stderrFuture;
			process::child c(
				args...,
				process::std_in.close(),
				process::std_out > stdoutFuture,
				process::std_err > stderrFuture,
				process::start_dir(workingDir),
				ioService
			);
			ioService.run();
			c.wait();
			
			//Retrieve the output data and exit code
			ProcessOutput result;
			result.stdout = stdoutFuture.get();
			result.stderr = stderrFuture.get();
			result.code = c.exit_code();
			return result;
		}
		
		static string strReplace(const string& find, const string& replace, string subject);
		
		static string readFile(const string& filename);
		static bool writeFile(const string& filename, const string& data);
};

#endif
