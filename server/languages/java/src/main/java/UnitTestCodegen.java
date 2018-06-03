import java.io.IOException;
import java.util.List;

public class UnitTestCodegen
{
	//Performs codegen for the specified unit tests
	public static byte[] performCodegen(String source, List<Common.UnitTest> tests) throws IOException, InterruptedException
	{
		//In order for Gson to serialise the UnitTestResults class, it must be separate from main() and not nested within it
		StringBuilder headerCode = new StringBuilder();
		headerCode.append(source);
		headerCode.append("\n\n");
		headerCode.append("class TestCaseResult { public String output; public String type; public boolean exception; public TestCaseResult(String output, String type, boolean exception) { this.output = output; this.type = type; this.exception = exception; } }\n");
		headerCode.append("class UnitTestResults { public java.util.List<TestCaseResult> result = new java.util.ArrayList<TestCaseResult>(); }\n");
		
		//Generate the unit test boilerplate to populate the body of the main() method
		StringBuilder builder = new StringBuilder();
		builder.append("java.util.List<UnitTestResults> results = new java.util.ArrayList<UnitTestResults>();\n");
		builder.append("UnitTestResults currTest = null;\n");
		builder.append("System.setOut(new java.io.PrintStream(new org.apache.commons.io.output.NullOutputStream()));\n");
		
		//Generate the code for each of the unit tests
		for (Common.UnitTest test : tests)
		{
			builder.append("currTest = new UnitTestResults();\n");
			builder.append(test.getSetup());
			builder.append("\n");
			for (Common.TestCase testCase : test.getCasesList())
			{
				List<String> inputs = testCase.getInputsList().subList(0, testCase.getInputsCount());
				builder.append(testCase.getSetup());
				builder.append("\n");
				builder.append("try { Object lastResult = " + test.getInvocation() + "(" + String.join(",", inputs) + ");\n");
				builder.append("currTest.result.add(new TestCaseResult(String.valueOf(lastResult), lastResult.getClass().getName(), false)); }\n");
				builder.append("catch (Exception e) { currTest.result.add(new TestCaseResult(e.getMessage(), e.getClass().getName(), true)); }\n");
				builder.append(testCase.getTeardown());
				builder.append("\n");
			}
			builder.append("results.add(currTest);\n");
			builder.append(test.getTeardown());
			builder.append("\n");
		}
		
		//Complete the boilerplate code
		builder.append("System.setOut(new java.io.PrintStream(new java.io.FileOutputStream(java.io.FileDescriptor.out)));\n");
		builder.append("System.out.print(new com.google.gson.Gson().toJson(results));\n");
		builder.append("System.out.flush();\n");
		
		//Perform codegen
		return CodegenManager.performCodegen(headerCode.toString(), builder.toString(), null);
	}
}
