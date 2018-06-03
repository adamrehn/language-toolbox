import java.util.Arrays;
import io.grpc.stub.StreamObserver;
import com.google.protobuf.ByteString;

public class LanguageModuleImp extends LanguageModuleGrpc.LanguageModuleImplBase
{
	@Override
	public void getCapabilities(Common.Empty request, StreamObserver<Common.LanguageCapabilities> responseObserver)
	{
		Common.LanguageCapabilities response = Common.LanguageCapabilities.newBuilder()
			.setLanguage("java")
			.setCapabilities(Common.Capabilities.GENERATE_ASTS_VALUE | Common.Capabilities.IO_MATCHING_VALUE | Common.Capabilities.UNIT_TESTING_VALUE)
			.build();
		responseObserver.onNext(response);
		responseObserver.onCompleted();
	}
	
	@Override
	public void getSandboxDetails(Common.Empty request, StreamObserver<Language.SandboxDetails> responseObserver)
	{
		Language.SandboxDetails response = Language.SandboxDetails.newBuilder()
			.setImage("adamrehn/language-toolbox-sandbox-java")
			.addAllCommand(Arrays.asList(new String[]{
				"bash", "-c", "cat > /tmp/temp.jar && java -jar /tmp/temp.jar"
			}))
			.build();
		responseObserver.onNext(response);
		responseObserver.onCompleted();
	}
	
	public void generateAst(Common.GenerateAstRequest request, StreamObserver<Common.GenerateAstResponse> responseObserver)
	{
		Common.GenerateAstResponse response = null;
		
		try
		{
			String ast = AstTransformer.generateAst(request.getSource());
			response = Common.GenerateAstResponse.newBuilder()
				.setError("")
				.setAst(ast)
				.build();
		}
		catch (Exception e)
		{
			response = Common.GenerateAstResponse.newBuilder()
				.setError(e.toString())
				.setAst("")
				.build();
		}
		
		responseObserver.onNext(response);
		responseObserver.onCompleted();
	}
	
	@Override
	public void codegenIOCapture(Language.CodegenIOCaptureRequest request, StreamObserver<Language.CodegenIOCaptureResponse> responseObserver)
	{
		Language.CodegenIOCaptureResponse response = null;
		
		try
		{
			byte[] codegenResult = IOCaptureCodegen.performCodegen(request.getSource(), request.getInvocation(), request.getStdin());
			response = Language.CodegenIOCaptureResponse.newBuilder()
				.setError("")
				.setData(ByteString.copyFrom(codegenResult))
				.build();
		}
		catch (Exception e)
		{
			response = Language.CodegenIOCaptureResponse.newBuilder()
				.setError(e.toString())
				.setData(ByteString.EMPTY)
				.build();
		}
		
		responseObserver.onNext(response);
		responseObserver.onCompleted();
	}
	
	@Override
	public void codegenUnitTests(Language.CodegenUnitTestsRequest request, StreamObserver<Language.CodegenUnitTestsResponse> responseObserver)
	{
		Language.CodegenUnitTestsResponse response = null;
		
		try
		{
			byte[] codegenResult = UnitTestCodegen.performCodegen(request.getSource(), request.getTestsList());
			response = Language.CodegenUnitTestsResponse.newBuilder()
				.setError("")
				.setData(ByteString.copyFrom(codegenResult))
				.build();
			
		}
		catch (Exception e)
		{
			response = Language.CodegenUnitTestsResponse.newBuilder()
				.setError(e.toString())
				.setData(ByteString.EMPTY)
				.build();
		}
		
		responseObserver.onNext(response);
		responseObserver.onCompleted();
	}
}
