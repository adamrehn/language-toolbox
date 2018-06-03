import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class IOCaptureCodegen
{
	//Performs codegen for performing I/O capture with the specified stdin data
	public static byte[] performCodegen(String source, String invocation, String stdin) throws IOException, InterruptedException
	{
		//Generate the invocation boilerplate to populate the body of the main() method
		StringBuilder builder = new StringBuilder();
		builder.append("try {\n");
		builder.append("java.io.InputStream resourceStream = System.class.getResource(\"/stdin.txt\").openStream();\n");
		builder.append("byte[] stdinData = org.apache.commons.io.IOUtils.toByteArray(resourceStream);\n");
		builder.append("resourceStream.close();\n");
		builder.append("System.setIn(new java.io.ByteArrayInputStream(stdinData));\n");
		builder.append(invocation);
		builder.append("}\n");
		builder.append("catch (Exception e) {\n");
		builder.append("System.err.println(e.toString());\n");
		builder.append("e.printStackTrace();\n");
		builder.append("}\n");
		
		//Bundle the stdin data into a resource file
		Map<String,String> resources = new HashMap<String,String>();
		resources.put("stdin.txt", stdin);
		
		//Perform codegen
		return CodegenManager.performCodegen(source, builder.toString(), resources);
	}
}
