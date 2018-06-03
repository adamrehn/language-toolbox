using System;
using Grpc.Core;
using System.Threading;

namespace language_csharp
{
	class Program
	{
		static int parsePort(string s)
		{
			int port = 0;
			if (Int32.TryParse(s, out port) == false) {
				throw new Exception("invalid port \"" + s + "\"");
			}
			
			return port;
		}
		
		static void Main(string[] args)
		{
			try
			{
				//Check that a port number was specified
				if (args.Length < 1) {
					throw new Exception("must specify port number to listen on.");
				}
				
				//Check that a template directory was specified
				if (args.Length < 2) {
					throw new Exception("must specify template directory path.");
				}
				
				//Verify that the specified port number is valid
				int port = Program.parsePort(args[0]);
				
				//Attempt to start the gRPC server
				Server server = new Server
				{
					Services = { LanguageModule.BindService(new LanguageModuleImp(args[1])) },
					Ports = { new ServerPort("localhost", port, ServerCredentials.Insecure) }
				};
				server.Start();
				
				//Debug output
				Console.WriteLine("Starting gRPC server on port " + port + "...");
				
				//Block the main thread until the server terminates
				while (true) {
					Thread.Sleep(1000);
				}
			}
			catch (Exception e) {
				Console.Error.WriteLine("Error: " + e.Message);
			}
		}
	}
}
