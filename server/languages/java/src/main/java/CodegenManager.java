import org.apache.commons.exec.CommandLine;
import org.apache.commons.io.FileUtils;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;
import java.io.File;

public class CodegenManager
{
	//Performs codegen for the specified code (prefix code to go before the main class, and the body of main())
	public static byte[] performCodegen(String prefixCode, String mainCode, Map<String,String> resources) throws IOException, InterruptedException
	{
		//Create a temporary directory to hold our gradle codegen build
		String tempDir = Files.createTempDirectory(null).toString();
		
		try
		{
			//Extract our template files
			Utility.extractResourceFile("/CodegenTemplate", "build.gradle", tempDir);
			Utility.extractResourceFile("/CodegenTemplate", "settings.gradle", tempDir);
			String templatePath = Utility.extractResourceFile("/CodegenTemplate", "src/main/java/CodegenOutput.java", tempDir);
			
			//Populate the template source file
			File templateFile = new File(templatePath);
			String codegenSource = FileUtils.readFileToString(templateFile, "utf-8");
			codegenSource = codegenSource.replace("//$$__PREFIX_CODE__$$", prefixCode);
			codegenSource = codegenSource.replace("//$$__MAIN_CODE__$$", mainCode);
			FileUtils.writeStringToFile(templateFile, codegenSource, "utf-8");
			
			//If any resource files were supplied, use them to populate the resources directory
			if (resources != null)
			{
				for (Map.Entry<String, String> resource : resources.entrySet())
				{
					File resourceFile = new File(Paths.get(tempDir, "src/main/resources", resource.getKey()).toString());
					FileUtils.writeStringToFile(resourceFile, resource.getValue(), "utf-8");
				}
			}
			
			//Attempt to perform codegen
			CommandLine codegenCmd = new CommandLine("gradle").addArgument("jar");
			ProcessOutput output = Utility.execute(codegenCmd, tempDir);
			if (output.code != 0) {
				throw new IOException("codegen failed with exit code " + output.code + " and stderr: \"" + output.stderr + "\"");
			}
			
			//Retrieve the generated JAR file
			byte[] jarData = FileUtils.readFileToByteArray(Paths.get(tempDir, "build/libs/CodegenOutput.jar").toFile());
			
			//Remove the temporary directory and return the JAR data
			new File(tempDir).delete();
			return jarData;
		}
		catch (Exception e)
		{
			//Remove the temporary directory prior to propagating any exceptions
			new File(tempDir).delete();
			throw e;
		}
	}
}
