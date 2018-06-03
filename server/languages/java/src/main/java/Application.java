import io.grpc.Server;
import io.grpc.ServerBuilder;
import java.io.IOException;

public class Application
{
	private Server server;
	
	private void start(int port) throws IOException
	{
		//Attempt to start the server
		server = ServerBuilder.forPort(port).addService(new LanguageModuleImp()).build().start();
		System.err.println("Starting gRPC server on port " + port + "...");
		
		//Shut down the gRPC server when the JVM terminates
		Runtime.getRuntime().addShutdownHook(new Thread()
		{
			@Override
			public void run() {
				Application.this.stop();
			}
		});
	}
	
	private void stop()
	{
		if (server != null) {
			server.shutdown();
		}
	}
	
	//Await termination on the main thread since gRPC uses background threads
	private void blockUntilShutdown() throws InterruptedException
	{
		if (server != null) {
			server.awaitTermination();
		}
	}
	
	public static void main(String[] args) throws IOException, InterruptedException
	{
		if (args.length > 0)
		{
			try
			{
				int port = Integer.parseInt(args[0]);
				final Application server = new Application();
				server.start(port);
				server.blockUntilShutdown();
			}
			catch (NumberFormatException e) {
				System.err.println("Error: invalid port number \"" + args[0] + "\"");
			}
		}
		else {
			System.err.println("Error: must specify port number to listen on.");
		}
	}
}
