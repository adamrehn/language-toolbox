using System;
using System.IO;
using System.Text;
using System.Diagnostics;

namespace language_csharp
{
	public struct ProcessOutput
	{
		public string stdout;
		public string stderr;
		public int code;
	}
	
	public class Utility
	{
		public static ProcessOutput execute(string command, string args, string workingDir)
		{
			ProcessOutput output = new ProcessOutput();
			using (Process process = new Process())
			{
				//Populate the StartInfo struct for the child process
				process.StartInfo.FileName = command;
				process.StartInfo.Arguments = args;
				process.StartInfo.WorkingDirectory = workingDir;
				process.StartInfo.RedirectStandardOutput = true;
				process.StartInfo.RedirectStandardError = true;
				
				//Wire up our event handler for stdout data
				StringBuilder stdoutBuilder = new StringBuilder();
				process.OutputDataReceived += new DataReceivedEventHandler((sender, e) => {
					stdoutBuilder.Append(e.Data);
				});
				
				//Wire up our event handler for stderr data
				StringBuilder stderrBuilder = new StringBuilder();
				process.ErrorDataReceived += new DataReceivedEventHandler((sender, e) => {
					stderrBuilder.Append(e.Data);
				});
				
				//Run the child process, reading output asynchronously
				process.Start();
				process.BeginOutputReadLine();
				process.BeginErrorReadLine();
				process.WaitForExit();
				output.code = process.ExitCode;
				process.Close();
				
				//Bundle up the output
				output.stdout = stdoutBuilder.ToString();
				output.stderr = stderrBuilder.ToString();
				return output;
			}
		}
	}
}
