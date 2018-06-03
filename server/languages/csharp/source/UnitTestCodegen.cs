using System;
using System.Text;
using System.Collections.Generic;

namespace language_csharp
{
	public class UnitTestCodegen
	{
		public static byte[] performCodegen(CodegenManager codegen, string source, IList<UnitTest> tests)
		{
			//Declare the UnitTestResults class so that it can then be serialised
			StringBuilder headerCode = new StringBuilder();
			headerCode.Append(@"
			class TestCaseResult {
				public string output; public string type; public bool exception;
				public TestCaseResult(string output, string type, bool exception) { this.output = output; this.type = type; this.exception = exception; }
			}
			class UnitTestResults {
				public System.Collections.Generic.List<TestCaseResult> result = new System.Collections.Generic.List<TestCaseResult>();
			}
			");
			headerCode.Append(source);
			
			//Generate the unit test boilerplate to populate the body of the main() method
			StringBuilder bodyCode = new StringBuilder();
			bodyCode.Append(@"
			var origStdout = System.Console.Out;
			var origStderr = System.Console.Error;
			System.Console.SetOut(System.IO.TextWriter.Null);
			System.Console.SetError(System.IO.TextWriter.Null);
			var results = new System.Collections.Generic.List<UnitTestResults>();
			UnitTestResults currTest = null;
			");
			
			//Generate the code for each of the unit tests
			foreach (UnitTest test in tests)
			{
				bodyCode.Append("currTest = new UnitTestResults();\n");
				bodyCode.Append(test.Setup);
				bodyCode.Append("\n");
				foreach (TestCase testCase in test.Cases)
				{
					bodyCode.Append(testCase.Setup);
					bodyCode.Append("\n");
					bodyCode.Append("try { var lastResult = " + test.Invocation + "(" + String.Join(",", testCase.Inputs) + ");\n");
					bodyCode.Append("currTest.result.Add(new TestCaseResult(lastResult.ToString(), lastResult.GetType().Name, false)); }\n");
					bodyCode.Append("catch (System.Exception e) { currTest.result.Add(new TestCaseResult(e.Message, e.GetType().Name, true)); }\n");
					bodyCode.Append(testCase.Teardown);
					bodyCode.Append("\n");
				}
				bodyCode.Append("results.Add(currTest);\n");
				bodyCode.Append(test.Teardown);
				bodyCode.Append("\n");
			}
			
			//Complete the boilerplate code
			bodyCode.Append(@"
			System.Console.SetOut(origStdout);
			System.Console.SetError(origStderr);
			System.Console.WriteLine(Newtonsoft.Json.JsonConvert.SerializeObject(results));
			");
			
			//Perform codegen
			return codegen.performCodegen(headerCode.ToString(), bodyCode.ToString());
		}
	}
}
