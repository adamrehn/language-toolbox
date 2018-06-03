import org.apache.commons.exec.DefaultExecuteResultHandler;
import org.apache.commons.exec.PumpStreamHandler;
import org.apache.commons.exec.DefaultExecutor;
import org.apache.commons.exec.CommandLine;
import org.apache.commons.exec.Executor;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import java.nio.charset.StandardCharsets;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Paths;
import java.net.URL;
import java.io.File;
import java.io.InputStream;

public class Utility
{
	//Executes a child process asynchronously and returns the output
	static public ProcessOutput execute(CommandLine cmd, String workingDir) throws IOException, InterruptedException
	{
		//Create output streams to hold the output of the child process
		ByteArrayOutputStream stdout = new ByteArrayOutputStream();
		ByteArrayOutputStream stderr = new ByteArrayOutputStream();
		
		//Attempt to execute the child process and wait for it to complete
		DefaultExecuteResultHandler resultHandler = new DefaultExecuteResultHandler();
		Executor executor = new DefaultExecutor();
		executor.setStreamHandler(new PumpStreamHandler(stdout, stderr));
		executor.setWorkingDirectory(new File(workingDir));
		executor.setExitValue(0);
		executor.execute(cmd, resultHandler);
		resultHandler.waitFor();
		
		//Retrieve the output
		ProcessOutput output = new ProcessOutput();
		output.stdout = stdout.toString("utf-8");
		output.stderr = stderr.toString("utf-8");
		output.code = resultHandler.getExitValue();
		return output;
	}
	
	//Reads an individual file from our resources
	static public String readResourceFile(String resource) throws IOException
	{
		InputStream resourceStream = System.class.getResource(resource).openStream();
		String data = IOUtils.toString(resourceStream, StandardCharsets.UTF_8);
		resourceStream.close();
		return data;
	}
	
	//Extracts an individual file from our resources
	static public void extractResourceFile(String resource, String destination) throws IOException
	{
		URL resourceURL = System.class.getResource(resource);
		File destFile = new File(destination);
		FileUtils.copyURLToFile(resourceURL, destFile);
	}
	
	//Extracts an individual file from our resources, computing the destination path
	static public String extractResourceFile(String resourceRoot, String resourcePath, String destRoot) throws IOException
	{
		String resource = Paths.get(resourceRoot, resourcePath).toString();
		String destination = Paths.get(destRoot, resourcePath).toString();
		Utility.extractResourceFile(resource, destination);
		return destination;
	}
}
